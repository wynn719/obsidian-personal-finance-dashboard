import { formatCurrencyCompact, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { AllocationRow } from "../../calculator";
import type { AssetAllocationTableProps } from "../types";

export function AssetAllocationTable({
  rows,
  maskNumbers,
}: AssetAllocationTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);
  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  const signClass = (v: number | null) =>
    v === null ? "" : v >= 0 ? "positive" : "negative";

  const columns: Column<AllocationRow>[] = [
    {
      key: "category",
      header: t("allocation.col.category"),
      cell: (r) => r.category,
      excludeFromCard: true,
    },
    {
      key: "amount",
      header: t("allocation.col.amount"),
      cell: (r) => mask(formatCurrencyCompact(r.amount)),
      numeric: true,
    },
    {
      key: "currentPercent",
      header: t("allocation.col.currentPercent"),
      cell: (r) => `${r.currentPercent.toFixed(2)}%`,
      numeric: true,
    },
    {
      key: "targetPercent",
      header: t("allocation.col.targetPercent"),
      cell: (r) => (r.targetPercent !== null ? `${r.targetPercent.toFixed(2)}%` : "-"),
      numeric: true,
      excludeFromCard: true,
    },
    {
      key: "deviation",
      header: t("allocation.col.deviation"),
      cell: (r) =>
        r.deviation !== null ? (
          <span className={signClass(r.deviation)}>{formatPercent(r.deviation)}</span>
        ) : (
          "-"
        ),
      numeric: true,
    },
    {
      key: "rebalance",
      header: t("allocation.col.rebalance"),
      cell: (r) => {
        if (r.rebalanceAmount === null) return "-";
        if (Math.abs(r.rebalanceAmount) < 1) {
          return <span className="finance-rebalance-hold">{t("allocation.rebalance.hold")}</span>;
        }
        if (r.rebalanceAmount > 0) {
          return (
            <span className="positive">
              {mask(
                t("allocation.rebalance.buy", {
                  amount: formatCurrencyCompact(r.rebalanceAmount),
                }),
              )}
            </span>
          );
        }
        return (
          <span className="negative">
            {mask(
              t("allocation.rebalance.sell", {
                amount: formatCurrencyCompact(Math.abs(r.rebalanceAmount)),
              }),
            )}
          </span>
        );
      },
      numeric: true,
    },
  ];

  const rowClassName = (r: AllocationRow) =>
    r.deviation !== null && Math.abs(r.deviation) > 10
      ? "finance-deviation-warning"
      : undefined;

  const summaryRow = (
    <>
      <td>{t("allocation.total")}</td>
      <td className="finance-number">{mask(formatCurrencyCompact(totalAmount))}</td>
      <td className="finance-number">100.00%</td>
      <td className="finance-number">100.00%</td>
      <td></td>
      <td></td>
    </>
  );

  // 卡片模式合计卡（移动端）
  const cardSummary = (
    <div className="finance-dt-row">
      <span className="finance-dt-label">{t("allocation.total")}</span>
      <span className="finance-dt-value finance-bold">
        {mask(formatCurrencyCompact(totalAmount))}
      </span>
    </div>
  );

  return (
    <div className="finance-section finance-allocation-section">
      <h2>
        <Icon name="trending-up" /> {t("allocation.title")}
      </h2>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.category}
        rowClassName={rowClassName}
        mobileMode="card"
        stickyLabel={false}
        summaryRow={summaryRow}
        cardSummary={cardSummary}
        emptyText={t("allocation.empty")}
      />
    </div>
  );
}
