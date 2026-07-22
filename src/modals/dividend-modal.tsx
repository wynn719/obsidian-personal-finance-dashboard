import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { DividendRecord } from "../models";
import { DataStore } from "../data-store";
import { DividendForm } from "../react/forms/dividend-form";

export class DividendModal extends Modal {
  private root: Root | null = null;
  private store: DataStore;
  private existingRecord: DividendRecord | undefined;

  constructor(app: App, store: DataStore, existingRecord?: DividendRecord) {
    super(app);
    this.store = store;
    this.existingRecord = existingRecord;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <DividendForm
        store={this.store}
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
