import { useState } from "react";
import { Notice } from "obsidian";
import { parseNumber } from "../../../accumulation/money";
import type { AccumulationPlan } from "../../../accumulation/types";
import { t } from "../../../i18n";
import { getCurrentDate } from "../../../utils";

interface AccumulationPriceInlineProps {
  plan: AccumulationPlan;
  onSave: (date: string, price: number) => Promise<void>;
}

/**
 * 内联改价：不弹窗。
 * 第一版不接行情 API，价格全靠手动录入，所以要让它「一步就能改」。
 */
export function AccumulationPriceInline({ plan, onSave }: AccumulationPriceInlineProps) {
  const [date, setDate] = useState(plan.priceUpdatedAt ?? getCurrentDate());
  const [price, setPrice] = useState(plan.currentPrice > 0 ? String(plan.currentPrice) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const value = parseNumber(price);
    if (value === null || value <= 0) {
      new Notice(t("acc.trade.err.price"));
      return;
    }
    setSaving(true);
    try {
      await onSave(date, value);
      new Notice(t("acc.detail.price.saved"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="finance-acc-price">
      <label className="finance-field finance-acc-price-field">
        <span className="finance-field-label">{t("acc.detail.price.date")}</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>
      <label className="finance-field finance-acc-price-field">
        <span className="finance-field-label">{t("acc.detail.price.value")}</span>
        <input
          type="number"
          step="0.001"
          min="0"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <button
        className="finance-btn finance-btn-cta"
        onClick={handleSave}
        disabled={saving}
      >
        {t("acc.detail.price.save")}
      </button>
      <span className="finance-acc-muted finance-acc-price-hint">
        {/* 少于两个价格点才算不出回撤，够数就不提示，免得显示「3/2」这种怪东西 */}
        {plan.prices.length < 2
          ? `${t("acc.warning.incomplete")} · ${plan.prices.length}/2`
          : ""}
      </span>
    </div>
  );
}
