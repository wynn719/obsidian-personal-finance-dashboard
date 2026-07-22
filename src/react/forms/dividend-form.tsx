import { useMemo, useState } from "react";
import { Notice } from "obsidian";
import { DividendRecord } from "../../models";
import { generateId, getCurrentDate } from "../../utils";
import { DataStore } from "../../data-store";
import { t } from "../../i18n";
import type { DividendFormProps } from "../types";

export function DividendForm({
  store,
  existingRecord,
  onClose,
}: DividendFormProps) {
  const [date, setDate] = useState(existingRecord?.date ?? getCurrentDate());
  const [stockName, setStockName] = useState(existingRecord?.stockName ?? "");
  const [amount, setAmount] = useState(
    existingRecord ? String(existingRecord.amount) : "",
  );
  const [note, setNote] = useState(existingRecord?.note ?? "");

  const existingNames = useMemo(() => {
    const names = new Set<string>();
    store.getDividendRecords().forEach((r) => names.add(r.stockName));
    return Array.from(names);
  }, [store]);

  const handleSubmit = async () => {
    if (!date) {
      new Notice(t("modal.dividend.invalidDate"));
      return;
    }
    if (!stockName.trim()) {
      new Notice(t("modal.dividend.invalidStockName"));
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      new Notice(t("modal.dividend.invalidAmount"));
      return;
    }

    const record: DividendRecord = {
      id: existingRecord?.id ?? generateId(),
      date,
      stockName: stockName.trim(),
      amount: amountNum,
      note: note || undefined,
    };

    if (existingRecord) {
      await store.updateDividend(record);
    } else {
      await store.addDividend(record);
    }

    new Notice(t("modal.dividend.saved"));
    onClose();
  };

  return (
    <div className="finance-modal-form">
      <h2>
        {existingRecord
          ? t("modal.dividend.titleEdit")
          : t("modal.dividend.titleAdd")}
      </h2>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.dividend.date")}</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.dividend.stockName")}</span>
        <input
          type="text"
          list="finance-stock-names"
          placeholder={t("modal.dividend.stockNamePlaceholder")}
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
        />
      </label>
      <datalist id="finance-stock-names">
        {existingNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.dividend.amount")}</span>
        <input
          type="number"
          min="0"
          placeholder={t("modal.dividend.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.dividend.note")}</span>
        <input
          type="text"
          placeholder={t("modal.dividend.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
        {t("modal.dividend.save")}
      </button>
    </div>
  );
}
