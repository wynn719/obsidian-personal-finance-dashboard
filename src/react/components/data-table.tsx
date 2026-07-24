import type { ReactNode } from "react";
import { useLayout } from "../responsive";

/**
 * 通用响应式表格组件。
 *
 * 设计：把"移动端适配能力"集中在此处，由顶层 useLayout() 下发的 layout 驱动：
 * - mobileMode="card"（阅读型表）：移动端每行渲染为纵向卡片，消灭横向滚动
 * - mobileMode="table"（比较型表）：移动端按 hideOnMobile 精简列，保留表格形态便于横向对比
 * - stickyLabel：首列粘性，桌面宽表横向滚动时保留行上下文
 * - actions：操作列粘性右侧
 *
 * 列颜色（涨跌/正负）由各列 cell 内的 <span className="positive/negative"> 自带，
 * 行级 class（如偏差告警）走 rowClassName，合计行走 summaryRow。
 */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** 数值列：套 finance-number（等宽数字） */
  numeric?: boolean;
  /** td 额外 class（如 finance-note） */
  className?: string;
  /** 比较型表移动端精简表格时隐藏该列 */
  hideOnMobile?: boolean;
  /** 卡片模式下不进入 body（如已在 head 展示） */
  excludeFromCard?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** 行额外 class（如 finance-deviation-warning） */
  rowClassName?: (row: T) => string | undefined;
  /** 移动端模式：card 卡片化（阅读型）/ table 精简表格（比较型）。默认 table */
  mobileMode?: "card" | "table";
  /** 卡片头部自定义（日期+类型等）；默认用首列值 */
  renderCardHead?: (row: T) => ReactNode;
  /** 操作列（粘性右侧）；不传则无操作列 */
  actions?: (row: T) => ReactNode;
  actionsHeader?: string;
  /** 合计行：渲染于数据行后，自带 finance-total-row（表格模式） */
  summaryRow?: ReactNode;
  /** 卡片模式下的合计卡：渲染于卡片列表末尾 */
  cardSummary?: ReactNode;
  /** 首列粘性（标签列）。默认 true */
  stickyLabel?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 表格额外 class */
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowClassName,
  mobileMode = "table",
  renderCardHead,
  actions,
  actionsHeader,
  summaryRow,
  cardSummary,
  stickyLabel = true,
  emptyText,
  className,
}: DataTableProps<T>) {
  const { layout } = useLayout();
  const mobile = layout === "mobile";

  if (rows.length === 0) {
    return emptyText ? <p className="finance-empty">{emptyText}</p> : null;
  }

  const hasActions = Boolean(actions);
  const tableCls = [
    "finance-table",
    hasActions ? "finance-table-has-actions" : "",
    stickyLabel ? "finance-table-sticky-label" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // 卡片模式（移动端 + 阅读型）
  if (mobile && mobileMode === "card") {
    const bodyCols = columns.filter((c) => !c.excludeFromCard);
    return (
      <div className="finance-dt-cards">
        {rows.map((row) => (
          <div
            className={["finance-dt-card", rowClassName?.(row) ?? ""]
              .filter(Boolean)
              .join(" ")}
            key={rowKey(row)}
          >
            <div className="finance-dt-card-head">
              {renderCardHead ? (
                renderCardHead(row)
              ) : (
                <span className="finance-dt-card-date">
                  {columns[0]?.cell(row)}
                </span>
              )}
              {actions && (
                <span className="finance-dt-card-actions">{actions(row)}</span>
              )}
            </div>
            <div className="finance-dt-card-body">
              {bodyCols.map((c) => (
                <div className="finance-dt-row" key={c.key}>
                  <span className="finance-dt-label">{c.header}</span>
                  <span
                    className={
                      c.numeric ? "finance-dt-value" : "finance-dt-value finance-dt-text"
                    }
                  >
                    {c.cell(row)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {cardSummary && (
          <div className="finance-dt-card finance-dt-card-summary">
            <div className="finance-dt-card-body">{cardSummary}</div>
          </div>
        )}
      </div>
    );
  }

  // 表格模式（桌面 / 移动端比较型精简）
  const visibleCols = mobile
    ? columns.filter((c) => !c.hideOnMobile)
    : columns;

  return (
    <div className="finance-table-wrapper">
      <table className={tableCls}>
        <thead>
          <tr>
            {visibleCols.map((c) => (
              <th key={c.key} className={c.numeric ? "finance-th-numeric" : undefined}>
                {c.header}
              </th>
            ))}
            {hasActions && <th>{actionsHeader ?? ""}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row)}>
              {visibleCols.map((c) => {
                const cls = [c.numeric ? "finance-number" : "", c.className ?? ""]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <td key={c.key} className={cls || undefined}>
                    {c.cell(row)}
                  </td>
                );
              })}
              {actions && (
                <td className="finance-table-actions-cell">{actions(row)}</td>
              )}
            </tr>
          ))}
          {summaryRow && <tr className="finance-total-row">{summaryRow}</tr>}
        </tbody>
      </table>
    </div>
  );
}
