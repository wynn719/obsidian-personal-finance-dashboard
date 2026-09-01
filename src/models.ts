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

/** Container for the standalone Misc data file (extensible: one `#` section per data type) */
export interface MiscData {
  stockHoldings: StockHolding[];
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
