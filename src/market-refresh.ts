import type { DataStore } from "./data-store";
import { fetchIndexSignal } from "./index-signal-service";
import { fetchDividendYields } from "./dividend-yield-service";
import { fetchEtfPremiums } from "./etf-premium-service";
import { fetchQuotes } from "./quote-service";

/**
 * 四项远程数据的统一拉取入口。
 *
 * 打开仪表盘视图时会把它们各拉一遍（见 FinanceApp 的 useEffect），
 * 卡片标题右侧的刷新按钮也复用这里的实现——避免「自动」和「手动」
 * 两套逻辑各自漂移。
 *
 * 每项都是 fetch + 写回 store；写回走 store 的序列化，所以这里刻意
 * **串行**执行，避免四处同时写 Misc.md 造成互相覆盖。
 */

/** 自动拉取的最小间隔：5 分钟内重复打开视图不重复请求 */
export const AUTO_REFRESH_MIN_INTERVAL = 5 * 60 * 1000;

let lastRunAt = 0;
let running: Promise<void> | null = null;

/** 年线策略信号 */
export async function refreshIndexSignal(store: DataStore): Promise<void> {
  const signal = await fetchIndexSignal();
  await store.updateIndexSignal(signal);
}

/** TTM 股息率；返回本次成功条数与失败代码，供调用方决定要不要提示 */
export async function refreshDividendYields(
  store: DataStore,
): Promise<{ saved: number; failed: number }> {
  const { rows, failed } = await fetchDividendYields();
  if (rows.length > 0) {
    await store.updateDividendYields(rows);
  }
  return { saved: rows.length, failed: failed.length };
}

/** ETF 溢价 */
export async function refreshEtfPremiums(store: DataStore): Promise<number> {
  const rows = await fetchEtfPremiums();
  await store.updateEtfPremiums(rows);
  return rows.length;
}

/** 持仓行情（价格 / 涨跌幅 / 汇率 / 名称） */
export async function refreshHoldingQuotes(
  store: DataStore,
): Promise<{ updated: number; total: number }> {
  const holdings = store.getHoldings().filter((h) => h.symbol);
  if (holdings.length === 0) return { updated: 0, total: 0 };

  const { quotes } = await fetchQuotes(holdings);
  const updates = holdings
    .filter((h) => h.symbol && quotes.has(h.symbol))
    .map((h) => {
      const q = quotes.get(h.symbol!)!;
      return {
        id: h.id,
        name: q.name,
        price: q.price,
        changePercent: q.changePercent,
        currency: q.currency,
        fxRate: q.fxRate,
      };
    });

  if (updates.length > 0) {
    await store.updateHoldingQuotes(updates);
  }
  return { updated: updates.length, total: holdings.length };
}

/**
 * 打开视图时调用：把四项远程数据各拉一遍。
 * 单项失败只记日志，不影响其它项——页面上仍显示上次缓存的值。
 */
export async function autoRefreshAll(
  store: DataStore,
  minIntervalMs: number = AUTO_REFRESH_MIN_INTERVAL,
): Promise<void> {
  if (running) return running;
  if (minIntervalMs > 0 && Date.now() - lastRunAt < minIntervalMs) return;

  running = (async () => {
    const steps: Array<[string, () => Promise<unknown>]> = [
      ["index signal", () => refreshIndexSignal(store)],
      ["dividend yields", () => refreshDividendYields(store)],
      ["etf premiums", () => refreshEtfPremiums(store)],
      ["holding quotes", () => refreshHoldingQuotes(store)],
    ];

    for (const [label, run] of steps) {
      try {
        await run();
      } catch (e) {
        console.error(`Finance Dashboard: auto refresh ${label} failed`, e);
      }
    }
    lastRunAt = Date.now();
  })().finally(() => {
    running = null;
  });

  return running;
}
