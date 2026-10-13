import { requestUrl } from "obsidian";
import type { IndexSignal, IndexSignalZone } from "./models";
import { roundAmount } from "./utils";

/**
 * 中证红利低波动100（930955）年线策略信号服务。
 *
 * 数据源：中证指数公司官网 index-perf 接口（一手数据，T+1 发布）。
 * 策略口径（与 WorkBuddy 每日自动化一致）：
 *   - MA250 = 最近 250 个交易日收盘均值
 *   - dev = 最新收盘 / MA250 − 1
 *   - dev < 0 → 买入区；0 ≤ dev < +3% → 持有区；
 *     +3% ≤ dev ≤ +6% → 卖出甜区；dev > +6% → 过热区
 *
 * 注意：官网接口对休市日（如国庆假期）会返回与上一交易日完全相同
 * 的填充行，解析时按「四价全同」剔除，避免污染 MA250。
 */

export const INDEX_SIGNAL_CODE = "930955";
export const INDEX_SIGNAL_NAME = "中证红利低波动100指数";
export const INDEX_SIGNAL_SHORT_NAME = "红利低波100";

const CSINDEX_API = "https://www.csindex.com.cn/csindex-home/perf/index-perf";
const MA_WINDOW = 250;
/** Natural days of history to request (250 trading days ≈ 365 natural days) */
const HISTORY_DAYS = 450;
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export interface CsIndexPoint {
  /** "YYYYMMDD" */
  tradeDate: string;
  close: number;
  open: number;
  high: number;
  low: number;
}

export interface ParsedIndexHistory {
  indexName: string;
  points: CsIndexPoint[];
}

/** 纯函数：解析 index-perf 接口 JSON，剔除休市填充行，按日期升序返回 */
export function parseIndexHistory(payload: unknown): ParsedIndexHistory {
  const body = payload as {
    data?: Array<Record<string, unknown>>;
  };
  const raw = Array.isArray(body?.data) ? body.data : [];
  const points: CsIndexPoint[] = [];
  let indexName = "";

  for (const row of raw) {
    const date = String(row?.tradeDate ?? "");
    const close = Number(row?.close);
    if (!/^\d{8}$/.test(date) || !Number.isFinite(close) || close <= 0) continue;
    if (!indexName) {
      indexName = String(row?.indexNameCnAll ?? "").trim();
    }
    points.push({
      tradeDate: date,
      close,
      open: Number(row?.open) || 0,
      high: Number(row?.high) || 0,
      low: Number(row?.low) || 0,
    });
  }

  points.sort((a, b) => a.tradeDate.localeCompare(b.tradeDate));

  // 剔除休市填充行：与前一交易日 OHLC 四价全同（官网假期会复制上一交易日数据）
  const dedup: CsIndexPoint[] = [];
  for (const p of points) {
    const prev = dedup[dedup.length - 1];
    if (
      prev &&
      prev.close === p.close &&
      prev.open === p.open &&
      prev.high === p.high &&
      prev.low === p.low
    ) {
      continue;
    }
    dedup.push(p);
  }

  return { indexName, points: dedup };
}

/** 按偏离度判定策略区间（边界与自动化口径一致） */
export function classifyZone(deviation: number): IndexSignalZone {
  if (deviation < 0) return "buy";
  if (deviation < 3) return "hold";
  if (deviation <= 6) return "sell";
  return "overheat";
}

/** 纯函数：由日线序列计算 MA250 信号 */
export function computeIndexSignal(
  points: CsIndexPoint[],
  indexName: string,
): IndexSignal {
  if (points.length < MA_WINDOW) {
    throw new Error(
      `insufficient index history: ${points.length} < ${MA_WINDOW}`,
    );
  }
  const last = points[points.length - 1];
  const window = points.slice(-MA_WINDOW);
  const ma250 = window.reduce((sum, p) => sum + p.close, 0) / MA_WINDOW;
  const deviation = (last.close / ma250 - 1) * 100;

  return {
    indexCode: INDEX_SIGNAL_CODE,
    indexName: indexName || INDEX_SIGNAL_NAME,
    tradeDate: formatDate(last.tradeDate),
    close: last.close,
    ma250: roundAmount(ma250),
    deviation: roundAmount(deviation),
    zone: classifyZone(deviation),
    updatedAt: new Date().toISOString(),
  };
}

/** 拉取指数日线并计算信号（带重试；自定义 header 失败时降级为默认头重试） */
export async function fetchIndexSignal(): Promise<IndexSignal> {
  const end = new Date();
  const start = new Date(end.getTime() - HISTORY_DAYS * 24 * 3600 * 1000);
  const url = `${CSINDEX_API}?indexCode=${INDEX_SIGNAL_CODE}&startDate=${compactDate(
    start,
  )}&endDate=${compactDate(end)}`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const payload = await requestIndexPayload(url, attempt === 0);
      const { indexName, points } = parseIndexHistory(payload);
      if (points.length > 0) {
        return computeIndexSignal(points, indexName);
      }
      lastError = new Error("empty index history payload");
    } catch (e) {
      lastError = e;
    }
    await sleep(700);
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("index signal fetch failed");
}

/**
 * 首选带浏览器 UA/Referer 请求（更稳）；若被拒则降级为 Obsidian 默认
 * 网络头重试（实测官网对默认头同样放行）。
 */
async function requestIndexPayload(
  url: string,
  withBrowserHeaders: boolean,
): Promise<unknown> {
  if (withBrowserHeaders) {
    try {
      const res = await requestUrl({
        url,
        headers: {
          "User-Agent": BROWSER_UA,
          Referer: "https://www.csindex.com.cn/",
        },
      });
      return res.json;
    } catch {
      // fall through to the default-header attempt below
    }
  }
  const res = await requestUrl({ url });
  return res.json;
}

function compactDate(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/** "20261012" → "2026-10-12" */
function formatDate(compact: string): string {
  return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
