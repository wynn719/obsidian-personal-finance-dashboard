import type { PlanStatus, StageStatus } from "../../../accumulation/types";
import { planStatusLabel, stageStatusLabel } from "./labels";

interface AccBadgeProps {
  status: StageStatus | PlanStatus;
  kind?: "stage" | "plan";
}

/** 状态徽章。颜色只表达状态，不参与「涨跌」语义（已完成用中性绿，不代表亏）。 */
export function AccBadge({ status, kind = "stage" }: AccBadgeProps) {
  const label =
    kind === "plan"
      ? planStatusLabel(status as PlanStatus)
      : stageStatusLabel(status as StageStatus);

  return (
    <span className="finance-acc-badge" data-status={status}>
      {label}
    </span>
  );
}
