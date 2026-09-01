import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { StockHolding } from "../../models";
import type { HoldingsTableProps } from "../types";

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
      cell: (h) => h.name,
      excludeFromCard: true,
    },
    {
      key: "amount",
      header: t("holdings.col.amount"),
      cell: (h) => mask(formatCurrencyCompact(h.amount)),
      numeric: true,
    },
    {
      key: "share",
      header: t("holdings.col.share"),
      cell: (h) =>
        total > 0
          ? mask(formatPercent((h.amount / total) * 100))
          : "—",
      numeric: true,
    },
    {
      key: "note",
      header: t("holdings.col.note"),
      cell: (h) => h.note ?? "",
      className: "finance-note",
      hideOnMobile: true,
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
      <td className="finance-number finance-bold">
        {mask(formatCurrencyCompact(total))}
      </td>
      <td className="finance-number finance-bold">100%</td>
      <td></td>
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
