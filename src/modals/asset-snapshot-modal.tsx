import { App, Modal } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { AssetSnapshot, FinanceSettings } from "../models";
import { DataStore } from "../data-store";
import { AssetSnapshotForm } from "../react/forms/asset-snapshot-form";

export class AssetSnapshotModal extends Modal {
  private root: Root | null = null;
  private store: DataStore;
  private settings: FinanceSettings;
  private existingSnapshot: AssetSnapshot | undefined;

  constructor(
    app: App,
    store: DataStore,
    settings: FinanceSettings,
    existingSnapshot?: AssetSnapshot,
  ) {
    super(app);
    this.store = store;
    this.settings = settings;
    this.existingSnapshot = existingSnapshot;
  }

  onOpen(): void {
    this.contentEl.empty();
    this.contentEl.addClass("finance-modal");
    this.root = createRoot(this.contentEl);
    this.root.render(
      <AssetSnapshotForm
        store={this.store}
        settings={this.settings}
        existingSnapshot={this.existingSnapshot}
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
