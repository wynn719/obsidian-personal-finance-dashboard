import { Plugin } from "obsidian";
import {
  FinanceSettings,
  DEFAULT_SETTINGS,
  CashFlowRecord,
  DividendRecord,
  AssetSnapshot,
  StockHolding,
} from "./models";
import { DataStore } from "./data-store";
import { FinanceCalculator } from "./calculator";
import {
  FinanceDashboardView,
  VIEW_TYPE_FINANCE,
} from "./views/dashboard-view";
import { AssetSnapshotModal } from "./modals/asset-snapshot-modal";
import { CashFlowModal } from "./modals/cash-flow-modal";
import { DividendModal } from "./modals/dividend-modal";
import { HoldingModal } from "./modals/holding-modal";
import { HoldingsManageModal } from "./modals/holdings-manage-modal";
import { FinanceSettingTab } from "./settings";
import { setLocale, t } from "./i18n";

export default class FinanceDashboardPlugin extends Plugin {
  settings: FinanceSettings = DEFAULT_SETTINGS;
  dataStore: DataStore = null!;
  calculator: FinanceCalculator = null!;

  async onload(): Promise<void> {
    // Load settings
    await this.loadSettings();

    // Initialize data store & start watching for external changes
    this.dataStore = new DataStore(
      this,
      this.settings.dataFolderPath,
      this.settings.miscDataFilePath,
    );
    await this.dataStore.load();
    this.dataStore.startWatching();

    // Initialize calculator
    this.calculator = new FinanceCalculator(this.dataStore);

    // Register the dashboard view (stock holdings module included)
    this.registerView(VIEW_TYPE_FINANCE, (leaf) => {
      const view = new FinanceDashboardView(
        leaf,
        this.dataStore,
        this.calculator,
        this.settings,
      );

      // Wire up modal callbacks
      view.onAddSnapshot = () => this.openAssetSnapshotModal();
      view.onAddCashFlow = () => this.openCashFlowModal();
      view.onAddDividend = () => this.openDividendModal();
      view.onEditHoldings = () => this.openHoldingsManageModal();
      view.onEditSnapshot = (snapshot: AssetSnapshot) =>
        this.openAssetSnapshotModal(snapshot);
      view.onEditCashFlow = (record: CashFlowRecord) =>
        this.openCashFlowModal(record);
      view.onEditDividend = (record: DividendRecord) =>
        this.openDividendModal(record);
      view.onEditHolding = (holding: StockHolding) =>
        this.openHoldingModal(holding);
      view.onRefreshData = async () => {
        await this.dataStore.reload();
        await this.dataStore.reloadMisc();
      };

      return view;
    });

    // Add ribbon icon
    this.addRibbonIcon("wallet", t("ribbon.openDashboard"), () => {
      this.activateDashboard();
    });

    // Register commands
    this.addCommand({
      id: "open-finance-dashboard",
      name: t("command.openDashboard"),
      callback: () => this.activateDashboard(),
    });

    this.addCommand({
      id: "add-asset-snapshot",
      name: t("command.addSnapshot"),
      callback: () => this.openAssetSnapshotModal(),
    });

    this.addCommand({
      id: "add-income-expense",
      name: t("command.addIncomeExpense"),
      callback: () => this.openCashFlowModal(),
    });

    this.addCommand({
      id: "add-dividend",
      name: t("command.addDividend"),
      callback: () => this.openDividendModal(),
    });

    this.addCommand({
      id: "add-stock-holding",
      name: t("command.addHolding"),
      callback: () => this.openHoldingModal(),
    });

    this.addCommand({
      id: "refresh-finance-data",
      name: t("command.refreshData"),
      callback: async () => {
        await this.dataStore.reload();
        await this.dataStore.reloadMisc();
      },
    });

    // Register settings tab
    this.addSettingTab(new FinanceSettingTab(this.app, this));
  }

  onunload(): void {
    this.dataStore.stopWatching();
  }

  // ============================================================
  // Settings
  // ============================================================

  async loadSettings(): Promise<void> {
    const savedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);

    // Migrate old dataFilePath to dataFolderPath
    if (
      savedData &&
      (savedData as Record<string, unknown>).dataFilePath &&
      !savedData.dataFolderPath
    ) {
      const oldPath = (savedData as Record<string, unknown>)
        .dataFilePath as string;
      // Extract folder from old file path (e.g. "Finance/Finance Dashboard.md" → "Finance")
      const lastSlash = oldPath.lastIndexOf("/");
      this.settings.dataFolderPath =
        lastSlash > 0 ? oldPath.substring(0, lastSlash) : "Finance";
      // Clean up old key
      delete (this.settings as unknown as Record<string, unknown>).dataFilePath;
      await this.saveSettings();
    }

    setLocale(this.settings.locale);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  // ============================================================
  // Dashboard activation
  // ============================================================

  async activateDashboard(): Promise<void> {
    const { workspace } = this.app;

    // Check if view already exists in any location
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_FINANCE)[0];

    if (!leaf) {
      // Create a new tab in the main editor area (like Thino)
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({
        type: VIEW_TYPE_FINANCE,
        active: true,
      });
    }

    workspace.revealLeaf(leaf);
  }

  // ============================================================
  // Modal openers
  // ============================================================

  private openAssetSnapshotModal(existingSnapshot?: AssetSnapshot): void {
    new AssetSnapshotModal(this.app, this.dataStore, this.settings, existingSnapshot).open();
  }

  private openCashFlowModal(existingRecord?: CashFlowRecord): void {
    new CashFlowModal(
      this.app,
      this.dataStore,
      this.settings,
      "income",
      existingRecord,
    ).open();
  }

  private openDividendModal(existingRecord?: DividendRecord): void {
    new DividendModal(this.app, this.dataStore, existingRecord).open();
  }

  private openHoldingModal(existingHolding?: StockHolding): void {
    new HoldingModal(this.app, this.dataStore, existingHolding).open();
  }

  private openHoldingsManageModal(): void {
    new HoldingsManageModal(this.app, this.dataStore, (holding) =>
      this.openHoldingModal(holding),
    ).open();
  }
}
