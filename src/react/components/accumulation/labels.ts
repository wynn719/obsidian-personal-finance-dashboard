/**
 * 枚举值 → i18n key 的映射。
 *
 * 集中在这里是为了让 `t()` 的 key 保持字面量联合类型：
 * 用模板字符串拼 key（`acc.market.${market}`）过不了 TS 检查，
 * 而 `as any` 会把「key 打错」这类错误留到运行时。
 */

import { t } from "../../../i18n";
import type {
  AccAssetType,
  AccMarket,
  PlanStatus,
  StageKind,
  StageStatus,
  TradeSide,
  TriggerMode,
} from "../../../accumulation/types";

const MARKET_KEYS: Record<AccMarket, "acc.market.CN" | "acc.market.HK" | "acc.market.US" | "acc.market.OTHER"> = {
  CN: "acc.market.CN",
  HK: "acc.market.HK",
  US: "acc.market.US",
  OTHER: "acc.market.OTHER",
};

const ASSET_KEYS: Record<
  AccAssetType,
  "acc.assetType.stock" | "acc.assetType.etf" | "acc.assetType.fund" | "acc.assetType.bond" | "acc.assetType.other"
> = {
  stock: "acc.assetType.stock",
  etf: "acc.assetType.etf",
  fund: "acc.assetType.fund",
  bond: "acc.assetType.bond",
  other: "acc.assetType.other",
};

const STAGE_STATUS_KEYS: Record<
  StageStatus,
  | "acc.stage.status.pending"
  | "acc.stage.status.triggered"
  | "acc.stage.status.partial"
  | "acc.stage.status.completed"
  | "acc.stage.status.skipped"
  | "acc.stage.status.voided"
> = {
  pending: "acc.stage.status.pending",
  triggered: "acc.stage.status.triggered",
  partial: "acc.stage.status.partial",
  completed: "acc.stage.status.completed",
  skipped: "acc.stage.status.skipped",
  voided: "acc.stage.status.voided",
};

const PLAN_STATUS_KEYS: Record<
  PlanStatus,
  | "acc.plan.status.pending"
  | "acc.plan.status.active"
  | "acc.plan.status.completed"
  | "acc.plan.status.archived"
> = {
  pending: "acc.plan.status.pending",
  active: "acc.plan.status.active",
  completed: "acc.plan.status.completed",
  archived: "acc.plan.status.archived",
};

const STAGE_KIND_KEYS: Record<StageKind, "acc.stage.kind.first" | "acc.stage.kind.left" | "acc.stage.kind.right"> = {
  first: "acc.stage.kind.first",
  left: "acc.stage.kind.left",
  right: "acc.stage.kind.right",
};

const TRIGGER_MODE_KEYS: Record<TriggerMode, "acc.stage.mode.drop" | "acc.stage.mode.target"> = {
  drop: "acc.stage.mode.drop",
  target: "acc.stage.mode.target",
};

const TRADE_SIDE_KEYS: Record<TradeSide, "acc.trade.side.buy" | "acc.trade.side.sell"> = {
  buy: "acc.trade.side.buy",
  sell: "acc.trade.side.sell",
};

export const marketLabel = (market: AccMarket): string => t(MARKET_KEYS[market]);
export const assetTypeLabel = (type: AccAssetType): string => t(ASSET_KEYS[type]);
export const stageStatusLabel = (status: StageStatus): string => t(STAGE_STATUS_KEYS[status]);
export const planStatusLabel = (status: PlanStatus): string => t(PLAN_STATUS_KEYS[status]);
export const stageKindLabel = (kind: StageKind): string => t(STAGE_KIND_KEYS[kind]);
export const triggerModeLabel = (mode: TriggerMode): string => t(TRIGGER_MODE_KEYS[mode]);
export const tradeSideLabel = (side: TradeSide): string => t(TRADE_SIDE_KEYS[side]);
