import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { DataStore } from "../data-store";
import { FinanceCalculator } from "../calculator";
import {
  FinanceSettings,
  CashFlowRecord,
  DividendRecord,
  AssetSnapshot,
} from "../models";
import { FinanceApp } from "../react/dashboard-app";
import { t } from "../i18n";

export const VIEW_TYPE_FINANCE = "finance-dashboard-view";

export class FinanceDashboardView extends ItemView {
  private store: DataStore;
  private calculator: FinanceCalculator;
  private settings: FinanceSettings;
  private root: Root | null = null;

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
    // 防御：onOpen 若被重复调用，先卸载旧 root 避免 createRoot 二次创建报错
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.contentEl.empty();
    this.contentEl.addClass("finance-dashboard");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <FinanceApp
        store={this.store}
        calculator={this.calculator}
        settings={this.settings}
        onAddSnapshot={this.onAddSnapshot}
        onAddCashFlow={this.onAddCashFlow}
        onAddDividend={this.onAddDividend}
        onEditSnapshot={this.onEditSnapshot}
        onEditCashFlow={this.onEditCashFlow}
        onEditDividend={this.onEditDividend}
        onRefreshData={this.onRefreshData}
      />,
    );
  }

  async onClose(): Promise<void> {
    // 先 unmount（触发 React cleanup：Chart.destroy 等），再清 DOM
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.contentEl.empty();
  }
}
