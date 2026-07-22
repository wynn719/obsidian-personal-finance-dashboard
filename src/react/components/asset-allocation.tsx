import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import type { AssetAllocationTableProps } from "../types";

export function AssetAllocationTable({
  rows,
  maskNumbers,
}: AssetAllocationTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="finance-section">
      <h2>
        <Icon name="trending-up" /> {t("allocation.title")}
      </h2>
      {rows.length === 0 ? (
        <p className="finance-empty">{t("allocation.empty")}</p>
      ) : (
        <table className="finance-table">
          <thead>
            <tr>
              <th>{t("allocation.col.category")}</th>
              <th>{t("allocation.col.amount")}</th>
              <th>{t("allocation.col.currentPercent")}</th>
              <th>{t("allocation.col.targetPercent")}</th>
              <th>{t("allocation.col.deviation")}</th>
              <th>{t("allocation.col.rebalance")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const warn =
                row.deviation !== null && Math.abs(row.deviation) > 10;
              const devClass =
                row.deviation !== null
                  ? row.deviation >= 0
                    ? "positive"
                    : "negative"
                  : "";
              let rebalanceText = "-";
              let rebalanceClass = "";
              if (row.rebalanceAmount !== null) {
                if (Math.abs(row.rebalanceAmount) < 1) {
                  rebalanceText = t("allocation.rebalance.hold");
                  rebalanceClass = "finance-rebalance-hold";
                } else if (row.rebalanceAmount > 0) {
                  rebalanceText = mask(
                    t("allocation.rebalance.buy", {
                      amount: formatCurrencyCompact(row.rebalanceAmount),
                    }),
                  );
                  rebalanceClass = "positive";
                } else {
                  rebalanceText = mask(
                    t("allocation.rebalance.sell", {
                      amount: formatCurrencyCompact(Math.abs(row.rebalanceAmount)),
                    }),
                  );
                  rebalanceClass = "negative";
                }
              }
              return (
                <tr
                  key={row.category}
                  className={warn ? "finance-deviation-warning" : undefined}
                >
                  <td>{row.category}</td>
                  <td className="finance-number">
                    {mask(formatCurrencyCompact(row.amount))}
                  </td>
                  <td className="finance-number">
                    {row.currentPercent.toFixed(2)}%
                  </td>
                  <td className="finance-number">
                    {row.targetPercent !== null
                      ? row.targetPercent.toFixed(2) + "%"
                      : "-"}
                  </td>
                  <td className={`finance-number ${devClass}`.trim()}>
                    {row.deviation !== null ? formatPercent(row.deviation) : "-"}
                  </td>
                  <td
                    className={`finance-number ${rebalanceClass}`.trim()}
                  >
                    {rebalanceText}
                  </td>
                </tr>
              );
            })}
            <tr className="finance-total-row">
              <td>{t("allocation.total")}</td>
              <td className="finance-number">
                {mask(formatCurrencyCompact(totalAmount))}
              </td>
              <td className="finance-number">100.00%</td>
              <td className="finance-number">100.00%</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
