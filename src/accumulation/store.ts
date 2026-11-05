/**
 * 分批建仓的持久化。
 *
 * 目录：{folder}/plans/{symbol}-{id}.md，归档移到 {folder}/archive/。
 * 只走 vault.adapter 的 exists/read/write/mkdir/list/rename/remove，
 * 与 DataStore 保持同一套 IO 语义（不缓存 TFile、不经过 Vault 的 modify 通道）。
 *
 * 三件容易踩的事，都在这里兜住：
 * 1) 自触发：写完盘会收到 vault 的 modify 事件，用「内容 hash」判定并吞掉，
 *    不用 isSaving 布尔（那是 DataStore 实例级的，跨 store 无效）；
 * 2) 并发：同一计划的读改写全部串进 Promise 队列，文件系统操作共用一条队列；
 * 3) 手改优先：写盘前若发现磁盘内容与上次写入不同，先把磁盘内容读回内存，
 *    再在它之上应用本次改动，避免把用户刚手改的表格静默覆盖。
 */

import type { EventRef, Plugin, TFile } from "obsidian";
import { parsePlan } from "./parser";
import { serializePlan } from "./serializer";
import type {
  AccumulationPlan,
  AccumulationTrade,
  NewPlanInput,
  PlanAdjustment,
  PlanPatch,
  PlanWarning,
  PricePoint,
} from "./types";

export interface BrokenPlan {
  path: string;
  error: string;
}

interface PlanEntry {
  plan: AccumulationPlan;
  path: string;
  /** 上次写盘内容的 hash，用来识别自触发 */
  lastWrittenHash: string;
}

const PLANS_DIR = "plans";
const ARCHIVE_DIR = "archive";
const DEBOUNCE_MS = 300;

function hashContent(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `${(hash >>> 0).toString(16)}:${text.length}`;
}

function dirname(path: string): string {
  const index = path.lastIndexOf("/");
  return index > 0 ? path.substring(0, index) : "";
}

