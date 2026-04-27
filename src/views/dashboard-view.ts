import { ItemView, WorkspaceLeaf, Menu, setIcon } from "obsidian";
import { DataStore } from "../data-store";
import { FinanceCalculator } from "../calculator";
import { FinanceSettings, CashFlowRecord, DividendRecord } from "../models";
import {
  formatCurrency,
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

  // Callbacks for opening modals (injected from main plugin)
  public onAddSnapshot: (() => void) | null = null;
  public onAddCashFlow: (() => void) | null = null;
  public onAddDividend: (() => void) | null = null;
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
    this.renderAssetAllocation(container, currentMonth);
    this.renderCharts(container, currentMonth);

    // Monthly overview table
    this.renderMonthlyOverview(container);

    // Bottom: Dividend summary + Cash flow details
    this.renderDividendSummary(container, currentYear);
    this.renderCashFlowDetails(container);
  }

  // ============================================================
  // Header
  // ============================================================

  private renderHeader(container: HTMLElement, currentYear: string): void {
    const header = container.createDiv({ cls: "finance-header" });
    const titleRow = header.createDiv({ cls: "finance-header-title-row" });
    const titleEl = titleRow.createEl("h1");
    const titleIcon = titleEl.createSpan({ cls: "finance-icon" });
    setIcon(titleIcon, "wallet");
    titleEl.createSpan({ text: " " + t("dashboard.title") });

    // Year selector
    const yearSelector = titleRow.createDiv({ cls: "finance-year-selector" });
    const yearLabel = yearSelector.createSpan({ cls: "finance-year-label" });
    const yearLabelIcon = yearLabel.createSpan({ cls: "finance-icon" });
    setIcon(yearLabelIcon, "calendar");
    yearLabel.createSpan({ text: " " + t("dashboard.yearSelector") });

    const yearSelect = yearSelector.createEl("select", {
      cls: "finance-year-select",
    });

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
      formatCurrency(metrics.totalAssets),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.momChange"),
      `${formatChange(metrics.momChange)}`,
      formatPercent(metrics.momPercent),
      metrics.momChange >= 0 ? "positive" : "negative",
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlyIncome"),
      formatCurrency(metrics.monthlyIncome),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlyExpense"),
      formatCurrency(metrics.monthlyExpense),
      t("metrics.unit"),
    );
    this.createMetricCard(
      grid,
      t("metrics.monthlySurplus"),
      formatCurrency(metrics.monthlySurplus),
      t("metrics.unit"),
      metrics.monthlySurplus >= 0 ? "positive" : "negative",
    );
    this.createMetricCard(
      grid,
      t("metrics.yearlyDividends"),
      formatCurrency(metrics.yearlyDividends),
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
        text: formatCurrency(row.amount),
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

      totalAmount += row.amount;
    });

    // Total row
    const totalRow = tbody.createEl("tr", { cls: "finance-total-row" });
    totalRow.createEl("td", { text: t("allocation.total") });
    totalRow.createEl("td", {
      text: formatCurrency(totalAmount),
      cls: "finance-number",
    });
    totalRow.createEl("td", { text: "100.00%", cls: "finance-number" });
    totalRow.createEl("td", { text: "100.00%", cls: "finance-number" });
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
  }

  private renderPieChart(parent: HTMLElement, month: string): void {
    const section = parent.createDiv({ cls: "finance-chart-container" });
    section.createEl("h3", { text: t("chart.assetDistribution") });

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
    canvas.width = 350;
    canvas.height = 350;

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
        responsive: false,
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
                const total = snapshot.totalAssets;
                const value = ctx.parsed;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(2) : "0";
                return ` ${ctx.label}: ¥${formatCurrency(value)} (${pct}%)`;
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
    section.createEl("h3", { text: t("chart.monthlyIncomeVsExpense") });

    const data = this.calculator.getMonthlyCashFlow(6);
    if (data.every((d) => d.income === 0 && d.expense === 0)) {
      section.createEl("p", { text: t("chart.noData"), cls: "finance-empty" });
      return;
    }

    const canvas = section.createEl("canvas");
    canvas.width = 450;
    canvas.height = 350;

    this.barChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: data.map((d) => d.month),
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
        responsive: false,
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
                ` ${ctx.dataset.label}: ¥${formatCurrency(ctx.parsed.y ?? 0)}`,
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
              callback: (value) => "¥" + formatCurrency(value as number),
            },
          },
        },
      },
    });
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

    const table = section.createEl("table", {
      cls: "finance-table finance-table-scroll",
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
      tr.createEl("td", { text: row.month });
      tr.createEl("td", {
        text: formatCurrency(row.salaryIncome),
        cls: "finance-number",
      });
      tr.createEl("td", {
        text: formatCurrency(row.otherIncome),
        cls: "finance-number",
      });

      allCategories.forEach((cat) => {
        tr.createEl("td", {
          text: formatCurrency(row.categoryAmounts[cat] ?? 0),
          cls: "finance-number",
        });
      });

      tr.createEl("td", {
        text: formatCurrency(row.totalAssets),
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
        irTd.textContent = formatCurrency(row.investmentReturn);
        irTd.addClass(row.investmentReturn >= 0 ? "positive" : "negative");
      } else {
        irTd.textContent = "-";
      }

      tr.createEl("td", { text: row.note, cls: "finance-note" });

      // Actions column with delete button
      const actionsTd = tr.createEl("td");
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
        text: row.amounts.map((a) => formatCurrency(a)).join(" + "),
        cls: "finance-number",
      });
      tr.createEl("td", {
        text: formatCurrency(row.total),
        cls: "finance-number finance-bold",
      });
    });

    // Grand total
    const totalRow = tbody.createEl("tr", { cls: "finance-total-row" });
    totalRow.createEl("td", { text: t("dividend.grandTotal") });
    totalRow.createEl("td", { text: "" });
    totalRow.createEl("td", {
      text: formatCurrency(grandTotal),
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
      // Remove existing table if any
      const existingTable = section.querySelector(".finance-table");
      if (existingTable) existingTable.remove();

      const filtered =
        currentFilter === "all"
          ? records
          : records.filter((r) => r.type === currentFilter);

      const table = section.createEl("table", { cls: "finance-table" });
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
        tr.createEl("td", { text: record.date });
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
          text: formatCurrency(record.amount),
          cls: "finance-number",
        });
        amountTd.addClass(record.type === "income" ? "positive" : "negative");
        tr.createEl("td", { text: record.note ?? "", cls: "finance-note" });

        const actionsTd = tr.createEl("td");
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
