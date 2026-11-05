import { useState } from "react";
import {
  filterPlanRows,
  resolveFxRate,
  sortPlanRows,
  toListRow,
} from "../../../accumulation/calc";
import type { FxHolding } from "../../../accumulation/calc";
import type {
  AccCurrency,
  AccumulationPlan,
  AccumulationTrade,
  PlanListFilter,
  PlanSortKey,
} from "../../../accumulation/types";
import type { AccumulationStore } from "../../../accumulation/store";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { useAccumulationData } from "../../use-accumulation-data";
import { AccumulationDetail } from "./accumulation-detail";
import { AccumulationList } from "./accumulation-list";

export type AccScreen = { kind: "list" } | { kind: "detail"; planId: string };

interface AccumulationModuleProps {
  store: AccumulationStore;
  screen: AccScreen;
  maskNumbers: boolean;
  holdings: FxHolding[];
  fxReferenceRates: Partial<Record<AccCurrency, number>>;
  onNavigate: (screen: AccScreen) => void;
  onBack: () => void;
  onEditPlan: (plan: AccumulationPlan) => void;
  onOpenTrade: (planId: string, trade?: AccumulationTrade) => void;
  onCreate: () => void;
}

/**
 * 建仓视图容器：列表 / 详情。
 * 筛选与排序状态放在这一层——从详情返回列表时不丢用户刚选的过滤条件。
 */
export function AccumulationModule({
  store,
  screen,
  maskNumbers,
  holdings,
  fxReferenceRates,
  onNavigate,
  onBack,
  onEditPlan,
  onOpenTrade,
  onCreate,
}: AccumulationModuleProps) {
  const { plans, brokenPlans } = useAccumulationData(store);
  const [filter, setFilter] = useState<PlanListFilter>({
    market: "all",
    assetType: "all",
    status: "all",
  });
  const [sortKey, setSortKey] = useState<PlanSortKey>("nextTrigger");

  const rows = sortPlanRows(
    filterPlanRows(
      plans.map((plan) => toListRow(plan, resolveFxRate(plan, holdings, fxReferenceRates))),
      filter,
    ),
    sortKey,
    sortKey === "updatedAt" ? "desc" : "asc",
  );

  if (screen.kind === "detail") {
    const plan = store.getPlan(screen.planId);
    if (!plan) {
      return (
        <div className="finance-acc-module">
          <p className="finance-empty">{t("acc.list.empty")}</p>
          <button className="finance-btn" onClick={onBack}>
            <Icon name="arrow-left" />
            <span className="finance-btn-label">{t("acc.btn.back")}</span>
          </button>
        </div>
      );
    }
    return (
      <AccumulationDetail
        store={store}
        plan={plan}
        maskNumbers={maskNumbers}
        onEditPlan={onEditPlan}
        onOpenTrade={onOpenTrade}
        onBack={() => onNavigate({ kind: "list" })}
      />
    );
  }

  return (
    <>
      <AccumulationList
        rows={rows}
        filter={filter}
        sortKey={sortKey}
        maskNumbers={maskNumbers}
        onFilterChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        onSortChange={setSortKey}
        onOpenPlan={(planId) => onNavigate({ kind: "detail", planId })}
        onCreate={onCreate}
        onBack={onBack}
      />

      {brokenPlans.length > 0 ? (
        <div className="finance-acc-warning finance-acc-broken-list">
          <span>
            <Icon name="alert-triangle" /> {t("acc.warning.broken")}
          </span>
          <ul>
            {brokenPlans.map((item) => (
              <li key={item.path}>
                <button
                  className="finance-btn-small"
                  onClick={() => void store.openPath(item.path)}
                  title={t("acc.action.openFile")}
                >
                  {item.path}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
