/**
 * 分批建仓的计算层：持仓成本、盈亏、预算、触发、计划/实际对比、回撤。
 *
 * 所有函数都是纯函数（不碰文件、不碰 i18n），可直接在 node --test 里跑。
 * 金额一律整数分；比例用「分 ÷ 分」，不让浮点中间值进持久化。
 */

import { clampPct, convertCents, pct, toCents } from "./money";
import type {
  AccumulationPlan,
  AccumulationStage,
  AccumulationTrade,
  AccCurrency,
  BudgetCheck,
  CompareRow,
  DrawdownResult,
  NextAction,
  PlanListFilter,
  PlanListRow,
  PlanMetrics,
  PlanSortKey,
  PlanStatus,
  Position,
  StageStatus,
  StageView,
} from "./types";

const EPS = 1e-9;

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

// ============================================================
// 触发价
// ============================================================

/**
 * 阶段触发价。
 * drop 模式 = 锚定价 × (1 − 跌幅%)，锚定价在计划创建时锁定，
 * 所以成交价怎么变都不会把触发价带跑；target 模式直接取目标价。
 */
export function computeTriggerPrice(stage: AccumulationStage): number {
  if (stage.triggerMode === "target") {
    if (stage.targetPrice !== undefined && Number.isFinite(stage.targetPrice) && stage.targetPrice > 0) {
      return round4(stage.targetPrice);
    }
    // target 模式但没填目标价：退回跌幅口径，避免触发价变 0 把整条时间线打乱
  }
  const drop = Number.isFinite(stage.dropPct) ? stage.dropPct : 0;
  return round4(stage.anchorPrice * (1 - drop / 100));
}

// ============================================================
// 持仓（移动加权平均成本）
// ============================================================

export function emptyPosition(): Position {
  return {
    shares: 0,
    costBasisCents: 0,
    realizedPnlCents: 0,
    buyAmountCents: 0,
    sellAmountCents: 0,
    feesCents: 0,
    investedCents: 0,
    avgCost: 0,
    invalidSellCount: 0,
  };
}

/** 按日期升序、同日按文件原序（sort 在现代 V8/WebKit 稳定，这里仍用索引兜底） */
export function sortTrades(trades: AccumulationTrade[]): AccumulationTrade[] {
  return trades
    .map((trade, index) => ({ trade, index }))
    .sort((a, b) => a.trade.date.localeCompare(b.trade.date) || a.index - b.index)
    .map((item) => item.trade);
}

/**
 * 应用一笔成交：
 * - 买入：成本 += 金额 + 手续费，投入 += 金额 + 手续费
 * - 卖出：成本按数量比例转出（唯一取整点），proceeds = 金额 − 手续费
 * - 清仓：把四舍五入残差并入已实现盈亏，成本归零
 * - 超卖：不清成负数，只计 invalidSellCount
 */
export function applyTrade(position: Position, trade: AccumulationTrade): Position {
  const next: Position = { ...position };
  const amount = Math.round(trade.amountCents);
  const fee = Math.round(trade.feeCents);
  const quantity = trade.quantity;

  if (!Number.isFinite(quantity) || quantity <= 0) return next;

  if (trade.side === "buy") {
    next.shares = round6(next.shares + quantity);
    next.costBasisCents += amount + fee;
    next.buyAmountCents += amount;
    next.feesCents += fee;
    next.investedCents += amount + fee;
  } else {
    if (next.shares <= EPS || quantity > next.shares + EPS) {
      next.invalidSellCount += 1;
      return next;
    }
    const ratio = Math.min(1, quantity / next.shares);
    const costOut = Math.round(next.costBasisCents * ratio);
    const proceeds = amount - fee;
    next.realizedPnlCents += proceeds - costOut;
    next.costBasisCents -= costOut;
    next.shares = round6(next.shares - quantity);
    next.sellAmountCents += amount;
    next.feesCents += fee;
    next.investedCents += fee - amount;

    if (next.shares <= EPS) {
      next.realizedPnlCents += next.costBasisCents;
      next.costBasisCents = 0;
      next.shares = 0;
    }
  }

  next.avgCost = next.shares > 0 ? next.costBasisCents / 100 / next.shares : 0;
  return next;
}

export class PositionCalculator {
  static compute(trades: AccumulationTrade[]): Position {
    return sortTrades(trades).reduce(applyTrade, emptyPosition());
  }

  static apply(position: Position, trade: AccumulationTrade): Position {
    return applyTrade(position, trade);
  }
}

