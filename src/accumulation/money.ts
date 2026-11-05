/**
 * 金额与数字的解析/格式化。
 *
 * 为什么不用 utils.formatCurrency：它走 `toLocaleString("zh-CN")`，会带千位逗号，
 * 而本模块要求「金额不显示千位分隔」；且它被既有 29 处引用，不能改。
 * 这里全部用整数运算，结果与 locale 无关。
 */

import type { AccCurrency, Cents } from "./types";

/** 元 → 分（唯一取整点之一） */
export function toCents(value: number): Cents {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** 分 → 元 */
export function fromCents(cents: Cents): number {
  if (!Number.isFinite(cents)) return 0;
  return cents / 100;
}

/**
 * 解析用户输入或文件里的金额字符串 → 分。
 * 接受 "1,234.56" / "￥1234.5" / "1234" / "-5.5"；空串与非法值返回 null。
 */
export function parseMoneyToCents(raw: string | undefined | null): Cents | null {
  if (raw === undefined || raw === null) return null;
  const cleaned = String(raw)
    .replace(/[,\s]/g, "")
    .replace(/[¥￥$€]/g, "");
  if (!cleaned) return null;
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return toCents(num);
}

/** 解析普通数字（价格、跌幅、比例、数量）；空/非法返回 null */
export function parseNumber(raw: string | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const cleaned = String(raw)
    .replace(/[,\s]/g, "")
    .replace(/[¥￥$€%]/g, "");
  if (!cleaned) return null;
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(cleaned)) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** 整数解析；空/非法返回 null */
export function parseInteger(raw: string | undefined | null): number | null {
  const num = parseNumber(raw);
  if (num === null || !Number.isInteger(num)) return null;
  return num;
}

/**
 * 分 → 金额字符串。固定 2 位小数、无千位分隔。
 * formatCents(12500000) === "125000.00"
 */
export function formatCents(
  cents: Cents,
  opts: { decimals?: 0 | 2; sign?: boolean; fallback?: string } = {},
): string {
  const { decimals = 2, sign = false, fallback = "—" } = opts;
  if (!Number.isFinite(cents)) return fallback;
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const body =
    decimals === 0
      ? String(Math.round(abs / 100))
      : `${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  const prefix = negative ? "-" : sign && abs > 0 ? "+" : "";
  return `${prefix}${body}`;
}

/** 价格：最多 maxDp 位、去尾零；非法值返回 fallback */
export function formatPrice(value: number, maxDp = 4, fallback = "—"): string {
  if (!Number.isFinite(value)) return fallback;
  if (value === 0) return "0";
  const fixed = value.toFixed(maxDp).replace(/0+$/, "").replace(/\.$/, "");
  return fixed === "-0" ? "0" : fixed;
}

/** 百分比：0 显示 "0.00%"，正数带 +，null 显示 fallback */
export function formatPct(value: number | null | undefined, dp = 2, fallback = "—"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(dp)}%`;
}

/** 不带正负号的百分比：占用率、占比这类「量」而不是「涨跌」的数字 */
export function formatPctPlain(value: number | null | undefined, dp = 2, fallback = "—"): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return `${value.toFixed(dp)}%`;
}

/** 比例（0~100）→ 进度条百分比字符串，限幅 0~100 */
export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * 跨币种换算，经 CNY 中转。
 * fxRate = CNY per 1 unit of `from`（与 StockHolding.fxRate 同口径）。
 */
export function convertCents(
  cents: Cents,
  from: AccCurrency,
  to: AccCurrency,
  fxRate: number,
): Cents {
  if (from === to) return cents;
  const rate = fxRate > 0 ? fxRate : 1;
  const inCny = from === "CNY" ? cents : cents * rate;
  if (to === "CNY") return Math.round(inCny);
  // 非 CNY 之间的换算需要一个近似：先按同一 rate 折回
  return Math.round(inCny / rate);
}

/** 安全除法（分母 0 返回 0） */
export function pct(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total === 0) return 0;
  return (part / total) * 100;
}
