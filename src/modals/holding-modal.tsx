import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { StockHolding } from "../models";
import { DataStore } from "../data-store";
import { HoldingForm } from "../react/forms/holding-form";

export class HoldingModal extends Modal {
  private root: Root | null = null;
  private store: DataStore;
  private existingHolding: StockHolding | undefined;

  constructor(app: App, store: DataStore, existingHolding?: StockHolding) {
    super(app);
    this.store = store;
    this.existingHolding = existingHolding;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <HoldingForm
        store={this.store}
        existingHolding={this.existingHolding}
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
