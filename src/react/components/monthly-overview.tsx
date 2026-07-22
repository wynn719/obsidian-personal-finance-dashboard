import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import type { MonthlyOverviewTableProps } from "../types";

export function MonthlyOverviewTable({
  rows,
  allCategories,
  maskNumbers,
  onEditMonth,
  onDeleteMonth,
}: MonthlyOverviewTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);

  const headers = [
    t("overview.col.month"),
    t("overview.col.salary"),
    t("overview.col.otherIncome"),
    ...allCategories,
    t("overview.col.totalAssets"),
    t("overview.col.momPercent"),
    t("overview.col.investReturn"),
    t("overview.col.note"),
    t("overview.col.actions"),
  ];

  const handleDelete = async (month: string) => {
    if (confirm(t("overview.deleteConfirm", { month }))) {
      await onDeleteMonth(month);
    }
  };

  return (
    <div className="finance-section">
      <h2>
        <Icon name="calendar" /> {t("overview.title")}
      </h2>
      {rows.length === 0 ? (
        <p className="finance-empty">{t("overview.empty")}</p>
      ) : (
        <div className="finance-table-wrapper">
          <table className="finance-table finance-table-has-actions">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const momClass =
                  row.momPercent !== null
                    ? row.momPercent >= 0
                      ? "positive"
                      : "negative"
                    : "";
                const irClass =
                  row.investmentReturn !== null
                    ? row.investmentReturn >= 0
                      ? "positive"
                      : "negative"
                    : "";
                return (
                  <tr key={row.month}>
                    <td>{row.month.substring(5)}</td>
                    <td className="finance-number">
                      {mask(formatCurrencyCompact(row.salaryIncome))}
                    </td>
                    <td className="finance-number">
                      {mask(formatCurrencyCompact(row.otherIncome))}
                    </td>
                    {allCategories.map((cat) => (
                      <td key={cat} className="finance-number">
                        {mask(formatCurrencyCompact(row.categoryAmounts[cat] ?? 0))}
                      </td>
                    ))}
                    <td className="finance-number">
                      {mask(formatCurrencyCompact(row.totalAssets))}
                    </td>
                    <td className={`finance-number ${momClass}`.trim()}>
                      {row.momPercent !== null ? formatPercent(row.momPercent) : "-"}
                    </td>
                    <td className={`finance-number ${irClass}`.trim()}>
                      {row.investmentReturn !== null
                        ? mask(formatCurrencyCompact(row.investmentReturn))
                        : "-"}
                    </td>
                    <td className="finance-note">{row.note}</td>
                    <td className="finance-table-actions-cell">
                      <button
                        className="finance-btn-small"
                        onClick={() => onEditMonth(row.month)}
                      >
                        <Icon name="pencil" />
                      </button>
                      <button
                        className="finance-btn-small"
                        onClick={() => handleDelete(row.month)}
                      >
                        <Icon name="trash-2" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
