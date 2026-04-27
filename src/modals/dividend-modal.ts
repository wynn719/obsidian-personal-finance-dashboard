import { App, Modal, Setting, Notice } from "obsidian";
import { DividendRecord } from "../models";
import { generateId, getCurrentDate } from "../utils";
import { DataStore } from "../data-store";
import { t } from "../i18n";

/**
 * Modal for adding/editing a dividend record.
 */
export class DividendModal extends Modal {
  private store: DataStore;
  private dateValue: string;
  private stockNameValue: string;
  private amountValue: string;
  private noteValue: string;
  private existingRecord: DividendRecord | undefined;

  constructor(app: App, store: DataStore, existingRecord?: DividendRecord) {
    super(app);
    this.store = store;
    this.existingRecord = existingRecord;
    this.dateValue = existingRecord?.date ?? getCurrentDate();
    this.stockNameValue = existingRecord?.stockName ?? "";
    this.amountValue = existingRecord ? String(existingRecord.amount) : "";
    this.noteValue = existingRecord?.note ?? "";
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("finance-modal");

    contentEl.createEl("h2", {
      text: this.existingRecord
        ? t("modal.dividend.titleEdit")
        : t("modal.dividend.titleAdd"),
    });

    // Date
    new Setting(contentEl).setName(t("modal.dividend.date")).addText((text) => {
      text.setValue(this.dateValue).onChange((value) => {
        this.dateValue = value;
      });
      text.inputEl.type = "date";
    });

    // Stock name with autocomplete from history
    const existingNames = this.getHistoricalStockNames();

    new Setting(contentEl)
      .setName(t("modal.dividend.stockName"))
      .setDesc(t("modal.dividend.stockNameDesc"))
      .addText((text) => {
        text
          .setPlaceholder(t("modal.dividend.stockNamePlaceholder"))
          .setValue(this.stockNameValue)
          .onChange((value) => {
            this.stockNameValue = value;
          });

        // Add datalist for autocomplete
        if (existingNames.length > 0) {
          const datalistId = "finance-stock-names";
          let datalist = document.getElementById(datalistId);
          if (!datalist) {
            datalist = document.createElement("datalist");
            datalist.id = datalistId;
            document.body.appendChild(datalist);
          }
          datalist.innerHTML = "";
          existingNames.forEach((name) => {
            const option = document.createElement("option");
            option.value = name;
            datalist!.appendChild(option);
          });
          text.inputEl.setAttribute("list", datalistId);
        }
      });

    // Amount
    new Setting(contentEl)
      .setName(t("modal.dividend.amount"))
      .addText((text) => {
        text
          .setPlaceholder(t("modal.dividend.amountPlaceholder"))
          .setValue(this.amountValue)
          .onChange((value) => {
            this.amountValue = value;
          });
        text.inputEl.type = "number";
        text.inputEl.setAttribute("min", "0");
      });

    // Note
    new Setting(contentEl).setName(t("modal.dividend.note")).addText((text) => {
      text
        .setPlaceholder(t("modal.dividend.notePlaceholder"))
        .setValue(this.noteValue)
        .onChange((value) => {
          this.noteValue = value;
        });
    });

    // Submit
    new Setting(contentEl).addButton((btn) => {
      btn
        .setButtonText(t("modal.dividend.save"))
        .setCta()
        .onClick(async () => {
          await this.handleSubmit();
        });
    });
  }

  private getHistoricalStockNames(): string[] {
    const names = new Set<string>();
    this.store.getDividendRecords().forEach((r) => names.add(r.stockName));
    return Array.from(names);
  }

  private async handleSubmit(): Promise<void> {
    if (!this.dateValue) {
      new Notice(t("modal.dividend.invalidDate"));
      return;
    }

    if (!this.stockNameValue.trim()) {
      new Notice(t("modal.dividend.invalidStockName"));
      return;
    }

    const amount = parseFloat(this.amountValue);
    if (!this.amountValue || isNaN(amount) || amount <= 0) {
      new Notice(t("modal.dividend.invalidAmount"));
      return;
    }

    const record: DividendRecord = {
      id: this.existingRecord?.id ?? generateId(),
      date: this.dateValue,
      stockName: this.stockNameValue.trim(),
      amount,
      note: this.noteValue || undefined,
    };

    if (this.existingRecord) {
      await this.store.updateDividend(record);
    } else {
      await this.store.addDividend(record);
    }

    new Notice(t("modal.dividend.saved"));
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
    // Clean up datalist
    const datalist = document.getElementById("finance-stock-names");
    if (datalist) datalist.remove();
  }
}
