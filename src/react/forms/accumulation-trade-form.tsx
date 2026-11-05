import { useState } from "react";
import { Notice } from "obsidian";
import { autoAmountCents } from "../../accumulation/calc";
import { formatCents, parseMoneyToCents, parseNumber } from "../../accumulation/money";
import { newTradeId, type AccumulationStore } from "../../accumulation/store";
import type { AccumulationTrade, TradeSide } from "../../accumulation/types";
import { t } from "../../i18n";
import { getCurrentDate } from "../../utils";

interface AccumulationTradeFormProps {
  store: AccumulationStore;
  planId: string;
  defaultStageOrder?: number | null;
  existingTrade?: AccumulationTrade;
  onClose: () => void;
}

/**
 * 成交记录表单。
 * 金额默认按 价格 × 数量 自动算（可手动覆盖），手续费独立输入且计入预算。
 * 成交永远不修改计划阶段本身——它只往成交表里加一笔。
 */
export function AccumulationTradeForm({
  store,
  planId,
  defaultStageOrder,
  existingTrade,
  onClose,
}: AccumulationTradeFormProps) {
  const plan = store.getPlan(planId);
  const [date, setDate] = useState(existingTrade?.date ?? getCurrentDate());
  const [stageOrder, setStageOrder] = useState<string>(
    existingTrade
      ? existingTrade.stageOrder === null
        ? ""
        : String(existingTrade.stageOrder)
      : defaultStageOrder === undefined || defaultStageOrder === null
        ? ""
        : String(defaultStageOrder),
  );
  const [side, setSide] = useState<TradeSide>(existingTrade?.side ?? "buy");
  const [price, setPrice] = useState(existingTrade ? String(existingTrade.price) : "");
  const [quantity, setQuantity] = useState(
    existingTrade ? String(existingTrade.quantity) : "",
  );
  const [amount, setAmount] = useState(
    existingTrade ? (existingTrade.amountCents / 100).toFixed(2) : "",
  );
  const [amountTouched, setAmountTouched] = useState(Boolean(existingTrade));
  const [fee, setFee] = useState(
    existingTrade ? (existingTrade.feeCents / 100).toFixed(2) : "0.00",
  );
  const [note, setNote] = useState(existingTrade?.note ?? "");

  const priceValue = parseNumber(price) ?? 0;
  const quantityValue = parseNumber(quantity) ?? 0;

  const autoAmount = () => {
    const cents = autoAmountCents(priceValue, quantityValue);
    setAmount((cents / 100).toFixed(2));
    setAmountTouched(false);
  };

  const handleSubmit = async () => {
    if (priceValue <= 0) {
      new Notice(t("acc.trade.err.price"));
      return;
    }
    if (quantityValue <= 0) {
      new Notice(t("acc.trade.err.qty"));
      return;
    }

    const amountCents =
      parseMoneyToCents(amount) ?? autoAmountCents(priceValue, quantityValue);

    const trade: AccumulationTrade = {
      id: existingTrade?.id ?? newTradeId(),
      date,
      stageOrder: stageOrder === "" ? null : Number(stageOrder),
      side,
      price: priceValue,
      quantity: quantityValue,
      amountCents,
      feeCents: parseMoneyToCents(fee) ?? 0,
      note: note.trim(),
    };

    try {
      if (existingTrade) await store.updateTrade(planId, trade);
      else await store.addTrade(planId, trade);
      new Notice(t("acc.trade.saved"));
      onClose();
    } catch (error) {
      console.error(error);
      new Notice(t("acc.err.saveFailed"));
    }
  };

  return (
    <div className="finance-modal-form finance-acc-form">
      <h2>{existingTrade ? t("acc.trade.titleEdit") : t("acc.trade.titleCreate")}</h2>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.date")}</span>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.stage")}</span>
        <select value={stageOrder} onChange={(event) => setStageOrder(event.target.value)}>
          <option value="">{t("acc.compare.unassigned")}</option>
          {plan?.stages.map((stage) => (
            <option key={stage.order} value={String(stage.order)}>
              {stage.order}. {stage.label}
            </option>
          ))}
        </select>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.side")}</span>
        <select value={side} onChange={(event) => setSide(event.target.value as TradeSide)}>
          <option value="buy">{t("acc.trade.side.buy")}</option>
          <option value="sell">{t("acc.trade.side.sell")}</option>
        </select>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.price")}</span>
        <input
          type="number"
          min="0"
          step="0.001"
          value={price}
          onChange={(event) => {
            setPrice(event.target.value);
            if (!amountTouched) {
              setAmount(((autoAmountCents(parseNumber(event.target.value) ?? 0, quantityValue)) / 100).toFixed(2));
            }
          }}
          onBlur={() => {
            if (!amountTouched) autoAmount();
          }}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.qty")}</span>
        <input
          type="number"
          min="0"
          step="0.000001"
          value={quantity}
          onChange={(event) => {
            setQuantity(event.target.value);
            if (!amountTouched) {
              setAmount(((autoAmountCents(priceValue, parseNumber(event.target.value) ?? 0)) / 100).toFixed(2));
            }
          }}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.amount")}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            setAmountTouched(true);
          }}
        />
        <span className="finance-field-hint">
          {t("acc.trade.autoAmount")} · {formatCents(autoAmountCents(priceValue, quantityValue))}
        </span>
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.fee")}</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={fee}
          onChange={(event) => setFee(event.target.value)}
        />
      </label>

      <label className="finance-field">
        <span className="finance-field-label">{t("acc.trade.note")}</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} />
      </label>

      <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
        {t("acc.form.save")}
      </button>
    </div>
  );
}
