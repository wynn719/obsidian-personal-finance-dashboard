import { Plugin, TFile, EventRef } from "obsidian";
import {
  FinanceData,
  EMPTY_FINANCE_DATA,
  AssetSnapshot,
  CashFlowRecord,
  DividendRecord,
  CategoryAmount,
  MiscData,
  StockHolding,
  HoldingCurrency,
} from "./models";
import { generateId } from "./utils";

const DEFAULT_DATA_FOLDER = "Finance";
const DEFAULT_MISC_FILE_PATH = "Finance/Misc.md";

/**
 * Convert an amount between holding currencies via the CNY fxRate.
 * fxRate is CNY per 1 unit of `from`; cross rates (e.g. HKD→USD) go via CNY.
 */
export function convertCurrency(
  amount: number,
  from: HoldingCurrency,
  to: HoldingCurrency,
  fxRate: number,
): number {
  if (from === to) return amount;
  const safeRate = fxRate > 0 ? fxRate : 1;
  const inCny = from === "CNY" ? amount : amount * safeRate;
  if (to === "CNY") return inCny;
  // to !== CNY: divide by its rate vs CNY — approximate with the same rate
  // when converting from CNY (only used for display toggling)
  return inCny / safeRate;
}

/**
 * Handles persistence of finance data to per-year Markdown files in the vault.
 *
 * File structure:
 *   Finance/2025.md
 *   Finance/2026.md
 *
 * Each file contains:
 * ---
 * # Asset Snapshots
 * ## 2025-03
 * > note text
 * | Category | Amount | Details |
 * |----------|--------|---------|
 * | 货币短债 | 1992493 | 微众 1029440, ... |
 *
 * # Cash Flow Records
 * | Date | Type | Category | Amount | Note |
 * |------|------|----------|--------|------|
 * | 2025-03-15 | income | 工资 | 63184 | 3月工资 |
 *
 * # Dividend Records
 * | Date | Stock | Amount | Note |
 * |------|-------|--------|------|
 * | 2025-06-15 | 五粮液 | 2578 | 五粮液第一次分红 |
 */
export class DataStore {
  private dataByYear: Map<string, FinanceData> = new Map();
  private currentYear: string;
  private plugin: Plugin;
  private dataFolderPath: string;
  private listeners: Array<() => void> = [];
  private fileChangeRef: EventRef | null = null;
  private miscRenameRef: EventRef | null = null;
  private isSaving = false;

  // Standalone misc data (non-yearly), persisted to a single Markdown file
  private miscData: MiscData = { stockHoldings: [] };
  private miscDataFilePath: string;

  constructor(plugin: Plugin, dataFolderPath?: string, miscDataFilePath?: string) {
    this.plugin = plugin;
    this.dataFolderPath = dataFolderPath ?? DEFAULT_DATA_FOLDER;
    this.miscDataFilePath = miscDataFilePath ?? DEFAULT_MISC_FILE_PATH;
    this.currentYear = String(new Date().getFullYear());
  }

  /** Update the misc data file path (called when settings change) */
  setMiscDataFilePath(path: string): void {
    this.miscDataFilePath = path;
  }

  getMiscDataFilePath(): string {
    return this.miscDataFilePath;
  }

  /** The misc file may live outside dataFolderPath – extract its parent folder */
  private getMiscParentFolder(): string {
    const lastSlash = this.miscDataFilePath.lastIndexOf("/");
    return lastSlash > 0 ? this.miscDataFilePath.substring(0, lastSlash) : "";
  }

  /** Update the data folder path (called when settings change) */
  setDataFolderPath(path: string): void {
    this.dataFolderPath = path;
  }

  getDataFolderPath(): string {
    return this.dataFolderPath;
  }

  /** Get the file path for a given year */
  private getYearFilePath(year: string): string {
    return `${this.dataFolderPath}/${year}.md`;
  }

  // ============================================================
  // Year management
  // ============================================================

  getCurrentYear(): string {
    return this.currentYear;
  }

  setCurrentYear(year: string): void {
    this.currentYear = year;
  }

