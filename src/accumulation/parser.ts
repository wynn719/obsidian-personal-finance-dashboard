/**
 * 计划 Markdown → AccumulationPlan。
 *
 * frontmatter 只支持「扁平 key: value」子集，故意不实现 YAML：
 * 没有嵌套、没有列表、没有块标量、没有锚点。遇到不支持的写法直接抛
 * PlanParseError，由 store 把文件标记为 broken 并冻结写入——
 * 宁可让用户看到「解析失败」，也不能把看不懂的内容静默丢掉。
 *
 * 分节标题同时认中英文，写回时用英文（与 Finance/Misc.md 的既有习惯一致）。
 */

import type {
  AccumulationPlan,
  AccumulationStage,
  AccumulationTrade,
  AccAssetType,
  AccCurrency,
  AccMarket,
  AmountMode,
  PlanAdjustment,
  PlanWarning,
  PricePoint,
  RawSection,
  StageKind,
  TradeSide,
  TriggerMode,
} from "./types";
import { ASSET_TYPES, AMOUNT_MODES, MARKETS, STAGE_KINDS, TRIGGER_MODES } from "./types";
import { parseInteger, parseMoneyToCents, parseNumber, toCents } from "./money";
import { parseTable } from "./table";
export class PlanParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanParseError";
  }
}

// 写回时使用的规范标题（读入时中英文都认）
export const SECTION_TITLES = {
  stages: "Stages",
  trades: "Trades",
  prices: "Prices",
  adjustments: "Adjustments",
  logic: "Investment Thesis",
  review: "Review",
} as const;

export interface SplitDocument {
  frontmatter: Record<string, string>;
  extraFrontmatter: string[];
  sections: RawSection[];
}

const KNOWN_KEYS = new Set([
  "id",
  "name",
  "symbol",
  "market",
  "assetType",
  "currency",
  "createdAt",
  "updatedAt",
  "totalBudget",
  "referencePrice",
  "currentPrice",
  "priceUpdatedAt",
  "reserveRatio",
  "amountMode",
  "requireConfirmDefault",
  "fxRateOverride",
  "archivedAt",
]);

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return v;
}

