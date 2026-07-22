import { useState } from "react";
import { Notice } from "obsidian";
import { AssetSnapshot, CategoryAmount, FinanceSettings } from "../../models";
import { generateId, getCurrentMonth } from "../../utils";
import { DataStore } from "../../data-store";
import { t } from "../../i18n";
import type { AssetSnapshotFormProps } from "../types";

interface CatData {
  amount: string;
  details: string;
}

export function AssetSnapshotForm({
  store,
  settings,
  existingSnapshot,
  onClose,
}: AssetSnapshotFormProps) {
  const [month, setMonth] = useState(
    existingSnapshot?.month ?? getCurrentMonth(),
  );
  const [note, setNote] = useState(existingSnapshot?.note ?? "");
  const [categoryAmounts, setCategoryAmounts] = useState<Record<string, CatData>>(
    () => {
      const init: Record<string, CatData> = {};
      settings.assetCategories.forEach((cat) => {
        const existing = existingSnapshot?.categories.find(
          (c) => c.category === cat,
        );
        init[cat] = {
          amount: existing ? String(existing.amount) : "",
          details: existing?.details ?? "",
        };
      });
      return init;
    },
  );

  const updateCat = (cat: string, field: keyof CatData, value: string) => {
    setCategoryAmounts((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [field]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      new Notice(t("modal.snapshot.invalidMonth"));
      return;
    }

    const categories: CategoryAmount[] = [];
    let totalAssets = 0;
    for (const cat of settings.assetCategories) {
      const data = categoryAmounts[cat];
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

    if (!existingSnapshot) {
      const existing = store.getSnapshotByMonth(month);
      if (existing) {
        if (!confirm(t("modal.snapshot.overwriteConfirm", { month }))) return;
      }
    }

    const snapshot: AssetSnapshot = {
      id: existingSnapshot?.id ?? generateId(),
      month,
      categories,
      totalAssets,
      note: note || undefined,
    };

    await store.addOrUpdateSnapshot(snapshot);
    new Notice(t("modal.snapshot.saved", { month }));
    onClose();
  };

  return (
    <div className="finance-modal-form">
      <h2>
        {existingSnapshot
          ? t("modal.snapshot.titleEdit")
          : t("modal.snapshot.titleAdd")}
      </h2>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.snapshot.month")}</span>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </label>

      <h3>{t("modal.snapshot.categories")}</h3>
      {settings.assetCategories.map((cat) => {
        const data = categoryAmounts[cat];
        return (
          <div key={cat} className="finance-field-row">
            <span className="finance-field-label">{cat}</span>
            <input
              type="number"
              placeholder={t("modal.cashFlow.amount")}
              value={data.amount}
              onChange={(e) => updateCat(cat, "amount", e.target.value)}
            />
            <input
              type="text"
              placeholder={t("modal.snapshot.detailsPlaceholder")}
              value={data.details}
              onChange={(e) => updateCat(cat, "details", e.target.value)}
            />
          </div>
        );
      })}

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.snapshot.note")}</span>
        <input
          type="text"
          placeholder={t("modal.snapshot.notePlaceholder")}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <button
        className="finance-btn finance-btn-cta"
        onClick={handleSubmit}
      >
        {t("modal.snapshot.save")}
      </button>
    </div>
  );
}
