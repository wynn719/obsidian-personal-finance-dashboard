/**
 * 组合级复盘统计（第二批交付，当前只有占位）。
 *
 * 口径约束（写在这里，免得第二批凭印象造数据）：
 * - 只统计 archived / completed 的计划，样本量 < 3 时 `sampleEnough = false`，UI 必须提示样本不足；
 * - 最大浮亏只能来自 `# Prices` 的价格点，没有点就是「数据不完整」，不许用成交价倒推冒充回撤；
 * - 跨币种一律先折算成 CNY 再汇总，汇率口径与 calc.resolveFxRate 一致；
 * - 只描述历史，不生成「未来该用哪种补仓方式」的结论，也不自动改用户策略。
 */

import type { AccumulationPlan, PortfolioStats } from "./types";

export function computePortfolioStats(_plans: AccumulationPlan[]): PortfolioStats {
  throw new Error("computePortfolioStats is not implemented yet (batch 2)");
}
