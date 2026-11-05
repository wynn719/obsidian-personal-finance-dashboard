/**
 * AccumulationPlan → 计划 Markdown。
 *
 * round-trip 分工：
 * - frontmatter 已知键、4 张表：插件全量重写；
 * - frontmatter 未知键：保留原始整行，插在已知键之后；
 * - `# 投资逻辑` / `# 复盘`：用户正文，逐行原样输出；
 * - 其它未知分节：整段原样跟随在文末。
 *
 * 分节标题与表头统一用英文（与 Finance/Misc.md 的既有习惯一致），
 * 读入侧中英文都认，所以手写中文标题也能正常工作。
 */

import { formatCents, formatPrice } from "./money";
import { buildHeader, buildRow, alignRow } from "./table";
import { computeTriggerPrice } from "./calc";
import { SECTION_TITLES } from "./parser";
import type {
  AccumulationPlan,
  AccumulationStage,
  AccumulationTrade,
  PlanAdjustment,
  PricePoint,
} from "./types";

const STAGE_HEADERS = [
  "Order",
  "Label",
  "Kind",
  "Mode",
  "Anchor",
  "Drop%",
  "Target",
  "Trigger",
  "Planned",
  "Confirm",
  "ConfirmedAt",
  "SkippedAt",
  "SkipReason",
  "VoidedAt",
];
const STAGE_ALIGN: Array<"left" | "right"> = [
  "right",
  "left",
  "left",
  "left",
  "right",
  "right",
  "right",
  "right",
  "right",
  "left",
  "left",
  "left",
  "left",
  "left",
];

const TRADE_HEADERS = ["ID", "Date", "Stage", "Side", "Price", "Quantity", "Amount", "Fee", "Note"];
const TRADE_ALIGN: Array<"left" | "right"> = [
  "left",
  "left",
  "right",
  "left",
  "right",
  "right",
  "right",
  "right",
  "left",
];

const PRICE_HEADERS = ["Date", "Price", "Note"];
const PRICE_ALIGN: Array<"left" | "right"> = ["left", "right", "left"];

const ADJUST_HEADERS = ["Date", "Stage", "Field", "Before", "After", "Note"];
const ADJUST_ALIGN: Array<"left" | "right"> = ["left", "right", "left", "left", "left", "left"];

function stageRow(stage: AccumulationStage): string {
  return buildRow([
    String(stage.order),
    stage.label,
    stage.kind,
    stage.triggerMode,
    formatPrice(stage.anchorPrice, 4),
    Number.isFinite(stage.dropPct) ? stage.dropPct.toFixed(2) : "0.00",
    stage.targetPrice === undefined ? "" : formatPrice(stage.targetPrice, 4),
    // 只读派生列：写出来是为了肉眼 readable，读入时一律重算
    formatPrice(computeTriggerPrice(stage), 4),
    formatCents(stage.plannedCents),
    stage.requiresConfirm ? "true" : "false",
    stage.confirmedAt ?? "",
    stage.skippedAt ?? "",
    stage.skipReason ?? "",
    stage.voidedAt ?? "",
  ]);
}

function tradeRow(trade: AccumulationTrade): string {
  return buildRow([
    trade.id,
    trade.date,
    trade.stageOrder === null ? "" : String(trade.stageOrder),
    trade.side,
    formatPrice(trade.price, 4),
    formatPrice(trade.quantity, 6),
    formatCents(trade.amountCents),
    formatCents(trade.feeCents),
    trade.note,
  ]);
}

function priceRow(point: PricePoint): string {
  return buildRow([point.date, formatPrice(point.price, 4), point.note]);
}

function adjustmentRow(item: PlanAdjustment): string {
  return buildRow([
    item.date,
    String(item.stageOrder),
    item.field,
    item.before,
    item.after,
    item.note,
  ]);
}

function tableBlock(
  title: string,
  headers: string[],
  align: Array<"left" | "right">,
  rows: string[],
  extraLines: string[] = [],
): string {
  const extras = extraLines.filter((line) => line.trim());
  return [`# ${title}`, "", buildHeader(headers), alignRow(align), ...rows, ...extras].join("\n");
}

