/**
 * 分批建仓（Position Tracker）的数据模型。
 *
 * 三条约定贯穿整个模块：
 * 1) 金额一律用整数「分」（Cents），只在 toCents / 写入文件两个边界取整；
 * 2) 阶段状态是**派生态**：文件里只持久 skipped / voided / confirmed 三个用户意图标记，
 *    pending / triggered / partial / completed 全部由「成交 + 现价 + 触发价」现场推导。
 *    成交是唯一事实源，持久状态一旦被手改表格就会永久失真且无法自愈；
 * 3) 机器 token（first/left/right、buy/sell、CN/HK/US）用英文小写，UI 文案统一走 i18n。
 *
 * 本文件不依赖 obsidian，可被 node --test 直接打包运行。
 */

/** 金额：整数分 */
export type Cents = number;

export type AccCurrency = "CNY" | "HKD" | "USD";

export type AccMarket = "CN" | "HK" | "US" | "OTHER";

export type AccAssetType = "stock" | "etf" | "fund" | "bond" | "other";

/** 阶段类型：首次建仓 / 左侧补仓（越跌越买）/ 右侧确认（趋势确认后追加） */
export type StageKind = "first" | "left" | "right";

/** 触发模式：相对锚定价跌幅 / 指定目标价 */
export type TriggerMode = "drop" | "target";

/** 金额策略：固定 / 递增 / 自定义 */
export type AmountMode = "fixed" | "ladder" | "custom";

export type TradeSide = "buy" | "sell";

export type StageStatus =
  | "pending" // 待执行
  | "triggered" // 已触发（价格条件满足，尚未成交）
  | "partial" // 部分执行
  | "completed" // 已完成
  | "skipped" // 已跳过（用户显式标记）
  | "voided"; // 已失效（计划调整时作废）

export type PlanStatus = "pending" | "active" | "completed" | "archived";

export const CURRENCIES: AccCurrency[] = ["CNY", "HKD", "USD"];
export const MARKETS: AccMarket[] = ["CN", "HK", "US", "OTHER"];
export const ASSET_TYPES: AccAssetType[] = ["stock", "etf", "fund", "bond", "other"];
export const STAGE_KINDS: StageKind[] = ["first", "left", "right"];
export const TRIGGER_MODES: TriggerMode[] = ["drop", "target"];
export const AMOUNT_MODES: AmountMode[] = ["fixed", "ladder", "custom"];

// ============================================================
// 阶段
// ============================================================

export interface AccumulationStage {
  /** 1-based 序号，写入文件，成交靠它关联阶段 */
  order: number;
  /** 显示名，如「左侧补仓-15%」 */
  label: string;
  kind: StageKind;
  triggerMode: TriggerMode;
  /**
   * 触发锚定价 = 建计划时的首次参考买入价。
   * 创建后不再随成交价/现价变化，保证触发价永不漂移。
   */
  anchorPrice: number;
  /** mode=drop 时有效：相对 anchorPrice 的跌幅（8 表示 -8%） */
  dropPct: number;
  /** mode=target 时有效：显式目标价。两种模式同时保留，切换时按锚定价互算，不丢数据 */
  targetPrice?: number;
  /** 该阶段计划投入（分） */
  plannedCents: Cents;
  /** 是否必须人工确认（right 阶段强制 true） */
  requiresConfirm: boolean;
  /** 手动确认日期：right 阶段唯一的「触发」来源 */
  confirmedAt?: string;
  skippedAt?: string;
  skipReason?: string;
  /** 计划调整时作废未执行阶段 */
  voidedAt?: string;
}

/** 阶段 + 派生态，UI 与计算层统一消费 */
export interface StageView {
  stage: AccumulationStage;
  /** 派生触发价（永不持久化，也不读文件里那一列） */
  triggerPrice: number;
  /** 该阶段已投入（买入额+买入费，卖出按净额抵减） */
  actualCents: Cents;
  tradeCount: number;
  lastTradeDate?: string;
  /** 价格条件是否满足（right 阶段恒为 false） */
  priceReached: boolean;
  status: StageStatus;
  /** 执行偏差 = actual - planned */
  deviationCents: Cents;
}