// ============================================================
// 阶段派生
// ============================================================

function stageActualCents(trades: AccumulationTrade[]): number {
  return trades.reduce((sum, trade) => {
    return sum + (trade.side === "buy" ? trade.amountCents + trade.feeCents : -(trade.amountCents - trade.feeCents));
  }, 0);
}

export function deriveStageStatus(
  stage: AccumulationStage,
  actualCents: number,
  priceReached: boolean,
): StageStatus {
  if (stage.voidedAt) return "voided";
  if (stage.skippedAt) return "skipped";
  if (actualCents > 0) {
    if (stage.plannedCents > 0 && actualCents >= stage.plannedCents) return "completed";
    return "partial";
  }
  if (stage.plannedCents <= 0 && actualCents === 0) {
    // 计划额为 0 的空阶段：不参与进度，仍可能被价格触发
    return priceReached ? "triggered" : "pending";
  }
  if (priceReached) return "triggered";
  return "pending";
}

export function buildStageViews(plan: AccumulationPlan): StageView[] {
  const trades = sortTrades(plan.trades);
  const currentPrice = plan.currentPrice;

  return [...plan.stages]
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const stageTrades = trades.filter((trade) => trade.stageOrder === stage.order);
      const actualCents = stageActualCents(stageTrades);
      const triggerPrice = computeTriggerPrice(stage);
      // right 阶段永远不看价格：右侧确认只能由用户手动标记（confirmedAt 就是它的触发源）
      const priceReached =
        stage.kind === "right"
          ? Boolean(stage.confirmedAt)
          : currentPrice > 0 &&
            triggerPrice > 0 &&
            currentPrice <= triggerPrice * (1 + EPS);
      const status = deriveStageStatus(stage, actualCents, priceReached);
      const lastTrade = stageTrades[stageTrades.length - 1];

      return {
        stage,
        triggerPrice,
        actualCents,
        tradeCount: stageTrades.length,
        lastTradeDate: lastTrade?.date,
        priceReached,
        status,
        deviationCents: actualCents - stage.plannedCents,
      };
    });
}

/** 建仓进度：Σ min(实际, 计划) / Σ 计划；作废阶段不计入分母 */
export function planProgressPct(views: StageView[]): number {
  let planned = 0;
  let done = 0;
  for (const view of views) {
    if (view.stage.voidedAt) continue;
    if (view.stage.plannedCents <= 0) continue;
    planned += view.stage.plannedCents;
    done += Math.max(0, Math.min(view.actualCents, view.stage.plannedCents));
  }
  return clampPct(pct(done, planned));
}

export function derivePlanStatus(plan: AccumulationPlan, views: StageView[]): PlanStatus {
  if (plan.archivedAt) return "archived";
  const meaningful = views.filter((view) => !view.stage.voidedAt);
  if (meaningful.length > 0) {
    const allSettled = meaningful.every(
      (view) => view.status === "completed" || view.status === "skipped",
    );
    if (allSettled) return "completed";
  }
  if (plan.trades.length > 0) return "active";
  return "pending";
}

// ============================================================
// 计划级指标
// ============================================================

export function computePlanMetrics(
  plan: AccumulationPlan,
  fxRate = 1,
  displayCurrency: AccCurrency = plan.currency,
): PlanMetrics {
  const position = PositionCalculator.compute(plan.trades);
  const totalBudgetCents = plan.totalBudgetCents;
  const remainingBudgetCents = totalBudgetCents - position.investedCents;
  const usageRate = clampPct(pct(position.investedCents, totalBudgetCents));

  const hasPrice = plan.currentPrice > 0 && position.shares > 0;
  const marketValueCents = hasPrice ? Math.round(position.shares * plan.currentPrice * 100) : 0;
  const unrealizedPnlCents = hasPrice ? marketValueCents - position.costBasisCents : 0;
  const unrealizedPct =
    hasPrice && position.costBasisCents > 0
      ? (unrealizedPnlCents / position.costBasisCents) * 100
      : 0;

  return {
    ...position,
    totalBudgetCents,
    remainingBudgetCents,
    usageRate,
    currentPrice: plan.currentPrice,
    marketValueCents,
    unrealizedPnlCents,
    unrealizedPct,
    totalBudgetDisplayCents: convertCents(
      totalBudgetCents,
      plan.currency,
      displayCurrency,
      fxRate,
    ),
    investedDisplayCents: convertCents(
      position.investedCents,
      plan.currency,
      displayCurrency,
      fxRate,
    ),
    unrealizedPnlDisplayCents: convertCents(
      unrealizedPnlCents,
      plan.currency,
      displayCurrency,
      fxRate,
    ),
    displayCurrency,
  };
}

