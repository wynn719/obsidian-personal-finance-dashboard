import { DataStore } from "./data-store";
import { AssetSnapshot, FinanceSettings, TargetAllocation } from "./models";

// ============================================================
// Computed result types
// ============================================================

export interface DashboardMetrics {
  totalAssets: number;
  momChange: number; // month-over-month absolute change
  momPercent: number; // month-over-month percentage
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySurplus: number;
  yearlyDividends: number;
}

export interface AllocationRow {
  category: string;
  amount: number;
  currentPercent: number;
  targetPercent: number | null;
  targetAmount: number | null;
  deviation: number | null;
  rebalanceAmount: number | null;
}

export interface MonthlyOverviewRow {
  month: string;
  salaryIncome: number;
  otherIncome: number;
  categoryAmounts: Record<string, number>;
  totalAssets: number;
  momPercent: number | null;
  investmentReturn: number | null;
  note: string;
}

export interface MonthlyCashFlowRow {
  month: string;
  income: number;
  expense: number;
  netCashFlow: number;
}

export interface MonthlyTotalAssetsRow {
  month: string;
  totalAssets: number;
}

export interface DividendSummaryRow {
  stockName: string;
  amounts: number[];
  total: number;
}

// ============================================================
// Calculator
// ============================================================

export class FinanceCalculator {
  private store: DataStore;

  constructor(store: DataStore) {
    this.store = store;
  }

  // ----------------------------------------------------------
  // Dashboard top-level metrics
  // ----------------------------------------------------------

