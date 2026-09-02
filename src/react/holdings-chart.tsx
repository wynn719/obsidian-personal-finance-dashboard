import { Chart, registerables, type ChartConfiguration } from "chart.js";
import { TreemapController, TreemapElement } from "chartjs-chart-treemap";
import { useMemo } from "react";
import { formatCurrencyCompact } from "../utils";
import type { HoldingCurrency, StockHolding } from "../models";
import { ChartCanvas, EmptyState, CHART_COLORS } from "./chart";
import { toDisplayCurrency } from "./components/holdings-table";
import type { HoldingsTreemapChartProps } from "./types";

// Treemap controller must be explicitly registered (not part of registerables)
Chart.register(...registerables, TreemapController, TreemapElement);

/** Treemap of stock holdings — rectangle area ∝ value in display currency, click to edit */
export function HoldingsTreemapChart({
  holdings,
  total,
  maskNumbers,
  displayCurrency = "CNY",
  onEditHolding,
}: HoldingsTreemapChartProps) {
  const config = useMemo<ChartConfiguration>(() => {
    return {
      type: "treemap" as unknown as ChartConfiguration["type"],
      data: {
        datasets: [
          {
            data: holdings.map((h) => toDisplayCurrency(h, displayCurrency)),
            tree: holdings.map((h) => ({
              name: h.name,
              value: toDisplayCurrency(h, displayCurrency),
            })),
            key: "value",
            groups: ["name"],
            backgroundColor: (ctx: { dataIndex: number }) =>
              CHART_COLORS[ctx.dataIndex % CHART_COLORS.length],
            borderWidth: 0,
            spacing: 0,
            labels: {
              display: true,
              overflow: "cut",
              align: "center",
              position: "middle",
              font: [{ size: 12 }, { size: 11 }],
              color: "#ffffff",
              // Two centered lines: stock name on top, share % below
              formatter: (ctx: {
                raw: { g?: string; v?: number };
              }): string[] => {
                const pct =
                  total > 0 && ctx.raw.v
                    ? ((ctx.raw.v / total) * 100).toFixed(1)
                    : "0";
                return [ctx.raw.g ?? "", `${pct}%`];
              },
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.9)",
            titleColor: "#f8fafc",
            bodyColor: "#e2e8f0",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              title: (items) => {
                const raw = (items[0]?.raw ?? {}) as { g?: string };
                return raw.g ?? "";
              },
              label: (ctx) => {
                if (maskNumbers) return " ***";
                const raw = (ctx.raw ?? {}) as { v?: number };
                const value = raw.v ?? 0;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(2) : "0";
                return ` ¥${formatCurrencyCompact(value)} (${pct}%)`;
              },
            },
          },
        },
        onClick: (
          _evt: unknown,
          elements: { index: number }[],
        ) => {
          const el = elements[0];
          if (!el) return;
          // dataset tree order matches holdings order
          const item = holdings[el.index];
          if (item && onEditHolding) onEditHolding(item);
        },
      },
    };
  }, [holdings, total, maskNumbers, displayCurrency, onEditHolding]);

  if (holdings.length === 0) return <EmptyState />;
  return <ChartCanvas config={config} />;
}
