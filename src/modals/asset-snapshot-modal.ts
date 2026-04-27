import { App, Modal, Setting, Notice } from "obsidian";
import { AssetSnapshot, CategoryAmount, FinanceSettings } from "../models";
import { generateId, getCurrentMonth } from "../utils";
import { DataStore } from "../data-store";
import { t } from "../i18n";

/**
 * Modal for adding/editing a monthly asset snapshot.
 * One form captures all category amounts for a single month.
 */
export class AssetSnapshotModal extends Modal {
  private store: DataStore;
  private settings: FinanceSettings;
  private month: string;
  private categoryAmounts: Map<string, { amount: string; details: string }>;
  private noteValue: string;
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
    this.month = existingSnapshot?.month ?? getCurrentMonth();
    this.noteValue = existingSnapshot?.note ?? "";

    // Initialize category amounts
    this.categoryAmounts = new Map();
    this.settings.assetCategories.forEach((cat) => {
      const existing = existingSnapshot?.categories.find(
        (c) => c.category === cat,
      );
      this.categoryAmounts.set(cat, {
        amount: existing ? String(existing.amount) : "",
        details: existing?.details ?? "",
      });
    });
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("finance-modal");

    contentEl.createEl("h2", {
      text: this.existingSnapshot
        ? t("modal.snapshot.titleEdit")
        : t("modal.snapshot.titleAdd"),
    });

    // Month selector
    new Setting(contentEl)
      .setName(t("modal.snapshot.month"))
      .setDesc(t("modal.snapshot.monthDesc"))
      .addText((text) => {
        text
          .setPlaceholder(t("modal.snapshot.monthPlaceholder"))
          .setValue(this.month)
          .onChange((value) => {
            this.month = value;
          });
        text.inputEl.type = "month";
      });

    // Category amount inputs
    contentEl.createEl("h3", { text: t("modal.snapshot.categories") });

    this.settings.assetCategories.forEach((cat) => {
      const data = this.categoryAmounts.get(cat)!;

      new Setting(contentEl)
        .setName(cat)
        .setDesc(t("modal.snapshot.categoryDesc"))
        .addText((text) => {
          text
            .setPlaceholder(t("modal.cashFlow.amount"))
            .setValue(data.amount)
            .onChange((value) => {
              data.amount = value;
            });
          text.inputEl.type = "number";
          text.inputEl.style.width = "150px";
        })
        .addText((text) => {
          text
            .setPlaceholder(t("modal.snapshot.detailsPlaceholder"))
            .setValue(data.details)
            .onChange((value) => {
              data.details = value;
            });
          text.inputEl.style.width = "200px";
        });
    });

    // Note
    new Setting(contentEl)
      .setName(t("modal.snapshot.note"))
      .setDesc(t("modal.snapshot.noteDesc"))
      .addText((text) => {
        text
          .setPlaceholder(t("modal.snapshot.notePlaceholder"))
          .setValue(this.noteValue)
          .onChange((value) => {
            this.noteValue = value;
          });
      });

    // Submit button
    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText(t("modal.snapshot.save"))
        .setCta()
        .onClick(async () => {
          await this.handleSubmit();
        });
    });
  }

  private async handleSubmit(): Promise<void> {
    // Validate month
    if (!this.month || !/^\d{4}-\d{2}$/.test(this.month)) {
      new Notice(t("modal.snapshot.invalidMonth"));
      return;
    }

    // Build categories array
    const categories: CategoryAmount[] = [];
    let totalAssets = 0;

    for (const cat of this.settings.assetCategories) {
      const data = this.categoryAmounts.get(cat)!;
      const amount = data.amount ? parseFloat(data.amount) : 0;

      if (data.amount && (isNaN(amount) || amount < 0)) {
        new Notice(t("modal.snapshot.invalidAmount", { category: cat }));
        return;
      }

      categories.push({
        category: cat,
        amount,
        details: data.details || undefined,
      });
      totalAssets += amount;
    }

    // Check if overwriting existing
    if (!this.existingSnapshot) {
      const existing = this.store.getSnapshotByMonth(this.month);
      if (existing) {
        const confirmed = confirm(
          t("modal.snapshot.overwriteConfirm", { month: this.month }),
        );
        if (!confirmed) return;
      }
    }

    const snapshot: AssetSnapshot = {
      id: this.existingSnapshot?.id ?? generateId(),
      month: this.month,
      categories,
      totalAssets,
      note: this.noteValue || undefined,
    };

    await this.store.addOrUpdateSnapshot(snapshot);
    new Notice(t("modal.snapshot.saved", { month: this.month }));
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
