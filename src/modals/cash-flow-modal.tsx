import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { CashFlowRecord, CashFlowType, FinanceSettings } from "../models";
import { DataStore } from "../data-store";
import { CashFlowForm } from "../react/forms/cash-flow-form";

export class CashFlowModal extends Modal {
  private root: Root | null = null;
  private store: DataStore;
  private settings: FinanceSettings;
  private defaultType: CashFlowType;
  private existingRecord: CashFlowRecord | undefined;

  constructor(
    app: App,
    store: DataStore,
    settings: FinanceSettings,
    defaultType: CashFlowType = "income",
    existingRecord?: CashFlowRecord,
  ) {
    super(app);
    this.store = store;
    this.settings = settings;
    this.defaultType = defaultType;
    this.existingRecord = existingRecord;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <CashFlowForm
        store={this.store}
        settings={this.settings}
        defaultType={this.defaultType}
        existingRecord={this.existingRecord}
        onClose={() => this.close()}
      />,
    );
  }

  onClose(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    this.contentEl.empty();
  }
}
