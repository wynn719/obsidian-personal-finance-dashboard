import { formatCurrencyCompact } from "../../utils";
import { t } from "../../i18n";
import { Icon } from "../icon";
import { DataTable, type Column } from "./data-table";
import type { DividendSummaryRow } from "../../calculator";
import type { DividendSummaryTableProps } from "../types";

export function DividendSummaryTable({
  year,
  rows,
  grandTotal,
  maskNumbers,
}: DividendSummaryTableProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);

  const columns: Column<DividendSummaryRow>[] = [
    {
      key: "stockName",
      header: t("dividend.col.stock"),
      cell: (r) => r.stockName,
      excludeFromCard: true,
    },
    {
      key: "amounts",
      header: t("dividend.col.amounts"),
      cell: (r) => mask(r.amounts.map((a) => formatCurrencyCompact(a)).join(" + ")),
      numeric: true,
    },
    {
      key: "total",
      header: t("dividend.col.total"),
      cell: (r) => mask(formatCurrencyCompact(r.total)),
      numeric: true,
      className: "finance-bold",
    },
  ];

  const summaryRow = (
    <>
      <td>{t("dividend.grandTotal")}</td>
      <td></td>
      <td className="finance-number finance-bold">
        {mask(formatCurrencyCompact(grandTotal))}
      </td>
    </>
  );

  // 卡片模式下的合计卡（移动端）：金额明细列在窄屏会撑爆表格，故 mobile 端走卡片
  const cardSummary = (
    <div className="finance-dt-row">
      <span className="finance-dt-label">{t("dividend.grandTotal")}</span>
      <span className="finance-dt-value finance-bold">
        {mask(formatCurrencyCompact(grandTotal))}
      </span>
    </div>
  );

  return (
    <div className="finance-section">
      <h2>
        <Icon name="target" /> {t("dividend.title")} ({year})
      </h2>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.stockName}
        mobileMode="card"
        stickyLabel={false}
        summaryRow={summaryRow}
        cardSummary={cardSummary}
        emptyText={t("dividend.empty")}
      />
    </div>
  );
}
