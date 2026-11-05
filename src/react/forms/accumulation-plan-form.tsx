import { useMemo, useState } from "react";
import { Notice } from "obsidian";
import { computeTriggerPrice } from "../../accumulation/calc";
import { formatCents, formatPct, formatPctPlain, formatPrice, parseMoneyToCents, parseNumber } from "../../accumulation/money";
import { applyAmountMode, buildTemplateStages, deployableCents, stageLabel } from "../../accumulation/template";
import type {
  AccAssetType,
  AccCurrency,
  AccMarket,
  AccumulationPlan,
  AccumulationStage,
  AmountMode,
  PlanAdjustment,
  StageKind,
  TriggerMode,
} from "../../accumulation/types";
import type { AccumulationStore } from "../../accumulation/store";
import { t } from "../../i18n";
import { getCurrentDate } from "../../utils";
import { Icon } from "../icon";

interface AccumulationPlanFormProps {
  store: AccumulationStore;
  existingPlan?: AccumulationPlan;
  onClose: () => void;
}

interface StageDraft {
  key: string;
  /** 持久化的阶段序号：删除中间某档后保留原编号，成交记录才不会串档 */
  order: number;
  kind: StageKind;
  triggerMode: TriggerMode;
  dropPct: string;
  targetPrice: string;
  planned: string;
  requiresConfirm: boolean;
}

const MARKETS: AccMarket[] = ["CN", "HK", "US", "OTHER"];
const ASSET_TYPES: AccAssetType[] = ["stock", "etf", "fund", "bond", "other"];
const CURRENCIES: AccCurrency[] = ["CNY", "HKD", "USD"];
const AMOUNT_MODES: AmountMode[] = ["custom", "fixed", "ladder"];

function todayString(): string {
  return getCurrentDate();
}

function draftFromStage(stage: AccumulationStage): StageDraft {
  return {
    key: `s${stage.order}-${Math.random().toString(36).slice(2, 6)}`,
    order: stage.order,
    kind: stage.kind,
    triggerMode: stage.triggerMode,
    dropPct: String(stage.dropPct),
    targetPrice: stage.targetPrice !== undefined ? String(stage.targetPrice) : "",
    planned: (stage.plannedCents / 100).toFixed(2),
    requiresConfirm: stage.requiresConfirm,
  };
}

