import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { MonthlyOverviewRow } from "../../calculator";
import type { MonthlyOverviewTableProps } from "../types";

export function MonthlyOverviewTable({
  rows,
  allCategories,
  maskNumbers,
  onEditMonth,
  onDeleteMonth,
}: MonthlyOverviewTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);

  const handleDelete = async (month: string) => {
    if (confirm(t("overview.deleteConfirm", { month }))) {
      await onDeleteMonth(month);
    }
  };

  const signClass = (v: number | null) =>
    v === null ? "" : v >= 0 ? "positive" : "negative";

  const columns: Column<MonthlyOverviewRow>[] = [
    {
      key: "month",
      header: t("overview.col.month"),
      cell: (r) => r.month.substring(5),
      excludeFromCard: true,
    },
    {
      key: "salary",
      header: t("overview.col.salary"),
      cell: (r) => mask(formatCurrencyCompact(r.salaryIncome)),
      numeric: true,
      excludeFromCard: true,
    },
    {
      key: "otherIncome",
      header: t("overview.col.otherIncome"),
      cell: (r) => mask(formatCurrencyCompact(r.otherIncome)),
      numeric: true,
      excludeFromCard: true,
    },
    ...allCategories.map((cat) => ({
      key: cat,
      header: cat,
      cell: (r: MonthlyOverviewRow) =>
        mask(formatCurrencyCompact(r.categoryAmounts[cat] ?? 0)),
      numeric: true,
      excludeFromCard: true,
    })),
    {
      key: "totalAssets",
      header: t("overview.col.totalAssets"),
      cell: (r) => mask(formatCurrencyCompact(r.totalAssets)),
      numeric: true,
    },
    {
      key: "mom",
      header: t("overview.col.momPercent"),
      cell: (r) =>
        r.momPercent !== null ? (
          <span className={signClass(r.momPercent)}>{formatPercent(r.momPercent)}</span>
        ) : (
          "-"
        ),
      numeric: true,
    },
    {
      key: "investReturn",
      header: t("overview.col.investReturn"),
      cell: (r) =>
        r.investmentReturn !== null ? (
          <span className={signClass(r.investmentReturn)}>
            {mask(formatCurrencyCompact(r.investmentReturn))}
          </span>
        ) : (
          "-"
        ),
      numeric: true,
    },
    {
      key: "note",
      header: t("overview.col.note"),
      cell: (r) => r.note,
      className: "finance-note",
      excludeFromCard: true,
    },
  ];

  const renderCardHead = (r: MonthlyOverviewRow) => (
    <span className="finance-dt-card-date">{r.month.substring(5)}</span>
  );

  const actions = (row: MonthlyOverviewRow) => (
    <>
      <button className="finance-btn-small" onClick={() => onEditMonth(row.month)}>
        <Icon name="pencil" />
      </button>
      <button className="finance-btn-small" onClick={() => handleDelete(row.month)}>
        <Icon name="trash-2" />
      </button>
    </>
  );

  return (
    <div className="finance-section finance-overview-section">
      <h2>
        <Icon name="calendar" /> {t("overview.title")}
      </h2>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.month}
        mobileMode="card"
        stickyLabel={true}
        renderCardHead={renderCardHead}
        actions={actions}
        actionsHeader={t("overview.col.actions")}
        emptyText={t("overview.empty")}
      />
    </div>
  );
}
