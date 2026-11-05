import { useEffect, useState, type ReactNode } from "react";
import { useFinanceData } from "./use-finance-data";
import { Icon } from "./icon";
import { PieChart, BarChart, TotalAssetsChart } from "./chart";
import { HoldingsTreemapChart } from "./holdings-chart";
import { useQuoteRefresh } from "./hooks/use-quote-refresh";
import { LayoutProvider } from "./responsive";
import { Masonry } from "./masonry";
import { Header } from "./components/header";
import { Tabs } from "./components/tabs";
import { MetricCards } from "./components/metric-cards";
import { IndexSignalSection } from "./components/index-signal";
import { DividendYieldSection } from "./components/dividend-yield";
import { EtfPremiumSection } from "./components/etf-premium";
import { AssetAllocationTable } from "./components/asset-allocation";
import { MonthlyOverviewTable } from "./components/monthly-overview";
import { DividendSummaryTable } from "./components/dividend-summary";
import { CashFlowDetailsTable } from "./components/cash-flow-details";
import { AccumulationCard } from "./components/accumulation/accumulation-card";
import { AccumulationModule, type AccScreen } from "./components/accumulation/accumulation-module";
import { t } from "../i18n";
import { autoRefreshAll } from "../market-refresh";
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
  onAddSnapshot,
  onAddCashFlow,
  onAddDividend,
  onEditHoldings,
  onEditSnapshot,
  onEditCashFlow,
  onEditDividend,
  onEditHolding,
  onRefreshData,
  accumulationStore,
  onAddAccumulationPlan,
  onEditAccumulationPlan,
  onOpenAccumulationTrade,
}: FinanceAppProps) {
  const { currentMonth, currentYear } = useFinanceData(store);
  const [maskNumbers, setMaskNumbers] = useState(false);
  const [tab, setTab] = useState<FinanceTab>(readStoredTab);
  // 工作台内的视图栈：null = 市场信号瀑布流；否则是建仓视图（list / detail）
  const [accScreen, setAccScreen] = useState<AccScreen | null>(null);
  const { refreshing, refreshQuotes } = useQuoteRefresh(store);

  // 打开视图时把所有需要远程拉取的数据各拉一遍：
  // 年线信号 / TTM 股息率 / ETF 溢价 / 持仓行情。
  // 5 分钟内重复打开不会重复请求；失败只写日志，页面继续用缓存值。
  useEffect(() => {
    void autoRefreshAll(store);
  }, [store]);

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

      {/* 工作台：市场信号瀑布流 + 建仓卡。
          常驻挂载、靠 CSS 隐藏 —— 切回时不丢各卡的筛选/展开状态。
          点建仓卡进入建仓视图时，整块面板换成视图栈（list / detail），左上角返回。 */}
      <div
        className="finance-tab-panel"
        data-active={tab === "workbench" && accScreen === null}
      >
        <Masonry maxCols={3}>
          <AccumulationCard
            store={accumulationStore}
            maskNumbers={maskNumbers}
            holdings={holdings}
            fxReferenceRates={settings.fxReferenceRates}
            onOpenAll={() => setAccScreen({ kind: "list" })}
            onOpenPlan={(planId) => setAccScreen({ kind: "detail", planId })}
            onCreate={() => onAddAccumulationPlan?.()}
          />
          <IndexSignalSection store={store} />
          <DividendYieldSection store={store} maskNumbers={maskNumbers} />
          <EtfPremiumSection store={store} />
        </Masonry>
      </div>

      {/* 建仓视图覆盖整个工作台面板：信号卡只被隐藏、不卸载，
          返回时筛选/展开状态还在。无 Chart.js，不必担心 0 宽画布。 */}
      {tab === "workbench" && accScreen !== null ? (
        <AccumulationModule
          store={accumulationStore}
          screen={accScreen}
          maskNumbers={maskNumbers}
          holdings={holdings}
          fxReferenceRates={settings.fxReferenceRates}
          onNavigate={setAccScreen}
          onBack={() => setAccScreen(null)}
          onEditPlan={(plan) => onEditAccumulationPlan?.(plan)}
          onOpenTrade={(planId, trade) => onOpenAccumulationTrade?.(planId, trade)}
          onCreate={() => onAddAccumulationPlan?.()}
        />
      ) : null}

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

          {/* 桌面瀑布流：hero 占两栏，其余卡片按高度自动分配列；
              两张宽表（月度总览 / 现金流）列数太多，放在瀑布流下方整行铺满。 */}
          <Masonry maxCols={3}>
            <MetricCards metrics={metrics} maskNumbers={maskNumbers} />

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
                    className={`finance-refresh-btn${
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
          </Masonry>

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