export function AccumulationPlanForm({ store, existingPlan, onClose }: AccumulationPlanFormProps) {
  const [name, setName] = useState(existingPlan?.name ?? "");
  const [symbol, setSymbol] = useState(existingPlan?.symbol ?? "");
  const [market, setMarket] = useState<AccMarket>(existingPlan?.market ?? "CN");
  const [assetType, setAssetType] = useState<AccAssetType>(existingPlan?.assetType ?? "etf");
  const [currency, setCurrency] = useState<AccCurrency>(existingPlan?.currency ?? "CNY");
  const [createdAt, setCreatedAt] = useState(existingPlan?.createdAt ?? todayString());
  const [totalBudget, setTotalBudget] = useState(
    existingPlan ? (existingPlan.totalBudgetCents / 100).toFixed(2) : "125000.00",
  );
  const [referencePrice, setReferencePrice] = useState(
    existingPlan ? String(existingPlan.referencePrice) : "",
  );
  const [currentPrice, setCurrentPrice] = useState(
    existingPlan ? String(existingPlan.currentPrice) : "",
  );
  const [reserveRatio, setReserveRatio] = useState(
    existingPlan ? String(existingPlan.reserveRatio) : "0",
  );
  const [amountMode, setAmountMode] = useState<AmountMode>(existingPlan?.amountMode ?? "custom");
  const [requireConfirmDefault, setRequireConfirmDefault] = useState(
    existingPlan?.requireConfirmDefault ?? true,
  );
  const [logic, setLogic] = useState(existingPlan?.logic ?? "");
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(
    existingPlan?.stages[0]?.triggerMode ?? "drop",
  );
  const [drafts, setDrafts] = useState<StageDraft[]>(
    existingPlan ? existingPlan.stages.map(draftFromStage) : [],
  );

  // 已经有过成交的阶段不允许改参数：历史不能被新计划覆盖
  const lockedOrders = useMemo(() => {
    if (!existingPlan) return new Set<number>();
    const traded = new Set(
      existingPlan.trades
        .map((trade) => trade.stageOrder)
        .filter((order): order is number => typeof order === "number"),
    );
    return new Set(
      existingPlan.stages.filter((stage) => traded.has(stage.order)).map((stage) => stage.order),
    );
  }, [existingPlan]);

  const budgetCents = parseMoneyToCents(totalBudget) ?? 0;
  const refPrice = parseNumber(referencePrice) ?? 0;
  const reserve = parseNumber(reserveRatio) ?? 0;
  const deployable = deployableCents(budgetCents, reserve);

  const plannedValues = drafts.map((draft) => parseMoneyToCents(draft.planned) ?? 0);
  const allocated = plannedValues.reduce((sum, value) => sum + value, 0);
  const unallocated = deployable - allocated;
  const overBudget = allocated > deployable;

  const toStages = (): AccumulationStage[] =>
    [...drafts]
      .sort((a, b) => a.order - b.order)
      .map((draft) => {
      const dropPct = parseNumber(draft.dropPct) ?? 0;
      const target = parseNumber(draft.targetPrice);
      return {
        order: draft.order,
        label: stageLabel(draft.kind, dropPct, draft.order),
        kind: draft.kind,
        triggerMode: draft.triggerMode,
        anchorPrice: refPrice,
        dropPct,
        targetPrice: target !== null && target > 0 ? target : undefined,
        plannedCents: parseMoneyToCents(draft.planned) ?? 0,
        requiresConfirm: draft.kind === "right" ? true : draft.requiresConfirm,
      };
    });

  const patchDraft = (key: string, patch: Partial<StageDraft>) => {
    setDrafts((prev) => prev.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  };

  const handleTemplate = () => {
    if (refPrice <= 0) {
      new Notice(t("acc.form.err.refPrice"));
      return;
    }
    setDrafts(buildTemplateStages(deployable > 0 ? deployable : budgetCents, refPrice).map(draftFromStage));
    setAmountMode("custom");
  };

  const handleTriggerMode = (mode: TriggerMode) => {
    setTriggerMode(mode);
    setDrafts((prev) =>
      prev.map((draft) => {
        if (mode === "target") {
          const dropPct = parseNumber(draft.dropPct) ?? 0;
          const explicit = parseNumber(draft.targetPrice);
          const target =
            explicit !== null && explicit > 0 ? explicit : Math.round(refPrice * (1 - dropPct / 100) * 10000) / 10000;
          return { ...draft, triggerMode: mode, targetPrice: String(target) };
        }
        const target = parseNumber(draft.targetPrice);
        const dropPct =
          target !== null && target > 0 && refPrice > 0
            ? Math.round(((refPrice - target) / refPrice) * 10000) / 100
            : parseNumber(draft.dropPct) ?? 0;
        return {
          ...draft,
          triggerMode: mode,
          dropPct: String(Math.max(0, Math.min(100, dropPct))),
        };
      }),
    );
  };

  const handleAmountMode = (mode: AmountMode) => {
    setAmountMode(mode);
    if (mode === "custom") return;
    const computed = applyAmountMode(toStages(), mode, deployable > 0 ? deployable : budgetCents);
    // 用 order 对齐，不用下标：草稿的顺序可能和持久化顺序不同
    const byOrder = new Map(computed.map((stage) => [stage.order, stage]));
    setDrafts((prev) =>
      prev.map((draft) => ({
        ...draft,
        planned: ((byOrder.get(draft.order)?.plannedCents ?? 0) / 100).toFixed(2),
      })),
    );
  };

  const handleAddStage = () => {
    setDrafts((prev) => {
      const last = prev[prev.length - 1];
      const nextDrop = last ? (parseNumber(last.dropPct) ?? 0) + 10 : 0;
      const maxOrder = prev.reduce((max, draft) => Math.max(max, draft.order), 0);
      return [
        ...prev,
        {
          key: `s-new-${Date.now()}`,
          order: maxOrder + 1,
          kind: prev.length === 0 ? "first" : "left",
          triggerMode,
          dropPct: String(Math.min(95, nextDrop)),
          targetPrice: "",
          planned: "0.00",
          requiresConfirm: requireConfirmDefault,
        },
      ];
    });
  };

  const handleRemoveStage = (key: string) => {
    const target = drafts.find((draft) => draft.key === key);
    if (!target) return;
    if (lockedOrders.has(target.order)) {
      new Notice(t("acc.err.brokenPlan"));
      return;
    }
    setDrafts((prev) => prev.filter((draft) => draft.key !== key));
  };

  const buildAdjustments = (stages: AccumulationStage[]): PlanAdjustment[] => {
    if (!existingPlan) return [];
    const result: PlanAdjustment[] = [];
    const date = todayString();
    for (const stage of stages) {
      const before = existingPlan.stages.find((item) => item.order === stage.order);
      if (!before) continue;
      if (before.plannedCents !== stage.plannedCents) {
        result.push({
          date,
          stageOrder: stage.order,
          field: "planned",
          before: formatCents(before.plannedCents),
          after: formatCents(stage.plannedCents),
          note: "",
        });
      }
      if (before.dropPct !== stage.dropPct) {
        result.push({
          date,
          stageOrder: stage.order,
          field: "dropPct",
          before: formatPct(-before.dropPct),
          after: formatPct(-stage.dropPct),
          note: "",
        });
      }
      if ((before.targetPrice ?? 0) !== (stage.targetPrice ?? 0)) {
        result.push({
          date,
          stageOrder: stage.order,
          field: "targetPrice",
          before: before.targetPrice !== undefined ? String(before.targetPrice) : "",
          after: stage.targetPrice !== undefined ? String(stage.targetPrice) : "",
          note: "",
        });
      }
    }
    if (existingPlan.totalBudgetCents !== budgetCents) {
      result.push({
        date,
        stageOrder: 0,
        field: "totalBudget",
        before: formatCents(existingPlan.totalBudgetCents),
        after: formatCents(budgetCents),
        note: "",
      });
    }
    return result;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      new Notice(t("acc.form.err.name"));
      return;
    }
    if (!symbol.trim()) {
      new Notice(t("acc.form.err.symbol"));
      return;
    }
    if (budgetCents <= 0) {
      new Notice(t("acc.form.err.budget"));
      return;
    }
    if (refPrice <= 0) {
      new Notice(t("acc.form.err.refPrice"));
      return;
    }
    if (drafts.length === 0) {
      new Notice(t("acc.form.err.stageEmpty"));
      return;
    }
    if (plannedValues.some((value) => value < 0)) {
      new Notice(t("acc.form.err.stageAmount"));
      return;
    }
    if (overBudget && !confirm(t("acc.form.overBudgetConfirm"))) return;

    const stages = toStages();
    const current = parseNumber(currentPrice) ?? 0;

    try {
      if (existingPlan) {
        await store.updatePlan(
          existingPlan.id,
          {
            name: name.trim(),
            symbol: symbol.trim(),
            market,
            assetType,
            currency,
            totalBudgetCents: budgetCents,
            referencePrice: refPrice,
            currentPrice: current,
            priceUpdatedAt: current > 0 ? existingPlan.priceUpdatedAt ?? todayString() : undefined,
            reserveRatio: reserve,
            amountMode,
            requireConfirmDefault,
            logic,
            stages,
          },
          buildAdjustments(stages),
        );
      } else {
        await store.createPlan({
          name: name.trim(),
          symbol: symbol.trim(),
          market,
          assetType,
          currency,
          createdAt,
          totalBudgetCents: budgetCents,
          referencePrice: refPrice,
          currentPrice: current,
          reserveRatio: reserve,
          amountMode,
          requireConfirmDefault,
          logic,
          stages,
        });
      }
      new Notice(t("acc.form.saved"));
      onClose();
    } catch (error) {
      console.error(error);
      new Notice(t("acc.err.saveFailed"));
    }
  };

  return (
    <div className="finance-modal-form finance-acc-form">
      <h2>
        {existingPlan ? t("acc.form.titleEdit") : t("acc.form.titleCreate")}
      </h2>

      <h3 className="finance-acc-form-section">{t("acc.form.section.basic")}</h3>
      <div className="finance-acc-form-grid">
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.name")}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.symbol")}</span>
          <input value={symbol} onChange={(event) => setSymbol(event.target.value)} />
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.market")}</span>
          <select value={market} onChange={(event) => setMarket(event.target.value as AccMarket)}>
            {MARKETS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.assetType")}</span>
          <select
            value={assetType}
            onChange={(event) => setAssetType(event.target.value as AccAssetType)}
          >
            {ASSET_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.currency")}</span>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value as AccCurrency)}
          >
            {CURRENCIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.createdAt")}</span>
          <input
            type="date"
            value={createdAt}
            onChange={(event) => setCreatedAt(event.target.value)}
          />
        </label>
      </div>

      <h3 className="finance-acc-form-section">{t("acc.form.section.budget")}</h3>
      <div className="finance-acc-form-grid">
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.totalBudget")}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={totalBudget}
            onChange={(event) => setTotalBudget(event.target.value)}
          />
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.refPrice")}</span>
          <input
            type="number"
            min="0"
            step="0.001"
            value={referencePrice}
            onChange={(event) => setReferencePrice(event.target.value)}
          />
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.currentPrice")}</span>
          <input
            type="number"
            min="0"
            step="0.001"
            value={currentPrice}
            onChange={(event) => setCurrentPrice(event.target.value)}
          />
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.reserveRatio")}</span>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={reserveRatio}
            onChange={(event) => setReserveRatio(event.target.value)}
          />
        </label>
      </div>

      <div className="finance-acc-budget">
        <span>
          {t("acc.form.deployable")} <strong>{formatCents(deployable)}</strong>
        </span>
        <span>
          {t("acc.form.allocated")} <strong>{formatCents(allocated)}</strong>
        </span>
        <span className={unallocated < 0 ? "finance-down" : undefined}>
          {t("acc.form.unallocated")} <strong>{formatCents(unallocated)}</strong>
        </span>
      </div>
      {overBudget ? (
        <p className="finance-acc-warning">{t("acc.warning.overBudget")}</p>
      ) : null}

      <h3 className="finance-acc-form-section">{t("acc.form.section.strategy")}</h3>
      <div className="finance-acc-form-grid">
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.triggerMode")}</span>
          <select
            value={triggerMode}
            onChange={(event) => handleTriggerMode(event.target.value as TriggerMode)}
          >
            <option value="drop">{t("acc.stage.mode.drop")}</option>
            <option value="target">{t("acc.stage.mode.target")}</option>
          </select>
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.amountMode")}</span>
          <select
            value={amountMode}
            onChange={(event) => handleAmountMode(event.target.value as AmountMode)}
          >
            {AMOUNT_MODES.map((value) => (
              <option key={value} value={value}>
                {t(
                  value === "fixed"
                    ? "acc.form.amountMode.fixed"
                    : value === "ladder"
                      ? "acc.form.amountMode.ladder"
                      : "acc.form.amountMode.custom",
                )}
              </option>
            ))}
          </select>
        </label>
        <label className="finance-field">
          <span className="finance-field-label">{t("acc.form.requireConfirm")}</span>
          <input
            type="checkbox"
            checked={requireConfirmDefault}
            onChange={(event) => setRequireConfirmDefault(event.target.checked)}
          />
        </label>
      </div>

      <div className="finance-acc-stage-toolbar">
        <span className="finance-acc-muted">{t("acc.form.templateHint")}</span>
        <span className="finance-acc-head-actions">
          <button className="finance-btn" onClick={handleTemplate}>
            <Icon name="wand-2" />
            <span className="finance-btn-label">{t("acc.form.template")}</span>
          </button>
          <button className="finance-btn" onClick={handleAddStage}>
            <Icon name="plus" />
            <span className="finance-btn-label">{t("acc.form.stage.add")}</span>
          </button>
        </span>
      </div>

      <div className="finance-acc-stage-editor">
        <div className="finance-acc-stage-editor-head">
          <span>#</span>
          <span>{t("acc.form.stage.drop")}</span>
          <span>{t("acc.form.stage.target")}</span>
          <span>{t("acc.form.stage.planned")}</span>
          <span>{t("acc.form.stageRatio")}</span>
          <span></span>
        </div>
        {[...drafts]
          .sort((a, b) => a.order - b.order)
          .map((draft) => {
          const locked = lockedOrders.has(draft.order);
          const planned = parseMoneyToCents(draft.planned) ?? 0;
          const ratio = deployable > 0 ? (planned / deployable) * 100 : 0;
          const preview = computeTriggerPrice({
            order: draft.order,
            label: "",
            kind: draft.kind,
            triggerMode: draft.triggerMode,
            anchorPrice: refPrice,
            dropPct: parseNumber(draft.dropPct) ?? 0,
            targetPrice: parseNumber(draft.targetPrice) ?? undefined,
            plannedCents: planned,
            requiresConfirm: draft.requiresConfirm,
          });
          return (
            <div className="finance-acc-stage-editor-row" key={draft.key} data-locked={locked ? "true" : undefined}>
              <span className="finance-acc-stage-order">
                {draft.order}
                <span className="finance-acc-muted">
                  {" "}
                  {t("acc.stage.col.trigger")} {preview > 0 ? formatPrice(preview) : "—"}
                </span>
              </span>
              <input
                type="number"
                step="0.5"
                disabled={locked}
                value={draft.dropPct}
                onChange={(event) => patchDraft(draft.key, { dropPct: event.target.value })}
              />
              <input
                type="number"
                step="0.001"
                disabled={locked}
                value={draft.targetPrice}
                placeholder="—"
                onChange={(event) => patchDraft(draft.key, { targetPrice: event.target.value })}
              />
              <input
                type="number"
                step="0.01"
                disabled={locked}
                value={draft.planned}
                onChange={(event) => patchDraft(draft.key, { planned: event.target.value })}
              />
              <span className="finance-acc-stage-preview">{formatPctPlain(ratio, 1)}</span>
              <button
                className="finance-btn-small"
                disabled={locked}
                onClick={() => handleRemoveStage(draft.key)}
                title={t("acc.form.stage.remove")}
              >
                <Icon name="trash-2" />
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="finance-acc-form-section">{t("acc.form.section.text")}</h3>
      <label className="finance-field">
        <span className="finance-field-label">{t("acc.form.logic")}</span>
        <textarea rows={4} value={logic} onChange={(event) => setLogic(event.target.value)} />
      </label>

      <div className="finance-acc-form-actions">
        <button className="finance-btn" onClick={onClose}>
          {t("acc.form.cancel")}
        </button>
        <button className="finance-btn finance-btn-cta" onClick={handleSubmit}>
          {t("acc.form.save")}
        </button>
      </div>
    </div>
  );
}
