import { formatCents, formatPct, formatPrice } from "../../../accumulation/money";
import type { StageView } from "../../../accumulation/types";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { AccBadge } from "./accumulation-badge";

interface StageTimelineProps {
  views: StageView[];
  maskNumbers: boolean;
  onRecord: (stageOrder: number) => void;
  onSkip: (stageOrder: number) => void;
  onConfirm: (stageOrder: number) => void;
}

/**
 * 阶段时间线：纯 CSS 竖线 + 节点。
 * 计划额用虚线下划（弱），实际额加粗（强），一眼能看出「计划多少、实际打了多少」。
 */
export function StageTimeline({ views, maskNumbers, onRecord, onSkip, onConfirm }: StageTimelineProps) {
  const mask = (text: string) => (maskNumbers ? "***" : text);

  if (views.length === 0) {
    return <p className="finance-empty">{t("acc.form.err.stageEmpty")}</p>;
  }

  return (
    <div className="finance-acc-timeline">
      {views.map((view) => {
        const { stage } = view;
        const settled = view.status === "completed" || view.status === "skipped" || view.status === "voided";
        const canConfirm = stage.kind === "right" && !stage.confirmedAt && !settled;
        return (
          <div
            className="finance-acc-timeline-item"
            key={stage.order}
            data-status={view.status}
          >
            <span className="finance-acc-dot" data-status={view.status} />

            <span className="finance-acc-stage-main">
              <span className="finance-acc-stage-title">
                <span className="finance-acc-stage-label">
                  {stage.order}. {stage.label}
                </span>
                <AccBadge status={view.status} />
                {view.priceReached && view.status !== "completed" ? (
                  <span className="finance-acc-flag">{t("acc.stage.reached.yes")}</span>
                ) : null}
              </span>

              <span className="finance-acc-stage-meta">
                <span>
                  {t("acc.stage.col.trigger")} {mask(formatPrice(view.triggerPrice))}
                </span>
                {stage.triggerMode === "drop" ? (
                  <span className="finance-acc-muted">{formatPct(-stage.dropPct)}</span>
                ) : null}
                <span>
                  {t("acc.stage.col.planned")}{" "}
                  <span className="finance-acc-amount-plan">
                    {mask(formatCents(stage.plannedCents))}
                  </span>
                </span>
                <span>
                  {t("acc.stage.col.actual")}{" "}
                  <span className="finance-acc-amount-actual">
                    {mask(formatCents(view.actualCents))}
                  </span>
                </span>
                {view.lastTradeDate ? (
                  <span className="finance-acc-muted">
                    {t("acc.stage.col.tradeDate")} {view.lastTradeDate}
                  </span>
                ) : null}
                {stage.skipReason ? (
                  <span className="finance-acc-muted">{stage.skipReason}</span>
                ) : null}
              </span>
            </span>

            <span className="finance-acc-stage-actions">
              {canConfirm ? (
                <button
                  className="finance-btn-small"
                  onClick={() => onConfirm(stage.order)}
                  title={t("acc.action.markConfirmed")}
                >
                  <Icon name="check" />
                </button>
              ) : null}
              {!settled ? (
                <>
                  <button
                    className="finance-btn-small"
                    onClick={() => onRecord(stage.order)}
                    title={t("acc.detail.next.btn.trade")}
                  >
                    <Icon name="plus" />
                  </button>
                  <button
                    className="finance-btn-small"
                    onClick={() => onSkip(stage.order)}
                    title={t("acc.action.skip")}
                  >
                    <Icon name="x" />
                  </button>
                </>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
