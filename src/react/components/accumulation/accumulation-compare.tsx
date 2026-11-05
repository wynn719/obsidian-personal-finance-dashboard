import { formatCents, formatPctPlain } from "../../../accumulation/money";
import type { CompareRow } from "../../../accumulation/types";
import { t } from "../../../i18n";
import { DataTable, type Column } from "../data-table";
import { useLayout } from "../../responsive";
import { AccBadge } from "./accumulation-badge";

interface AccumulationCompareProps {
  rows: CompareRow[];
  totalBudgetCents: number;
  maskNumbers: boolean;
}

/** 计划 vs 实际。偏差为正 = 多投，为负 = 少投；跳过阶段带原因。 */
export function AccumulationCompare({ rows, totalBudgetCents, maskNumbers }: AccumulationCompareProps) {
  const mask = (text: string) => (maskNumbers ? "***" : text);
  // 合计行的单元格数必须跟着可见列数走，否则手机端会整体错位一格
  const { layout } = useLayout();
  const mobile = layout === "mobile";

  const labelOf = (row: CompareRow) =>
    row.stageOrder === 0 ? t("acc.compare.unassigned") : row.label;

  const columns: Column<CompareRow>[] = [
    {
      key: "stage",
      header: t("acc.compare.col.stage"),
      excludeFromCard: true,
      cell: (row) => (
        <span className="finance-acc-compare-stage">
          {labelOf(row)}
          {row.skipReason ? (
            <span className="finance-acc-muted">{row.skipReason}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: "planned",
      header: t("acc.compare.col.planned"),
      numeric: true,
      cell: (row) => (
        <span className="finance-acc-amount-plan">{mask(formatCents(row.plannedCents))}</span>
      ),
    },
    {
      key: "actual",
      header: t("acc.compare.col.actual"),
      numeric: true,
      cell: (row) => (
        <span className="finance-acc-amount-actual">{mask(formatCents(row.actualCents))}</span>
      ),
    },
    {
      key: "deviation",
      header: t("acc.compare.col.deviation"),
      numeric: true,
      cell: (row) => {
        if (row.stageOrder === 0) return "—";
        const cls = row.deviationCents > 0 ? "finance-up" : row.deviationCents < 0 ? "finance-down" : "";
        return <span className={cls}>{mask(formatCents(row.deviationCents, { sign: true }))}</span>;
      },
    },
    {
      key: "planUsage",
      header: t("acc.compare.col.planUsage"),
      numeric: true,
      hideOnMobile: true,
      cell: (row) => mask(formatPctPlain(row.plannedUsagePct, 1)),
    },
    {
      key: "actualUsage",
      header: t("acc.compare.col.actualUsage"),
      numeric: true,
      hideOnMobile: true,
      cell: (row) => mask(formatPctPlain(row.actualUsagePct, 1)),
    },
    {
      key: "status",
      header: t("acc.stage.col.status"),
      // 手机端状态在时间线里已经有了，这里让位给金额对比
      hideOnMobile: true,
      cell: (row) => (row.stageOrder === 0 ? "—" : <AccBadge status={row.status} />),
    },
  ];

  const totalPlanned = rows.reduce((sum, row) => sum + row.plannedCents, 0);
  const totalActual = rows.reduce((sum, row) => sum + row.actualCents, 0);

  const summaryRow = (
    <>
      <td>{t("acc.compare.total")}</td>
      <td className="finance-number">{mask(formatCents(totalPlanned))}</td>
      <td className="finance-number">{mask(formatCents(totalActual))}</td>
      <td className="finance-number">{mask(formatCents(totalActual - totalPlanned, { sign: true }))}</td>
      {mobile ? null : (
        <>
          <td className="finance-number">
            {mask(formatPctPlain(totalBudgetCents > 0 ? (totalPlanned / totalBudgetCents) * 100 : 0, 1))}
          </td>
          <td className="finance-number">
            {mask(formatPctPlain(totalBudgetCents > 0 ? (totalActual / totalBudgetCents) * 100 : 0, 1))}
          </td>
        </>
      )}
      <td></td>
    </>
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(row) => `${row.stageOrder}-${row.label}`}
      // 比较型表：手机端保留表格形态（按 hideOnMobile 精简列），逐档对比才看得清
      mobileMode="table"
      stickyLabel={false}
      summaryRow={summaryRow}
      emptyText={t("acc.empty.text")}
    />
  );
}
