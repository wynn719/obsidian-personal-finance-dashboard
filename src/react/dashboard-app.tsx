import { useState, type ReactNode } from "react";
import { useFinanceData } from "./use-finance-data";
import { Icon } from "./icon";
import { PieChart, BarChart, TotalAssetsChart } from "./chart";
import { HoldingsTreemapChart } from "./holdings-chart";
import { useQuoteRefresh } from "./hooks/use-quote-refresh";
import { LayoutProvider } from "./responsive";
import { Header } from "./components/header";
import { Tabs } from "./components/tabs";
import { MetricCards } from "./components/metric-cards";
import { PomodoroSection } from "./components/pomodoro";
import { IndexSignalSection } from "./components/index-signal";
import { DividendYieldSection } from "./components/dividend-yield";
import { EtfPremiumSection } from "./components/etf-premium";
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
    <div className="finance-section finance-chart-container">
      <h2>
        <Icon name={icon} /> {title}
      </h2>
      {children}
    </div>
  );
}

type FinanceTab = "workbench" | "assets";

const TAB_STORAGE_KEY = "finance-dashboard:active-tab";

/** 读取上次停留的 tab；读不到（首次 / 存储不可用）就落在工作台 */
function readStoredTab(): FinanceTab {
  try {
    return window.localStorage.getItem(TAB_STORAGE_KEY) === "assets"
      ? "assets"
      : "workbench";
  } catch {
    return "workbench";
  }
}

export function FinanceApp({
  container,
  store,
  calculator,
  settings,
  pomodoroStore,
  onAddSnapshot,
  onAddCashFlow,
  onAddDividend,
  onEditHoldings,
  onEditSnapshot,
  onEditCashFlow,
  onEditDividend,
  onEditHolding,
  onRefreshData,
}: FinanceAppProps) {
  const { currentMonth, currentYear } = useFinanceData(store);
  const [maskNumbers, setMaskNumbers] = useState(false);
  const [tab, setTab] = useState<FinanceTab>(readStoredTab);
  const { refreshing, refreshQuotes } = useQuoteRefresh(store);

  const changeTab = (next: FinanceTab) => {
    setTab(next);
    try {
      window.localStorage.setItem(TAB_STORAGE_KEY, next);
    } catch {
      // 存储不可用不影响切换本身
    }
  };

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

  // 持仓数据（非年度，Misc.md）；Treemap 占比统一按人民币口径换算
  const holdings = store.getHoldings();
  const holdingsTotal = store.getTotalHoldingsAmount("CNY");

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
      <Tabs
        value={tab}
        onChange={(next) => changeTab(next as FinanceTab)}
        items={[
          { key: "workbench", label: t("tab.workbench"), icon: "layout-grid" },
          { key: "assets", label: t("tab.assets"), icon: "pie-chart" },
        ]}
      />

      {/* 工作台：番茄钟 + 三个市场信号模块。
          这里刻意「常驻挂载、靠 CSS 隐藏」——卸载会丢掉正在跑的计时器状态。 */}
      <div className="finance-tab-panel" data-active={tab === "workbench"}>
        <PomodoroSection pomodoroStore={pomodoroStore} />

        {/* 市场信号区：红利低波年线信号 / TTM 股息率 / ETF 溢价监控（各自独立模块，手动刷新） */}
        <div className="finance-market-grid">
          <IndexSignalSection store={store} />
          <DividendYieldSection store={store} maskNumbers={maskNumbers} />
          <EtfPremiumSection store={store} />
        </div>
      </div>

      {/* 资产配置：条件渲染而非隐藏 —— 三张 Chart 在 display:none 容器里会以
          0 宽初始化，切回来未必能自动 resize，重建更稳妥。
          年份选择器与数据操作按钮都属于这一页，一并放在面板内。 */}
      {tab === "assets" ? (
        <div className="finance-tab-panel">
          <Header
            store={store}
            currentYear={currentYear}
            onYearChange={(year) => store.switchYear(year)}
            maskNumbers={maskNumbers}
            onToggleMask={() => setMaskNumbers((m) => !m)}
            onAddSnapshot={() => onAddSnapshot?.()}
            onAddCashFlow={() => onAddCashFlow?.()}
            onAddDividend={() => onAddDividend?.()}
            onEditHoldings={() => onEditHoldings?.()}
            onRefresh={() => onRefreshData?.()}
          />

          <MetricCards metrics={metrics} maskNumbers={maskNumbers} />

          {/* 资产配置 + 股息汇总 + 股票持仓 Treemap 同一行 */}
          <div className="finance-summary-grid">
            <AssetAllocationTable rows={allocRows} maskNumbers={maskNumbers} />
            <DividendSummaryTable
              year={currentYear}
              rows={dividendRows}
              grandTotal={grandTotal}
              maskNumbers={maskNumbers}
            />
            <div className="finance-section finance-chart-container finance-holdings-chart">
              <h2 className="finance-holdings-title">
                <span>
                  <Icon name="pie-chart" /> {t("holdings.chartTitle")}
                </span>
                {holdings.length > 0 ? (
                  <button
                    className={`finance-btn-small${
                      refreshing ? " finance-btn-spinning" : ""
                    }`}
                    onClick={refreshQuotes}
                    disabled={refreshing}
                    title={t("holdings.btn.refreshQuotes")}
                  >
                    <Icon name="refresh-cw" />
                  </button>
                ) : null}
              </h2>
              {holdings.length > 0 ? (
                <HoldingsTreemapChart
                  holdings={holdings}
                  total={holdingsTotal}
                  maskNumbers={maskNumbers}
                  onEditHolding={onEditHolding}
                />
              ) : (
                <div className="finance-holdings-empty">
                  <p className="finance-empty">{t("holdings.empty")}</p>
                  <button
                    className="finance-btn finance-btn-cta finance-holdings-cta"
                    onClick={() => onEditHoldings?.()}
                  >
                    <Icon name="plus" />
                    <span className="finance-btn-label">
                      {t("holdings.btn.addHolding")}
                    </span>
                  </button>
                </div>
              )}
            </div>
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
            <ChartContainer
              icon="line-chart"
              title={t("chart.monthlyTotalAssets")}
            >
              <TotalAssetsChart
                data={totalAssetsData}
                maskNumbers={maskNumbers}
              />
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
        </div>
      ) : null}
    </LayoutProvider>
  );
}
