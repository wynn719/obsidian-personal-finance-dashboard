import { useState } from "react";
import { Notice } from "obsidian";
import { StockHolding } from "../../models";
import { generateId } from "../../utils";
import { DataStore } from "../../data-store";
import { fetchQuoteName } from "../../quote-service";
import { t } from "../../i18n";
import type { HoldingFormProps } from "../types";

/**
 * 添加/编辑持仓：只需填写股票代码 + 持股数。
 * 股票名称由行情接口写入（只读展示），代码失焦时自动拉取；
 * 查不到名称则无法保存。市值在「刷新行情」时按 股数 × 现价 写回。
 */
export function HoldingForm({
  store,
  existingHolding,
  onClose,
}: HoldingFormProps) {
  const [symbol, setSymbol] = useState(existingHolding?.symbol ?? "");
  const [shares, setShares] = useState(
    existingHolding?.shares ? String(existingHolding.shares) : "",
  );
  // Existing holding: show persisted name; new entry: filled after lookup
  const [name, setName] = useState(existingHolding?.name ?? "");
  const [checking, setChecking] = useState(false);
  const [lookedUp, setLookedUp] = useState(Boolean(existingHolding?.name));

  const handleSymbolLookup = async () => {
    const code = symbol.trim();
    if (!code || checking) return;
    setChecking(true);
    try {
      const fetched = await fetchQuoteName(code);
      if (fetched) {
        setName(fetched);
        setLookedUp(true);
      } else {
        setName("");
        setLookedUp(false);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    const symbolCode = symbol.trim();
    const sharesNum = parseFloat(shares);

    if (!symbolCode) {
      new Notice(t("modal.holding.invalidSymbol"));
      return;
    }
    if (isNaN(sharesNum) || sharesNum <= 0) {
      new Notice(t("modal.holding.invalidShares"));
      return;
    }
    if (!name.trim()) {
      new Notice(t("modal.holding.symbolNotFound"));
      return;
    }

    // Keep previous quote data when symbol/shares are unchanged
    const symbolUnchanged = existingHolding?.symbol === symbolCode;
    const sharesUnchanged = existingHolding?.shares === sharesNum;

    const holding: StockHolding = {
      id: existingHolding?.id ?? generateId(),
      name: name.trim(),
      symbol: symbolCode,
      shares: sharesNum,
      amount:
        symbolUnchanged && sharesUnchanged && existingHolding
          ? existingHolding.amount
          : sharesNum * (existingHolding?.price ?? 0),
      price: symbolUnchanged ? existingHolding?.price : undefined,
      priceChangePercent: symbolUnchanged
        ? existingHolding?.priceChangePercent
        : undefined,
      quoteTime: symbolUnchanged ? existingHolding?.quoteTime : undefined,
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
        <span className="finance-field-label">
          {t("modal.holding.symbol")}
        </span>
        <input
          type="text"
          placeholder={t("modal.holding.symbolPlaceholder")}
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value);
            // Symbol changed → previous lookup result is stale
            setLookedUp(Boolean(existingHolding?.name));
          }}
          onBlur={handleSymbolLookup}
        />
        <span className="finance-field-hint">
          {checking
            ? t("modal.holding.checking")
            : t("modal.holding.symbolHint")}
        </span>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("modal.holding.name")}</span>
        <input
          type="text"
          className="finance-input-readonly"
          placeholder={checking ? t("modal.holding.checking") : ""}
          value={name}
          readOnly
        />
        {lookedUp ? null : (
          <span className="finance-field-hint">
            {t("modal.holding.nameAutoHint")}
          </span>
        )}
      </label>

      <label className="finance-field">
        <span className="finance-field-label">
          {t("modal.holding.shares")}
        </span>
        <input
          type="number"
          min="0"
          step="any"
          placeholder={t("modal.holding.sharesPlaceholder")}
          value={shares}
          onChange={(e) => setShares(e.target.value)}
        />
      </label>

      <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
        {t("modal.holding.save")}
      </button>
    </div>
  );
}
