/**
 * 建仓计划模板与金额策略。
 *
 * 默认模板对齐需求里的示例：0% / -8% / -15% / -25% / -35% / 右侧确认，
 * 金额 10000/15000/20000/25000/25000/30000，总预算 125000。
 * 换预算时按比例缩放，并把取整残差并进最后一档，保证 Σ 阶段金额 === 可分配预算。
 */

import { t } from "../i18n";
import { clampPct } from "./money";
import type { AccumulationStage, AmountMode, StageKind, TriggerMode } from "./types";
import { computeTriggerPrice } from "./calc";

export const DEFAULT_TEMPLATE_BUDGET_CENTS = 125000 * 100;

const TEMPLATE_DROPS = [0, 8, 15, 25, 35];
const TEMPLATE_AMOUNTS = [10000, 15000, 20000, 25000, 25000, 30000];
const RIGHT_SIDE_PREMIUM = 4; // %，右侧确认的确认位在参考价之上 4%

export function stageLabel(kind: StageKind, dropPct: number, index: number): string {
  if (kind === "first") return t("acc.stage.kind.first");
  if (kind === "right") return t("acc.stage.kind.right");
  const pctText = Number.isFinite(dropPct) ? `-${Math.round(dropPct)}%` : `#${index}`;
  return `${t("acc.stage.kind.left")} ${pctText}`;
}

/**
 * 生成模板阶段。budgetCents 为「可分配预算」（已扣预留），
 * referencePrice 为首次参考买入价，决定所有触发价。
 */
export function buildTemplateStages(budgetCents: number, referencePrice: number): AccumulationStage[] {
  const scale = budgetCents > 0 ? budgetCents / DEFAULT_TEMPLATE_BUDGET_CENTS : 1;
  const scaled = TEMPLATE_AMOUNTS.map((amount) => Math.round(amount * 100 * scale));
  // 取整残差并进右侧确认那一档
  const total = scaled.reduce((sum, value) => sum + value, 0);
  scaled[scaled.length - 1] += budgetCents - total;

  const stages: AccumulationStage[] = TEMPLATE_DROPS.map((drop, index) => ({
    order: index + 1,
    label: stageLabel(index === 0 ? "first" : "left", drop, index + 1),
    kind: index === 0 ? "first" : "left",
    triggerMode: "drop" as TriggerMode,
    anchorPrice: referencePrice,
    dropPct: drop,
    plannedCents: scaled[index],
    requiresConfirm: index === 0,
  }));

  stages.push({
    order: stages.length + 1,
    label: stageLabel("right", 0, stages.length + 1),
    kind: "right",
    triggerMode: "target",
    anchorPrice: referencePrice,
    dropPct: 0,
    targetPrice: referencePrice > 0 ? round4(referencePrice * (1 + RIGHT_SIDE_PREMIUM / 100)) : undefined,
    plannedCents: scaled[scaled.length - 1],
    requiresConfirm: true,
  });

  return stages;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function distribute(totalCents: number, weights: number[]): number[] {
  const sumWeights = weights.reduce((sum, weight) => sum + weight, 0);
  if (sumWeights <= 0 || totalCents <= 0) return weights.map(() => 0);
  const values = weights.map((weight) => Math.round((totalCents * weight) / sumWeights));
  const diff = totalCents - values.reduce((sum, value) => sum + value, 0);
  if (values.length > 0) values[values.length - 1] += diff;
  return values;
}

/**
 * 按策略重算各阶段金额。
 * fixed = 均分；ladder = 线性递增（首档 1、每档 +50%）；custom = 原样不动。
 */
export function applyAmountMode(
  stages: AccumulationStage[],
  mode: AmountMode,
  deployableCents: number,
): AccumulationStage[] {
  if (mode === "custom" || stages.length === 0) return stages.map((stage) => ({ ...stage }));

  const weights =
    mode === "fixed"
      ? stages.map(() => 1)
      : stages.map((_, index) => 1 + index * 0.5);

  const values = distribute(deployableCents, weights);
  return stages.map((stage, index) => ({ ...stage, plannedCents: values[index] }));
}

/**
 * 切换触发模式：两套参数同时保留，切过去时按锚定价互算，切回来仍是原值。
 * 这是「不要因为切换模式丢计划」的关键。
 */
export function applyTriggerMode(
  stages: AccumulationStage[],
  mode: TriggerMode,
): AccumulationStage[] {
  return stages.map((stage) => {
    if (mode === "target") {
      const targetPrice =
        stage.targetPrice !== undefined && stage.targetPrice > 0
          ? stage.targetPrice
          : Math.round(computeTriggerPrice({ ...stage, triggerMode: "drop" }) * 10000) / 10000;
      return { ...stage, triggerMode: "target", targetPrice };
    }
    const anchor = stage.anchorPrice > 0 ? stage.anchorPrice : 0;
    const price =
      stage.targetPrice !== undefined && stage.targetPrice > 0
        ? stage.targetPrice
        : computeTriggerPrice(stage);
    const dropPct =
      anchor > 0 ? Math.round(((anchor - price) / anchor) * 10000) / 100 : stage.dropPct;
    return {
      ...stage,
      triggerMode: "drop",
      dropPct: Math.max(0, Math.min(100, dropPct)),
    };
  });
}

/** 预留比例 → 可分配预算 */
export function deployableCents(totalBudgetCents: number, reserveRatio: number): number {
  return totalBudgetCents - Math.round((totalBudgetCents * clampPct(reserveRatio)) / 100);
}
