import { useState } from "react";
import { Notice } from "obsidian";
import {
  buildCompareRows,
  buildStageViews,
  budgetCheck,
  computeDrawdown,
  computePlanMetrics,
  derivePlanStatus,
  nextAction,
} from "../../../accumulation/calc";
import { formatCents, formatPct, formatPctPlain, formatPrice } from "../../../accumulation/money";
import type {
  AccumulationPlan,
  AccumulationStage,
  AccumulationTrade,
  PlanAdjustment,
} from "../../../accumulation/types";
import type { AccumulationStore } from "../../../accumulation/store";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { DataTable, type Column } from "../data-table";
import { AccBadge } from "./accumulation-badge";
import { AccumulationCompare } from "./accumulation-compare";
import { AccumulationPriceInline } from "./accumulation-price-inline";
import { AccProgress } from "./accumulation-progress";
import { StageTimeline } from "./accumulation-stage-timeline";
import { AccumulationTrades } from "./accumulation-trades";
import { marketLabel, assetTypeLabel } from "./labels";

interface AccumulationDetailProps {
  store: AccumulationStore;
  plan: AccumulationPlan;
  maskNumbers: boolean;
  onEditPlan: (plan: AccumulationPlan) => void;
  onOpenTrade: (planId: string, trade?: AccumulationTrade) => void;
  onBack: () => void;
}