// ============================================================
// 成交
// ============================================================

export interface AccumulationTrade {
  /** 稳定 ID，文件第一列，用于增改删 */
  id: string;
  date: string;
  /** 对应阶段序号；null = 未分配到任何阶段（金额仍计入累计投入） */
  stageOrder: number | null;
  side: TradeSide;
  price: number;
  /** 数量，允许小数（场内基金可拆份），精度 6 位 */
  quantity: number;
  /** 成交金额（分）。默认 round(price*qty*100)，允许手工覆盖 */
  amountCents: Cents;
  /** 手续费（分）：买入计入成本，卖出冲减收入 */
  feeCents: Cents;
  note: string;
}

// ============================================================
// 价格记录 / 计划调整历史
// ============================================================

/** 手动录入的价格点；同一天只保留一个（后写覆盖） */
export interface PricePoint {
  date: string;
  price: number;
  note: string;
}

/** 计划调整历史（append-only） */
export interface PlanAdjustment {
  date: string;
  /** 0 = 计划级字段；>0 = 阶段级 */
  stageOrder: number;
  /** 字段机器名：planned / dropPct / targetPrice / totalBudget / reserveRatio / stageRemoved */
  field: string;
  before: string;
  after: string;
  note: string;
}

// ============================================================
// 文件里的原始分节（round-trip 用）
// ============================================================

/** 一段 `# 标题` + 其后原始行（含空行，不含标题行） */
export interface RawSection {
  title: string;
  lines: string[];
}

export interface PlanWarning {
  level: "info" | "warn" | "error";
  /** 机器码，供 UI 映射文案 */
  code: string;
  /** 出问题的位置，如「阶段计划:12」 */
  where: string;
  detail: string;
}

// ============================================================
// 计划（读入后 UI 直接消费）
// ============================================================

export interface AccumulationPlan {
  // —— frontmatter ——
  id: string;
  name: string;
  symbol: string;
  market: AccMarket;
  assetType: AccAssetType;
  currency: AccCurrency;
  createdAt: string;
  updatedAt: string;
  totalBudgetCents: Cents;
  referencePrice: number;
  /** 手动录入的最新价；0 = 未录入 */
  currentPrice: number;
  priceUpdatedAt?: string;
  /** 预留资金比例 0~100：不参与阶段分配，也不得投入 */
  reserveRatio: number;
  amountMode: AmountMode;
  requireConfirmDefault: boolean;
  /** 手工覆盖的汇率（CNY per 1 unit）；缺省走持仓 fxRate → 设置参考汇率 */
  fxRateOverride?: number;
  archivedAt?: string;

  // —— 表格 ——
  stages: AccumulationStage[];
  trades: AccumulationTrade[];
  prices: PricePoint[];
  adjustments: PlanAdjustment[];

  // —— 自由正文（逐行原样保留）——
  logic: string;
  review: string;

  // —— round-trip 附件 ——
  /** 未识别的 frontmatter 键（保留原始整行） */
  extraFrontmatter: string[];
  /** 未识别的 `#` 分节，原样回写 */
  unknownSections: RawSection[];
  /** 各表里无法解析的行，原样附在表体末尾 */
  orphanRows: Record<string, string[]>;
  /** 解析期发现的问题，不阻断加载 */
  warnings: PlanWarning[];
}

// ============================================================
// 计算结果
// ============================================================

export interface Position {
  shares: number;
  /** 持仓成本（分），移动加权平均口径 */
  costBasisCents: Cents;
  realizedPnlCents: Cents;
  /** 累计买入金额（分，不含费） */
  buyAmountCents: Cents;
  /** 累计卖出金额（分，不含费） */
  sellAmountCents: Cents;
  feesCents: Cents;
  /** 累计投入（净现金流）= 买入额 + 买入费 − 卖出额 + 卖出费 */
  investedCents: Cents;
  avgCost: number;
  invalidSellCount: number;
}

