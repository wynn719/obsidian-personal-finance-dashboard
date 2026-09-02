import { Chart, registerables, type ChartConfiguration } from "chart.js";
import { useEffect, useMemo, useRef } from "react";
import { formatCurrencyCompact } from "../utils";
import { t } from "../i18n";
import type { AssetSnapshot } from "../models";
import type {
  PieChartProps,
  BarChartProps,
  TotalAssetsChartProps,
} from "./types";

Chart.register(...registerables);

// 方案 D「Obsidian 融合」：Tailwind 400 档低饱和色 + 统一 0.8 透明度，
// 与 Obsidian 明/暗主题背景自然融合；白字标签对比度仍充足。
const CHART_COLORS = [
  "rgba(96, 165, 250, 0.8)", // blue 400
  "rgba(74, 222, 128, 0.8)", // green 400
  "rgba(251, 191, 36, 0.8)", // amber 400
  "rgba(167, 139, 250, 0.8)", // violet 400
  "rgba(34, 211, 238, 0.8)", // cyan 400
  "rgba(244, 114, 182, 0.8)", // pink 400
  "rgba(251, 146, 60, 0.8)", // orange 400
];

function getBgSecondary(): string {
  return (
    getComputedStyle(document.body)
      .getPropertyValue("--background-secondary")
      .trim() || "#ffffff"
  );
}

/** 通用 Chart.js 容器：config 变化时销毁旧实例并重建。 */
export function ChartCanvas({ config }: { config: ChartConfiguration }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current = new Chart(canvasRef.current, config);
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [config]);
  return <canvas ref={canvasRef} />;
}

export function EmptyState() {
  return <p className="finance-empty">{t("chart.noData")}</p>;
}

export { CHART_COLORS, getBgSecondary };

// ============================================================
// Pie — 资产分布环形图
// ============================================================

export function PieChart({ snapshot, maskNumbers }: PieChartProps) {
  const filtered = useMemo(
    () => snapshot?.categories.filter((c) => c.amount > 0) ?? [],
    [snapshot],
  );

  const config = useMemo<ChartConfiguration>(() => {
    const total = snapshot?.totalAssets ?? 0;
    return {
      type: "doughnut",
      data: {
        labels: filtered.map((c) => c.category),
        datasets: [
          {
            data: filtered.map((c) => c.amount),
            backgroundColor: CHART_COLORS.slice(0, filtered.length),
            borderWidth: 2,
            borderColor: getBgSecondary(),
            hoverBorderWidth: 3,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "55%",
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) => {
                if (maskNumbers) return ` ${ctx.label}: ***`;
                const value = ctx.parsed as number;
                const pct = total > 0 ? ((value / total) * 100).toFixed(2) : "0";
                return ` ${ctx.label}: ¥${formatCurrencyCompact(value)} (${pct}%)`;
              },
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
      },
    };
  }, [filtered, snapshot, maskNumbers]);

  if (!snapshot || filtered.length === 0) return <EmptyState />;
  return <ChartCanvas config={config} />;
}

// ============================================================
// Bar — 月度收支 + 净现金流
// ============================================================

export function BarChart({ data, maskNumbers }: BarChartProps) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: "bar",
      data: {
        labels: data.map((d) => d.month.substring(5)),
        datasets: [
          {
            label: t("chart.income"),
            data: data.map((d) => d.income),
            backgroundColor: "rgba(239, 138, 138, 0.7)",
            hoverBackgroundColor: "rgba(239, 138, 138, 0.85)",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: t("chart.expense"),
            data: data.map((d) => d.expense),
            backgroundColor: "rgba(125, 201, 143, 0.7)",
            hoverBackgroundColor: "rgba(125, 201, 143, 0.85)",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: t("chart.netCashFlow"),
            data: data.map((d) => d.netCashFlow),
            type: "line",
            borderColor: "rgba(143, 168, 217, 0.9)",
            backgroundColor: "rgba(143, 168, 217, 0.1)",
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: "rgba(143, 168, 217, 0.9)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                maskNumbers
                  ? ` ${ctx.dataset.label}: ***`
                  : ` ${ctx.dataset.label}: ¥${formatCurrencyCompact((ctx.parsed as { y: number }).y ?? 0)}`,
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: {
              callback: (value) =>
                maskNumbers ? "***" : "¥" + formatCurrencyCompact(value as number),
            },
          },
        },
      },
    };
  }, [data, maskNumbers]);

  if (data.every((d) => d.income === 0 && d.expense === 0)) return <EmptyState />;
  return <ChartCanvas config={config} />;
}

// ============================================================
// Line — 月度总资产趋势
// ============================================================

export function TotalAssetsChart({ data, maskNumbers }: TotalAssetsChartProps) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: "line",
      data: {
        labels: data.map((d) => d.month.substring(5)),
        datasets: [
          {
            label: t("chart.monthlyTotalAssets"),
            data: data.map((d) => d.totalAssets),
            borderColor: "rgba(96, 165, 250, 0.9)",
            backgroundColor: "rgba(96, 165, 250, 0.12)",
            borderWidth: 2.5,
            pointRadius: 4,
            pointBackgroundColor: "rgba(96, 165, 250, 0.9)",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: (ctx) =>
                maskNumbers
                  ? ` ${ctx.dataset.label}: ***`
                  : ` ${ctx.dataset.label}: ¥${formatCurrencyCompact((ctx.parsed as { y: number }).y ?? 0)}`,
            },
          },
          legend: {
            position: "bottom",
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: "circle",
              font: { size: 12 },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: false,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: {
              callback: (value) =>
                maskNumbers ? "***" : "¥" + formatCurrencyCompact(value as number),
            },
          },
        },
      },
    };
  }, [data, maskNumbers]);

  if (data.every((d) => d.totalAssets === 0)) return <EmptyState />;
  return <ChartCanvas config={config} />;
}
