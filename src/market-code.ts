/**
 * A-share code → exchange prefix mapping for Tencent's quote API.
 *
 * Kept dependency-free so it can be unit-tested under plain node and reused by
 * every service that talks to qt.gtimg.cn (holdings quotes, ETF premiums).
 *
 * The API is prefix-sensitive: `qt.gtimg.cn/q=sh159952` returns nothing while
 * `sz159952` returns 创业板ETF广发. A wrong prefix therefore looks exactly like
 * "this symbol does not exist", which is why the table below must cover fund
 * and bond segments — not just ordinary stocks.
 *
 * Covered segments:
 *   sh   11  convertible bonds     50/51/52/56/58  ETFs & LOFs
 *        60  main board            68  STAR market
 *        90  B shares
 *   sz   00  main board           12  convertible bonds
 *        15/16/18  ETFs & LOFs    20  B shares
 *        30  ChiNext               39  indices
 *   bj   43/83/87/88/92  Beijing Stock Exchange
 *
 * Anything else falls back to `sh`, matching the historical behaviour. When a
 * new segment appears, add it here — guessing is what broke 159952 before.
 */

export type MarketPrefix = "sh" | "sz" | "bj";

const SH_PREFIXES = new Set([
  "11", // 沪市可转债 110/111/113/118
  "50", // 沪市 ETF 510xxx 系列中的 50 段
  "51", // 沪市 ETF 510/511/512/513/515/516/518/...
  "52", // 沪市 ETF 520xxx
  "56", // 沪市 ETF 560/561/562/563/588 (科创)
  "58", // 沪市 ETF 588xxx
  "60", // 主板 A 股 600/601/603/605
  "68", // 科创板 688/689
  "90", // 沪市 B 股 900xxx
]);

const SZ_PREFIXES = new Set([
  "00", // 主板 A 股 000/001/002/003
  "12", // 深市可转债 123/127/128
  "15", // 深市 ETF 159xxx、分级基金 150xxx
  "16", // 深市 LOF 160/161/162/163/164/165/166/167/168/169
  "18", // 深市封闭式基金 184xxx
  "20", // 深市 B 股 200xxx
  "30", // 创业板 300/301/302
  "39", // 深证指数 399xxx
]);

const BJ_PREFIXES = new Set([
  "43", // 北交所 430xxx
  "83", // 北交所 83xxxx
  "87", // 北交所 87xxxx
  "88", // 北交所 88xxxx
  "92", // 北交所 92xxxx
]);

/**
 * 3-digit overrides for segments that collide with a 2-digit rule.
 * `204/205` (SSE pledged / quoted repos) sit inside `20`, which the table above
 * maps to Shenzhen B shares — so they must be checked first.
 */
const SH_PREFIX3 = new Set([
  "204", // 上交所质押式回购 204001...
  "205", // 上交所报价回购 205001（银河「天天利」等）
]);

/**
 * Map a plain 6-digit A-share code to its exchange prefix.
 * Returns `null` for anything that is not exactly 6 digits.
 */
export function marketPrefixFor(code: string): MarketPrefix | null {
  if (!/^\d{6}$/.test(code)) return null;
  if (SH_PREFIX3.has(code.slice(0, 3))) return "sh";
  const head = code.slice(0, 2);
  if (BJ_PREFIXES.has(head)) return "bj";
  if (SZ_PREFIXES.has(head)) return "sz";
  if (SH_PREFIXES.has(head)) return "sh";
  // Unknown segment — keep the legacy `sh` default rather than failing loudly,
  // so codes outside the table (e.g. 205xxx pledged repos) still resolve.
  return "sh";
}