  /** Scan the data folder for available year files (e.g. 2025.md → "2025") */
  async getAvailableYears(): Promise<string[]> {
    const adapter = this.plugin.app.vault.adapter;
    const years: string[] = [];

    if (await adapter.exists(this.dataFolderPath)) {
      const listing = await adapter.list(this.dataFolderPath);
      for (const filePath of listing.files) {
        const match = filePath.match(/(\d{4})\.md$/);
        if (match) {
          years.push(match[1]);
        }
      }
    }

    // Always include current calendar year
    const calendarYear = String(new Date().getFullYear());
    if (!years.includes(calendarYear)) {
      years.push(calendarYear);
    }

    return years.sort();
  }

  /** Get the current year's data */
  private getData(): FinanceData {
    return (
      this.dataByYear.get(this.currentYear) ?? {
        assetSnapshots: [],
        cashFlowRecords: [],
        dividendRecords: [],
      }
    );
  }

  /** Set the current year's data */
  private setData(data: FinanceData): void {
    this.dataByYear.set(this.currentYear, data);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  async load(): Promise<void> {
    // Load current year first
    await this.loadYear(this.currentYear);
    // Also pre-load all available years so that getDividendsByYear etc. work synchronously
    const years = await this.getAvailableYears();
    for (const y of years) {
      if (y !== this.currentYear) {
        await this.loadYear(y);
      }
    }
    // Load standalone misc data
    await this.loadMisc();
  }

  async loadYear(year: string): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      const filePath = this.getYearFilePath(year);

      if (await adapter.exists(filePath)) {
        const raw = await adapter.read(filePath);
        this.dataByYear.set(year, MarkdownParser.parse(raw));
      } else {
        this.dataByYear.set(year, {
          assetSnapshots: [],
          cashFlowRecords: [],
          dividendRecords: [],
        });
      }
    } catch (e) {
      console.error(`Finance Dashboard: Failed to load data for ${year}`, e);
      this.dataByYear.set(year, {
        assetSnapshots: [],
        cashFlowRecords: [],
        dividendRecords: [],
      });
    }
  }

  async save(): Promise<void> {
    this.isSaving = true;
    try {
      const adapter = this.plugin.app.vault.adapter;

      // Ensure folder exists
      if (!(await adapter.exists(this.dataFolderPath))) {
        await adapter.mkdir(this.dataFolderPath);
      }

      const filePath = this.getYearFilePath(this.currentYear);
      const markdown = MarkdownSerializer.serialize(this.getData());
      await adapter.write(filePath, markdown);
    } finally {
      setTimeout(() => {
        this.isSaving = false;
      }, 500);
    }
  }

  // ============================================================
  // File watcher – detect external edits to any year file
  // ============================================================

  startWatching(): void {
    this.fileChangeRef = this.plugin.app.vault.on(
      "modify",
      async (file: TFile) => {
        if (this.isSaving) return;

        // Misc data file: exact path match (not matched by the year regex below)
        if (file.path === this.miscDataFilePath) {
          console.log(
            "Finance Dashboard: External change detected for misc data, reloading…",
          );
          await this.loadMisc();
          this.notifyChange();
          return;
        }

        if (
          file.path.startsWith(this.dataFolderPath + "/") &&
          file.path.endsWith(".md")
        ) {
          const match = file.path.match(/(\d{4})\.md$/);
          if (match) {
            const year = match[1];
            console.log(
              `Finance Dashboard: External change detected for ${year}, reloading…`,
            );
            await this.loadYear(year);
            if (year === this.currentYear) {
              this.notifyChange();
            }
          }
        }
      },
    );

    // If the misc file is moved/renamed externally, reload from its configured path
    this.miscRenameRef = this.plugin.app.vault.on(
      "rename",
      async (file: TFile, oldPath: string) => {
        if (oldPath === this.miscDataFilePath && !this.isSaving) {
          console.log(
            "Finance Dashboard: Misc data file moved/renamed, reloading…",
          );
          await this.loadMisc();
          this.notifyChange();
        }
      },
    );

    this.plugin.registerEvent(this.fileChangeRef);
    this.plugin.registerEvent(this.miscRenameRef);
  }

  stopWatching(): void {
    if (this.fileChangeRef) {
      this.plugin.app.vault.offref(this.fileChangeRef);
      this.fileChangeRef = null;
    }
    if (this.miscRenameRef) {
      this.plugin.app.vault.offref(this.miscRenameRef);
      this.miscRenameRef = null;
    }
  }

  /**
   * Switch to a different year, loading its data if needed.
   */
  async switchYear(year: string): Promise<void> {
    this.currentYear = year;
    if (!this.dataByYear.has(year)) {
      await this.loadYear(year);
    }
    this.notifyChange();
  }

  /**
   * Force reload data from disk (useful for manual refresh).
   */
  async reload(): Promise<void> {
    await this.loadYear(this.currentYear);
    this.notifyChange();
  }

  // ============================================================
  // Misc data (standalone file, non-yearly)
  // ============================================================

  async loadMisc(): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      if (await adapter.exists(this.miscDataFilePath)) {
        const raw = await adapter.read(this.miscDataFilePath);
        this.miscData = MiscMarkdownParser.parse(raw);
      } else {
        this.miscData = { stockHoldings: [] };
      }
    } catch (e) {
      console.error("Finance Dashboard: Failed to load misc data", e);
      this.miscData = { stockHoldings: [] };
    }
  }

  async saveMisc(): Promise<void> {
    this.isSaving = true;
    try {
      const adapter = this.plugin.app.vault.adapter;
      const parent = this.getMiscParentFolder();
      if (parent && !(await adapter.exists(parent))) {
        await adapter.mkdir(parent);
      }
      await adapter.write(
        this.miscDataFilePath,
        MiscMarkdownSerializer.serialize(this.miscData),
      );
    } finally {
      setTimeout(() => {
        this.isSaving = false;
      }, 500);
    }
  }

  /** Force reload misc data from disk and notify listeners */
  async reloadMisc(): Promise<void> {
    await this.loadMisc();
    this.notifyChange();
  }

  getHoldings(): StockHolding[] {
    return [...this.miscData.stockHoldings].sort(
      (a, b) =>
        this.holdingValue(b, "CNY") - this.holdingValue(a, "CNY"),
    );
  }

  /**
   * Market value in the given display currency.
   * Native value = shares × price (falls back to stored amount before
   * first refresh); converted via per-holding fxRate when needed.
   */
  holdingValue(
    h: StockHolding,
    displayCurrency: HoldingCurrency = "CNY",
  ): number {
    const native =
      (h.shares ?? 0) > 0 && (h.price ?? 0) > 0
        ? h.shares * (h.price ?? 0)
        : h.amount;
    return convertCurrency(native, h.currency ?? "CNY", displayCurrency, h.fxRate ?? 1);
  }

  getTotalHoldingsAmount(displayCurrency: HoldingCurrency = "CNY"): number {
    return this.miscData.stockHoldings.reduce(
      (sum, h) => sum + this.holdingValue(h, displayCurrency),
      0,
    );
  }

  /** Update quote-driven fields (name/price/change/fx/time/amount) after a refresh */
  async updateHoldingQuotes(
    updates: Array<{
      id: string;
      name: string;
      price: number;
      changePercent: number;
      currency: HoldingCurrency;
      fxRate: number;
    }>,
  ): Promise<void> {
    let changed = false;
    for (const u of updates) {
      const h = this.miscData.stockHoldings.find((x) => x.id === u.id);
      if (!h) continue;
      h.name = u.name;
      h.price = u.price;
      h.priceChangePercent = u.changePercent;
      h.currency = u.currency;
      h.fxRate = u.fxRate;
      h.quoteTime = new Date().toISOString();
      if ((h.shares ?? 0) > 0) {
        h.amount = (h.shares ?? 0) * u.price;
      }
      changed = true;
    }
    if (changed) {
      await this.saveMisc();
      this.notifyChange();
    }
  }

  async addHolding(holding: StockHolding): Promise<void> {
    this.miscData.stockHoldings.push(holding);
    await this.saveMisc();
    this.notifyChange();
  }

  async updateHolding(holding: StockHolding): Promise<void> {
    const idx = this.miscData.stockHoldings.findIndex(
      (h) => h.id === holding.id,
    );
    if (idx >= 0) {
      this.miscData.stockHoldings[idx] = holding;
      await this.saveMisc();
      this.notifyChange();
    }
  }

  async deleteHolding(id: string): Promise<void> {
    this.miscData.stockHoldings = this.miscData.stockHoldings.filter(
      (h) => h.id !== id,
    );
    await this.saveMisc();
    this.notifyChange();
  }

  // ============================================================
  // Change listeners (for Dashboard refresh)
  // ============================================================

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyChange(): void {
    this.listeners.forEach((l) => l());
  }

  // ============================================================
  // Asset Snapshots
  // ============================================================

  getSnapshots(): AssetSnapshot[] {
    return this.getData().assetSnapshots;
  }

  getSnapshotByMonth(month: string): AssetSnapshot | undefined {
    return this.getData().assetSnapshots.find((s) => s.month === month);
  }

  getLatestSnapshot(): AssetSnapshot | undefined {
    const snapshots = this.getData().assetSnapshots;
    if (snapshots.length === 0) return undefined;
    return [...snapshots].sort((a, b) => b.month.localeCompare(a.month))[0];
  }

  async addOrUpdateSnapshot(snapshot: AssetSnapshot): Promise<void> {
    // Determine which year this snapshot belongs to
    const year = snapshot.month.substring(0, 4);
    const prevYear = this.currentYear;

    // Switch to the target year for saving
    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    const idx = data.assetSnapshots.findIndex(
      (s) => s.month === snapshot.month,
    );
    if (idx >= 0) {
      data.assetSnapshots[idx] = snapshot;
    } else {
      data.assetSnapshots.push(snapshot);
    }
    this.setData(data);
    await this.save();
    this.notifyChange();

    // Switch back if needed
    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async deleteSnapshot(month: string): Promise<void> {
    const data = this.getData();
    data.assetSnapshots = data.assetSnapshots.filter((s) => s.month !== month);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  // ============================================================
  // Cash Flow Records
  // ============================================================

  getCashFlowRecords(): CashFlowRecord[] {
    return this.getData().cashFlowRecords;
  }

  getCashFlowByMonth(month: string): CashFlowRecord[] {
    return this.getData().cashFlowRecords.filter((r) =>
      r.date.startsWith(month),
    );
  }

  async addCashFlow(record: CashFlowRecord): Promise<void> {
    // Determine which year this record belongs to
    const year = record.date.substring(0, 4);
    const prevYear = this.currentYear;

    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    data.cashFlowRecords.push(record);
    this.setData(data);
    await this.save();
    this.notifyChange();

    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async updateCashFlow(record: CashFlowRecord): Promise<void> {
    const data = this.getData();
    const idx = data.cashFlowRecords.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      data.cashFlowRecords[idx] = record;
      this.setData(data);
      await this.save();
      this.notifyChange();
    }
  }

  async deleteCashFlow(id: string): Promise<void> {
    const data = this.getData();
    data.cashFlowRecords = data.cashFlowRecords.filter((r) => r.id !== id);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  async deleteCashFlowByMonth(month: string): Promise<void> {
    const data = this.getData();
    data.cashFlowRecords = data.cashFlowRecords.filter(
      (r) => !r.date.startsWith(month),
    );
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  // ============================================================
  // Dividend Records
  // ============================================================

  getDividendRecords(): DividendRecord[] {
    return this.getData().dividendRecords;
  }

  getDividendsByYear(year: string): DividendRecord[] {
    // Since data is already per-year, just return all if matching current year
    if (year === this.currentYear) {
      return this.getData().dividendRecords;
    }
    // Load data for the requested year (may be different from currentYear)
    const data = this.dataByYear.get(year);
    if (data) {
      return data.dividendRecords;
    }
    // Fallback: year not loaded yet, return empty
    return [];
  }

  async addDividend(record: DividendRecord): Promise<void> {
    const year = record.date.substring(0, 4);
    const prevYear = this.currentYear;

    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    data.dividendRecords.push(record);
    this.setData(data);
    await this.save();
    this.notifyChange();

    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async updateDividend(record: DividendRecord): Promise<void> {
    const data = this.getData();
    const idx = data.dividendRecords.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      data.dividendRecords[idx] = record;
      this.setData(data);
      await this.save();
      this.notifyChange();
    }
  }

  async deleteDividend(id: string): Promise<void> {
    const data = this.getData();
    data.dividendRecords = data.dividendRecords.filter((r) => r.id !== id);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }
}

// ============================================================
// Markdown Parser – reads Markdown into FinanceData
// ============================================================

/** Parse a markdown table row into cell values (shared by both parsers) */
function parseMarkdownTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);
}

class MarkdownParser {
  static parse(markdown: string): FinanceData {
    const data: FinanceData = {
      assetSnapshots: [],
      cashFlowRecords: [],
      dividendRecords: [],
    };

    const lines = markdown.split("\n");
    let currentSection: "none" | "assets" | "cashflow" | "dividends" = "none";
    let currentMonth: string | null = null;
    let currentNote: string | null = null;
    let currentCategories: CategoryAmount[] = [];
    let inTable = false;
    let headerParsed = false;

    const flushSnapshot = () => {
      if (currentMonth && currentCategories.length > 0) {
        const totalAssets = currentCategories.reduce(
          (sum, c) => sum + c.amount,
          0,
        );
        data.assetSnapshots.push({
          id: `snap-${currentMonth}`,
          month: currentMonth,
          categories: [...currentCategories],
          totalAssets,
          note: currentNote ?? undefined,
        });
      }
      currentMonth = null;
      currentNote = null;
      currentCategories = [];
      inTable = false;
      headerParsed = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect top-level sections (# heading)
      if (/^#\s+/.test(line) && !/^##\s+/.test(line)) {
        // Flush any pending asset snapshot
        if (currentSection === "assets") {
          flushSnapshot();
        }

        if (line.includes("Asset Snapshots") || line.includes("资产快照")) {
          currentSection = "assets";
        } else if (
          line.includes("Cash Flow Records") ||
          line.includes("收支记录")
        ) {
          currentSection = "cashflow";
          inTable = false;
          headerParsed = false;
        } else if (
          line.includes("Dividend Records") ||
          line.includes("股息记录")
        ) {
          currentSection = "dividends";
          inTable = false;
          headerParsed = false;
        } else {
          currentSection = "none";
        }
        continue;
      }

      if (currentSection === "assets") {
        // Detect month heading (## YYYY-MM)
        const monthMatch = line.match(/^##\s+(\d{4}-\d{2})/);
        if (monthMatch) {
          flushSnapshot();
          currentMonth = monthMatch[1];
          continue;
        }

        // Detect note (> blockquote)
        if (line.startsWith(">")) {
          currentNote = line.substring(1).trim();
          continue;
        }

        // Parse table rows
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row (|---|---|---|)
          }

          const cells = parseMarkdownTableRow(line);
          if (cells.length >= 2) {
            const category = cells[0];
            const amount = parseInt(cells[1], 10) || 0;
            const details = cells[2] || undefined;
            currentCategories.push({ category, amount, details });
          }
          continue;
        }

        // Empty line or non-table line resets table state
        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }

      if (currentSection === "cashflow") {
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row
          }

          const cells = parseMarkdownTableRow(line);
          if (cells.length >= 4) {
            const record: CashFlowRecord = {
              id: generateId(),
              date: cells[0],
              type: cells[1] as "income" | "expense",
              category: cells[2],
              amount: parseInt(cells[3], 10) || 0,
              note: cells[4] || undefined,
            };
            data.cashFlowRecords.push(record);
          }
          continue;
        }

        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }

      if (currentSection === "dividends") {
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row
          }

          const cells = parseMarkdownTableRow(line);
          if (cells.length >= 3) {
            const record: DividendRecord = {
              id: generateId(),
              date: cells[0],
              stockName: cells[1],
              amount: parseInt(cells[2], 10) || 0,
              note: cells[3] || undefined,
            };
            data.dividendRecords.push(record);
          }
          continue;
        }

        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }
    }

    // Flush last pending asset snapshot
    if (currentSection === "assets") {
      flushSnapshot();
    }

    return data;
  }

  /** Parse a markdown table row into cell values */
  private static parseTableRow(line: string): string[] {
    return parseMarkdownTableRow(line);
  }
}

