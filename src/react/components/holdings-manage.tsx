import { useState } from "react";
import { useFinanceData } from "../use-finance-data";
import { Icon } from "../icon";
import { HoldingsTable } from "./holdings-table";
import { useQuoteRefresh } from "../hooks/use-quote-refresh";
import { t } from "../../i18n";
import type { HoldingsManageProps } from "../types";

/** 最近一次成功刷新时间（跨弹窗/仪表盘展示用） */
function formatQuoteTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

/**
 * 股票持仓管理视图（弹窗内）：
 * useFinanceData 订阅 store，弹窗内增删改/行情刷新后实时更新；
 * 单条添加/编辑通过回调叠加打开 HoldingModal。
 */
export function HoldingsManage({
  store,
  onAddHolding,
  onEditHolding,
}: HoldingsManageProps) {
  useFinanceData(store);
  const [maskNumbers, setMaskNumbers] = useState(false);
  const { refreshing, refreshQuotes } = useQuoteRefresh(store);

  const holdings = store.getHoldings();
  const total = store.getTotalHoldingsAmount();
  const lastQuoteTime = holdings
    .map((h) => h.quoteTime)
    .filter(Boolean)
    .sort()
    .pop();

  const handleDelete = async (id: string) => {
    await store.deleteHolding(id);
  };

  return (
    <div className="finance-modal-holdings">
      <div className="finance-modal-holdings-header">
        <h2>{t("modal.holdingsManage.title")}</h2>
        <div className="finance-actions">
          {lastQuoteTime ? (
            <span className="finance-quote-time">
              {t("holdings.quoteUpdatedAt", {
                time: formatQuoteTime(lastQuoteTime),
              })}
            </span>
          ) : null}
          <button
            className={`finance-btn${refreshing ? " finance-btn-active" : ""}`}
            onClick={refreshQuotes}
            disabled={refreshing}
            title={t("holdings.btn.refreshQuotes")}
          >
            <Icon name="refresh-cw" />
          </button>
          <button
            className={`finance-btn${maskNumbers ? " finance-btn-active" : ""}`}
            onClick={() => setMaskNumbers((m) => !m)}
          >
            <Icon name={maskNumbers ? "eye-off" : "eye"} />
          </button>
          <button className="finance-btn finance-btn-cta" onClick={onAddHolding}>
            <Icon name="plus" />
            <span className="finance-btn-label">
              {t("holdings.btn.addHolding")}
            </span>
          </button>
        </div>
      </div>

      <HoldingsTable
        holdings={holdings}
        total={total}
        maskNumbers={maskNumbers}
        onEdit={onEditHolding}
        onDelete={handleDelete}
        bare
      />
    </div>
  );
}
