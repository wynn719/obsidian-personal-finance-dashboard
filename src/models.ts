/**
 * Core data models for the Finance Dashboard plugin.
 * Asset snapshots use a flat one-level structure (category → amount per month).
 */

// ============================================================
// Asset Snapshot - one record per month, all categories in one object
// ============================================================

/** Amount for a single asset category within a monthly snapshot */
export interface CategoryAmount {
  /** Asset category name, e.g. "货币短债", "中长债" */
  category: string;
  /** Total amount for this category (already summed across accounts) */
  amount: number;
  /** Optional details memo, e.g. "微众 1029440, 招商银行 675844" */
  details?: string;
}

/** Monthly asset snapshot - one record captures the full picture */
export interface AssetSnapshot {
  id: string;
  /** Month in "YYYY-MM" format, e.g. "2025-03" */
  month: string;
  /** All category amounts for this month */
  categories: CategoryAmount[];
  /** Pre-calculated total assets for this month */
  totalAssets: number;
  /** Optional note for the month, e.g. "港美股大跌、A股小跌" */
  note?: string;
}

// ============================================================
// Cash Flow Records (Income / Expense)
// ============================================================

export type CashFlowType = "income" | "expense";

export interface CashFlowRecord {
  id: string;
  type: CashFlowType;
  /** Date in "YYYY-MM-DD" format */
  date: string;
  amount: number;
  /** Category, e.g. "工资", "副业", "房租", "餐饮" */
  category: string;
  note?: string;
}

// ============================================================
// Dividend Records
// ============================================================

export interface DividendRecord {
  id: string;
  /** Date in "YYYY-MM-DD" format */
  date: string;
  /** Stock name, e.g. "五粮液", "中国神华" */
  stockName: string;
  amount: number;
  note?: string;
}

// ============================================================
// Stock Holdings (Misc Data)
// ============================================================

/** Holding display/valuation currency codes */
export type HoldingCurrency = "CNY" | "HKD" | "USD";

export interface StockHolding {
  id: string;
  /** Stock name, e.g. "五粮液", "腾讯控股" — auto-filled from the quote API */
  name: string;
  /** Holding market value in native currency = shares × price (written back on refresh) */
  amount: number;
  /** Stock code for live quotes, e.g. "600036" (A-share), "00700" (HK), "AAPL" (US) */
  symbol: string;
  /** Number of shares held */
  shares: number;
  /** Native trading currency of the symbol, derived from the market */
  currency: HoldingCurrency;
  /** FX rate to CNY at last refresh (CNY per 1 unit of currency); 1 for A-shares */
  fxRate: number;
  /** Last fetched price (per share, in native currency) */
  price?: number;
  /** Day change percent from last quote fetch, e.g. 1.84 means +1.84% */
  priceChangePercent?: number;
  /** Timestamp (ISO string) of the last successful quote refresh */
  quoteTime?: string;
}

// ============================================================
// Market signal caches (Misc Data) — refreshed manually, cached to disk
// ============================================================

/** Yearly-mean-line strategy zone (CSI Dividend Low Volatility 100) */
export type IndexSignalZone = "buy" | "hold" | "sell" | "overheat";

/** Index MA250 deviation signal (cached; mirrors the daily WorkBuddy check) */
export interface IndexSignal {
  /** CSI index code, e.g. "930955" */
  indexCode: string;
  /** Index display name, e.g. "中证红利低波动100指数" */
  indexName: string;
  /** Latest trading day, "YYYY-MM-DD" */
  tradeDate: string;
  /** Close of the latest trading day */
  close: number;
  /** 250-trading-day moving average of the close */
  ma250: number;
  /** Deviation from MA250 in percent, e.g. 1.94 means +1.94% */
  deviation: number;
  /** Strategy zone derived from the deviation */
  zone: IndexSignalZone;
  /** ISO timestamp of the last refresh */
  updatedAt: string;
}