// ============================================================
// Markdown Serializer – writes FinanceData to Markdown
// ============================================================

class MarkdownSerializer {
  static serialize(data: FinanceData): string {
    const parts: string[] = [];

    // Header
    parts.push("# Asset Snapshots\n");

    // Sort snapshots by month descending (newest first)
    const sortedSnapshots = [...data.assetSnapshots].sort((a, b) =>
      b.month.localeCompare(a.month),
    );

    for (const snapshot of sortedSnapshots) {
      parts.push(`## ${snapshot.month}`);
      if (snapshot.note) {
        parts.push(`> ${snapshot.note}`);
      }
      parts.push("");
      parts.push("| Category | Amount | Details |");
      parts.push("|----------|--------|---------|");

      for (const cat of snapshot.categories) {
        const details = cat.details ?? "";
        parts.push(`| ${cat.category} | ${cat.amount} | ${details} |`);
      }
      parts.push("");
    }

    // Cash Flow Records
    parts.push("# Cash Flow Records\n");

    if (data.cashFlowRecords.length > 0) {
      parts.push("| Date | Type | Category | Amount | Note |");
      parts.push("|------|------|----------|--------|------|");

      // Sort by date descending
      const sortedCashFlow = [...data.cashFlowRecords].sort((a, b) =>
        b.date.localeCompare(a.date),
      );

      for (const record of sortedCashFlow) {
        const note = record.note ?? "";
        parts.push(
          `| ${record.date} | ${record.type} | ${record.category} | ${record.amount} | ${note} |`,
        );
      }
      parts.push("");
    }

    // Dividend Records
    parts.push("# Dividend Records\n");

    if (data.dividendRecords.length > 0) {
      parts.push("| Date | Stock | Amount | Note |");
      parts.push("|------|-------|--------|------|");

      // Sort by date ascending
      const sortedDividends = [...data.dividendRecords].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      for (const record of sortedDividends) {
        const note = record.note ?? "";
        parts.push(
          `| ${record.date} | ${record.stockName} | ${record.amount} | ${note} |`,
        );
      }
      parts.push("");
    }

    return parts.join("\n");
  }
}