function sanitizeSymbol(symbol: string): string {
  const cleaned = symbol.trim().replace(/[\\/:*?"<>|#^[\]]/g, "_");
  return cleaned || "plan";
}

function newPlanId(): string {
  return `pl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function newTradeId(): string {
  return `pl_t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export class AccumulationStore {
  private plugin: Plugin;
  private folderPath: string;
  private entries = new Map<string, PlanEntry>();
  private pathToId = new Map<string, string>();
  private brokenEntries = new Map<string, BrokenPlan>();
  private listeners: Array<() => void> = [];
  private queues = new Map<string, Promise<unknown>>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private eventRefs: EventRef[] = [];

  constructor(plugin: Plugin, folderPath: string) {
    this.plugin = plugin;
    this.folderPath = folderPath;
  }

  // ============================================================
  // 生命周期
  // ============================================================

  private get adapter() {
    return this.plugin.app.vault.adapter;
  }

  getFolderPath(): string {
    return this.folderPath;
  }

  private get plansDir(): string {
    return `${this.folderPath}/${PLANS_DIR}`;
  }

  private get archiveDir(): string {
    return `${this.folderPath}/${ARCHIVE_DIR}`;
  }

  async load(): Promise<void> {
    this.entries.clear();
    this.pathToId.clear();
    this.brokenEntries.clear();

    await this.ensureFolder(this.plansDir);
    await this.ensureFolder(this.archiveDir);

    await this.loadDir(this.plansDir);
    await this.loadDir(this.archiveDir);
    this.notifyChange();
  }

  async reload(): Promise<void> {
    await this.load();
  }

  private async loadDir(dir: string): Promise<void> {
    const listing = await this.adapter.list(dir);
    for (const filePath of listing.files) {
      if (!filePath.toLowerCase().endsWith(".md")) continue;
      await this.readIntoMemory(filePath);
    }
  }

  private async readIntoMemory(path: string): Promise<void> {
    try {
      const raw = await this.adapter.read(path);
      const plan = parsePlan(raw, path);
      const entry: PlanEntry = { plan, path, lastWrittenHash: hashContent(raw) };
      this.entries.set(plan.id, entry);
      this.pathToId.set(path, plan.id);
      this.brokenEntries.delete(path);
    } catch (error) {
      // 解析失败：保留原文、只标记，绝不写回
      this.brokenEntries.set(path, { path, error: String(error) });
    }
  }

  startWatching(): void {
    const vault = this.plugin.app.vault;

    this.eventRefs.push(
      vault.on("modify", (file: TFile) => {
        if (!this.isPlanPath(file.path)) return;
        this.scheduleRead(file.path);
      }),
    );

    this.eventRefs.push(
      vault.on("create", (file: TFile) => {
        if (!this.isPlanPath(file.path)) return;
        this.scheduleRead(file.path);
      }),
    );

    this.eventRefs.push(
      vault.on("delete", (file: TFile) => {
        const id = this.pathToId.get(file.path);
        if (id) {
          this.entries.delete(id);
          this.pathToId.delete(file.path);
          this.notifyChange();
          return;
        }
        if (this.brokenEntries.delete(file.path)) this.notifyChange();
      }),
    );

    this.eventRefs.push(
      vault.on("rename", (file: TFile, oldPath: string) => {
        const id = this.pathToId.get(oldPath);
        if (!id) return;
        const entry = this.entries.get(id);
        this.pathToId.delete(oldPath);
        this.pathToId.set(file.path, id);
        if (entry) entry.path = file.path;
        this.notifyChange();
      }),
    );
  }

  stopWatching(): void {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    for (const ref of this.eventRefs) this.plugin.app.vault.offref(ref);
    this.eventRefs = [];
  }

  setFolderPath(path: string): void {
    if (!path || path === this.folderPath) return;
    this.folderPath = path;
    void this.reload();
  }

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((item) => item !== listener);
    };
  }

  private notifyChange(): void {
    for (const listener of this.listeners) listener();
  }

  private isPlanPath(path: string): boolean {
    return (
      path.startsWith(`${this.plansDir}/`) || path.startsWith(`${this.archiveDir}/`)
    );
  }

  private scheduleRead(path: string): void {
    const existing = this.timers.get(path);
    if (existing) clearTimeout(existing);
    this.timers.set(
      path,
      setTimeout(() => {
        this.timers.delete(path);
        void this.reloadPath(path);
      }, DEBOUNCE_MS),
    );
  }

  private async reloadPath(path: string): Promise<void> {
    let raw: string;
    try {
      if (!(await this.adapter.exists(path))) return;
      raw = await this.adapter.read(path);
    } catch {
      return;
    }

    const id = this.pathToId.get(path);
    const entry = id ? this.entries.get(id) : undefined;
    // 自己刚写的：hash 一致，直接吞掉，避免「写完 → 重解析 → 重渲染」抖动
    if (entry && entry.lastWrittenHash === hashContent(raw)) return;

    await this.readIntoMemory(path);
    this.notifyChange();
  }

  // ============================================================
  // 读
  // ============================================================

  getPlans(): AccumulationPlan[] {
    return [...this.entries.values()]
      .map((entry) => entry.plan)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getPlan(id: string): AccumulationPlan | undefined {
    return this.entries.get(id)?.plan;
  }

  getPath(id: string): string | undefined {
    return this.entries.get(id)?.path;
  }

  /** 在 Obsidian 里打开计划源文件（解析失败时也用它，让用户直接看原文） */
  async openPath(path: string): Promise<void> {
    if (!path) return;
    await this.plugin.app.workspace.openLinkText(path, "");
  }

  getTrades(id: string): AccumulationTrade[] {
    const plan = this.getPlan(id);
    if (!plan) return [];
    return [...plan.trades].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }

  getPrices(id: string): PricePoint[] {
    return this.getPlan(id)?.prices ?? [];
  }

  getAdjustments(id: string): PlanAdjustment[] {
    const plan = this.getPlan(id);
    if (!plan) return [];
    return [...plan.adjustments].sort((a, b) => b.date.localeCompare(a.date));
  }

  isBroken(id: string): boolean {
    const path = this.getPath(id);
    return path ? this.brokenEntries.has(path) : false;
  }

  getBrokenPlans(): BrokenPlan[] {
    return [...this.brokenEntries.values()];
  }

  getWarnings(): PlanWarning[] {
    const warnings: PlanWarning[] = [];
    for (const entry of this.entries.values()) warnings.push(...entry.plan.warnings);
    for (const broken of this.brokenEntries.values()) {
      warnings.push({
        level: "error",
        code: "file.parseFailed",
        where: broken.path,
        detail: broken.error,
      });
    }
    return warnings;
  }

  // ============================================================
  // 写
  // ============================================================

  private enqueue<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    this.queues.set(
      key,
      next.catch(() => undefined),
    );
    return next;
  }

  private async ensureFolder(path: string): Promise<void> {
    if (!path) return;
    const segments = path.split("/").filter(Boolean);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await this.adapter.exists(current))) {
        await this.adapter.mkdir(current);
      }
    }
  }

  /** 写入前把磁盘上的手改读回内存：用户的编辑优先，本次改动叠加在其上 */
  private async refreshIfChanged(entry: PlanEntry): Promise<void> {
    if (!entry.lastWrittenHash) return;
    try {
      if (!(await this.adapter.exists(entry.path))) return;
      const raw = await this.adapter.read(entry.path);
      if (hashContent(raw) === entry.lastWrittenHash) return;
      entry.plan = parsePlan(raw, entry.path);
      entry.lastWrittenHash = hashContent(raw);
    } catch {
      // 读不回来就按内存里的写，不阻断用户操作
    }
  }

  private async persist(entry: PlanEntry): Promise<void> {
    const updatedAt = new Date().toISOString();
    entry.plan.updatedAt = updatedAt;
    const raw = serializePlan(entry.plan);
    // 先记 hash 再写盘：modify 事件回来时才能判定这是自己写的
    entry.lastWrittenHash = hashContent(raw);

    await this.ensureFolder(dirname(entry.path));

    const adapter = this.adapter as unknown as {
      exists(path: string): Promise<boolean>;
      write(path: string, data: string): Promise<void>;
      process?: (path: string, fn: (data: string) => string) => Promise<unknown>;
    };

    if (await adapter.exists(entry.path)) {
      // 原子替换：adapter.process 的语义就是 read-modify-write，旧版本没有则退回 write
      if (typeof adapter.process === "function") {
        await adapter.process(entry.path, () => raw);
      } else {
        await adapter.write(entry.path, raw);
      }
    } else {
      await adapter.write(entry.path, raw);
    }
    this.notifyChange();
  }

  private requireEntry(id: string): PlanEntry {
    const entry = this.entries.get(id);
    if (!entry) throw new Error(`plan not found: ${id}`);
    if (this.brokenEntries.has(entry.path)) {
      throw new Error(`plan file cannot be parsed: ${entry.path}`);
    }
    return entry;
  }

  async createPlan(input: NewPlanInput): Promise<AccumulationPlan> {
    const id = newPlanId();
    const path = `${this.plansDir}/${sanitizeSymbol(input.symbol)}-${id}.md`;
    const today = todayString();

    const plan: AccumulationPlan = {
      id,
      name: input.name.trim(),
      symbol: input.symbol.trim(),
      market: input.market,
      assetType: input.assetType,
      currency: input.currency,
      createdAt: input.createdAt || today,
      updatedAt: new Date().toISOString(),
      totalBudgetCents: input.totalBudgetCents,
      referencePrice: input.referencePrice,
      currentPrice: input.currentPrice,
      priceUpdatedAt: input.currentPrice > 0 ? today : undefined,
      reserveRatio: input.reserveRatio,
      amountMode: input.amountMode,
      requireConfirmDefault: input.requireConfirmDefault,
      stages: [...input.stages].sort((a, b) => a.order - b.order),
      trades: [],
      // 建计划时的现价作为第一个价格点：让后续回撤至少有个起点
      prices: input.currentPrice > 0 ? [{ date: today, price: input.currentPrice, note: "" }] : [],
      adjustments: [],
      logic: input.logic,
      review: "",
      extraFrontmatter: [],
      unknownSections: [],
      orphanRows: {},
      warnings: [],
    };

    const entry: PlanEntry = { plan, path, lastWrittenHash: "" };
    await this.enqueue(id, async () => {
      this.entries.set(id, entry);
      this.pathToId.set(path, id);
      await this.persist(entry);
    });
    return plan;
  }

  async updatePlan(
    id: string,
    patch: PlanPatch,
    adjustments: PlanAdjustment[] = [],
  ): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      const plan = entry.plan;

      if (patch.name !== undefined) plan.name = patch.name;
      if (patch.symbol !== undefined) plan.symbol = patch.symbol;
      if (patch.market !== undefined) plan.market = patch.market;
      if (patch.assetType !== undefined) plan.assetType = patch.assetType;
      if (patch.currency !== undefined) plan.currency = patch.currency;
      if (patch.totalBudgetCents !== undefined) plan.totalBudgetCents = patch.totalBudgetCents;
      if (patch.referencePrice !== undefined) plan.referencePrice = patch.referencePrice;
      if (patch.currentPrice !== undefined) plan.currentPrice = patch.currentPrice;
      if (patch.priceUpdatedAt !== undefined) plan.priceUpdatedAt = patch.priceUpdatedAt;
      if (patch.reserveRatio !== undefined) plan.reserveRatio = patch.reserveRatio;
      if (patch.amountMode !== undefined) plan.amountMode = patch.amountMode;
      if (patch.requireConfirmDefault !== undefined) {
        plan.requireConfirmDefault = patch.requireConfirmDefault;
      }
      if (patch.fxRateOverride !== undefined) plan.fxRateOverride = patch.fxRateOverride;
      if (patch.logic !== undefined) plan.logic = patch.logic;
      if (patch.review !== undefined) plan.review = patch.review;
      if (patch.stages !== undefined) {
        plan.stages = [...patch.stages].sort((a, b) => a.order - b.order);
      }
      if (adjustments.length > 0) plan.adjustments = [...plan.adjustments, ...adjustments];

      await this.persist(entry);
    });
  }

  async setPrice(id: string, price: number, date: string, note = ""): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      const plan = entry.plan;
      plan.currentPrice = price;
      plan.priceUpdatedAt = date;
      // 同一天只留一个点：一天内多次改价不该堆成一串
      plan.prices = [...plan.prices.filter((point) => point.date !== date), { date, price, note }].sort(
        (a, b) => a.date.localeCompare(b.date),
      );
      await this.persist(entry);
    });
  }

  async addTrade(id: string, trade: AccumulationTrade): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      entry.plan.trades = [...entry.plan.trades, trade];
      await this.persist(entry);
    });
  }

  async updateTrade(id: string, trade: AccumulationTrade): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      entry.plan.trades = entry.plan.trades.map((item) => (item.id === trade.id ? trade : item));
      await this.persist(entry);
    });
  }

  async deleteTrade(id: string, tradeId: string): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      entry.plan.trades = entry.plan.trades.filter((item) => item.id !== tradeId);
      await this.persist(entry);
    });
  }

  async setSectionText(id: string, which: "logic" | "review", text: string): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      if (which === "logic") entry.plan.logic = text;
      else entry.plan.review = text;
      await this.persist(entry);
    });
  }

  async archivePlan(id: string): Promise<void> {
    await this.enqueue(id, async () => {
      const entry = this.requireEntry(id);
      await this.refreshIfChanged(entry);
      entry.plan.archivedAt = todayString();
      await this.persist(entry);

      const fileName = entry.path.split("/").pop() ?? `${entry.plan.id}.md`;
      const target = `${this.archiveDir}/${fileName}`;
      if (entry.path !== target) {
        await this.ensureFolder(this.archiveDir);
        await this.adapter.rename(entry.path, target);
        this.pathToId.delete(entry.path);
        entry.path = target;
        this.pathToId.set(target, id);
      }
      this.notifyChange();
    });
  }

  async deletePlan(id: string): Promise<void> {
    await this.enqueue("__fs__", async () => {
      const entry = this.entries.get(id);
      if (!entry) return;
      const adapter = this.adapter;
      let removed = false;
      if (typeof adapter.trashSystem === "function") {
        removed = await adapter.trashSystem(entry.path);
      }
      if (!removed) await adapter.remove(entry.path);
      this.entries.delete(id);
      this.pathToId.delete(entry.path);
      this.notifyChange();
    });
  }
}
