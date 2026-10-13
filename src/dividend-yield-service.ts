import { requestUrl } from "obsidian";
import type { DividendYieldRow, StockHolding } from "./models";
import { fetchQuotes } from "./quote-service";
import { roundAmount } from "./utils";

/**
 * 9 只 A 股跟踪池的 TTM 股息率服务。
 *
 * 数据源：
 *   1. 分红记录 — 东方财富 RPT_SHAREBONUS_DET 接口（一次批量 in 查询）
 *   2. 现价     — 腾讯行情（复用 quote-service.fetchQuotes）
 *
 * 口径（完全复刻 WorkBuddy 每日股票分析自动化的 ttm_yield.py）：
 *   - 仅统计 方案进度=实施分配 且 有除权日的记录
 *   - 年报 = 报告期 12-31 的最近一次已实施；中期 = 06-30/09-30 的最近一次已实施
 *   - TTM 每股 = 年报每10股派息/10 + 中期每10股派息/10（无中期则为年度口径）
 *   - TTM 股息率 = TTM 每股 ÷ 现价 × 100
 *   - 最新一期年报未实施时输出提醒（pendingAnnual）
 *
 * 股票池与自动化提示词一致，增删只改下方清单。
 */

export interface DividendTrackStock {
  name: string;
  /** Plain 6-digit A-share code */
  code: string;
}

export const DIVIDEND_YIELD_LIST: DividendTrackStock[] = [
  { name: "招商银行", code: "600036" },
  { name: "五粮液", code: "000858" },
  { name: "海尔智家", code: "600690" },
  { name: "美的集团", code: "000333" },
  { name: "中国平安", code: "601318" },
  { name: "中国移动", code: "600941" },
  { name: "大秦铁路", code: "601006" },
  { name: "长江电力", code: "600900" },
  { name: "贵州茅台", code: "600519" },
];

const EM_API = "https://datacenter-web.eastmoney.com/api/data/v1/get";

/** Normalized East Money dividend record */
export interface EmDividendRec {
  code: string;
  /** 每 10 股税前派息（元） */
  cashPer10: number | null;
  /** 除权除息日 "YYYY-MM-DD"，无则 null */
  exDate: string | null;
  /** 报告期 "YYYY-MM-DD"，无则 null */
  reportDate: string | null;
  /** 方案进度，如 "实施分配" */
  progress: string | null;
}

export interface TtmComputation {
  divType: "semi" | "annual";
  /** 最近一次已实施年报报告期 */
  annualPeriod: string;
  /** 最近一次已实施中期报告期（semi 才有） */
  interimPeriod?: string;
  /** TTM 每股分红（元，税前） */
  ttmPerShare: number;
  /** 最新一期年报已披露但未实施时的报告期（提醒） */
  pendingAnnual?: string;
}

/** 纯函数：映射东财接口记录 */
export function mapEmRecord(row: Record<string, unknown>): EmDividendRec {
  const normDate = (v: unknown): string | null => {
    const s = String(v ?? "").trim();
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
  };
  const rawCash = row.PRETAX_BONUS_RMB;
  const cash =
    rawCash === null || rawCash === undefined ? NaN : Number(rawCash);
  return {
    code: String(row.SECURITY_CODE ?? "").trim(),
    cashPer10: Number.isFinite(cash) ? cash : null,
    exDate: normDate(row.EX_DIVIDEND_DATE),
    reportDate: normDate(row.REPORT_DATE),
    progress: String(row.ASSIGN_PROGRESS ?? "").trim() || null,
  };
}

/** 纯函数：复刻 ttm_yield.py 的 TTM 口径 */
export function computeTtmDividend(recs: EmDividendRec[]): TtmComputation {
  const impl = recs.filter(
    (r) =>
      r.progress === "实施分配" &&
      r.exDate !== null &&
      r.reportDate !== null &&
      r.cashPer10 !== null,
  );
  const byExDesc = (a: EmDividendRec, b: EmDividendRec) =>
    (b.exDate ?? "").localeCompare(a.exDate ?? "");

  const annuals = impl
    .filter((r) => r.reportDate!.endsWith("12-31"))
    .sort(byExDesc);
  const interims = impl
    .filter(
      (r) => r.reportDate!.endsWith("06-30") || r.reportDate!.endsWith("09-30"),
    )
    .sort(byExDesc);

  if (annuals.length === 0) {
    throw new Error("no implemented annual dividend record");
  }

  // 提醒：最新一期年报报告期尚未实施（取的是更早一期已实施年报）
  const allAnnualPeriods = [
    ...new Set(
      recs
        .map((r) => r.reportDate)
        .filter((d): d is string => d !== null && d.endsWith("12-31")),
    ),
  ].sort();
  const latestAnnual = allAnnualPeriods[allAnnualPeriods.length - 1];
  const pendingAnnual =
    latestAnnual && latestAnnual !== annuals[0].reportDate
      ? latestAnnual
      : undefined;

  const annualPerShare = roundAmount((annuals[0].cashPer10 ?? 0) / 10, 4);
  if (interims.length > 0) {
    const interimPerShare = roundAmount((interims[0].cashPer10 ?? 0) / 10, 4);
    return {
      divType: "semi",
      annualPeriod: annuals[0].reportDate!,
      interimPeriod: interims[0].reportDate!,
      ttmPerShare: roundAmount(annualPerShare + interimPerShare, 4),
      pendingAnnual,
    };
  }
  return {
    divType: "annual",
    annualPeriod: annuals[0].reportDate!,
    ttmPerShare: annualPerShare,
    pendingAnnual,
  };
}

