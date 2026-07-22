import { formatCurrencyCompact, formatChange, formatPercent } from "../../utils";
import { t } from "../../i18n";
import type { MetricCardsProps } from "../types";

interface MetricCardProps {
  label: string;
  value: string;
  suffix: string;
  colorClass?: string;
}

function MetricCard({ label, value, suffix, colorClass }: MetricCardProps) {
  return (
    <div className="finance-metric-card">
      <div className="finance-metric-label">{label}</div>
      <div className={`finance-metric-value${colorClass ? " " + colorClass : ""}`}>
        {value}
      </div>
      <div className="finance-metric-suffix">{suffix}</div>
    </div>
  );
}

export function MetricCards({ metrics, maskNumbers }: MetricCardsProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);
  return (
    <div className="finance-metrics-grid">
      <MetricCard
        label={t("metrics.totalAssets")}
        value={mask(formatCurrencyCompact(metrics.totalAssets))}
        suffix={t("metrics.unit")}
      />
      <MetricCard
        label={t("metrics.momChange")}
        value={mask(formatChange(metrics.momChange))}
        suffix={mask(formatPercent(metrics.momPercent))}
        colorClass={metrics.momChange >= 0 ? "positive" : "negative"}
      />
      <MetricCard
        label={t("metrics.monthlyIncome")}
        value={mask(formatCurrencyCompact(metrics.monthlyIncome))}
        suffix={t("metrics.unit")}
      />
      <MetricCard
        label={t("metrics.monthlyExpense")}
        value={mask(formatCurrencyCompact(metrics.monthlyExpense))}
        suffix={t("metrics.unit")}
      />
      <MetricCard
        label={t("metrics.monthlySurplus")}
        value={mask(formatCurrencyCompact(metrics.monthlySurplus))}
        suffix={t("metrics.unit")}
        colorClass={metrics.monthlySurplus >= 0 ? "positive" : "negative"}
      />
      <MetricCard
        label={t("metrics.yearlyDividends")}
        value={mask(formatCurrencyCompact(metrics.yearlyDividends))}
        suffix={t("metrics.unit")}
      />
    </div>
  );
}
