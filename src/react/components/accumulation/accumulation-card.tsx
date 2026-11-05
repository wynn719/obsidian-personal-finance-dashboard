import { formatCents, formatPrice } from "../../../accumulation/money";
import { resolveFxRate, sumPlansInCny, toListRow } from "../../../accumulation/calc";
import type { AccCurrency, PlanListRow } from "../../../accumulation/types";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { useAccumulationData } from "../../use-accumulation-data";
import type { AccumulationStore } from "../../../accumulation/store";
import type { FxHolding } from "../../../accumulation/calc";
import { AccProgress } from "./accumulation-progress";

interface AccumulationCardProps {
  store: AccumulationStore;
  maskNumbers: boolean;
  holdings: FxHolding[];
  fxReferenceRates: Partial<Record<AccCurrency, number>>;
  onOpenAll: () => void;
  onOpenPlan: (id: string) => void;
  onCreate: () => void;
}

/** 已触发的最靠前，其余按距触发价升序；没有下一档的排最后 */
function urgency(row: PlanListRow): number {
  if (!row.next) return Number.POSITIVE_INFINITY;
  if (row.next.priceReached) return -1;
  return row.next.distancePct ?? Number.POSITIVE_INFINITY;
}

/** 工作台里的紧凑卡片：合计投入 + 最近 3 条 + 新建/全部 */
export function AccumulationCard({
  store,
  maskNumbers,
  holdings,
  fxReferenceRates,
  onOpenAll,
  onOpenPlan,
  onCreate,
}: AccumulationCardProps) {
  const { plans } = useAccumulationData(store);
  const mask = (text: string) => (maskNumbers ? "***" : text);

  // 卡片是「正在跑的计划」的视角：已归档的只留在列表/复盘里
  const rows = plans
    .filter((plan) => !plan.archivedAt)
    .map((plan) => toListRow(plan, resolveFxRate(plan, holdings, fxReferenceRates)));
  const totals = sumPlansInCny(rows);
  const top = [...rows].sort((a, b) => urgency(a) - urgency(b)).slice(0, 3);
  const usage = totals.budgetCents > 0 ? (totals.investedCents / totals.budgetCents) * 100 : 0;

  return (
    <div className="finance-section finance-acc-card">
      <h2 className="finance-acc-head">
        <span>
          <Icon name="layers" />
          {t("acc.title")}
          <span className="finance-count-chip">{rows.length}</span>
        </span>
        <span className="finance-acc-head-actions">
          <button
            className="finance-refresh-btn"
            onClick={onCreate}
            title={t("acc.btn.new")}
            aria-label={t("acc.btn.new")}
          >
            <Icon name="plus" />
          </button>
          <button className="finance-btn-small" onClick={onOpenAll} title={t("acc.btn.all")}>
            <Icon name="list" />
          </button>
        </span>
      </h2>

      {rows.length === 0 ? (
        <p className="finance-empty">{t("acc.empty")}</p>
      ) : (
        <>
          <div className="finance-acc-total">
            <span className="finance-acc-total-label">{t("acc.card.invested")}</span>
            <span className="finance-acc-total-value">
              {mask(formatCents(totals.investedCents))}
            </span>
            <AccProgress value={usage} over={usage > 100} />
          </div>

          <ul className="finance-acc-compact">
            {top.map((row) => {
              // 卡片里一列混着多币种，统一用折算后的人民币口径，避免「HKD 和 CNY 直接比大小」
              const pnl = row.metrics.unrealizedPnlDisplayCents;
              const pnlClass = pnl > 0 ? "finance-up" : pnl < 0 ? "finance-down" : "";
              return (
                <li key={row.plan.id}>
                  <button
                    className="finance-acc-compact-row"
                    onClick={() => onOpenPlan(row.plan.id)}
                  >
                    <span className="finance-acc-row-name">
                      {row.plan.name}
                      <span className="finance-holding-symbol">{row.plan.symbol}</span>
                    </span>
                    <AccProgress value={row.progressPct} />
                    <span className={`finance-acc-row-pnl ${pnlClass}`}>
                      {mask(formatCents(pnl, { sign: true }))}
                    </span>
                    <span
                      className="finance-acc-row-sub"
                      data-reached={row.next?.priceReached ? "true" : undefined}
                    >
                      {row.next
                        ? t("acc.card.next", { price: mask(formatPrice(row.next.triggerPrice)) })
                        : t("acc.card.done")}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
