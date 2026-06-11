import { ItemView, WorkspaceLeaf, Menu, setIcon } from "obsidian";
import { DataStore } from "../data-store";
import { FinanceCalculator } from "../calculator";
import { FinanceSettings, CashFlowRecord, DividendRecord, AssetSnapshot } from "../models";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercent,
  formatChange,
  getCurrentMonth,
  getCurrentYear,
} from "../utils";
import { t } from "../i18n";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export const VIEW_TYPE_FINANCE = "finance-dashboard-view";

export class FinanceDashboardView extends ItemView {
  private store: DataStore;
  private calculator: FinanceCalculator;
  private settings: FinanceSettings;
  private unsubscribe: (() => void) | null = null;
  private pieChart: Chart | null = null;
  private barChart: Chart | null = null;
  private maskNumbers: boolean = false;

  // Callbacks for opening modals (injected from main plugin)
  public onAddSnapshot: (() => void) | null = null;
  public onAddCashFlow: (() => void) | null = null;
  public onAddDividend: (() => void) | null = null;
  public onEditSnapshot: ((snapshot: AssetSnapshot) => void) | null = null;
  public onEditCashFlow: ((record: CashFlowRecord) => void) | null = null;
  public onEditDividend: ((record: DividendRecord) => void) | null = null;
  public onRefreshData: (() => Promise<void>) | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    store: DataStore,
    calculator: FinanceCalculator,
    settings: FinanceSettings,
  ) {
    super(leaf);
    this.store = store;
    this.calculator = calculator;
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_FINANCE;
  }

  getDisplayText(): string {
    return t("dashboard.title").replace(/^[^\s]+\s/, "");
  }

  getIcon(): string {
    return "wallet";
  }

  async onOpen(): Promise<void> {
    this.unsubscribe = this.store.onChange(() => this.render());
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.unsubscribe) this.unsubscribe();
    this.destroyCharts();
  }

  private destroyCharts(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }
  }

  /**
   * Mask sensitive number values when maskNumbers is enabled
   */
  private maskValue(value: string): string {
    return this.maskNumbers ? "***" : value;
  }

  // ============================================================
  // Main render
  // ============================================================

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    this.destroyCharts();

    container.addClass("finance-dashboard");

    // Use the latest snapshot month if current month has no data
    const latestSnapshot = this.store.getLatestSnapshot();
    const currentMonth = latestSnapshot?.month ?? getCurrentMonth();
    const currentYear = this.store.getCurrentYear();

    // Header with action buttons and year selector
    this.renderHeader(container, currentYear);

    // Top: Metric cards
    this.renderMetricCards(container, currentMonth);

    // Middle: Asset allocation + charts
    const analysisGrid = container.createDiv({ cls: "finance-analysis-grid" });
    this.renderAssetAllocation(analysisGrid, currentMonth);
    this.renderCharts(analysisGrid, currentMonth);

    // Monthly overview table
    this.renderMonthlyOverview(container);

    // Bottom: Dividend summary + Cash flow details
    const activityGrid = container.createDiv({ cls: "finance-activity-grid" });
    this.renderDividendSummary(activityGrid, currentYear);
    this.renderCashFlowDetails(activityGrid);
  }

  // ============================================================
  // Header
  // ============================================================

  private renderHeader(container: HTMLElement, currentYear: string): void {
    const header = container.createDiv({ cls: "finance-header" });
    const titleRow = header.createDiv({ cls: "finance-header-title-row" });

    // Year selector
    const yearSelector = titleRow.createDiv({ cls: "finance-year-selector" });
    const yearLabel = yearSelector.createSpan({ cls: "finance-year-label" });
    const yearLabelIcon = yearLabel.createSpan({ cls: "finance-icon" });
    setIcon(yearLabelIcon, "calendar");
    yearLabel.createSpan({ text: " " + t("dashboard.yearSelector") });

    const yearSelectWrapper = yearSelector.createDiv({ cls: "finance-year-select-wrapper" });
    const yearSelect = yearSelectWrapper.createEl("select", {
      cls: "finance-year-select",
    });
    const yearSelectIcon = yearSelectWrapper.createSpan({ cls: "finance-year-select-icon" });
    setIcon(yearSelectIcon, "chevron-down");

    // Populate year options asynchronously
    this.store.getAvailableYears().then((years) => {
      years.forEach((year) => {
        const option = yearSelect.createEl("option", {
          text: year,
          attr: { value: year },
        });
        if (year === currentYear) {
          option.selected = true;
        }
      });
    });

    yearSelect.addEventListener("change", async () => {
      const selectedYear = yearSelect.value;
      await this.store.switchYear(selectedYear);
    });

    const actions = header.createDiv({ cls: "finance-actions" });

    // Mask numbers toggle button
    const btnMask = actions.createEl("button", {
      cls: `finance-btn ${this.maskNumbers ? "finance-btn-active" : ""}`,
    });
    const btnMaskIcon = btnMask.createSpan({ cls: "finance-icon" });
    setIcon(btnMaskIcon, this.maskNumbers ? "eye-off" : "eye");
    btnMask.addEventListener("click", () => {
      this.maskNumbers = !this.maskNumbers;
      this.render();
    });

    const btnSnapshot = actions.createEl("button", { cls: "finance-btn" });
    const btnSnapshotIcon = btnSnapshot.createSpan({ cls: "finance-icon" });
    setIcon(btnSnapshotIcon, "bar-chart-3");
    btnSnapshot.createSpan({ text: " " + t("dashboard.btn.addSnapshot") });
    btnSnapshot.addEventListener("click", () => this.onAddSnapshot?.());

    const btnCashFlow = actions.createEl("button", { cls: "finance-btn" });
    const btnCashFlowIcon = btnCashFlow.createSpan({ cls: "finance-icon" });
    setIcon(btnCashFlowIcon, "banknote");
    btnCashFlow.createSpan({ text: " " + t("dashboard.btn.addCashFlow") });
    btnCashFlow.addEventListener("click", () => this.onAddCashFlow?.());

    const btnDividend = actions.createEl("button", { cls: "finance-btn" });
    const btnDividendIcon = btnDividend.createSpan({ cls: "finance-icon" });
    setIcon(btnDividendIcon, "target");
    btnDividend.createSpan({ text: " " + t("dashboard.btn.addDividend") });
    btnDividend.addEventListener("click", () => this.onAddDividend?.());

    const btnRefresh = actions.createEl("button", { cls: "finance-btn" });
    const btnRefreshIcon = btnRefresh.createSpan({ cls: "finance-icon" });
    setIcon(btnRefreshIcon, "refresh-cw");
    btnRefresh.createSpan({ text: " " + t("dashboard.btn.refresh") });
    btnRefresh.addEventListener("click", async () => {
      await this.onRefreshData?.();
    });
  }

  // ============================================================
  // Metric Cards
  // ============================================================

  private renderMetricCards(container: HTMLElement, month: string): void {
    const metrics = this.calculator.getDashboardMetrics(month);
    const grid = container.createDiv({ cls: "finance-metrics-grid" });

    this.createMetricCard(
      grid,
      t("metrics.totalAssets"),
      this.maskValue(formatCurrencyCompact(metrics.totalAssets)),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.momChange"),
      this.maskValue(`${formatChange(metrics.momChange)}`),
      this.maskValue(formatPercent(metrics.momPercent)),
      metrics.momChange >= 0 ? "positive" : "negative",
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlyIncome"),
      this.maskValue(formatCurrencyCompact(metrics.monthlyIncome)),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlyExpense"),
      this.maskValue(formatCurrencyCompact(metrics.monthlyExpense)),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlySurplus"),
      this.maskValue(formatCurrencyCompact(metrics.monthlySurplus)),
      t("metrics.unit"),
      metrics.monthlySurplus >= 0 ? "positive" : "negative",
    );
    this.createMetricCard(
      grid,
      t("metrics.yearlyDividends"),
      this.maskValue(formatCurrencyCompact(metrics.yearlyDividends)),
      t("metrics.unit"),
    );
  }

  private createMetricCard(
    parent: HTMLElement,
    label: string,
    value: string,
    suffix: string,
    colorClass?: string,
  ): void {
    const card = parent.createDiv({ cls: "finance-metric-card" });
    card.createDiv({ cls: "finance-metric-label", text: label });
    const valueEl = card.createDiv({
      cls: "finance-metric-value",
      text: value,
    });
    if (colorClass) valueEl.addClass(colorClass);
    card.createDiv({ cls: "finance-metric-suffix", text: suffix });
  }

  // ============================================================
  // Asset Allocation Table
  // ============================================================

  private renderAssetAllocation(container: HTMLElement, month: string): void {
    const section = container.createDiv({ cls: "finance-section" });
    const allocTitle = section.createEl("h2");
    const allocIcon = allocTitle.createSpan({ cls: "finance-icon" });
    setIcon(allocIcon, "trending-up");
    allocTitle.createSpan({ text: " " + t("allocation.title") });

    const rows = this.calculator.getAllocationRows(
      month,
      this.settings.targetAllocations,
    );
    if (rows.length === 0) {
      section.createEl("p", {
        text: t("allocation.empty"),
        cls: "finance-empty",
      });
      return;
    }

    const table = section.createEl("table", { cls: "finance-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    [
      t("allocation.col.category"),
      t("allocation.col.amount"),
      t("allocation.col.currentPercent"),
      t("allocation.col.targetPercent"),
      t("allocation.col.deviation"),
      t("allocation.col.rebalance"),
    ].forEach((h) => headerRow.createEl("th", { text: h }));

    const tbody = table.createEl("tbody");
    let totalAmount = 0;

    rows.forEach((row) => {
      const tr = tbody.createEl("tr");
      if (row.deviation !== null && Math.abs(row.deviation) > 10) {
        tr.addClass("finance-deviation-warning");
      }

      tr.createEl("td", { text: row.category });
      tr.createEl("td", {
        text: this.maskValue(formatCurrencyCompact(row.amount)),
        cls: "finance-number",
      });
      tr.createEl("td", {
        text: row.currentPercent.toFixed(2) + "%",
        cls: "finance-number",
      });
      tr.createEl("td", {
        text:
          row.targetPercent !== null ? row.targetPercent.toFixed(2) + "%" : "-",
        cls: "finance-number",
      });

      const devTd = tr.createEl("td", { cls: "finance-number" });
      if (row.deviation !== null) {
        devTd.textContent = formatPercent(row.deviation);
        devTd.addClass(row.deviation >= 0 ? "positive" : "negative");
      } else {
        devTd.textContent = "-";
      }

      const rebalanceTd = tr.createEl("td", { cls: "finance-number" });
      if (row.rebalanceAmount === null) {
        rebalanceTd.textContent = "-";
      } else if (Math.abs(row.rebalanceAmount) < 1) {
        rebalanceTd.textContent = t("allocation.rebalance.hold");
        rebalanceTd.addClass("finance-rebalance-hold");
      } else if (row.rebalanceAmount > 0) {
        rebalanceTd.textContent = this.maskValue(
          t("allocation.rebalance.buy", {
            amount: formatCurrencyCompact(row.rebalanceAmount),
          }),
        );
        rebalanceTd.addClass("positive");
      } else {
        rebalanceTd.textContent = this.maskValue(
          t("allocation.rebalance.sell", {
            amount: formatCurrencyCompact(Math.abs(row.rebalanceAmount)),
          }),
        );
        rebalanceTd.addClass("negative");
      }

      totalAmount += row.amount;
    });

    // Total row
    const totalRow = tbody.createEl("tr", { cls: "finance-total-row" });
    totalRow.createEl("td", { text: t("allocation.total") });
    totalRow.createEl("td", {
      text: this.maskValue(formatCurrencyCompact(totalAmount)),
      cls: "finance-number",
    });
    totalRow.createEl("td", { text: "100.00%", cls: "finance-number" });
    totalRow.createEl("td", { text: "100.00%", cls: "finance-number" });
    totalRow.createEl("td", { text: "" });
    totalRow.createEl("td", { text: "" });
  }

  // ============================================================
  // Charts (Pie + Bar)
  // ============================================================

  private renderCharts(container: HTMLElement, month: string): void {
    const chartsRow = container.createDiv({ cls: "finance-charts-row" });

    // Pie chart - Asset distribution
    this.renderPieChart(chartsRow, month);

    // Bar chart - Monthly income vs expense
    this.renderBarChart(chartsRow);

    // Line chart - Monthly total assets
    this.renderTotalAssetsChart(chartsRow);
  }

  private renderPieChart(parent: HTMLElement, month: string): void {
    const section = parent.createDiv({ cls: "finance-chart-container" });
    this.createChartTitle(section, "pie-chart", t("chart.assetDistribution"));

    const snapshot = this.store.getSnapshotByMonth(month);
    if (!snapshot) {
      section.createEl("p", { text: t("chart.noData"), cls: "finance-empty" });
      return;
    }

    const filtered = snapshot.categories.filter((c) => c.amount > 0);
    if (filtered.length === 0) {
      section.createEl("p", { text: t("chart.noData"), cls: "finance-empty" });
      return;
    }

    const canvas = section.createEl("canvas");

    // Professional finance palette - accessible and distinguishable
    const chartColors = [
      "#3b82f6", // Blue - Primary
      "#22c55e", // Green - Positive
      "#f59e0b", // Amber - Warning
      "#8b5cf6", // Purple - Accent
      "#06b6d4", // Cyan - Info
      "#ec4899", // Pink - Highlight
      "#f97316", // Orange - Secondary
    ];

    this.pieChart = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: filtered.map((c) => c.category),
        datasets: [
          {
            data: filtered.map((c) => c.amount),
            backgroundColor: chartColors.slice(0, filtered.length),
            borderWidth: 2,
            borderColor:
              getComputedStyle(document.body)
                .getPropertyValue("--background-secondary")
                .trim() || "#ffffff",
            hoverBorderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                if (this.maskNumbers) {
                  return ` ${ctx.label}: ***`;
                }
                const total = snapshot.totalAssets;
                const value = ctx.parsed;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(2) : "0";
                return ` ${ctx.label}: ¥${formatCurrencyCompact(value)} (${pct}%)`;
              },
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
      },
    });
  }

  private renderBarChart(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "finance-chart-container" });
    this.createChartTitle(
      section,
      "bar-chart-3",
      t("chart.monthlyIncomeVsExpense"),
    );

    const data = this.calculator.getMonthlyCashFlow();
    if (data.every((d) => d.income === 0 && d.expense === 0)) {
      section.createEl("p", { text: t("chart.noData"), cls: "finance-empty" });
      return;
    }

    const canvas = section.createEl("canvas");

    this.barChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map((d) => d.month.substring(5)),
        datasets: [
          {
            label: t("chart.income"),
            data: data.map((d) => d.income),
            backgroundColor: "rgba(34, 197, 94, 0.75)",
            hoverBackgroundColor: "rgba(34, 197, 94, 0.9)",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: t("chart.expense"),
            data: data.map((d) => d.expense),
            backgroundColor: "rgba(239, 68, 68, 0.75)",
            hoverBackgroundColor: "rgba(239, 68, 68, 0.9)",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: t("chart.netCashFlow"),
            data: data.map((d) => d.netCashFlow),
            type: "line",
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                this.maskNumbers
                  ? ` ${ctx.dataset.label}: ***`
                  : ` ${ctx.dataset.label}: ¥${formatCurrencyCompact(ctx.parsed.y ?? 0)}`,
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            ticks: {
              callback: (value) =>
                this.maskNumbers ? "***" : "¥" + formatCurrencyCompact(value as number),
            },
          },
        },
      },
    });
  }

  private renderTotalAssetsChart(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "finance-chart-container" });
    this.createChartTitle(section, "line-chart", t("chart.monthlyTotalAssets"));

    const data = this.calculator.getMonthlyTotalAssets();
    if (data.every((d) => d.totalAssets === 0)) {
      section.createEl("p", { text: t("chart.noData"), cls: "finance-empty" });
      return;
    }

    const canvas = section.createEl("canvas");

    new Chart(canvas, {
      type: "line",
      data: {
        labels: data.map((d) => d.month.substring(5)),
        datasets: [
          {
            label: t("chart.monthlyTotalAssets"),
            data: data.map((d) => d.totalAssets),
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: "#3b82f6",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                this.maskNumbers
                  ? ` ${ctx.dataset.label}: ***`
                  : ` ${ctx.dataset.label}: ¥${formatCurrencyCompact(ctx.parsed.y ?? 0)}`,
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: "rgba(148, 163, 184, 0.1)",
            },
            ticks: {
              callback: (value) =>
                this.maskNumbers ? "***" : "¥" + formatCurrencyCompact(value as number),
            },
          },
        },
      },
    });
  }

  private createChartTitle(
    section: HTMLElement,
    iconName: string,
    title: string,
  ): void {
    const chartTitle = section.createEl("h2", { cls: "finance-chart-title" });
    const chartIcon = chartTitle.createSpan({ cls: "finance-icon" });
    setIcon(chartIcon, iconName);
    chartTitle.createSpan({ text: " " + title });
  }

  // ============================================================
  // Monthly Overview Table
  // ============================================================

  private renderMonthlyOverview(container: HTMLElement): void {
    const section = container.createDiv({ cls: "finance-section" });
    const overviewTitle = section.createEl("h2");
    const overviewIcon = overviewTitle.createSpan({ cls: "finance-icon" });
    setIcon(overviewIcon, "calendar");
    overviewTitle.createSpan({ text: " " + t("overview.title") });

    const rows = this.calculator.getMonthlyOverview(this.settings);
    if (rows.length === 0) {
      section.createEl("p", {
        text: t("overview.empty"),
        cls: "finance-empty",
      });
      return;
    }

    // Collect all categories for dynamic columns
    const allCategories = this.calculator.getAllCategories();

    const tableWrapper = section.createDiv({ cls: "finance-table-wrapper" });
    const table = tableWrapper.createEl("table", {
      cls: "finance-table finance-table-has-actions",
    });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");

    const headers = [
      t("overview.col.month"),
      t("overview.col.salary"),
      t("overview.col.otherIncome"),
      ...allCategories,
      t("overview.col.totalAssets"),
      t("overview.col.momPercent"),
      t("overview.col.investReturn"),
      t("overview.col.note"),
      t("overview.col.actions"),
    ];
    headers.forEach((h) => headerRow.createEl("th", { text: h }));

    const tbody = table.createEl("tbody");
    rows.forEach((row) => {
      const tr = tbody.createEl("tr");
      tr.createEl("td", { text: row.month.substring(5) });
      tr.createEl("td", {
        text: this.maskValue(formatCurrencyCompact(row.salaryIncome)),
        cls: "finance-number",
      });
      tr.createEl("td", {
        text: this.maskValue(formatCurrencyCompact(row.otherIncome)),
        cls: "finance-number",
      });

      allCategories.forEach((cat) => {
        tr.createEl("td", {
          text: this.maskValue(formatCurrencyCompact(row.categoryAmounts[cat] ?? 0)),
          cls: "finance-number",
        });
      });

      tr.createEl("td", {
        text: this.maskValue(formatCurrencyCompact(row.totalAssets)),
        cls: "finance-number",
      });

      const momTd = tr.createEl("td", { cls: "finance-number" });
      if (row.momPercent !== null) {
        momTd.textContent = formatPercent(row.momPercent);
        momTd.addClass(row.momPercent >= 0 ? "positive" : "negative");
      } else {
        momTd.textContent = "-";
      }

      const irTd = tr.createEl("td", { cls: "finance-number" });
      if (row.investmentReturn !== null) {
        irTd.textContent = this.maskValue(formatCurrencyCompact(row.investmentReturn));
        irTd.addClass(row.investmentReturn >= 0 ? "positive" : "negative");
      } else {
        irTd.textContent = "-";
      }

      tr.createEl("td", { text: row.note, cls: "finance-note" });

      // Actions column with edit and delete buttons
      const actionsTd = tr.createEl("td", { cls: "finance-table-actions-cell" });
      
      // Edit button
      const editBtn = actionsTd.createEl("button", {
        cls: "finance-btn-small",
      });
      setIcon(editBtn, "pencil");
      editBtn.addEventListener("click", () => {
        const snapshot = this.store.getSnapshotByMonth(row.month);
        if (snapshot) {
          this.onEditSnapshot?.(snapshot);
        }
      });

      // Delete button
      const deleteBtn = actionsTd.createEl("button", {
        cls: "finance-btn-small",
      });
      setIcon(deleteBtn, "trash-2");
      deleteBtn.addEventListener("click", async () => {
        if (confirm(t("overview.deleteConfirm", { month: row.month }))) {
          await this.store.deleteSnapshot(row.month);
          await this.store.deleteCashFlowByMonth(row.month);
        }
      });
    });
  }

  // ============================================================
  // Dividend Summary
  // ============================================================

  private renderDividendSummary(container: HTMLElement, year: string): void {
    const section = container.createDiv({ cls: "finance-section" });
    const divTitle = section.createEl("h2");
    const divIcon = divTitle.createSpan({ cls: "finance-icon" });
    setIcon(divIcon, "target");
    divTitle.createSpan({ text: " " + t("dividend.title") + ` (${year})` });

    const { rows, grandTotal } = this.calculator.getDividendSummary(year);
    if (rows.length === 0) {
      section.createEl("p", {
        text: t("dividend.empty"),
        cls: "finance-empty",
      });
      return;
    }

    const table = section.createEl("table", { cls: "finance-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    [
      t("dividend.col.stock"),
      t("dividend.col.amounts"),
      t("dividend.col.total"),
    ].forEach((h) => headerRow.createEl("th", { text: h }));

    const tbody = table.createEl("tbody");
    rows.forEach((row) => {
      const tr = tbody.createEl("tr");
      tr.createEl("td", { text: row.stockName });
      tr.createEl("td", {
        text: this.maskValue(row.amounts.map((a) => formatCurrencyCompact(a)).join(" + ")),
        cls: "finance-number",
      });
      tr.createEl("td", {
        text: this.maskValue(formatCurrencyCompact(row.total)),
        cls: "finance-number finance-bold",
      });
    });

    // Grand total
    const totalRow = tbody.createEl("tr", { cls: "finance-total-row" });
    totalRow.createEl("td", { text: t("dividend.grandTotal") });
    totalRow.createEl("td", { text: "" });
    totalRow.createEl("td", {
      text: this.maskValue(formatCurrencyCompact(grandTotal)),
      cls: "finance-number finance-bold",
    });
  }

  // ============================================================
  // Cash Flow Details
  // ============================================================

  private renderCashFlowDetails(container: HTMLElement): void {
    const section = container.createDiv({ cls: "finance-section" });
    const cfTitle = section.createEl("h2");
    const cfIcon = cfTitle.createSpan({ cls: "finance-icon" });
    setIcon(cfIcon, "clipboard-list");
    cfTitle.createSpan({ text: " " + t("cashFlow.title") });

    const records = [...this.store.getCashFlowRecords()].sort((a, b) =>
      b.date.localeCompare(a.date),
    );

    if (records.length === 0) {
      section.createEl("p", {
        text: t("cashFlow.empty"),
        cls: "finance-empty",
      });
      return;
    }

    // Filter buttons
    const filterBar = section.createDiv({ cls: "finance-filter-bar" });
    let currentFilter: string = "all";

    const renderTable = () => {
      // Remove existing table wrapper if any
      const existingWrapper = section.querySelector(".finance-table-wrapper");
      if (existingWrapper) existingWrapper.remove();

      const filtered =
        currentFilter === "all"
          ? records
          : records.filter((r) => r.type === currentFilter);

      const tableWrapper = section.createDiv({ cls: "finance-table-wrapper" });
      const table = tableWrapper.createEl("table", { cls: "finance-table finance-table-has-actions" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      [
        t("cashFlow.col.date"),
        t("cashFlow.col.type"),
        t("cashFlow.col.category"),
        t("cashFlow.col.amount"),
        t("cashFlow.col.note"),
        t("cashFlow.col.actions"),
      ].forEach((h) => headerRow.createEl("th", { text: h }));

      const tbody = table.createEl("tbody");
      // Show max 50 records for performance
      const displayRecords = filtered.slice(0, 50);

      displayRecords.forEach((record) => {
        const tr = tbody.createEl("tr");
        tr.createEl("td", { text: record.date.substring(5) });
        const typeTd = tr.createEl("td");
        const typeIcon = typeTd.createSpan({ cls: "finance-icon" });
        setIcon(
          typeIcon,
          record.type === "income" ? "trending-up" : "trending-down",
        );
        typeTd.createSpan({
          text:
            " " +
            (record.type === "income"
              ? t("cashFlow.type.income")
              : t("cashFlow.type.expense")),
        });
        tr.createEl("td", { text: record.category });
        const amountTd = tr.createEl("td", {
          text: this.maskValue(formatCurrencyCompact(record.amount)),
          cls: "finance-number",
        });
        amountTd.addClass(record.type === "income" ? "positive" : "negative");
        tr.createEl("td", { text: record.note ?? "", cls: "finance-note" });

        const actionsTd = tr.createEl("td", { cls: "finance-table-actions-cell" });
        const editBtn = actionsTd.createEl("button", {
          cls: "finance-btn-small",
        });
        setIcon(editBtn, "pencil");
        editBtn.addEventListener("click", () => this.onEditCashFlow?.(record));

        const deleteBtn = actionsTd.createEl("button", {
          cls: "finance-btn-small",
        });
        setIcon(deleteBtn, "trash-2");
        deleteBtn.addEventListener("click", async () => {
          if (confirm(t("cashFlow.deleteConfirm"))) {
            await this.store.deleteCashFlow(record.id);
          }
        });
      });

      if (filtered.length > 50) {
        section.createEl("p", {
          text: t("cashFlow.showingRecords", { count: filtered.length }),
          cls: "finance-pagination-info",
        });
      }
    };

    ["all", "income", "expense"].forEach((filter) => {
      const btn = filterBar.createEl("button", {
        text:
          filter === "all"
            ? t("cashFlow.filter.all")
            : filter === "income"
              ? t("cashFlow.filter.income")
              : t("cashFlow.filter.expense"),
        cls: `finance-filter-btn ${currentFilter === filter ? "active" : ""}`,
      });
      btn.addEventListener("click", () => {
        currentFilter = filter;
        filterBar
          .querySelectorAll(".finance-filter-btn")
          .forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        renderTable();
      });
    });

    renderTable();
  }
}
