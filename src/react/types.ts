import type { DataStore } from "../data-store";
import type { FinanceCalculator } from "../calculator";
import type {
  FinanceSettings,
  AssetSnapshot,
  CashFlowRecord,
  DividendRecord,
  StockHolding,
  HoldingCurrency,
} from "../models";
import type {
  DashboardMetrics,
  AllocationRow,
  MonthlyOverviewRow,
  MonthlyCashFlowRow,
  MonthlyTotalAssetsRow,
  DividendSummaryRow,
} from "../calculator";

// ===== 顶层注入 =====
export interface FinanceAppProps {
  /** 仪表盘根容器节点（Obsidian contentEl），供 LayoutProvider 测量并下发 data-layout。 */
  container: HTMLElement;
  store: DataStore;
  calculator: FinanceCalculator;
  settings: FinanceSettings;
  onAddSnapshot: (() => void) | null;
  onAddCashFlow: (() => void) | null;
  onAddDividend: (() => void) | null;
  onEditHoldings: (() => void) | null;
  onEditSnapshot: ((s: AssetSnapshot) => void) | null;
  onEditCashFlow: ((r: CashFlowRecord) => void) | null;
  onEditDividend: ((r: DividendRecord) => void) | null;
  onEditHolding: ((h: StockHolding) => void) | null;
  onRefreshData: (() => Promise<void>) | null;
}

// ===== Header =====
export interface HeaderProps {
  store: DataStore;
  currentYear: string;
  onYearChange: (year: string) => Promise<void>;
  maskNumbers: boolean;
  onToggleMask: () => void;
  onAddSnapshot: () => void;
  onAddCashFlow: () => void;
  onAddDividend: () => void;
  onEditHoldings: () => void;
  onRefresh: () => void;
}

// ===== MetricCards =====
export interface MetricCardsProps {
  metrics: DashboardMetrics;
  maskNumbers: boolean;
}

// ===== AssetAllocationTable =====
export interface AssetAllocationTableProps {
  rows: AllocationRow[];
  maskNumbers: boolean;
}

// ===== Chart 组件 =====
export interface PieChartProps {
  snapshot: AssetSnapshot | undefined;
  maskNumbers: boolean;
}
export interface BarChartProps {
  data: MonthlyCashFlowRow[];
  maskNumbers: boolean;
}
export interface TotalAssetsChartProps {
  data: MonthlyTotalAssetsRow[];
  maskNumbers: boolean;
}

// ===== MonthlyOverviewTable =====
export interface MonthlyOverviewTableProps {
  rows: MonthlyOverviewRow[];
  allCategories: string[];
  maskNumbers: boolean;
  onEditMonth: (month: string) => void;
  onDeleteMonth: (month: string) => Promise<void>;
}

// ===== DividendSummaryTable =====
export interface DividendSummaryTableProps {
  year: string;
  rows: DividendSummaryRow[];
  grandTotal: number;
  maskNumbers: boolean;
}

// ===== CashFlowDetailsTable =====
export interface CashFlowDetailsTableProps {
  records: CashFlowRecord[];
  maskNumbers: boolean;
  onEdit: (record: CashFlowRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

// ===== 表单 =====
export interface AssetSnapshotFormProps {
  store: DataStore;
  settings: FinanceSettings;
  existingSnapshot?: AssetSnapshot;
  onClose: () => void;
}
export interface CashFlowFormProps {
  store: DataStore;
  settings: FinanceSettings;
  defaultType: CashFlowRecord["type"];
  existingRecord?: CashFlowRecord;
  onClose: () => void;
}
export interface DividendFormProps {
  store: DataStore;
  existingRecord?: DividendRecord;
  onClose: () => void;
}

// ===== Holdings 模块（股票持仓占比，内嵌于主仪表盘） =====
export interface HoldingsTreemapChartProps {
  holdings: StockHolding[];
  /** Total in the display currency */
  total: number;
  maskNumbers: boolean;
  /** Currency used for treemap areas (defaults to CNY) */
  displayCurrency?: HoldingCurrency;
  onEditHolding: ((holding: StockHolding) => void) | null;
}
export interface HoldingsTableProps {
  holdings: StockHolding[];
  /** Total market value in displayCurrency */
  total: number;
  maskNumbers: boolean;
  /** Currency used for value/share columns */
  displayCurrency: HoldingCurrency;
  onEdit: (holding: StockHolding) => void;
  onDelete: (id: string) => Promise<void>;
  /** 弹窗内使用：去掉外层 section 卡片壳（h2/边框） */
  bare?: boolean;
}
export interface HoldingsManageProps {
  store: DataStore;
  onAddHolding: () => void;
  onEditHolding: (holding: StockHolding) => void;
}
export interface HoldingFormProps {
  store: DataStore;
  existingHolding?: StockHolding;
  onClose: () => void;
}
