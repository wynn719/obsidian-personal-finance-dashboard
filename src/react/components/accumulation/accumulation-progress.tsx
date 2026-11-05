import { clampPct } from "../../../accumulation/money";

interface AccProgressProps {
  /** 0~100 */
  value: number;
  /** 超出预算等异常态改用警示色 */
  over?: boolean;
  /** 对比模式：计划值用斜纹条叠在实际值上方 */
  planValue?: number;
  variant?: "bar" | "compare";
}

/** 预算/进度条。纯 CSS，不用图表库：它只有一段长度要表达。 */
export function AccProgress({ value, over, planValue, variant = "bar" }: AccProgressProps) {
  if (variant === "compare") {
    return (
      <span className="finance-acc-bar-group">
        <span className="finance-acc-bar" data-over={over ? "true" : undefined}>
          <span
            className="finance-acc-bar-fill finance-acc-bar-fill--plan"
            style={{ width: `${clampPct(planValue ?? 0)}%` }}
          />
        </span>
        <span className="finance-acc-bar" data-over={over ? "true" : undefined}>
          <span
            className="finance-acc-bar-fill"
            style={{ width: `${clampPct(value)}%` }}
          />
        </span>
      </span>
    );
  }

  return (
    <span className="finance-acc-bar" data-over={over ? "true" : undefined}>
      <span className="finance-acc-bar-fill" style={{ width: `${clampPct(value)}%` }} />
    </span>
  );
}
