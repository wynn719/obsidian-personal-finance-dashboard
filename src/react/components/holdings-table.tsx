import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { StockHolding } from "../../models";
import type { HoldingsTableProps } from "../types";

/** Effective market value: shares × latest price (falls back to stored amount) */
export function holdingValue(h: StockHolding): number {
  return (h.shares ?? 0) > 0 && (h.price ?? 0) > 0
    ? h.shares * (h.price ?? 0)
    : h.amount;
}

/** Day change percent with sign, e.g. "+1.84%" / "-2.56%" */
function formatChange(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function HoldingsTable({
  holdings,
  total,
  maskNumbers,
  onEdit,
  onDelete,
  bare = false,
}: HoldingsTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);

  const handleDelete = async (id: string) => {
    if (confirm(t("holdings.deleteConfirm"))) {
      await onDelete(id);
    }
  };

  const columns: Column<StockHolding>[] = [
    {
      key: "name",
      header: t("holdings.col.name"),
      cell: (h) => (
        <span className="finance-holding-name">
          {h.name}
          <span className="finance-holding-symbol">{h.symbol}</span>
        </span>
      ),
      excludeFromCard: true,
    },
    {
      key: "price",
      header: t("holdings.col.price"),
      cell: (h) => (h.price ? mask(h.price.toFixed(2)) : "—"),
      numeric: true,
      hideOnMobile: true,
    },
    {
      key: "change",
      header: t("holdings.col.change"),
      cell: (h) => {
        if (maskNumbers) return "***";
        const pct = h.priceChangePercent;
        if (pct === undefined || pct === null) return "—";
        return (
          <span className={pct > 0 ? "finance-up" : pct < 0 ? "finance-down" : ""}>
            {formatChange(pct)}
          </span>
        );
      },
      numeric: true,
      hideOnMobile: true,
    },
    {
      key: "amount",
      header: t("holdings.col.amount"),
      cell: (h) => mask(formatCurrencyCompact(holdingValue(h))),
      numeric: true,
    },
    {
      key: "share",
      header: t("holdings.col.share"),
      cell: (h) =>
        total > 0 ? mask(formatPercent((holdingValue(h) / total) * 100)) : "—",
      numeric: true,
    },
  ];

  const renderCardHead = (h: StockHolding) => (
    <span className="finance-dt-card-date">{h.name}</span>
  );

  const actions = (h: StockHolding) => (
    <>
      <button className="finance-btn-small" onClick={() => onEdit(h)}>
        <Icon name="pencil" />
      </button>
      <button className="finance-btn-small" onClick={() => handleDelete(h.id)}>
        <Icon name="trash-2" />
      </button>
    </>
  );

  const summaryRow = (
    <>
      <td>{t("holdings.totalValue")}</td>
      <td></td>
      <td></td>
      <td className="finance-number finance-bold">
        {mask(formatCurrencyCompact(total))}
      </td>
      <td className="finance-number finance-bold">100%</td>
    </>
  );

  const cardSummary = (
    <div className="finance-dt-row">
      <span className="finance-dt-label">{t("holdings.totalValue")}</span>
      <span className="finance-dt-value finance-bold">
        {mask(formatCurrencyCompact(total))}
      </span>
    </div>
  );

  return (
    <div className={bare ? "finance-holdings-bare" : "finance-section"}>
      {bare ? null : (
        <h2>
          <Icon name="clipboard-list" /> {t("holdings.tableTitle")}
        </h2>
      )}
      <DataTable
        columns={columns}
        rows={holdings}
        rowKey={(h) => h.id}
        mobileMode="card"
        stickyLabel={false}
        renderCardHead={renderCardHead}
        actions={actions}
        actionsHeader={t("holdings.col.actions")}
        summaryRow={summaryRow}
        cardSummary={cardSummary}
        emptyText={t("holdings.empty")}
      />
    </div>
  );
}
