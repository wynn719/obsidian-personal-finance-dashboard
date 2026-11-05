import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import type { AccumulationTrade } from "../accumulation/types";
import type { AccumulationStore } from "../accumulation/store";
import { AccumulationTradeForm } from "../react/forms/accumulation-trade-form";

export class AccumulationTradeModal extends Modal {
  private root: Root | null = null;
  private store: AccumulationStore;
  private planId: string;
  private existingTrade: AccumulationTrade | undefined;
  private defaultStageOrder: number | null | undefined;

  constructor(
    app: App,
    store: AccumulationStore,
    planId: string,
    existingTrade?: AccumulationTrade,
    defaultStageOrder?: number | null,
  ) {
    super(app);
    this.store = store;
    this.planId = planId;
    this.existingTrade = existingTrade;
    this.defaultStageOrder = defaultStageOrder;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <AccumulationTradeForm
        store={this.store}
        planId={this.planId}
        defaultStageOrder={this.defaultStageOrder}
        existingTrade={this.existingTrade}
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
