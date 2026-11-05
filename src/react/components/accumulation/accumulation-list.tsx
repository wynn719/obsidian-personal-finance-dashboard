import { formatCents, formatPct, formatPrice } from "../../../accumulation/money";
import type {
  AccAssetType,
  AccMarket,
  PlanListFilter,
  PlanListRow,
  PlanSortKey,
  PlanStatus,
} from "../../../accumulation/types";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { DataTable, type Column } from "../data-table";
import { AccBadge } from "./accumulation-badge";
import { AccProgress } from "./accumulation-progress";
import { assetTypeLabel, marketLabel } from "./labels";

interface AccumulationListProps {
  rows: PlanListRow[];
  filter: PlanListFilter;
  sortKey: PlanSortKey;
  maskNumbers: boolean;
  onFilterChange: (patch: Partial<PlanListFilter>) => void;
  onSortChange: (key: PlanSortKey) => void;
  onOpenPlan: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

const ALL = "all" as const;

const MARKETS: AccMarket[] = ["CN", "HK", "US", "OTHER"];
const ASSET_TYPES: AccAssetType[] = ["stock", "etf", "fund", "bond", "other"];
const STATUSES: PlanStatus[] = ["pending", "active", "completed", "archived"];
const SORTS: PlanSortKey[] = ["pnl", "usage", "updatedAt", "nextTrigger"];

const SORT_KEYS: Record<PlanSortKey, "acc.sort.pnl" | "acc.sort.usage" | "acc.sort.updatedAt" | "acc.sort.nextTrigger"> = {
  pnl: "acc.sort.pnl",
  usage: "acc.sort.usage",
  updatedAt: "acc.sort.updatedAt",
  nextTrigger: "acc.sort.nextTrigger",
};

const STATUS_LABEL_KEYS: Record<
  PlanStatus,
  | "acc.plan.status.pending"
  | "acc.plan.status.active"
  | "acc.plan.status.completed"
  | "acc.plan.status.archived"
> = {
  pending: "acc.plan.status.pending",
  active: "acc.plan.status.active",
  completed: "acc.plan.status.completed",
  archived: "acc.plan.status.archived",
};

export function AccumulationList({
  rows,
  filter,
  sortKey,
  maskNumbers,
  onFilterChange,
  onSortChange,
  onOpenPlan,
  onCreate,
  onBack,
}: AccumulationListProps) {
  const mask = (text: string) => (maskNumbers ? "***" : text);

  const columns: Column<PlanListRow>[] = [
    {
      key: "name",
      header: t("acc.list.col.name"),
      excludeFromCard: true,
      cell: (row) => (
        <span className="finance-holding-name">
          {row.plan.name}
          {/* 每行是不同计划，金额都是本币，所以币种必须跟着代码一起显示 */}
          <span className="finance-holding-symbol">
            {row.plan.symbol} · {row.plan.currency}
          </span>
        </span>
      ),
    },
    {
      key: "market",
      header: t("acc.list.col.market"),
      hideOnMobile: true,
      cell: (row) => marketLabel(row.plan.market),
    },
    {
      key: "assetType",
      header: t("acc.list.col.assetType"),
      hideOnMobile: true,
      cell: (row) => assetTypeLabel(row.plan.assetType),
    },
    {
      key: "price",
      header: t("acc.list.col.price"),
      numeric: true,
      hideOnMobile: true,
      cell: (row) =>
        row.plan.currentPrice > 0
          ? mask(formatPrice(row.plan.currentPrice))
          : "—",
    },
    {
      key: "avgCost",
      header: t("acc.list.col.avgCost"),
      numeric: true,
      hideOnMobile: true,
      cell: (row) => (row.metrics.shares > 0 ? mask(formatPrice(row.metrics.avgCost, 3)) : "—"),
    },
    {
      key: "invested",
      header: t("acc.list.col.invested"),
      numeric: true,
      cell: (row) => mask(formatCents(row.metrics.investedCents)),
    },
    {
      key: "remaining",
      header: t("acc.list.col.remaining"),
      numeric: true,
      hideOnMobile: true,
      cell: (row) => (
        <span className={row.metrics.remainingBudgetCents < 0 ? "finance-acc-over" : undefined}>
          {mask(formatCents(row.metrics.remainingBudgetCents))}
        </span>
      ),
    },
    {
      key: "pnl",
      header: t("acc.list.col.pnl"),
      numeric: true,
      cell: (row) => {
        const pnl = row.metrics.unrealizedPnlCents;
        const cls = pnl > 0 ? "finance-up" : pnl < 0 ? "finance-down" : "";
        return (
          <span className={cls}>
            {mask(formatCents(pnl, { sign: true }))}
            <span className="finance-acc-pnl-rate">
              {mask(formatPct(row.metrics.unrealizedPct))}
            </span>
          </span>
        );
      },
    },
    {
      key: "progress",
      header: t("acc.list.col.progress"),
      cell: (row) => (
        <span className="finance-acc-progress-cell">
          <AccProgress value={row.progressPct} />
          <span className="finance-acc-progress-text">{Math.round(row.progressPct)}%</span>
        </span>
      ),
    },
    {
      key: "next",
      header: t("acc.list.col.next"),
      numeric: true,
      cell: (row) =>
        row.next ? (
          <span
            className="finance-acc-next-price"
            data-reached={row.next.priceReached ? "true" : undefined}
          >
            {mask(formatPrice(row.next.triggerPrice))}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: t("acc.list.col.status"),
      cell: (row) => <AccBadge status={row.status} kind="plan" />,
    },
  ];

  const actions = (row: PlanListRow) => (
    <button
      className="finance-btn-small"
      onClick={() => onOpenPlan(row.plan.id)}
      title={t("acc.title")}
    >
      <Icon name="chevron-right" />
    </button>
  );

  return (
    <div className="finance-acc-module">
      <div className="finance-acc-toolbar">
        <button className="finance-acc-back" onClick={onBack}>
          <Icon name="arrow-left" />
          {t("acc.btn.back")}
        </button>
        <span className="finance-acc-toolbar-title">{t("acc.list.title")}</span>
        <button className="finance-btn finance-btn-cta" onClick={onCreate}>
          <Icon name="plus" />
          <span className="finance-btn-label">{t("acc.btn.new")}</span>
        </button>
      </div>

      <div className="finance-acc-filters">
        <span className="finance-acc-filter-group">
          <span className="finance-acc-filter-label">{t("acc.filter.market")}</span>
          <span className="finance-filter-bar">
            {[ALL, ...MARKETS].map((value) => (
              <button
                key={value}
                className={`finance-filter-btn${filter.market === value ? " active" : ""}`}
                onClick={() => onFilterChange({ market: value as AccMarket | "all" })}
              >
                {value === ALL ? t("acc.filter.all") : marketLabel(value as AccMarket)}
              </button>
            ))}
          </span>
        </span>

        <span className="finance-acc-filter-group">
          <span className="finance-acc-filter-label">{t("acc.filter.assetType")}</span>
          <span className="finance-filter-bar">
            {[ALL, ...ASSET_TYPES].map((value) => (
              <button
                key={value}
                className={`finance-filter-btn${filter.assetType === value ? " active" : ""}`}
                onClick={() => onFilterChange({ assetType: value as AccAssetType | "all" })}
              >
                {value === ALL ? t("acc.filter.all") : assetTypeLabel(value as AccAssetType)}
              </button>
            ))}
          </span>
        </span>

        <span className="finance-acc-filter-group">
          <span className="finance-acc-filter-label">{t("acc.filter.status")}</span>
          <span className="finance-filter-bar">
            {[ALL, ...STATUSES].map((value) => (
              <button
                key={value}
                className={`finance-filter-btn${filter.status === value ? " active" : ""}`}
                onClick={() => onFilterChange({ status: value as PlanStatus | "all" })}
              >
                {value === ALL ? t("acc.filter.all") : t(STATUS_LABEL_KEYS[value as PlanStatus])}
              </button>
            ))}
          </span>
        </span>

        <span className="finance-acc-filter-group">
          <span className="finance-acc-filter-label">{t("acc.sort.label")}</span>
          <span className="finance-filter-bar">
            {SORTS.map((value) => (
              <button
                key={value}
                className={`finance-filter-btn${sortKey === value ? " active" : ""}`}
                onClick={() => onSortChange(value)}
              >
                {t(SORT_KEYS[value])}
              </button>
            ))}
          </span>
        </span>
      </div>

      <div className="finance-section finance-acc-list-card">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.plan.id}
          mobileMode="card"
          stickyLabel={false}
          actions={actions}
          actionsHeader={t("acc.list.col.actions")}
          renderCardHead={(row) => (
            <span className="finance-dt-card-date">
              {row.plan.name}
              <span className="finance-holding-symbol">{row.plan.symbol}</span>
            </span>
          )}
          emptyText={t("acc.list.empty")}
        />
      </div>
    </div>
  );
}
