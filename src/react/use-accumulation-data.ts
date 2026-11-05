import { useEffect, useState } from "react";
import type { AccumulationStore } from "../accumulation/store";

/**
 * 订阅 AccumulationStore 变化。
 * 与 useFinanceData 同一套路：store 通知 → 自增 tick → 组件重渲染，
 * 组件里直接调 store 的同步读方法即可拿到最新数据。
 */
export function useAccumulationData(store: AccumulationStore) {
  const [, setTick] = useState(0);
  useEffect(() => store.onChange(() => setTick((value) => value + 1)), [store]);

  return {
    plans: store.getPlans(),
    brokenPlans: store.getBrokenPlans(),
    warnings: store.getWarnings(),
  };
}