/** 切出 frontmatter 与 `#` 分节；frontmatter 非法时抛 PlanParseError */
export function splitDocument(raw: string): SplitDocument {
  const normalized = raw.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  if (lines.length > 0 && lines[0].charCodeAt(0) === 0xfeff) {
    lines[0] = lines[0].slice(1);
  }

  const frontmatter: Record<string, string> = {};
  const extraFrontmatter: string[] = [];
  let cursor = 0;

  if (lines[0]?.trim() === "---") {
    let end = -1;
    for (let i = 1; i < lines.length; i += 1) {
      if (lines[i].trim() === "---") {
        end = i;
        break;
      }
    }
    if (end === -1) throw new PlanParseError("frontmatter is not closed with ---");

    for (let i = 1; i < end; i += 1) {
      const line = lines[i];
      if (!line.trim()) continue;
      if (/^\s/.test(line)) {
        throw new PlanParseError(`frontmatter must be flat (line ${i + 1}: ${line})`);
      }
      const match = /^([a-z][A-Za-z0-9_]*):[ \t]*(.*)$/.exec(line);
      if (!match) {
        throw new PlanParseError(`unsupported frontmatter syntax (line ${i + 1}: ${line})`);
      }
      const key = match[1];
      const value = unquote(match[2]);
      if (KNOWN_KEYS.has(key)) frontmatter[key] = value;
      else extraFrontmatter.push(line.trim());
    }
    cursor = end + 1;
  }

  const sections: RawSection[] = [];
  let current: RawSection | null = null;
  for (; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (/^#\s+/.test(line) && !/^##\s+/.test(line)) {
      if (current) sections.push(current);
      current = { title: line.replace(/^#\s+/, "").trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return { frontmatter, extraFrontmatter, sections };
}

type SectionKey = keyof typeof SECTION_TITLES | "unknown";

function sectionKey(title: string): SectionKey {
  if (/阶段|stage/i.test(title)) return "stages";
  if (/成交|trade/i.test(title)) return "trades";
  if (/价格|price/i.test(title)) return "prices";
  if (/调整|adjust/i.test(title)) return "adjustments";
  if (/投资逻辑|逻辑|thesis|logic/i.test(title)) return "logic";
  if (/复盘|review/i.test(title)) return "review";
  return "unknown";
}

function normalizeEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  const v = value.trim().toLowerCase();
  const hit = allowed.find((a) => a.toLowerCase() === v);
  return hit ?? fallback;
}

function parseBool(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return true;
  if (v === "false" || v === "no" || v === "0") return false;
  return null;
}

function parseDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  return v;
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function proseOf(section: RawSection | undefined): string {
  if (!section) return "";
  const lines = [...section.lines];
  // 掐掉分节标题后/下一个标题前的空行：否则每轮序列化都会多出一行，
  // 文件会越写越空，幂等性直接破掉。
  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
  return lines.join("\n");
}

/** 文件名（去扩展名）作为兜底名称 */
export function stemOf(filePath: string): string {
  const base = filePath.split("/").pop() ?? filePath;
  return base.replace(/\.md$/i, "");
}

function fallbackId(stem: string): string {
  // 约定文件名 {symbol}-{id}.md；取最后一段作为 id，取不到就用 stem
  const parts = stem.split("-");
  const last = parts[parts.length - 1];
  return last && last.length >= 4 ? last : stem;
}

function pushWarn(warnings: PlanWarning[], code: string, where: string, detail: string): void {
  warnings.push({ level: "warn", code, where, detail });
}

// ============================================================
// 各分节解析
// ============================================================

function parseStages(
  section: RawSection | undefined,
  canonicalTitle: string,
  referencePrice: number,
  warnings: PlanWarning[],
  orphanRows: Record<string, string[]>,
): AccumulationStage[] {
  if (!section) return [];
  const table = parseTable(section.lines);
  const byOrder = new Map<number, AccumulationStage>();
  const orphan = [...table.orphan];

  table.rows.forEach((cells, idx) => {
    const where = `${section.title}:${idx + 1}`;
    if (cells.length < 9) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "table.tooFewColumns", where, `${cells.length} columns`);
      return;
    }
    // 多出来的列意味着手改时插了一列，后面所有字段都会串位 —— 必须留痕
    if (cells.length > 14) {
      pushWarn(warnings, "stage.extraColumns", where, `${cells.length} columns`);
    }
    const order = parseInteger(cells[0]);
    if (order === null || order <= 0) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "stage.invalidOrder", where, cells[0]);
      return;
    }
    if (byOrder.has(order)) {
      pushWarn(warnings, "stage.duplicateOrder", where, String(order));
    }
    const kind = normalizeEnum<StageKind>(cells[2] ?? "", STAGE_KINDS, "left");
    const triggerMode = normalizeEnum<TriggerMode>(cells[3] ?? "", TRIGGER_MODES, "drop");
    const anchorPrice = parseNumber(cells[4]) ?? referencePrice;
    const dropPct = parseNumber(cells[5]) ?? 0;
    const targetPrice = parseNumber(cells[6]) ?? undefined;
    const plannedCents = parseMoneyToCents(cells[8]) ?? 0;
    const requiresConfirm = parseBool(cells[9]) ?? kind === "right";

    byOrder.set(order, {
      order,
      label: cells[1] || `#${order}`,
      kind,
      triggerMode,
      anchorPrice,
      dropPct,
      targetPrice,
      plannedCents,
      requiresConfirm,
      confirmedAt: parseDate(cells[10]),
      skippedAt: parseDate(cells[11]),
      skipReason: cells[12] || undefined,
      voidedAt: parseDate(cells[13]),
    });
  });

  if (orphan.length > 0) orphanRows[canonicalTitle] = orphan;
  return [...byOrder.values()].sort((a, b) => a.order - b.order);
}

