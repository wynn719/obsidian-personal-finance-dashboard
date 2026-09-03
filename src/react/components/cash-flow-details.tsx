import { useState } from "react";
import { formatCurrencyCompact } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { CashFlowRecord } from "../../models";
import type { CashFlowDetailsTableProps } from "../types";

type Filter = "all" | "income" | "expense";

export function CashFlowDetailsTable({
  records,
  maskNumbers,
  onEdit,
  onDelete,
}: CashFlowDetailsTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? records : records.filter((r) => r.type === filter);
  const display = filtered.slice(0, 50);

  const handleDelete = async (id: string) => {
    if (confirm(t("cashFlow.deleteConfirm"))) {
      await onDelete(id);
    }
  };

  const filterLabels: Record<Filter, string> = {
    all: t("cashFlow.filter.all"),
    income: t("cashFlow.filter.income"),
    expense: t("cashFlow.filter.expense"),
  };

  const columns: Column<CashFlowRecord>[] = [
    {
      key: "date",
      header: t("cashFlow.col.date"),
      cell: (r) => r.date.substring(5),
      excludeFromCard: true,
    },
    {
      key: "type",
      header: t("cashFlow.col.type"),
      cell: (r) => (
        <>
          <Icon name={r.type === "income" ? "trending-up" : "trending-down"} />{" "}
          {r.type === "income" ? t("cashFlow.type.income") : t("cashFlow.type.expense")}
        </>
      ),
      excludeFromCard: true,
    },
    { key: "category", header: t("cashFlow.col.category"), cell: (r) => r.category },
    {
      key: "amount",
      header: t("cashFlow.col.amount"),
      cell: (r) => (
        <span className={r.type === "income" ? "positive" : "negative"}>
          {mask(formatCurrencyCompact(r.amount))}
        </span>
      ),
      numeric: true,
    },
    {
      key: "note",
      header: t("cashFlow.col.note"),
      cell: (r) => r.note ?? "",
      className: "finance-note",
    },
  ];

  const renderCardHead = (r: CashFlowRecord) => (
    <>
      <span className="finance-dt-card-date">{r.date.substring(5)}</span>
      <span className={`finance-dt-card-type ${r.type}`}>
        <Icon name={r.type === "income" ? "trending-up" : "trending-down"} />
        {r.type === "income" ? t("cashFlow.type.income") : t("cashFlow.type.expense")}
      </span>
    </>
  );

  const actions = (r: CashFlowRecord) => (
    <>
      <button className="finance-btn-small" onClick={() => onEdit(r)}>
        <Icon name="pencil" />
      </button>
      <button className="finance-btn-small" onClick={() => handleDelete(r.id)}>
        <Icon name="trash-2" />
      </button>
    </>
  );

  return (
    <div className="finance-section finance-cashflow-section">
      <h2>
        <Icon name="clipboard-list" /> {t("cashFlow.title")}
      </h2>
      {records.length === 0 ? (
        <p className="finance-empty">{t("cashFlow.empty")}</p>
      ) : (
        <>
          <div className="finance-filter-bar">
            {(Object.keys(filterLabels) as Filter[]).map((f) => (
              <button
                key={f}
                className={`finance-filter-btn${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <DataTable
            columns={columns}
            rows={display}
            rowKey={(r) => r.id}
            mobileMode="card"
            stickyLabel={false}
            renderCardHead={renderCardHead}
            actions={actions}
            actionsHeader={t("cashFlow.col.actions")}
            emptyText={t("cashFlow.empty")}
          />
          {filtered.length > 50 && (
            <p className="finance-pagination-info">
              {t("cashFlow.showingRecords", { count: filtered.length })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