// ============================================================
// Misc Markdown Parser / Serializer – standalone non-yearly data file
//
// File structure:
//   Finance/Misc.md
//
//   # Stock Holdings
//   | Name | Amount | Symbol | Shares | Price | Change% | UpdatedAt |
//   |------|--------|--------|--------|-------|---------|-----------|
//   | 五粮液 | 257800 | 000858 | 3600 | 71.83 | 0.79 | 2026-09-01T16:00:00+08:00 |
// ============================================================

class MiscMarkdownParser {
  static parse(markdown: string): MiscData {
    const data: MiscData = { stockHoldings: [] };
    const lines = markdown.split("\n");
    let inHoldings = false;
    let inTable = false;
    let headerParsed = false;

    for (const raw of lines) {
      const line = raw.trim();

      // Top-level heading switches section
      if (/^#\s+/.test(line) && !/^##\s+/.test(line)) {
        inHoldings = line.includes("Stock Holdings") || line.includes("股票持仓");
        inTable = false;
        headerParsed = false;
        continue;
      }
      if (!inHoldings) continue;

      if (line.startsWith("|")) {
        if (!inTable) {
          inTable = true;
          headerParsed = false;
          continue; // Skip header row
        }
        if (!headerParsed) {
          headerParsed = true;
          continue; // Skip separator row (|---|---|---|)
        }
        const cells = parseMarkdownTableRow(line);
        if (cells.length >= 2) {
          // Current 9-column: Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt
          // Legacy 8-column (with Note): Note dropped
          // Legacy 7-column (without Currency/FXRate): currency inferred from symbol
          // Legacy 3-column (Name | Amount | Note): only name/amount survive
          const hasQuoteCols = cells.length >= 6;
          const hasCurrencyCols = cells.length >= 8;
          const name = cells[0];
          const amount = parseFloat(cells[1]) || 0;
          let symbol = hasQuoteCols ? cells[2].trim() : "";
          let shares = hasQuoteCols ? parseFloat(cells[3]) || 0 : 0;
          let price = hasQuoteCols ? parseFloat(cells[4]) || 0 : 0;
          let changePct = hasQuoteCols
            ? parseFloat(cells[5].replace("%", "")) || 0
            : 0;
          let currency: HoldingCurrency | undefined = hasCurrencyCols
            ? (cells[6].trim().toUpperCase() as HoldingCurrency)
            : undefined;
          let fxRate = hasCurrencyCols ? parseFloat(cells[7]) || 0 : 0;
          let quoteTime: string | undefined;

          if (cells.length >= 9) {
            quoteTime = cells[8] || undefined;
          } else if (cells.length >= 8) {
            // Legacy 8-column: cells[6]=Note, cells[7]=UpdatedAt — wait for
            // actual 9-col detection above; for 8 cols assume Note variant
            quoteTime = undefined;
          }

          // Infer currency from symbol when missing/invalid
          if (
            !currency ||
            !["CNY", "HKD", "USD"].includes(currency) ||
            fxRate <= 0
          ) {
            if (/^\d{5}$/.test(symbol)) {
              currency = "HKD";
              fxRate = fxRate > 0 ? fxRate : 0.86;
            } else if (symbol && /^[A-Z]/i.test(symbol)) {
              currency = "USD";
              fxRate = fxRate > 0 ? fxRate : 6.72;
            } else {
              currency = "CNY";
              fxRate = 1;
            }
          }

          data.stockHoldings.push({
            id: generateId(),
            name,
            amount,
            symbol,
            shares,
            currency,
            fxRate,
            price: price > 0 ? price : undefined,
            priceChangePercent: hasQuoteCols ? changePct : undefined,
            quoteTime: quoteTime || undefined,
          });
        }
        continue;
      }

      if (line === "") {
        inTable = false;
        headerParsed = false;
      }
    }

    return data;
  }
}