function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** 内联正文编辑：只在点「编辑」时变成 textarea，避免整页都是输入框 */
function ProseEditor({
  title,
  icon,
  value,
  onSave,
}: {
  title: string;
  icon: string;
  value: string;
  onSave: (text: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = async () => {
    await onSave(draft);
    setEditing(false);
    new Notice(t("acc.detail.textSaved"));
  };

  return (
    <div className="finance-section">
      <h2 className="finance-acc-head">
        <span>
          <Icon name={icon} />
          {title}
        </span>
        <span className="finance-acc-head-actions">
          {editing ? (
            <button className="finance-btn-small" onClick={save} title={t("acc.detail.textSave")}>
              <Icon name="check" />
            </button>
          ) : (
            <button
              className="finance-btn-small"
              onClick={() => {
                setDraft(value);
                setEditing(true);
              }}
              title={t("acc.detail.textEdit")}
            >
              <Icon name="pencil" />
            </button>
          )}
        </span>
      </h2>
      {editing ? (
        <textarea
          className="finance-acc-prose-input"
          value={draft}
          rows={6}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : value.trim() ? (
        <pre className="finance-acc-prose">{value}</pre>
      ) : (
        <p className="finance-empty">{t("acc.empty.text")}</p>
      )}
    </div>
  );
}

export function AccumulationDetail({
  store,
  plan,
  maskNumbers,
  onEditPlan,
  onOpenTrade,
  onBack,
}: AccumulationDetailProps) {
  const mask = (text: string) => (maskNumbers ? "***" : text);

  const views = buildStageViews(plan);
  const metrics = computePlanMetrics(plan);
  const budget = budgetCheck(plan);
  const next = nextAction(plan, views);
  const compareRows = buildCompareRows(plan, views);
  const drawdown = computeDrawdown(plan);
  const status = derivePlanStatus(plan, views);
  const broken = store.isBroken(plan.id);

  const stageLabelOf = (stageOrder: number | null) => {
    if (stageOrder === null) return "—";
    const stage = plan.stages.find((item) => item.order === stageOrder);
    return stage ? `${stage.order}. ${stage.label}` : `#${stageOrder}`;
  };

  const adjustStage = async (
    stageOrder: number,
    patch: Partial<AccumulationStage>,
    adjustments: PlanAdjustment[],
  ) => {
    const stages = plan.stages.map((stage) =>
      stage.order === stageOrder ? { ...stage, ...patch } : stage,
    );
    await store.updatePlan(plan.id, { stages }, adjustments);
  };

  const handleSkip = async (stageOrder: number) => {
    const reason = prompt(t("acc.action.skipPrompt")) ?? "";
    const stage = plan.stages.find((item) => item.order === stageOrder);
    await adjustStage(
      stageOrder,
      { skippedAt: todayString(), skipReason: reason },
      stage
        ? [
            {
              date: todayString(),
              stageOrder,
              field: "skipped",
              before: "pending",
              after: reason || "skipped",
              note: "",
            },
          ]
        : [],
    );
  };

  const handleConfirm = async (stageOrder: number) => {
    await adjustStage(
      stageOrder,
      { confirmedAt: todayString() },
      [
        {
          date: todayString(),
          stageOrder,
          field: "confirmedAt",
          before: "",
          after: todayString(),
          note: t("acc.action.markConfirmed"),
        },
      ],
    );
  };

  const handleArchive = async () => {
    if (!confirm(t("acc.action.archiveConfirm"))) return;
    await store.archivePlan(plan.id);
    new Notice(t("acc.action.archived"));
    onBack();
  };

  const handleDelete = async () => {
    if (!confirm(t("acc.action.deleteConfirm"))) return;
    try {
      await store.deletePlan(plan.id);
      onBack();
    } catch {
      new Notice(t("acc.action.deleteFailed"));
    }
  };

  const pnl = metrics.unrealizedPnlCents;
  const pnlClass = pnl > 0 ? "finance-up" : pnl < 0 ? "finance-down" : "";

  // 「距触发」用「低于 / 高于」而不是带符号的百分数：负号在这语境里读不出方向
  const distanceText =
    next === null || next.distancePct === null
      ? "—"
      : Math.abs(next.distancePct) < 0.005
        ? formatPct(0)
        : next.distancePct < 0
          ? t("acc.detail.next.below", { pct: `${Math.abs(next.distancePct).toFixed(2)}%` })
          : t("acc.detail.next.above", { pct: `${next.distancePct.toFixed(2)}%` });

  const metricItems: Array<{ label: string; value: string; className?: string }> = [
    { label: t("acc.detail.metric.totalBudget"), value: mask(formatCents(metrics.totalBudgetCents)) },
    { label: t("acc.detail.metric.invested"), value: mask(formatCents(metrics.investedCents)) },
    {
      label: t("acc.detail.metric.remaining"),
      value: mask(formatCents(metrics.remainingBudgetCents)),
      // 负的剩余预算 = 超投，用警示色而不是「跌绿」
      className: metrics.remainingBudgetCents < 0 ? "finance-acc-over" : undefined,
    },
    { label: t("acc.detail.metric.usage"), value: mask(formatPctPlain(metrics.usageRate, 1)) },
    { label: t("acc.detail.metric.shares"), value: mask(formatPrice(metrics.shares, 6)) },
    {
      label: t("acc.detail.metric.avgCost"),
      value: metrics.shares > 0 ? mask(formatPrice(metrics.avgCost, 3)) : "—",
    },
    {
      label: t("acc.detail.metric.price"),
      value: plan.currentPrice > 0 ? mask(formatPrice(plan.currentPrice)) : "—",
    },
    {
      label: t("acc.detail.metric.marketValue"),
      value: metrics.marketValueCents > 0 ? mask(formatCents(metrics.marketValueCents)) : "—",
    },
    { label: t("acc.detail.metric.pnl"), value: mask(formatCents(pnl, { sign: true })), className: pnlClass },
    {
      label: t("acc.detail.metric.pnlRate"),
      value: metrics.shares > 0 ? mask(formatPct(metrics.unrealizedPct)) : "—",
      className: pnlClass,
    },
  ];

  const adjustmentColumns: Column<PlanAdjustment>[] = [
    { key: "date", header: t("acc.trade.date"), excludeFromCard: true, cell: (row) => row.date },
    {
      key: "stage",
      header: t("acc.compare.col.stage"),
      cell: (row) => (row.stageOrder === 0 ? t("acc.detail.overview") : `#${row.stageOrder}`),
    },
    { key: "field", header: t("acc.compare.col.deviation"), cell: (row) => row.field },
    {
      key: "change",
      header: t("acc.detail.compare"),
      cell: (row) => `${row.before || "—"} → ${row.after || "—"}`,
    },
    { key: "note", header: t("acc.trade.note"), hideOnMobile: true, cell: (row) => row.note || "—" },
  ];

  return (
    <div className="finance-acc-module">
      <div className="finance-acc-toolbar">
        <button className="finance-acc-back" onClick={onBack}>
          <Icon name="arrow-left" />
          {t("acc.btn.back")}
        </button>
        <span className="finance-acc-toolbar-title">
          {plan.name}
          <span className="finance-holding-symbol">{plan.symbol}</span>
        </span>
        <span className="finance-acc-toolbar-actions">
          <AccBadge status={status} kind="plan" />
          <button
            className="finance-btn-small"
            onClick={() => onEditPlan(plan)}
            title={t("acc.action.editPlan")}
            disabled={broken}
          >
            <Icon name="pencil" />
          </button>
          <button
            className="finance-btn-small"
            onClick={handleArchive}
            title={t("acc.action.archive")}
            disabled={broken}
          >
            <Icon name="archive" />
          </button>
          <button
            className="finance-btn-small"
            onClick={handleDelete}
            title={t("acc.action.delete")}
          >
            <Icon name="trash-2" />
          </button>
        </span>
      </div>

      {broken ? (
        <p className="finance-acc-warning">
          <Icon name="alert-triangle" /> {t("acc.warning.broken")}
        </p>
      ) : null}

      {budget.overInvested ? (
        <p className="finance-acc-warning">{t("acc.warning.overInvested")}</p>
      ) : null}

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="gauge" />
            {t("acc.detail.overview")}
            <span className="finance-holding-symbol">
              {marketLabel(plan.market)} · {assetTypeLabel(plan.assetType)} · {plan.currency}
            </span>
          </span>
        </h2>
        <div className="finance-acc-metric-grid">
          {metricItems.map((item) => (
            <div className="finance-acc-metric" key={item.label}>
              <span className="finance-acc-metric-label">{item.label}</span>
              <span className={`finance-acc-metric-value ${item.className ?? ""}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
        <div className="finance-acc-usage">
          <AccProgress value={metrics.usageRate} over={budget.overInvested} />
          <span className="finance-acc-muted">
            {t("acc.form.unallocated")} {mask(formatCents(budget.unallocatedCents))}
          </span>
        </div>
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="target" />
            {t("acc.detail.next.title")}
          </span>
        </h2>
        {next ? (
          <div className="finance-acc-next" data-reached={next.priceReached ? "true" : undefined}>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.next.stage")}</span>
              <span className="finance-acc-metric-value">
                {next.stageOrder}. {next.label}
              </span>
            </div>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.next.trigger")}</span>
              <span className="finance-acc-metric-value">{mask(formatPrice(next.triggerPrice))}</span>
            </div>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.metric.price")}</span>
              <span className="finance-acc-metric-value">
                {plan.currentPrice > 0 ? mask(formatPrice(plan.currentPrice)) : "—"}
              </span>
            </div>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.next.distance")}</span>
              <span className="finance-acc-metric-value">{distanceText}</span>
            </div>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.next.planned")}</span>
              <span className="finance-acc-metric-value">{mask(formatCents(next.plannedCents))}</span>
            </div>
            <div className="finance-acc-next-item">
              <span className="finance-acc-metric-label">{t("acc.detail.next.remaining")}</span>
              <span className="finance-acc-metric-value">
                {mask(formatCents(next.remainingBudgetCents))}
              </span>
            </div>

            <div className="finance-acc-next-actions">
              {next.needsManualConfirm ? (
                <button
                  className="finance-btn finance-btn-cta"
                  onClick={() => handleConfirm(next.stageOrder)}
                >
                  <Icon name="check" />
                  <span className="finance-btn-label">{t("acc.detail.next.btn.confirm")}</span>
                </button>
              ) : null}
              <button
                className="finance-btn"
                onClick={() => onOpenTrade(plan.id)}
                disabled={broken}
              >
                <Icon name="plus" />
                <span className="finance-btn-label">{t("acc.detail.next.btn.trade")}</span>
              </button>
              <button
                className="finance-btn"
                onClick={() => handleSkip(next.stageOrder)}
                disabled={broken}
              >
                <Icon name="x" />
                <span className="finance-btn-label">{t("acc.detail.next.btn.skip")}</span>
              </button>
            </div>

            <p className="finance-acc-next-hint">
              {next.priceReached
                ? t("acc.detail.next.reached")
                : next.needsManualConfirm
                  ? t("acc.detail.next.confirmHint")
                  : ""}
            </p>
          </div>
        ) : (
          <p className="finance-empty">{t("acc.detail.next.none")}</p>
        )}
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="git-commit" />
            {t("acc.detail.stages")}
          </span>
        </h2>
        <StageTimeline
          views={views}
          maskNumbers={maskNumbers}
          onRecord={() => onOpenTrade(plan.id)}
          onSkip={handleSkip}
          onConfirm={handleConfirm}
        />
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="columns" />
            {t("acc.detail.compare")}
          </span>
        </h2>
        <AccumulationCompare
          rows={compareRows}
          totalBudgetCents={plan.totalBudgetCents}
          maskNumbers={maskNumbers}
        />
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="list" />
            {t("acc.detail.trades")}
          </span>
          <span className="finance-acc-head-actions">
            <button
              className="finance-btn-small"
              onClick={() => onOpenTrade(plan.id)}
              disabled={broken}
              title={t("acc.action.addTrade")}
            >
              <Icon name="plus" />
            </button>
          </span>
        </h2>
        <AccumulationTrades
          trades={store.getTrades(plan.id)}
          stageLabelOf={stageLabelOf}
          maskNumbers={maskNumbers}
          onAdd={() => onOpenTrade(plan.id)}
          onEdit={(trade) => onOpenTrade(plan.id, trade)}
          onDelete={(tradeId) => void store.deleteTrade(plan.id, tradeId)}
        />
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="trending-down" />
            {t("acc.detail.price.title")}
          </span>
          <span className="finance-acc-head-actions">
            {drawdown.incomplete ? (
              <span className="finance-acc-muted">{t("acc.warning.incomplete")}</span>
            ) : (
              <>
                <span className="finance-acc-muted">
                  {t("acc.detail.maxLoss")} {formatPct(drawdown.maxLossPct)}
                </span>
                <span className="finance-acc-muted">
                  {t("acc.detail.maxGain")} {formatPct(drawdown.maxGainPct)}
                </span>
              </>
            )}
          </span>
        </h2>
        <AccumulationPriceInline
          plan={plan}
          onSave={(date, price) => store.setPrice(plan.id, price, date)}
        />
      </div>

      <div className="finance-section">
        <h2 className="finance-acc-head">
          <span>
            <Icon name="history" />
            {t("acc.detail.adjustments")}
          </span>
        </h2>
        <DataTable
          columns={adjustmentColumns}
          rows={store.getAdjustments(plan.id)}
          rowKey={(row) => `${row.date}-${row.stageOrder}-${row.field}`}
          mobileMode="card"
          stickyLabel={false}
          emptyText={t("acc.empty.text")}
        />
      </div>

      <ProseEditor
        title={t("acc.detail.logic")}
        icon="file-text"
        value={plan.logic}
        onSave={(text) => store.setSectionText(plan.id, "logic", text)}
      />

      <ProseEditor
        title={t("acc.detail.review")}
        icon="book-open"
        value={plan.review}
        onSave={(text) => store.setSectionText(plan.id, "review", text)}
      />
    </div>
  );
}