export function budgetCheck(plan: AccumulationPlan): BudgetCheck {
  const totalBudgetCents = plan.totalBudgetCents;
  const reservedCents = Math.round((totalBudgetCents * clampPct(plan.reserveRatio)) / 100);
  const deployableCents = totalBudgetCents - reservedCents;
  const active = plan.stages.filter((stage) => !stage.voidedAt);
  const allocatedCents = active.reduce((sum, stage) => sum + stage.plannedCents, 0);
  const unallocatedCents = deployableCents - allocatedCents;
  const investedCents = PositionCalculator.compute(plan.trades).investedCents;

  return {
    totalBudgetCents,
    reservedCents,
    deployableCents,
    allocatedCents,
    unallocatedCents,
    overAllocated: allocatedCents > deployableCents + EPS,
    investedCents,
    overInvested: investedCents > totalBudgetCents + EPS,
    stageRatios: active.map((stage) => pct(stage.plannedCents, deployableCents)),
  };
}

const SETTLED: StageStatus[] = ["completed", "skipped", "voided"];

/**
 * 下一次建仓机会。
 * 右侧确认阶段只有在左侧全部了结后才进入候选——它本质是「趋势确认后追加」，
 * 不该在下跌途中抢在补仓前面提示。
 */
export function nextAction(plan: AccumulationPlan, views?: StageView[]): NextAction | null {
  const stageViews = views ?? buildStageViews(plan);
  const leftPending = stageViews.some(
    (view) => view.stage.kind !== "right" && !SETTLED.includes(view.status),
  );
  const invested = PositionCalculator.compute(plan.trades).investedCents;

  for (const view of stageViews) {
    if (SETTLED.includes(view.status)) continue;
    if (view.stage.kind === "right" && leftPending) continue;

    return {
      stageOrder: view.stage.order,
      label: view.stage.label,
      triggerPrice: view.triggerPrice,
      currentPrice: plan.currentPrice,
      distancePct:
        view.triggerPrice > 0 && plan.currentPrice > 0
          ? ((plan.currentPrice - view.triggerPrice) / view.triggerPrice) * 100
          : null,
      plannedCents: view.stage.plannedCents,
      remainingBudgetCents: plan.totalBudgetCents - invested,
      priceReached: view.priceReached,
      requiresConfirm: view.stage.requiresConfirm || view.stage.kind === "right",
      needsManualConfirm: view.stage.kind === "right",
    };
  }
  return null;
}

export function buildCompareRows(plan: AccumulationPlan, views?: StageView[]): CompareRow[] {
  const stageViews = views ?? buildStageViews(plan);
  const total = plan.totalBudgetCents;
  const rows: CompareRow[] = stageViews.map((view) => ({
    stageOrder: view.stage.order,
    label: view.stage.label,
    status: view.status,
    plannedCents: view.stage.plannedCents,
    actualCents: view.actualCents,
    deviationCents: view.deviationCents,
    plannedUsagePct: pct(view.stage.plannedCents, total),
    actualUsagePct: pct(view.actualCents, total),
    skipReason: view.stage.skipReason,
  }));

  // 未分配到任何阶段的成交（补录、清仓等）单独成行，避免金额「凭空消失」
  const unassigned = plan.trades.filter((trade) => trade.stageOrder === null);
  if (unassigned.length > 0) {
    const actual = stageActualCents(unassigned);
    rows.push({
      stageOrder: 0,
      label: "",
      status: "partial",
      plannedCents: 0,
      actualCents: actual,
      deviationCents: actual,
      plannedUsagePct: 0,
      actualUsagePct: pct(actual, total),
    });
  }

  return rows;
}

/**
 * 最大浮亏/浮盈：以「当日持仓成本」为基准，逐价格点算浮动收益率。
 * 价格点不足 2 个（有效样本不足）时返回 incomplete，绝不拿 0 假装有回撤。
 */
