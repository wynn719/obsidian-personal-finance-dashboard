import { useState, type ReactNode } from "react";
import { useFinanceData } from "./use-finance-data";
import { Icon } from "./icon";
import { PieChart, BarChart, TotalAssetsChart } from "./chart";
import { LayoutProvider } from "./responsive";
import { Header } from "./components/header";
import { MetricCards } from "./components/metric-cards";
import { AssetAllocationTable } from "./components/asset-allocation";
import { MonthlyOverviewTable } from "./components/monthly-overview";
import { DividendSummaryTable } from "./components/dividend-summary";
import { CashFlowDetailsTable } from "./components/cash-flow-details";
import { t } from "../i18n";
import type { FinanceAppProps } from "./types";

function ChartContainer({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="finance-chart-container">
      <h2 className="finance-chart-title">
        <Icon name={icon} /> {title}
      </h2>
      {children}
    </div>
  );
}

export function FinanceApp({
  container,
  store,
  calculator,
  settings,
  onAddSnapshot,
  onAddCashFlow,
  onAddDividend,
  onEditSnapshot,
  onEditCashFlow,
  onEditDividend,
  onRefreshData,
}: FinanceAppProps) {
  const { currentMonth, currentYear } = useFinanceData(store);
  const [maskNumbers, setMaskNumbers] = useState(false);

  // 派生数据（每次 store 变化触发重渲染时重算）
  const metrics = calculator.getDashboardMetrics(currentMonth);
  const allocRows = calculator.getAllocationRows(
    currentMonth,
    settings.targetAllocations,
  );
  const overviewRows = calculator.getMonthlyOverview(settings);
  const allCategories = calculator.getAllCategories();
  const cashFlowData = calculator.getMonthlyCashFlow(currentYear);
  const totalAssetsData = calculator.getMonthlyTotalAssets(currentYear);
  const { rows: dividendRows, grandTotal } =
    calculator.getDividendSummary(currentYear);
  const snapshot = store.getSnapshotByMonth(currentMonth);
  const cashFlowRecords = [...store.getCashFlowRecords()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const handleEditMonth = (month: string) => {
    const snap = store.getSnapshotByMonth(month);
    if (snap) onEditSnapshot?.(snap);
  };
  const handleDeleteMonth = async (month: string) => {
    await store.deleteSnapshot(month);
    await store.deleteCashFlowByMonth(month);
  };
  const handleDeleteCashFlow = async (id: string) => {
    await store.deleteCashFlow(id);
  };

  return (
    <LayoutProvider container={container}>
      <Header
        store={store}
        currentYear={currentYear}
        onYearChange={(year) => store.switchYear(year)}
        maskNumbers={maskNumbers}
        onToggleMask={() => setMaskNumbers((m) => !m)}
        onAddSnapshot={() => onAddSnapshot?.()}
        onAddCashFlow={() => onAddCashFlow?.()}
        onAddDividend={() => onAddDividend?.()}
        onRefresh={() => onRefreshData?.()}
      />

      <MetricCards metrics={metrics} maskNumbers={maskNumbers} />

      {/* 资产配置 + 股息汇总 同一行 */}
      <div className="finance-summary-grid">
        <AssetAllocationTable rows={allocRows} maskNumbers={maskNumbers} />
        <DividendSummaryTable
          year={currentYear}
          rows={dividendRows}
          grandTotal={grandTotal}
          maskNumbers={maskNumbers}
        />
      </div>

      {/* 三个图表放在表格下方 */}
      <div className="finance-charts-row">
        <ChartContainer icon="pie-chart" title={t("chart.assetDistribution")}>
          <PieChart snapshot={snapshot} maskNumbers={maskNumbers} />
        </ChartContainer>
        <ChartContainer
          icon="bar-chart-3"
          title={t("chart.monthlyIncomeVsExpense")}
        >
          <BarChart data={cashFlowData} maskNumbers={maskNumbers} />
        </ChartContainer>
        <ChartContainer icon="line-chart" title={t("chart.monthlyTotalAssets")}>
          <TotalAssetsChart data={totalAssetsData} maskNumbers={maskNumbers} />
        </ChartContainer>
      </div>

      <MonthlyOverviewTable
        rows={overviewRows}
        allCategories={allCategories}
        maskNumbers={maskNumbers}
        onEditMonth={handleEditMonth}
        onDeleteMonth={handleDeleteMonth}
      />

      <CashFlowDetailsTable
        records={cashFlowRecords}
        maskNumbers={maskNumbers}
        onEdit={(record) => onEditCashFlow?.(record)}
        onDelete={handleDeleteCashFlow}
      />
    </LayoutProvider>
  );
}
