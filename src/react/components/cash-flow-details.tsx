import { useState } from "react";
import { formatCurrencyCompact } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
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

  return (
    <div className="finance-section">
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
          <div className="finance-table-wrapper">
            <table className="finance-table finance-table-has-actions">
              <thead>
                <tr>
                  <th>{t("cashFlow.col.date")}</th>
                  <th>{t("cashFlow.col.type")}</th>
                  <th>{t("cashFlow.col.category")}</th>
                  <th>{t("cashFlow.col.amount")}</th>
                  <th>{t("cashFlow.col.note")}</th>
                  <th>{t("cashFlow.col.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {display.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date.substring(5)}</td>
                    <td>
                      <Icon
                        name={record.type === "income" ? "trending-up" : "trending-down"}
                      />{" "}
                      {record.type === "income"
                        ? t("cashFlow.type.income")
                        : t("cashFlow.type.expense")}
                    </td>
                    <td>{record.category}</td>
                    <td
                      className={`finance-number ${
                        record.type === "income" ? "positive" : "negative"
                      }`}
                    >
                      {mask(formatCurrencyCompact(record.amount))}
                    </td>
                    <td className="finance-note">{record.note ?? ""}</td>
                    <td className="finance-table-actions-cell">
                      <button
                        className="finance-btn-small"
                        onClick={() => onEdit(record)}
                      >
                        <Icon name="pencil" />
                      </button>
                      <button
                        className="finance-btn-small"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Icon name="trash-2" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
