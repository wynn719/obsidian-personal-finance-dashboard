import { formatCurrencyCompact, formatChange, formatPercent } from "../../utils";
import { t } from "../../i18n";
import { useLayout } from "../responsive";
import type { MetricCardsProps } from "../types";

/** 把 "463.36万" 拆成数值与单位，供 hero 卡分级排版（单位降为小号后缀） */
function splitCompact(value: string): { num: string; unit: string } {
  const m = value.match(/^([+-]?[\d,.]+)(.*)$/);
  if (!m) return { num: value, unit: "" };
  return { num: m[1], unit: m[2] };
}

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

/**
 * 移动端高密度排版（对齐设计稿 3:1）：
 * 六张等权卡降为一个视觉块——总资产独占主位、环比收进胶囊徽章，
 * 收入/支出/结余/股息并成一条四列指标带，用 1px hairline 竖线分隔。
 * 桌面仍用 6 卡网格，此处只在 mobile 生效。
 */
function MobileMetrics({ metrics, maskNumbers }: MetricCardsProps) {
  const mask = (v: string) => (maskNumbers ? "***" : v);
  const up = metrics.momChange >= 0;
  const { num, unit } = splitCompact(formatCurrencyCompact(metrics.totalAssets));

  const cells: { label: string; value: string; tone?: "up" | "down" }[] = [
    {
      label: t("metrics.monthlyIncome"),
      value: mask(formatCurrencyCompact(metrics.monthlyIncome)),
    },
    {
      label: t("metrics.monthlyExpense"),
      value: mask(formatCurrencyCompact(metrics.monthlyExpense)),
    },
    {
      label: t("metrics.monthlySurplus"),
      value: mask(formatCurrencyCompact(metrics.monthlySurplus)),
      tone: metrics.monthlySurplus >= 0 ? "up" : "down",
    },
    {
      label: t("metrics.yearlyDividends"),
      value: mask(formatCurrencyCompact(metrics.yearlyDividends)),
      tone: metrics.yearlyDividends >= 0 ? "up" : "down",
    },
  ];

  return (
    <div className="finance-hero">
      <div className="finance-hero-top">
        <div className="finance-hero-main">
          <span className="finance-hero-label">{t("metrics.totalAssets")}</span>
          <div className="finance-hero-value">
            {mask(num)}
            {unit ? <span className="finance-hero-unit">{unit}</span> : null}
          </div>
        </div>
        <div className="finance-hero-mom">
          <span className={`finance-hero-badge ${up ? "is-up" : "is-down"}`}>
            {mask(formatPercent(metrics.momPercent))}
          </span>
          <span className={`finance-hero-delta ${up ? "is-up" : "is-down"}`}>
            {t("metrics.momChange")} {mask(formatChange(metrics.momChange))}
          </span>
        </div>
      </div>

      <div className="finance-hero-strip">
        {cells.map((c) => (
          <div className="finance-hero-cell" key={c.label}>
            <span className="finance-hero-cell-label">{c.label}</span>
            <span
              className={`finance-hero-cell-value${
                c.tone ? ` is-${c.tone}` : ""
              }`}
            >
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricCards({ metrics, maskNumbers }: MetricCardsProps) {
  const { layout } = useLayout();
  if (layout === "mobile") {
    return <MobileMetrics metrics={metrics} maskNumbers={maskNumbers} />;
  }

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