  getDashboardMetrics(currentMonth: string): DashboardMetrics {
    const currentSnapshot = this.store.getSnapshotByMonth(currentMonth);
    const prevMonth = this.getPreviousMonth(currentMonth);
    const prevSnapshot = this.store.getSnapshotByMonth(prevMonth);

    const totalAssets = currentSnapshot?.totalAssets ?? 0;
    const prevTotal = prevSnapshot?.totalAssets ?? 0;
    const momChange = totalAssets - prevTotal;
    const momPercent = prevTotal !== 0 ? (momChange / prevTotal) * 100 : 0;

    const cashFlows = this.store.getCashFlowByMonth(currentMonth);
    const monthlyIncome = cashFlows
      .filter((r) => r.type === "income")
      .reduce((sum, r) => sum + r.amount, 0);
    const monthlyExpense = cashFlows
      .filter((r) => r.type === "expense")
      .reduce((sum, r) => sum + r.amount, 0);

    const year = currentMonth.substring(0, 4);
    const yearlyDividends = this.store
      .getDividendsByYear(year)
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalAssets,
      momChange,
      momPercent,
      monthlyIncome,
      monthlyExpense,
      monthlySurplus: monthlyIncome - monthlyExpense,
      yearlyDividends,
    };
  }

  // ----------------------------------------------------------
  // Asset allocation table
  // ----------------------------------------------------------

  getAllocationRows(
    currentMonth: string,
    targets: TargetAllocation[],
  ): AllocationRow[] {
    const snapshot = this.store.getSnapshotByMonth(currentMonth);
    if (!snapshot) return [];

    const total = snapshot.totalAssets;
    const targetMap = new Map(targets.map((t) => [t.category, t.percentage]));

    return snapshot.categories.map((cat) => {
      const currentPercent = total > 0 ? (cat.amount / total) * 100 : 0;
      const targetPercent = targetMap.get(cat.category) ?? null;
      const targetAmount =
        targetPercent !== null ? total * (targetPercent / 100) : null;
      const deviation =
        targetPercent !== null ? currentPercent - targetPercent : null;
      const rebalanceAmount =
        targetAmount !== null ? targetAmount - cat.amount : null;

      return {
        category: cat.category,
        amount: cat.amount,
        currentPercent,
        targetPercent,
        targetAmount,
        deviation,
        rebalanceAmount,
      };
    });
  }

  // ----------------------------------------------------------
  // Monthly overview table
  // ----------------------------------------------------------

  getMonthlyOverview(settings?: FinanceSettings): MonthlyOverviewRow[] {
    const snapshots = [...this.store.getSnapshots()].sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    // Use the first income category as "salary" category, fallback to "工资"
    const salaryCategory = settings?.incomeCategories?.[0] ?? "工资";

    return snapshots.map((snapshot, idx) => {
      const cashFlows = this.store.getCashFlowByMonth(snapshot.month);
      const salaryIncome = cashFlows
        .filter((r) => r.type === "income" && r.category === salaryCategory)
        .reduce((sum, r) => sum + r.amount, 0);
      const otherIncome = cashFlows
        .filter((r) => r.type === "income" && r.category !== salaryCategory)
        .reduce((sum, r) => sum + r.amount, 0);

      const prevSnapshot = idx > 0 ? snapshots[idx - 1] : null;
      const prevTotal = prevSnapshot?.totalAssets ?? null;

      const totalExpense = cashFlows
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);
      const netCashFlow = salaryIncome + otherIncome - totalExpense;

      let momPercent: number | null = null;
      let investmentReturn: number | null = null;

      if (prevTotal !== null && prevTotal !== 0) {
        momPercent = ((snapshot.totalAssets - prevTotal) / prevTotal) * 100;
        // 投资收益 = 总资产变化 - 净现金流（收入 - 支出）
        investmentReturn =
          snapshot.totalAssets - prevTotal - netCashFlow;
      }

      const categoryAmounts: Record<string, number> = {};
      snapshot.categories.forEach((cat) => {
        categoryAmounts[cat.category] = cat.amount;
      });

      return {
        month: snapshot.month,
        salaryIncome,
        otherIncome,
        categoryAmounts,
        totalAssets: snapshot.totalAssets,
        momPercent,
        investmentReturn,
        note: snapshot.note ?? "",
      };
    });
  }

  // ----------------------------------------------------------
  // Monthly cash flow for chart (from January of current year)
  // ----------------------------------------------------------

  getMonthlyCashFlow(year?: string): MonthlyCashFlowRow[] {
    const yearStr = year ?? this.store.getCurrentYear();
    let result: MonthlyCashFlowRow[] = [];

    for (let m = 1; m <= 12; m++) {
      const month = `${yearStr}-${String(m).padStart(2, "0")}`;
      const records = this.store.getCashFlowByMonth(month);

      const income = records
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);
      const expense = records
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

      result.push({ month, income, expense, netCashFlow: income - expense });
    }

    // Remove trailing months with no data (future months)
    while (
      result.length > 0 &&
      result[result.length - 1].income === 0 &&
      result[result.length - 1].expense === 0
    ) {
      result.pop();
    }

    // If still empty, fall back to all months that have data
    if (result.length === 0) {
      const allRecords = this.store.getCashFlowRecords();
      if (allRecords.length > 0) {
        const monthSet = new Set<string>();
        allRecords.forEach((r) => monthSet.add(r.date.substring(0, 7)));
        const sortedMonths = Array.from(monthSet).sort();
        const firstMonth = sortedMonths[0];
        const lastMonth = sortedMonths[sortedMonths.length - 1];

        const rangeMonths: string[] = [];
        const [startY, startM] = firstMonth.split("-").map(Number);
        const [endY, endM] = lastMonth.split("-").map(Number);
        let cy = startY, cm = startM;
        while (cy < endY || (cy === endY && cm <= endM)) {
          rangeMonths.push(`${cy}-${String(cm).padStart(2, "0")}`);
          cm++;
          if (cm > 12) {
            cm = 1;
            cy++;
          }
        }

        result = rangeMonths.map((month) => {
          const records = this.store.getCashFlowByMonth(month);
          const income = records
            .filter((r) => r.type === "income")
            .reduce((sum, r) => sum + r.amount, 0);
          const expense = records
            .filter((r) => r.type === "expense")
            .reduce((sum, r) => sum + r.amount, 0);
          return { month, income, expense, netCashFlow: income - expense };
        });
      }
    }

    return result;
  }

  // ----------------------------------------------------------
  // Monthly total assets for chart (from January of current year)
  // ----------------------------------------------------------

  getMonthlyTotalAssets(year?: string): MonthlyTotalAssetsRow[] {
    const snapshots = this.store.getSnapshots();
    const snapshotsMap = new Map(snapshots.map((s) => [s.month, s.totalAssets]));
    const yearStr = year ?? this.store.getCurrentYear();
    let result: MonthlyTotalAssetsRow[] = [];

    for (let m = 1; m <= 12; m++) {
      const month = `${yearStr}-${String(m).padStart(2, "0")}`;
      result.push({ month, totalAssets: snapshotsMap.get(month) ?? 0 });
    }

    // Remove trailing months with no data (future months)
    while (result.length > 0 && result[result.length - 1].totalAssets === 0) {
      result.pop();
    }

    // If still empty, fall back to all months that have data
    if (result.length === 0 && snapshots.length > 0) {
      const sortedMonths = snapshots.map((s) => s.month).sort();
      const firstMonth = sortedMonths[0];
      const lastMonth = sortedMonths[sortedMonths.length - 1];

      const rangeMonths: string[] = [];
      const [startY, startM] = firstMonth.split("-").map(Number);
      const [endY, endM] = lastMonth.split("-").map(Number);
      let cy = startY, cm = startM;
      while (cy < endY || (cy === endY && cm <= endM)) {
        rangeMonths.push(`${cy}-${String(cm).padStart(2, "0")}`);
        cm++;
        if (cm > 12) {
          cm = 1;
          cy++;
        }
      }

      result = rangeMonths.map((month) => ({
        month,
        totalAssets: snapshotsMap.get(month) ?? 0,
      }));
    }

    return result;
  }

  // ----------------------------------------------------------
  // Dividend summary
  // ----------------------------------------------------------

  getDividendSummary(year: string): {
    rows: DividendSummaryRow[];
    grandTotal: number;
  } {
    const records = this.store.getDividendsByYear(year);
    const grouped = new Map<string, number[]>();

    records.forEach((r) => {
      if (!grouped.has(r.stockName)) {
        grouped.set(r.stockName, []);
      }
      grouped.get(r.stockName)!.push(r.amount);
    });

    const rows: DividendSummaryRow[] = [];
    let grandTotal = 0;

    grouped.forEach((amounts, stockName) => {
      const total = amounts.reduce((s, a) => s + a, 0);
      grandTotal += total;
      rows.push({ stockName, amounts, total });
    });

    return { rows, grandTotal };
  }

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------

  private getPreviousMonth(month: string): string {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 2, 1); // m-1 is current, m-2 is previous
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  /** Get all unique asset categories across all snapshots */
  getAllCategories(): string[] {
    const cats = new Set<string>();
    this.store.getSnapshots().forEach((s) => {
      s.categories.forEach((c) => cats.add(c.category));
    });
    return Array.from(cats);
  }

  /** Get current month string in YYYY-MM format */
  static getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  /** Get current year string */
  static getCurrentYear(): string {
    return String(new Date().getFullYear());
  }
}