export function computeDrawdown(plan: AccumulationPlan): DrawdownResult {
  const events: Array<{ date: string; order: number; trade?: AccumulationTrade; price?: number }> = [];
  for (const trade of sortTrades(plan.trades)) {
    events.push({ date: trade.date, order: 0, trade });
  }
  for (const point of plan.prices) {
    events.push({ date: point.date, order: 1, price: point.price });
  }
  events.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  let position = emptyPosition();
  let maxLoss: number | null = null;
  let maxGain: number | null = null;
  let sampleCount = 0;

  for (const event of events) {
    if (event.trade) {
      position = applyTrade(position, event.trade);
      continue;
    }
    const price = event.price ?? 0;
    if (price <= 0 || position.shares <= 0 || position.costBasisCents <= 0) continue;
    const ratio = ((price * position.shares * 100 - position.costBasisCents) / position.costBasisCents) * 100;
    sampleCount += 1;
    maxLoss = maxLoss === null ? ratio : Math.min(maxLoss, ratio);
    maxGain = maxGain === null ? ratio : Math.max(maxGain, ratio);
  }

  const incomplete = plan.prices.length < 2 || sampleCount < 2;
  return {
    maxLossPct: incomplete ? null : maxLoss,
    maxGainPct: incomplete ? null : maxGain,
    sampleCount,
    incomplete,
  };
}

// ============================================================
// 汇率与列表
// ============================================================

export interface FxHolding {
  symbol: string;
  currency: AccCurrency;
  fxRate: number;
}

/** 汇率优先级：计划覆盖 > 同标的持仓行情 > 设置参考汇率 > 1 */
export function resolveFxRate(
  plan: AccumulationPlan,
  holdings: readonly FxHolding[],
  refRates: Partial<Record<AccCurrency, number>>,
): number {
  if (plan.currency === "CNY") return 1;
  if (plan.fxRateOverride !== undefined && plan.fxRateOverride > 0) return plan.fxRateOverride;

  const holding = holdings.find(
    (item) => item.currency === plan.currency && item.symbol === plan.symbol && item.fxRate > 0,
  );
  if (holding) return holding.fxRate;

  const ref = refRates[plan.currency];
  if (ref !== undefined && ref > 0) return ref;
  return 1;
}

export function toListRow(plan: AccumulationPlan, fxRate: number, broken = false): PlanListRow {
  const views = buildStageViews(plan);
  return {
    plan,
    metrics: computePlanMetrics(plan, fxRate, "CNY"),
    status: derivePlanStatus(plan, views),
    progressPct: planProgressPct(views),
    next: nextAction(plan, views),
    broken,
  };
}

export function filterPlanRows(rows: PlanListRow[], filter: PlanListFilter): PlanListRow[] {
  return rows.filter((row) => {
    if (filter.market !== "all" && row.plan.market !== filter.market) return false;
    if (filter.assetType !== "all" && row.plan.assetType !== filter.assetType) return false;
    if (filter.status !== "all" && row.status !== filter.status) return false;
    return true;
  });
}

export function sortPlanRows(
  rows: PlanListRow[],
  key: PlanSortKey,
  dir: "asc" | "desc" = "desc",
): PlanListRow[] {
  const sign = dir === "asc" ? 1 : -1;
  const sorted = [...rows].sort((a, b) => {
    switch (key) {
      case "pnl":
        return (a.metrics.unrealizedPnlDisplayCents - b.metrics.unrealizedPnlDisplayCents) * sign;
      case "usage":
        return (a.metrics.usageRate - b.metrics.usageRate) * sign;
      case "nextTrigger": {
        const av = a.next?.distancePct ?? Number.POSITIVE_INFINITY;
        const bv = b.next?.distancePct ?? Number.POSITIVE_INFINITY;
        return (av - bv) * sign;
      }
      case "updatedAt":
      default:
        return a.plan.updatedAt.localeCompare(b.plan.updatedAt) * sign;
    }
  });
  return sorted;
}

export function sumPlansInCny(rows: PlanListRow[]): {
  budgetCents: number;
  investedCents: number;
  pnlCents: number;
} {
  return rows.reduce(
    (acc, row) => ({
      budgetCents: acc.budgetCents + row.metrics.totalBudgetDisplayCents,
      investedCents: acc.investedCents + row.metrics.investedDisplayCents,
      pnlCents: acc.pnlCents + row.metrics.unrealizedPnlDisplayCents,
    }),
    { budgetCents: 0, investedCents: 0, pnlCents: 0 },
  );
}

/** 成交金额默认值：价格 × 数量（唯一取整点） */
export function autoAmountCents(price: number, quantity: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return 0;
  return toCents(price * quantity);
}
