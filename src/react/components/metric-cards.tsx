import { formatCurrencyCompact, formatChange, formatPercent } from "../../utils";
import { t } from "../../i18n";
import type { MetricCardsProps } from "../types";

/** 把 "463.36万" 拆成数值与单位，供 hero 卡分级排版（单位降为小号后缀） */
function splitCompact(value: string): { num: string; unit: string } {
  const m = value.match(/^([+-]?[\d,.]+)(.*)$/);
  if (!m) return { num: value, unit: "" };
  return { num: m[1], unit: m[2] };
}

/**
 * 指标区（全端统一）：总资产独占主位、环比收进胶囊徽章，
 * 收入/支出/结余/股息并成一条四列指标带，用 1px hairline 竖线分隔。
 * 桌面在瀑布流里占两栏（data-span），[data-layout="full"] 下改为横向构图。
 */
export function MetricCards({ metrics, maskNumbers }: MetricCardsProps) {
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
    <div className="finance-hero" data-span="2">
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