/** One stock's TTM dividend yield (tracker pool, mirrors ttm_yield.py) */
export interface DividendYieldRow {
  name: string;
  /** Plain 6-digit A-share code, e.g. "600036" */
  symbol: string;
  /** "semi" = annual + interim, "annual" = annual only */
  divType: "semi" | "annual";
  /** Latest implemented annual report period, "YYYY-MM-DD" */
  annualPeriod: string;
  /** Latest implemented interim report period (semi only), "YYYY-MM-DD" */
  interimPeriod?: string;
  /** TTM dividend per share (¥, pre-tax) */
  ttmPerShare: number;
  /** Latest price (¥) */
  price: number;
  /** TTM yield in percent, e.g. 4.78 means 4.78% */
  yieldPct: number;
  /** Latest annual report period not yet implemented (reminder), if any */
  pendingAnnual?: string;
  /** ISO timestamp of the last refresh */
  updatedAt: string;
}

/** One ETF's premium quote vs its latest NAV (market data) */
export interface EtfPremiumRow {
  /** ETF code, e.g. "513100" */
  code: string;
  name: string;
  /** Latest price (¥) */
  price: number;
  /** Premium percent vs the latest published NAV; negative = discount */
  premium: number;
  /** Combined fee percent (management + custody) */
  fee: number;
  /** Fund scale in 100M CNY */
  scale: number;
  /** ISO timestamp of the last refresh */
  updatedAt: string;
}

// ============================================================
// Pomodoro (focus sessions, Misc Data)
// ============================================================

/**
 * One day's completed pomodoros, aggregated per day.
 * Storing a row per day (instead of per session) keeps Misc.md compact —
 * a year of heavy use is ~365 rows — while still supporting the today /
 * this-week statistics the dashboard shows.
 */
export interface PomodoroDay {
  /** Date in "YYYY-MM-DD" format */
  date: string;
  /** Number of completed focus sessions that day */
  count: number;
  /** Total focused minutes that day */
  minutes: number;
}

/** Container for the standalone Misc data file (extensible: one `#` section per data type) */
export interface MiscData {
  stockHoldings: StockHolding[];
  /** Cached MA250 strategy signal (single index) */
  indexSignal?: IndexSignal;
  /** Cached TTM dividend yield tracker rows */
  dividendYields?: DividendYieldRow[];
  /** Cached ETF premium monitor rows */
  etfPremiums?: EtfPremiumRow[];
}

export const EMPTY_MISC_DATA: MiscData = {
  stockHoldings: [],
};

// ============================================================
// Target Allocation
// ============================================================

export interface TargetAllocation {
  category: string;
  /** Target percentage, e.g. 25 means 25% */
  percentage: number;
}

// ============================================================
// Plugin Settings
// ============================================================

export interface FinanceSettings {
  /** Display language */
  locale: import("./i18n").Locale;
  /** Path to the folder that stores yearly Markdown data files (relative to vault root) */
  dataFolderPath: string;
  /** Full path to the standalone Markdown file storing non-yearly data (relative to vault root, includes file name) */
  miscDataFilePath: string;
  /** Full path to the standalone Markdown file storing pomodoro records (relative to vault root, includes file name) */
  pomodoroDataFilePath: string;
  /** Target asset allocation percentages */
  targetAllocations: TargetAllocation[];
  /** Asset categories */
  assetCategories: string[];
  /** Income categories */
  incomeCategories: string[];
  /** Expense categories */
  expenseCategories: string[];
}

export const DEFAULT_SETTINGS: FinanceSettings = {
  locale: "zh",
  dataFolderPath: "Finance",
  miscDataFilePath: "Finance/Misc.md",
  pomodoroDataFilePath: "Finance/Pomodoro.md",
  targetAllocations: [
    { category: "货币短债", percentage: 25 },
    { category: "中长债", percentage: 20 },
    { category: "黄金", percentage: 5 },
    { category: "高股息", percentage: 10 },
    { category: "港美A", percentage: 40 },
  ],
  assetCategories: ["货币短债", "中长债", "黄金", "高股息", "港美A"],
  incomeCategories: ["工资", "副业", "投资收益", "其他收入"],
  expenseCategories: ["房租", "餐饮", "交通", "娱乐", "其他支出"],
};

// ============================================================
// Full Data Store
// ============================================================

export interface FinanceData {
  assetSnapshots: AssetSnapshot[];
  cashFlowRecords: CashFlowRecord[];
  dividendRecords: DividendRecord[];
}

export const EMPTY_FINANCE_DATA: FinanceData = {
  assetSnapshots: [],
  cashFlowRecords: [],
  dividendRecords: [],
};
