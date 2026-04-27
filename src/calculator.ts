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
  deviation: number | null;
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
      const deviation =
        targetPercent !== null ? currentPercent - targetPercent : null;

      return {
        category: cat.category,
        amount: cat.amount,
        currentPercent,
        targetPercent,
        deviation,
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

      let momPercent: number | null = null;
      let investmentReturn: number | null = null;

      if (prevTotal !== null && prevTotal !== 0) {
        momPercent = ((snapshot.totalAssets - prevTotal) / prevTotal) * 100;
        investmentReturn =
          snapshot.totalAssets - prevTotal - salaryIncome - otherIncome;
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
  // Monthly cash flow for chart (last N months)
  // ----------------------------------------------------------

  getMonthlyCashFlow(months: number = 6): MonthlyCashFlowRow[] {
    // First, try the latest N months from current date
    const now = new Date();
    let result: MonthlyCashFlowRow[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const records = this.store.getCashFlowByMonth(month);

      const income = records
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + r.amount, 0);
      const expense = records
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + r.amount, 0);

      result.push({ month, income, expense, netCashFlow: income - expense });
    }

    // If all recent months are empty, fall back to months that actually have data
    if (result.every((d) => d.income === 0 && d.expense === 0)) {
      const allRecords = this.store.getCashFlowRecords();
      if (allRecords.length > 0) {
        // Collect unique months from actual records
        const monthSet = new Set<string>();
        allRecords.forEach((r) => {
          const m = r.date.substring(0, 7); // YYYY-MM
          monthSet.add(m);
        });
        const sortedMonths = Array.from(monthSet).sort();

        // Take the last N months that have data, and fill gaps between them
        const firstMonth = sortedMonths[0];
        const lastMonth = sortedMonths[sortedMonths.length - 1];

        // Generate continuous month range from first to last
        const rangeMonths: string[] = [];
        const [startY, startM] = firstMonth.split("-").map(Number);
        const [endY, endM] = lastMonth.split("-").map(Number);
        let cy = startY,
          cm = startM;
        while (cy < endY || (cy === endY && cm <= endM)) {
          rangeMonths.push(`${cy}-${String(cm).padStart(2, "0")}`);
          cm++;
          if (cm > 12) {
            cm = 1;
            cy++;
          }
        }

        // Take last N months from the range
        const displayMonths = rangeMonths.slice(-months);

        result = displayMonths.map((month) => {
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