export interface PlanMetrics extends Position {
  totalBudgetCents: Cents;
  remainingBudgetCents: Cents;
  usageRate: number;
  currentPrice: number;
  marketValueCents: Cents;
  unrealizedPnlCents: Cents;
  unrealizedPct: number;
  /** 折算到展示币种后的金额（只用于跨币种排序/汇总，计划内展示永远本币） */
  totalBudgetDisplayCents: Cents;
  investedDisplayCents: Cents;
  unrealizedPnlDisplayCents: Cents;
  displayCurrency: AccCurrency;
}

export interface BudgetCheck {
  totalBudgetCents: Cents;
  reservedCents: Cents;
  /** 可分配 = 总预算 - 预留 */
  deployableCents: Cents;
  allocatedCents: Cents;
  /** 允许 > 0（保留未分配） */
  unallocatedCents: Cents;
  overAllocated: boolean;
  investedCents: Cents;
  overInvested: boolean;
  /** 各阶段占可分配预算的百分比 */
  stageRatios: number[];
}

export interface NextAction {
  stageOrder: number;
  label: string;
  triggerPrice: number;
  currentPrice: number;
  /** (现价 − 触发价) / 触发价 × 100；触发价 0 时为 null */
  distancePct: number | null;
  plannedCents: Cents;
  remainingBudgetCents: Cents;
  priceReached: boolean;
  requiresConfirm: boolean;
  /** right 阶段：只提示「需手动确认」，绝不由价格自动判定 */
  needsManualConfirm: boolean;
}

export interface CompareRow {
  stageOrder: number;
  label: string;
  status: StageStatus;
  plannedCents: Cents;
  actualCents: Cents;
  deviationCents: Cents;
  plannedUsagePct: number;
  actualUsagePct: number;
  skipReason?: string;
}

export interface DrawdownResult {
  /** 相对当日持仓均价的最大浮亏（负数），null = 数据不完整 */
  maxLossPct: number | null;
  maxGainPct: number | null;
  sampleCount: number;
  incomplete: boolean;
}

export interface PlanListRow {
  plan: AccumulationPlan;
  metrics: PlanMetrics;
  status: PlanStatus;
  /** 建仓进度：Σ min(actual, planned) / Σ planned */
  progressPct: number;
  next: NextAction | null;
  broken: boolean;
}

export interface PlanListFilter {
  market: AccMarket | "all";
  assetType: AccAssetType | "all";
  status: PlanStatus | "all";
}

export type PlanSortKey = "pnl" | "usage" | "updatedAt" | "nextTrigger";

/** 第二批预留：组合级统计（第一批只定义类型） */
export interface PortfolioStats {
  total: number;
  winCount: number;
  winRate: number;
  avgReturnPct: number;
  avgMaxLossPct: number;
  avgDurationDays: number;
  avgCapitalOccupancy: number;
  executionDeviationPct: number;
  rightSideCapitalRatio: number;
  sampleEnough: boolean;
}

// ============================================================
// 新建 / 更新入参
// ============================================================

export interface NewPlanInput {
  name: string;
  symbol: string;
  market: AccMarket;
  assetType: AccAssetType;
  currency: AccCurrency;
  createdAt: string;
  totalBudgetCents: Cents;
  referencePrice: number;
  currentPrice: number;
  reserveRatio: number;
  amountMode: AmountMode;
  requireConfirmDefault: boolean;
  logic: string;
  stages: AccumulationStage[];
}

/** 只允许改「未来」：阶段计划、预算、策略参数。成交一律走 trade 方法 */
export interface PlanPatch {
  name?: string;
  symbol?: string;
  market?: AccMarket;
  assetType?: AccAssetType;
  currency?: AccCurrency;
  totalBudgetCents?: Cents;
  referencePrice?: number;
  currentPrice?: number;
  priceUpdatedAt?: string;
  reserveRatio?: number;
  amountMode?: AmountMode;
  requireConfirmDefault?: boolean;
  fxRateOverride?: number;
  logic?: string;
  review?: string;
  stages?: AccumulationStage[];
}