/** 用户正文块：保留内部空行，只掐掉首尾空行（否则每轮写入都会多出空行） */
function proseBlock(title: string, text: string): string {
  const trimmed = text.replace(/\r\n/g, "\n").replace(/^\s+|\s+$/g, "");
  return trimmed ? `# ${title}\n\n${trimmed}` : `# ${title}`;
}

function frontmatterBlock(plan: AccumulationPlan): string {
  const lines: string[] = ["---"];
  lines.push(`id: ${plan.id}`);
  lines.push(`name: ${plan.name}`);
  lines.push(`symbol: ${plan.symbol}`);
  lines.push(`market: ${plan.market}`);
  lines.push(`assetType: ${plan.assetType}`);
  lines.push(`currency: ${plan.currency}`);
  lines.push(`createdAt: ${plan.createdAt}`);
  lines.push(`updatedAt: ${plan.updatedAt}`);
  lines.push(`totalBudget: ${formatCents(plan.totalBudgetCents)}`);
  lines.push(`referencePrice: ${formatPrice(plan.referencePrice, 4)}`);
  lines.push(`currentPrice: ${formatPrice(plan.currentPrice, 4)}`);
  if (plan.priceUpdatedAt) lines.push(`priceUpdatedAt: ${plan.priceUpdatedAt}`);
  lines.push(`reserveRatio: ${plan.reserveRatio}`);
  lines.push(`amountMode: ${plan.amountMode}`);
  lines.push(`requireConfirmDefault: ${plan.requireConfirmDefault ? "true" : "false"}`);
  if (plan.fxRateOverride !== undefined && Number.isFinite(plan.fxRateOverride)) {
    lines.push(`fxRateOverride: ${formatPrice(plan.fxRateOverride, 6)}`);
  }
  if (plan.archivedAt) lines.push(`archivedAt: ${plan.archivedAt}`);
  // 未知键原样保留，避免手写的元数据被静默吞掉
  for (const raw of plan.extraFrontmatter) {
    if (raw.trim()) lines.push(raw);
  }
  lines.push("---");
  return lines.join("\n");
}

export function serializePlan(plan: AccumulationPlan): string {
  const blocks: string[] = [frontmatterBlock(plan)];

  const stages = [...plan.stages].sort((a, b) => a.order - b.order);
  blocks.push(
    tableBlock(
      SECTION_TITLES.stages,
      STAGE_HEADERS,
      STAGE_ALIGN,
      stages.map(stageRow),
      plan.orphanRows[SECTION_TITLES.stages],
    ),
  );
  blocks.push(
    tableBlock(
      SECTION_TITLES.trades,
      TRADE_HEADERS,
      TRADE_ALIGN,
      plan.trades.map(tradeRow),
      plan.orphanRows[SECTION_TITLES.trades],
    ),
  );
  blocks.push(
    tableBlock(
      SECTION_TITLES.prices,
      PRICE_HEADERS,
      PRICE_ALIGN,
      plan.prices.map(priceRow),
      plan.orphanRows[SECTION_TITLES.prices],
    ),
  );
  blocks.push(
    tableBlock(
      SECTION_TITLES.adjustments,
      ADJUST_HEADERS,
      ADJUST_ALIGN,
      plan.adjustments.map(adjustmentRow),
      plan.orphanRows[SECTION_TITLES.adjustments],
    ),
  );

  blocks.push(proseBlock(SECTION_TITLES.logic, plan.logic));
  blocks.push(proseBlock(SECTION_TITLES.review, plan.review));

  for (const section of plan.unknownSections) {
    const body = section.lines
      .join("\n")
      .replace(/\r\n/g, "\n")
      .replace(/^\s+|\s+$/g, "");
    blocks.push(body ? `# ${section.title}\n\n${body}` : `# ${section.title}`);
  }

  return `${blocks.join("\n\n")}\n`;
}
