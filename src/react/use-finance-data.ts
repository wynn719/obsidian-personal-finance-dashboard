import { useEffect, useState } from "react";
import type { DataStore } from "../data-store";
import { getCurrentMonth } from "../utils";

/**
 * 订阅 DataStore 变化，store.notifyChange 时触发重渲染。
 * 组件内直接调 store/calculator 同步方法即可读到最新数据。
 */
export function useFinanceData(store: DataStore) {
  const [, setTick] = useState(0);
  useEffect(() => store.onChange(() => setTick((t) => t + 1)), [store]);

  const latestSnapshot = store.getLatestSnapshot();
  const currentMonth = latestSnapshot?.month ?? getCurrentMonth();
  const currentYear = store.getCurrentYear();

  return { store, currentMonth, currentYear };
}