/** 拉取全部分红记录 + 现价，计算 9 只股票的 TTM 股息率 */
export async function fetchDividendYields(): Promise<{
  rows: DividendYieldRow[];
  failed: string[];
}> {
  const records = await fetchDividendRecords();
  const { quotes } = await fetchQuotes(pseudoHoldings());
  const now = new Date().toISOString();

  const rows: DividendYieldRow[] = [];
  const failed: string[] = [];

  for (const stock of DIVIDEND_YIELD_LIST) {
    try {
      const comp = computeTtmDividend(
        records.filter((r) => r.code === stock.code),
      );
      const quote = quotes.get(stock.code);
      if (!quote || !(quote.price > 0)) {
        throw new Error("no live quote");
      }
      rows.push({
        name: stock.name,
        symbol: stock.code,
        divType: comp.divType,
        annualPeriod: comp.annualPeriod,
        interimPeriod: comp.interimPeriod,
        ttmPerShare: comp.ttmPerShare,
        price: quote.price,
        yieldPct: roundAmount((comp.ttmPerShare / quote.price) * 100),
        pendingAnnual: comp.pendingAnnual,
        updatedAt: now,
      });
    } catch (e) {
      console.warn(
        `Finance Dashboard: dividend yield failed for ${stock.name}`,
        e,
      );
      failed.push(stock.name);
    }
  }

  rows.sort((a, b) => b.yieldPct - a.yieldPct);
  return { rows, failed };
}

/** 构造伪持仓对象，仅用于复用 quote-service 的批量行情能力 */
function pseudoHoldings(): StockHolding[] {
  return DIVIDEND_YIELD_LIST.map((s, i) => ({
    id: `dividend-yield-${i}`,
    name: s.name,
    amount: 0,
    symbol: s.code,
    shares: 0,
    currency: "CNY" as const,
    fxRate: 1,
  }));
}

/** 批量拉取东财分红记录（带重试与分页兜底） */
async function fetchDividendRecords(): Promise<EmDividendRec[]> {
  const codes = DIVIDEND_YIELD_LIST.map((s) => `%22${s.code}%22`).join(",");
  const filter = `(SECURITY_CODE%20in%20(${codes}))`;
  const firstUrl =
    `${EM_API}?reportName=RPT_SHAREBONUS_DET` +
    `&columns=SECURITY_CODE,PRETAX_BONUS_RMB,EX_DIVIDEND_DATE,REPORT_DATE,ASSIGN_PROGRESS` +
    `&filter=${filter}&pageNumber=1&pageSize=500&sortColumns=REPORT_DATE&sortTypes=-1`;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const records = await requestDividendPages(firstUrl);
      if (records.length > 0) return records;
      lastError = new Error("empty dividend payload");
    } catch (e) {
      lastError = e;
    }
    await sleep(700);
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("dividend fetch failed");
}

async function requestDividendPages(firstUrl: string): Promise<EmDividendRec[]> {
  const records: EmDividendRec[] = [];
  let url: string | null = firstUrl;
  let page = 0;

  while (url && page < 5) {
    const res = await requestUrl({ url });
    const result = (res.json as {
      result?: {
        pages?: number;
        data?: Array<Record<string, unknown>>;
      } | null;
    })?.result;
    const data = Array.isArray(result?.data) ? result.data : [];
    for (const row of data) {
      records.push(mapEmRecord(row));
    }
    page += 1;
    const pages = Number(result?.pages) || 1;
    if (page >= pages) break;
    url = firstUrl.replace("pageNumber=1", `pageNumber=${page + 1}`);
  }

  return records;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
