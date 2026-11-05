import { formatCents, formatPrice } from "../../../accumulation/money";
import type { AccumulationTrade } from "../../../accumulation/types";
import { t } from "../../../i18n";
import { Icon } from "../../icon";
import { DataTable, type Column } from "../data-table";
import { tradeSideLabel } from "./labels";

interface AccumulationTradesProps {
  trades: AccumulationTrade[];
  stageLabelOf: (stageOrder: number | null) => string;
  maskNumbers: boolean;
  onAdd: () => void;
  onEdit: (trade: AccumulationTrade) => void;
  onDelete: (tradeId: string) => void;
}

/** 实际成交表：增改删都在这里，计划表格永远不覆盖这些记录。 */
export function AccumulationTrades({
  trades,
  stageLabelOf,
  maskNumbers,
  onAdd,
  onEdit,
  onDelete,
}: AccumulationTradesProps) {
  const mask = (text: string) => (maskNumbers ? "***" : text);

  const columns: Column<AccumulationTrade>[] = [
    {
      key: "date",
      header: t("acc.trade.date"),
      excludeFromCard: true,
      cell: (trade) => <span className="finance-dt-card-date">{trade.date}</span>,
    },
    {
      key: "stage",
      header: t("acc.trade.stage"),
      cell: (trade) => stageLabelOf(trade.stageOrder),
    },
    {
      key: "side",
      header: t("acc.trade.side"),
      cell: (trade) => (
        <span className={trade.side === "buy" ? "finance-down" : "finance-up"}>
          {tradeSideLabel(trade.side)}
        </span>
      ),
    },
    {
      key: "price",
      header: t("acc.trade.price"),
      numeric: true,
      cell: (trade) => mask(formatPrice(trade.price)),
    },
    {
      key: "quantity",
      header: t("acc.trade.qty"),
      numeric: true,
      cell: (trade) => mask(formatPrice(trade.quantity, 6)),
    },
    {
      key: "amount",
      header: t("acc.trade.amount"),
      numeric: true,
      cell: (trade) => mask(formatCents(trade.amountCents)),
    },
    {
      key: "fee",
      header: t("acc.trade.fee"),
      numeric: true,
      hideOnMobile: true,
      cell: (trade) => mask(formatCents(trade.feeCents)),
    },
    {
      key: "note",
      header: t("acc.trade.note"),
      hideOnMobile: true,
      cell: (trade) => trade.note || "—",
    },
  ];

  const actions = (trade: AccumulationTrade) => (
    <>
      <button className="finance-btn-small" onClick={() => onEdit(trade)} title={t("acc.trade.titleEdit")}>
        <Icon name="pencil" />
      </button>
      <button
        className="finance-btn-small"
        onClick={() => {
          if (confirm(t("acc.trade.deleteConfirm"))) onDelete(trade.id);
        }}
        title={t("acc.action.delete")}
      >
        <Icon name="trash-2" />
      </button>
    </>
  );

  return (
    <DataTable
      columns={columns}
      rows={trades}
      rowKey={(trade) => trade.id}
      mobileMode="card"
      stickyLabel={false}
      actions={actions}
      actionsHeader={t("acc.list.col.actions")}
      renderCardHead={(trade) => (
        <span className="finance-dt-card-date">
          {trade.date}
          <span className="finance-holding-symbol">{tradeSideLabel(trade.side)}</span>
        </span>
      )}
      emptyText={t("acc.empty.text")}
    />
  );
}