class MiscMarkdownSerializer {
  static serialize(data: MiscData): string {
    const parts: string[] = [];

    parts.push("# Stock Holdings\n");

    if (data.stockHoldings.length > 0) {
      parts.push(
        "| Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt |",
      );
      parts.push(
        "|------|--------|--------|--------|-------|---------|----------|--------|-----------|",
      );

      // Sort by CNY market value descending (primary ordering for the allocation view)
      const value = (h: StockHolding) =>
        convertCurrency(
          (h.shares ?? 0) > 0 && (h.price ?? 0) > 0
            ? (h.shares ?? 0) * (h.price ?? 0)
            : h.amount,
          h.currency ?? "CNY",
          "CNY",
          h.fxRate ?? 1,
        );
      const sorted = [...data.stockHoldings].sort((a, b) => value(b) - value(a));
      for (const h of sorted) {
        parts.push(
          `| ${h.name} | ${h.amount} | ${h.symbol} | ${h.shares} | ${
            h.price ?? ""
          } | ${h.priceChangePercent ?? ""} | ${h.currency ?? "CNY"} | ${
            h.fxRate ?? 1
          } | ${h.quoteTime ?? ""} |`,
        );
      }
      parts.push("");
    }

    // Future non-yearly sections append here

    return parts.join("\n");
  }
}
