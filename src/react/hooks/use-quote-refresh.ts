import { useCallback, useState } from "react";
import { Notice } from "obsidian";
import type { DataStore } from "../../data-store";
import { refreshHoldingQuotes } from "../../market-refresh";
import { t } from "../../i18n";

/**
 * 手动刷新行情：批量拉取所有持仓的实时价格 + 汇率，
 * 写回 store（name/price/changePercent/currency/fxRate/quoteTime/amount）
 * 后触发全 UI 刷新，Misc.md 中持仓金额随每次刷新更新。
 *
 * 实际拉取逻辑在 market-refresh 里，与「打开视图自动刷新」共用同一份实现，
 * 这里只负责按钮的 loading 状态与提示文案。
 */
export function useQuoteRefresh(store: DataStore) {
  const [refreshing, setRefreshing] = useState(false);

  const refreshQuotes = useCallback(async () => {
    if (refreshing) return;
    const total = store.getHoldings().filter((h) => h.symbol).length;
    if (total === 0) return;

    setRefreshing(true);
    try {
      const { updated } = await refreshHoldingQuotes(store);

      if (updated === 0) {
        new Notice(t("holdings.quoteFailed"));
      } else if (updated < total) {
        new Notice(
          t("holdings.quoteUpdated", {
            success: String(updated),
            total: String(total),
          }),
        );
      }
    } catch (e) {
      console.error("Finance Dashboard: refresh quotes failed", e);
      new Notice(t("holdings.quoteFailed"));
    } finally {
      setRefreshing(false);
    }
  }, [store, refreshing]);

  return { refreshing, refreshQuotes };
}
