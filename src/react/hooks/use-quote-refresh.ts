import { useCallback, useState } from "react";
import { Notice } from "obsidian";
import type { DataStore } from "../../data-store";
import { fetchQuotes } from "../../quote-service";
import { t } from "../../i18n";

/**
 * 手动刷新行情：批量拉取所有持仓的实时价格，
 * 写回 store（name/price/changePercent/quoteTime/amount）后触发全 UI 刷新，
 * Misc.md 中持仓金额随每次刷新更新。首期不做轮询，仅由按钮触发。
 */
export function useQuoteRefresh(store: DataStore) {
  const [refreshing, setRefreshing] = useState(false);

  const refreshQuotes = useCallback(async () => {
    const holdings = store.getHoldings().filter((h) => h.symbol);
    if (holdings.length === 0 || refreshing) return;

    setRefreshing(true);
    try {
      const quotes = await fetchQuotes(holdings);
      const updates = holdings
        .filter((h) => h.symbol && quotes.has(h.symbol))
        .map((h) => ({
          id: h.id,
          name: quotes.get(h.symbol!)!.name,
          price: quotes.get(h.symbol!)!.price,
          changePercent: quotes.get(h.symbol!)!.changePercent,
        }));

      if (updates.length > 0) {
        await store.updateHoldingQuotes(updates);
      }

      if (quotes.size === 0) {
        new Notice(t("holdings.quoteFailed"));
      } else if (updates.length < holdings.length) {
        new Notice(
          t("holdings.quoteUpdated", {
            success: String(updates.length),
            total: String(holdings.length),
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