function parseTrades(
  section: RawSection | undefined,
  canonicalTitle: string,
  warnings: PlanWarning[],
  orphanRows: Record<string, string[]>,
): AccumulationTrade[] {
  if (!section) return [];
  const table = parseTable(section.lines);
  const trades: AccumulationTrade[] = [];
  const orphan = [...table.orphan];

  table.rows.forEach((cells, idx) => {
    const where = `${section.title}:${idx + 1}`;
    if (cells.length < 6) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "table.tooFewColumns", where, `${cells.length} columns`);
      return;
    }
    const date = parseDate(cells[1]);
    if (!date) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "trade.invalidDate", where, cells[1]);
      return;
    }
    const price = parseNumber(cells[4]) ?? 0;
    const quantity = parseNumber(cells[5]) ?? 0;
    const side = normalizeEnum<TradeSide>(cells[3] ?? "", ["buy", "sell"] as const, "buy");
    const amountCents = parseMoneyToCents(cells[6]) ?? toCents(price * quantity);
    const feeCents = parseMoneyToCents(cells[7]) ?? 0;
    if (cells.length > 9) {
      pushWarn(warnings, "trade.extraColumns", where, `${cells.length} columns`);
    }
    const stageOrder = parseInteger(cells[2]);

    trades.push({
      id: cells[0] || `pl_t${Date.now().toString(36)}${idx}`,
      date,
      stageOrder: stageOrder && stageOrder > 0 ? stageOrder : null,
      side,
      price,
      quantity,
      amountCents,
      feeCents,
      note: cells[8] || "",
    });
  });

  if (orphan.length > 0) orphanRows[canonicalTitle] = orphan;
  return trades;
}

function parsePrices(
  section: RawSection | undefined,
  canonicalTitle: string,
  warnings: PlanWarning[],
  orphanRows: Record<string, string[]>,
): PricePoint[] {
  if (!section) return [];
  const table = parseTable(section.lines);
  const byDate = new Map<string, PricePoint>();
  const orphan = [...table.orphan];

  table.rows.forEach((cells, idx) => {
    const where = `${section.title}:${idx + 1}`;
    if (cells.length < 2) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "table.tooFewColumns", where, `${cells.length} columns`);
      return;
    }
    const date = parseDate(cells[0]);
    const price = parseNumber(cells[1]);
    if (!date || price === null) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "price.invalidRow", where, table.rowLines[idx]);
      return;
    }
    // 同一天后写覆盖：一天内多次改价不该堆成一串点
    byDate.set(date, { date, price, note: cells[2] || "" });
  });

  if (orphan.length > 0) orphanRows[canonicalTitle] = orphan;
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function parseAdjustments(
  section: RawSection | undefined,
  canonicalTitle: string,
  warnings: PlanWarning[],
  orphanRows: Record<string, string[]>,
): PlanAdjustment[] {
  if (!section) return [];
  const table = parseTable(section.lines);
  const result: PlanAdjustment[] = [];
  const orphan = [...table.orphan];

  table.rows.forEach((cells, idx) => {
    const where = `${section.title}:${idx + 1}`;
    if (cells.length < 3) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "table.tooFewColumns", where, `${cells.length} columns`);
      return;
    }
    const date = parseDate(cells[0]);
    if (!date) {
      orphan.push(table.rowLines[idx]);
      pushWarn(warnings, "adjustment.invalidDate", where, cells[0]);
      return;
    }
    result.push({
      date,
      stageOrder: parseInteger(cells[1]) ?? 0,
      field: cells[2] || "unknown",
      before: cells[3] || "",
      after: cells[4] || "",
      note: cells[5] || "",
    });
  });

  if (orphan.length > 0) orphanRows[canonicalTitle] = orphan;
  return result;
}

