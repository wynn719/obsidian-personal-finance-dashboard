import { useState } from "react";
import { Notice } from "obsidian";
import { CashFlowRecord, CashFlowType, FinanceSettings } from "../../models";
import { generateId, getCurrentDate } from "../../utils";
import { DataStore } from "../../data-store";
import { t } from "../../i18n";
import type { CashFlowFormProps } from "../types";

export function CashFlowForm({
  store,
  settings,
  defaultType,
  existingRecord,
  onClose,
}: CashFlowFormProps) {
  const [type, setType] = useState<CashFlowType>(
    existingRecord?.type ?? defaultType,
  );
  const [date, setDate] = useState(existingRecord?.date ?? getCurrentDate());
  const [amount, setAmount] = useState(
    existingRecord ? String(existingRecord.amount) : "",
  );
  const [category, setCategory] = useState(existingRecord?.category ?? "");
  const [note, setNote] = useState(existingRecord?.note ?? "");

  const categories =
    type === "income" ? settings.incomeCategories : settings.expenseCategories;

  const handleTypeChange = (value: CashFlowType) => {
    setType(value);
    setCategory("");
  };

  const handleSubmit = async () => {
    if (!date) {
      new Notice(t("modal.cashFlow.invalidDate"));
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      new Notice(t("modal.cashFlow.invalidAmount"));
      return;
    }
    if (!category) {
      new Notice(t("modal.cashFlow.invalidCategory"));
      return;
    }

    const record: CashFlowRecord = {
      id: existingRecord?.id ?? generateId(),
      type,
      date,
      amount: amountNum,
      category,
      note: note || undefined,
    };

    if (existingRecord) {
      await store.updateCashFlow(record);
    } else {
      await store.addCashFlow(record);
    }

    new Notice(
      type === "income"
        ? t("modal.cashFlow.savedIncome")
        : t("modal.cashFlow.savedExpense"),
    );
    onClose();
  };

  return (
    <div className="finance-modal-form">
      <h2>
        {existingRecord
          ? t("modal.cashFlow.titleEdit")
          : t("modal.cashFlow.titleAdd")}
      </h2>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.cashFlow.type")}</span>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value as CashFlowType)}
        >
          <option value="income">{t("modal.cashFlow.typeIncome")}</option>
          <option value="expense">{t("modal.cashFlow.typeExpense")}</option>
        </select>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.cashFlow.date")}</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.cashFlow.amount")}</span>
        <input
          type="number"
          min="0"
          placeholder={t("modal.cashFlow.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.cashFlow.category")}</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t("modal.cashFlow.categorySelect")}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.cashFlow.note")}</span>
        <input
          type="text"
          placeholder={t("modal.cashFlow.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
        {t("modal.cashFlow.save")}
      </button>
    </div>
  );
}
