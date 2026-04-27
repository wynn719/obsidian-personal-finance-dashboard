import { App, Modal, Setting, Notice } from "obsidian";
import { CashFlowRecord, CashFlowType, FinanceSettings } from "../models";
import { generateId, getCurrentDate } from "../utils";
import { DataStore } from "../data-store";
import { t } from "../i18n";

/**
 * Modal for adding/editing an income or expense record.
 */
export class CashFlowModal extends Modal {
  private store: DataStore;
  private settings: FinanceSettings;
  private recordType: CashFlowType;
  private dateValue: string;
  private amountValue: string;
  private categoryValue: string;
  private noteValue: string;
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
    this.existingRecord = existingRecord;
    this.recordType = existingRecord?.type ?? defaultType;
    this.dateValue = existingRecord?.date ?? getCurrentDate();
    this.amountValue = existingRecord ? String(existingRecord.amount) : "";
    this.categoryValue = existingRecord?.category ?? "";
    this.noteValue = existingRecord?.note ?? "";
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("finance-modal");

    contentEl.createEl("h2", {
      text: this.existingRecord
        ? t("modal.cashFlow.titleEdit")
        : t("modal.cashFlow.titleAdd"),
    });

    // Type selector
    new Setting(contentEl)
      .setName(t("modal.cashFlow.type"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("income", t("modal.cashFlow.typeIncome"))
          .addOption("expense", t("modal.cashFlow.typeExpense"))
          .setValue(this.recordType)
          .onChange((value) => {
            this.recordType = value as CashFlowType;
            this.categoryValue = "";
            this.refreshCategoryDropdown();
          });
      });

    // Date
    new Setting(contentEl).setName(t("modal.cashFlow.date")).addText((text) => {
      text.setValue(this.dateValue).onChange((value) => {
        this.dateValue = value;
      });
      text.inputEl.type = "date";
    });

    // Amount
    new Setting(contentEl)
      .setName(t("modal.cashFlow.amount"))
      .addText((text) => {
        text
          .setPlaceholder(t("modal.cashFlow.amountPlaceholder"))
          .setValue(this.amountValue)
          .onChange((value) => {
            this.amountValue = value;
          });
        text.inputEl.type = "number";
        text.inputEl.setAttribute("min", "0");
      });

    // Category (will be refreshed based on type)
    this.categoryContainer = contentEl.createDiv();
    this.refreshCategoryDropdown();

    // Note
    new Setting(contentEl).setName(t("modal.cashFlow.note")).addText((text) => {
      text
        .setPlaceholder(t("modal.cashFlow.notePlaceholder"))
        .setValue(this.noteValue)
        .onChange((value) => {
          this.noteValue = value;
        });
    });

    // Submit
    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText(t("modal.cashFlow.save"))
        .setCta()
        .onClick(async () => {
          await this.handleSubmit();
        });
    });
  }

  private categoryContainer: HTMLElement | null = null;

  private refreshCategoryDropdown(): void {
    if (!this.categoryContainer) return;
    this.categoryContainer.empty();

    const categories =
      this.recordType === "income"
        ? this.settings.incomeCategories
        : this.settings.expenseCategories;

    new Setting(this.categoryContainer)
      .setName(t("modal.cashFlow.category"))
      .addDropdown((dropdown) => {
        dropdown.addOption("", t("modal.cashFlow.categorySelect"));
        categories.forEach((cat) => {
          dropdown.addOption(cat, cat);
        });
        dropdown.setValue(this.categoryValue).onChange((value) => {
          this.categoryValue = value;
        });
      });
  }

  private async handleSubmit(): Promise<void> {
    // Validate
    if (!this.dateValue) {
      new Notice(t("modal.cashFlow.invalidDate"));
      return;
    }

    const amount = parseFloat(this.amountValue);
    if (!this.amountValue || isNaN(amount) || amount <= 0) {
      new Notice(t("modal.cashFlow.invalidAmount"));
      return;
    }

    if (!this.categoryValue) {
      new Notice(t("modal.cashFlow.invalidCategory"));
      return;
    }

    const record: CashFlowRecord = {
      id: this.existingRecord?.id ?? generateId(),
      type: this.recordType,
      date: this.dateValue,
      amount,
      category: this.categoryValue,
      note: this.noteValue || undefined,
    };

    if (this.existingRecord) {
      await this.store.updateCashFlow(record);
    } else {
      await this.store.addCashFlow(record);
    }

    new Notice(
      this.recordType === "income"
        ? t("modal.cashFlow.savedIncome")
        : t("modal.cashFlow.savedExpense"),
    );
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