// ============================================================
// 主入口
// ============================================================

export interface ParseOptions {
  /** 兜底创建日期；默认今天 */
  today?: string;
}

/** 解析一份计划 Markdown。frontmatter 非法会抛 PlanParseError，其余问题只记 warning */
export function parsePlan(raw: string, filePath: string, opts: ParseOptions = {}): AccumulationPlan {
  const doc = splitDocument(raw);
  const meta = doc.frontmatter;
  const stem = stemOf(filePath);
  const warnings: PlanWarning[] = [];
  const orphanRows: Record<string, string[]> = {};

  const id = meta.id?.trim() || fallbackId(stem);
  if (!meta.id) pushWarn(warnings, "frontmatter.missingId", "frontmatter", stem);
  if (!meta.name) pushWarn(warnings, "frontmatter.missingName", "frontmatter", stem);
  if (!meta.symbol) pushWarn(warnings, "frontmatter.missingSymbol", "frontmatter", stem);

  const referencePrice = parseNumber(meta.referencePrice) ?? 0;
  const totalBudgetCents = parseMoneyToCents(meta.totalBudget) ?? 0;
  if (meta.totalBudget !== undefined && totalBudgetCents <= 0) {
    pushWarn(warnings, "frontmatter.invalidBudget", "frontmatter", meta.totalBudget);
  }

  const reserveRaw = parseNumber(meta.reserveRatio) ?? 0;
  const reserveRatio = Math.min(100, Math.max(0, reserveRaw));

  const bySection = new Map<SectionKey, RawSection>();
  const unknownSections: RawSection[] = [];
  for (const section of doc.sections) {
    const key = sectionKey(section.title);
    if (key === "unknown") {
      if (section.lines.some((l) => l.trim())) unknownSections.push(section);
      continue;
    }
    if (!bySection.has(key)) bySection.set(key, section);
  }

  const createdAt = parseDate(meta.createdAt) ?? opts.today ?? todayString();

  const plan: AccumulationPlan = {
    id,
    name: meta.name?.trim() || stem,
    symbol: meta.symbol?.trim() || "",
    market: normalizeEnum<AccMarket>(meta.market ?? "", MARKETS, "OTHER"),
    assetType: normalizeEnum<AccAssetType>(meta.assetType ?? "", ASSET_TYPES, "other"),
    currency: normalizeEnum<AccCurrency>(meta.currency ?? "", ["CNY", "HKD", "USD"] as const, "CNY"),
    createdAt,
    updatedAt: meta.updatedAt?.trim() || new Date().toISOString(),
    totalBudgetCents,
    referencePrice,
    currentPrice: parseNumber(meta.currentPrice) ?? 0,
    priceUpdatedAt: parseDate(meta.priceUpdatedAt),
    reserveRatio,
    amountMode: normalizeEnum<AmountMode>(meta.amountMode ?? "", AMOUNT_MODES, "custom"),
    requireConfirmDefault: parseBool(meta.requireConfirmDefault) ?? true,
    fxRateOverride: parseNumber(meta.fxRateOverride) ?? undefined,
    archivedAt: parseDate(meta.archivedAt),
    stages: parseStages(
      bySection.get("stages"),
      SECTION_TITLES.stages,
      referencePrice,
      warnings,
      orphanRows,
    ),
    trades: parseTrades(bySection.get("trades"), SECTION_TITLES.trades, warnings, orphanRows),
    prices: parsePrices(bySection.get("prices"), SECTION_TITLES.prices, warnings, orphanRows),
    adjustments: parseAdjustments(
      bySection.get("adjustments"),
      SECTION_TITLES.adjustments,
      warnings,
      orphanRows,
    ),
    logic: proseOf(bySection.get("logic")),
    review: proseOf(bySection.get("review")),
    extraFrontmatter: doc.extraFrontmatter,
    unknownSections,
    orphanRows,
    warnings,
  };

  return plan;
}
