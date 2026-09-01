import { useState } from "react";
import { useFinanceData } from "../use-finance-data";
import { Icon } from "../icon";
import { HoldingsTable } from "./holdings-table";
import { t } from "../../i18n";
import type { HoldingsManageProps } from "../types";

/**
 * 股票持仓管理视图（弹窗内）：
 * useFinanceData 订阅 store，弹窗内增删改后实时刷新；
 * 单条添加/编辑通过回调叠加打开 HoldingModal。
 */
export function HoldingsManage({
  store,
  onAddHolding,
  onEditHolding,
}: HoldingsManageProps) {
  useFinanceData(store);
  const [maskNumbers, setMaskNumbers] = useState(false);

  const holdings = store.getHoldings();
  const total = store.getTotalHoldingsAmount();

  const handleDelete = async (id: string) => {
    await store.deleteHolding(id);
  };

  return (
    <div className="finance-modal-holdings">
      <div className="finance-modal-holdings-header">
        <h2>{t("modal.holdingsManage.title")}</h2>
        <div className="finance-actions">
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
