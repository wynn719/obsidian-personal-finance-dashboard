import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { DataStore } from "../data-store";
import { FinanceCalculator } from "../calculator";
import {
  FinanceSettings,
  CashFlowRecord,
  DividendRecord,
  AssetSnapshot,
  StockHolding,
} from "../models";
import { FinanceApp } from "../react/dashboard-app";
import type { AccumulationStore } from "../accumulation/store";
import type { AccumulationPlan, AccumulationTrade } from "../accumulation/types";
import { t } from "../i18n";

export const VIEW_TYPE_FINANCE = "finance-dashboard-view";

export class FinanceDashboardView extends ItemView {
  private store: DataStore;
  private calculator: FinanceCalculator;
  private settings: FinanceSettings;
  private accumulationStore: AccumulationStore;
  private root: Root | null = null;

  // Callbacks for opening modals (injected from main plugin)
  public onAddSnapshot: (() => void) | null = null;
  public onAddCashFlow: (() => void) | null = null;
  public onAddDividend: (() => void) | null = null;
  public onEditHoldings: (() => void) | null = null;
  public onEditSnapshot: ((snapshot: AssetSnapshot) => void) | null = null;
  public onEditCashFlow: ((record: CashFlowRecord) => void) | null = null;
  public onEditDividend: ((record: DividendRecord) => void) | null = null;
  public onEditHolding: ((holding: StockHolding) => void) | null = null;
  public onRefreshData: (() => Promise<void>) | null = null;
  public onAddAccumulationPlan: (() => void) | null = null;
  public onEditAccumulationPlan: ((plan: AccumulationPlan) => void) | null = null;
  public onOpenAccumulationTrade:
    | ((planId: string, trade?: AccumulationTrade) => void)
    | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    store: DataStore,
    calculator: FinanceCalculator,
    settings: FinanceSettings,
    accumulationStore: AccumulationStore,
  ) {
    super(leaf);
    this.store = store;
    this.calculator = calculator;
    this.settings = settings;
    this.accumulationStore = accumulationStore;
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
        container={this.contentEl}
        store={this.store}
        calculator={this.calculator}
        settings={this.settings}
        onAddSnapshot={this.onAddSnapshot}
        onAddCashFlow={this.onAddCashFlow}
        onAddDividend={this.onAddDividend}
        onEditHoldings={this.onEditHoldings}
        onEditSnapshot={this.onEditSnapshot}
        onEditCashFlow={this.onEditCashFlow}
        onEditDividend={this.onEditDividend}
        onEditHolding={this.onEditHolding}
        onRefreshData={this.onRefreshData}
        accumulationStore={this.accumulationStore}
        onAddAccumulationPlan={this.onAddAccumulationPlan}
        onEditAccumulationPlan={this.onEditAccumulationPlan}
        onOpenAccumulationTrade={this.onOpenAccumulationTrade}
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
