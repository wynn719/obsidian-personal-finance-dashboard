import { useMemo, useState } from "react";
import { Notice } from "obsidian";
import { StockHolding } from "../../models";
import { generateId } from "../../utils";
import { DataStore } from "../../data-store";
import { t } from "../../i18n";
import type { HoldingFormProps } from "../types";

export function HoldingForm({
  store,
  existingHolding,
  onClose,
}: HoldingFormProps) {
  const [name, setName] = useState(existingHolding?.name ?? "");
  const [amount, setAmount] = useState(
    existingHolding ? String(existingHolding.amount) : "",
  );
  const [note, setNote] = useState(existingHolding?.note ?? "");

  const existingNames = useMemo(() => {
    const names = new Set<string>();
    store.getHoldings().forEach((h) => names.add(h.name));
    return Array.from(names);
  }, [store]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      new Notice(t("modal.holding.invalidName"));
      return;
    }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      new Notice(t("modal.holding.invalidAmount"));
      return;
    }

    const holding: StockHolding = {
      id: existingHolding?.id ?? generateId(),
      name: name.trim(),
      amount: amountNum,
      note: note || undefined,
    };

    if (existingHolding) {
      await store.updateHolding(holding);
    } else {
      await store.addHolding(holding);
    }

    new Notice(t("modal.holding.saved"));
    onClose();
  };

  return (
    <div className="finance-modal-form">
      <h2>
        {existingHolding
          ? t("modal.holding.titleEdit")
          : t("modal.holding.titleAdd")}
      </h2>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.holding.name")}</span>
        <input
          type="text"
          list="finance-holding-names"
          placeholder={t("modal.holding.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <datalist id="finance-holding-names">
        {existingNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.holding.amount")}</span>
        <input
          type="number"
          min="0"
          step="any"
          placeholder={t("modal.holding.amountPlaceholder")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.holding.note")}</span>
        <input
          type="text"
          placeholder={t("modal.holding.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
        {t("modal.holding.save")}
      </button>
    </div>
  );
}
