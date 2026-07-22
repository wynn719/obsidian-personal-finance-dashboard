import { formatCurrencyCompact } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import type { DividendSummaryTableProps } from "../types";

export function DividendSummaryTable({
  year,
  rows,
  grandTotal,
  maskNumbers,
}: DividendSummaryTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);

  return (
    <div className="finance-section">
      <h2>
        <Icon name="target" /> {t("dividend.title")} ({year})
      </h2>
      {rows.length === 0 ? (
        <p className="finance-empty">{t("dividend.empty")}</p>
      ) : (
        <table className="finance-table">
          <thead>
            <tr>
              <th>{t("dividend.col.stock")}</th>
              <th>{t("dividend.col.amounts")}</th>
              <th>{t("dividend.col.total")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.stockName}>
                <td>{row.stockName}</td>
                <td className="finance-number">
                  {mask(row.amounts.map((a) => formatCurrencyCompact(a)).join(" + "))}
                </td>
                <td className="finance-number finance-bold">
                  {mask(formatCurrencyCompact(row.total))}
                </td>
              </tr>
            ))}
            <tr className="finance-total-row">
              <td>{t("dividend.grandTotal")}</td>
              <td></td>
              <td className="finance-number finance-bold">
                {mask(formatCurrencyCompact(grandTotal))}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
