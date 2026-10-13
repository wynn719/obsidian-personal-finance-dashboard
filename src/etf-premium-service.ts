import { requestUrl } from "obsidian";
import type { EtfPremiumRow } from "./models";
import { roundAmount } from "./utils";

/**
 * 场内纳指/标普 QDII ETF 低溢价监控服务。
 *
 * 数据源：腾讯行情 qt.gtimg.cn（与持仓模块同源，一次请求拉取全部标的）。
 * ETF 行情行为 GBK 编码的 `v_<code>="..."` 行，~ 分隔；实测字段索引：
 *   [1] 名称  [3] 现价  [44] 规模(亿元)  [77] 溢价率(%)  [78] IOPV/参考净值
 * 腾讯直接给出「现价 ÷ 最新已公布净值 − 1」的溢价率，负数即折价。
 *
 * 标的清单与综合费率（管理费+托管费，年化 %）固化在下方，与
 * WorkBuddy 每日自动化提示词保持一致；费率调整时需同步修改。
 */

interface EtfDef {
  /** Plain 6-digit code, e.g. "513100" */
  code: string;
  /** Combined fee % (management + custody) */
  fee: number;
}

export const ETF_PREMIUM_LIST: EtfDef[] = [
  // 纳斯达克100（12 只）
  { code: "159501", fee: 0.6 }, // 纳指ETF嘉实
  { code: "159696", fee: 0.6 }, // 纳指ETF易方达
  { code: "513870", fee: 0.6 }, // 纳指ETF富国
  { code: "159659", fee: 0.65 }, // 纳斯达克100ETF招商
  { code: "159660", fee: 0.65 }, // 纳指ETF汇添富
  { code: "513390", fee: 0.65 }, // 纳指100ETF博时
  { code: "513100", fee: 0.8 }, // 纳指ETF国泰
  { code: "513300", fee: 0.8 }, // 纳斯达克ETF华夏
  { code: "159632", fee: 0.8 }, // 纳斯达克ETF华安
  { code: "159941", fee: 1.0 }, // 纳指ETF广发
  { code: "159513", fee: 1.0 }, // 纳斯达克100ETF大成
  { code: "513110", fee: 1.0 }, // 纳指ETF华泰柏瑞
  // 标普500（4 只）
  { code: "513650", fee: 0.75 }, // 标普500ETF南方
  { code: "159655", fee: 0.75 }, // 标普500ETF华夏
  { code: "159612", fee: 0.75 }, // 标普500ETF国泰
  { code: "513500", fee: 0.8 }, // 标普500ETF博时
];

/** 低溢价阈值（%）：溢价率 ≤ 3% 视为可关注标的 */
export const ETF_PREMIUM_THRESHOLD = 3;

const QUOTE_API = "https://qt.gtimg.cn/q=";

/** 159xxx → 深市，513xxx → 沪市 */
function marketPrefix(code: string): "sh" | "sz" {
  return code.startsWith("15") ? "sz" : "sh";
}

/**
 * 纯函数：解析腾讯行情文本（GBK 已解码）为 ETF 溢价行。
 * 字段不足或关键值非法时跳过该行（防御非 ETF 返回与接口变更）。
 */
export function parseEtfPremiumPayload(text: string): EtfPremiumRow[] {
  const rows: EtfPremiumRow[] = [];
  const updatedAt = new Date().toISOString();
  const lineRe = /v_([a-zA-Z0-9]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = lineRe.exec(text)) !== null) {
    const fields = match[2].split("~");
    if (fields.length < 80) continue;

    const rawCode = match[1];
    const code = rawCode.replace(/^(sh|sz)/, "");
    const name = fields[1]?.trim() ?? "";
    const price = parseFloat(fields[3]);
    const scale = parseFloat(fields[44]);
    const premium = parseFloat(fields[77]);
    const iopv = parseFloat(fields[78]);

    if (!name || !Number.isFinite(price) || price <= 0) continue;
    // ETF 行必带 IOPV；股票行没有该字段，用于区分
    if (!Number.isFinite(premium) || !Number.isFinite(iopv)) continue;

    const def = ETF_PREMIUM_LIST.find((e) => e.code === code);
    rows.push({
      code,
      name,
      price,
      premium: roundAmount(premium),
      fee: def?.fee ?? 0,
      scale: Number.isFinite(scale) ? roundAmount(scale) : 0,
      updatedAt,
    });
  }

  rows.sort((a, b) => a.premium - b.premium);
  return rows;
}

/** 拉取 16 只标的的实时溢价率（带重试 + GBK 解码） */
export async function fetchEtfPremiums(): Promise<EtfPremiumRow[]> {
  const codes = ETF_PREMIUM_LIST.map((e) => `${marketPrefix(e.code)}${e.code}`);
  const text = await requestQuotesText(`${QUOTE_API}${codes.join(",")}`);
  const rows = parseEtfPremiumPayload(text);
  if (rows.length === 0) {
    throw new Error("empty ETF premium payload");
  }
  return rows;
}

/** GET with GBK decoding and retry — mirrors quote-service.ts */
async function requestQuotesText(url: string): Promise<string> {
  const MAX_RETRIES = 2;
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await requestUrl({ url, method: "GET" });
      if (res.status === 200) {
        const text = decodeGbk(res.arrayBuffer);
        if (text) return text;
      }
      lastError = new Error(`unexpected status ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < MAX_RETRIES) {
      await sleep(800);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("ETF premium fetch failed");
}

/** 腾讯行情为 GBK 编码，requestUrl 默认按 UTF-8 解码会乱码，需手动解码 */
function decodeGbk(buffer: ArrayBuffer): string | null {
  try {
    return new TextDecoder("gbk").decode(buffer);
  } catch {
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    } catch {
      return null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
