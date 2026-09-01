import { requestUrl } from "obsidian";
import type { StockHolding } from "./models";

/**
 * Live quote service based on Tencent's public quote API (qt.gtimg.cn).
 *
 * - No API key required, supports A-share / HK / US mixed batch queries.
 * - Response is GBK-encoded `v_<code>="..."` lines, fields separated by `~`.
 *   Field indices: [1]=name [3]=current price [31]=change [32]=change%
 * - Obsidian's requestUrl bypasses browser CORS restrictions and handles
 *   the GBK decoding for us.
 *
 * Symbol → Tencent code rules (first char disambiguates market):
 *   A-share 600xxx/601xxx/603xxx/605xxx/688xxx/689xxx → sh<code>
 *   A-share 000xxx/001xxx/002xxx/003xxx/300xxx/301xxx → sz<code>
 *   4/8-digit starting with 0/4/8 (Beijing SE etc.) →bj<code>
 *   5-digit all-numeric → hk<code> (HK)
 *   Otherwise (letters) → us<code> (US)
 */

const QUOTE_API = "https://qt.gtimg.cn/q=";

/** Resolve a user-entered stock symbol to a Tencent quote code */
export function toTencentCode(symbol: string): string | null {
  const s = symbol.trim().toUpperCase();
  if (!s) return null;

  // Pure digits → A-share / HK
  if (/^\d+$/.test(s)) {
    if (s.length === 5) return `hk${s}`;
    if (s.length !== 6) return null;
    if (/^(60|68)/.test(s)) return `sh${s}`;
    if (/^(00|30)/.test(s)) return `sz${s}`;
    if (/^(43|83|87|88|92)/.test(s)) return `bj${s}`;
    return `sh${s}`;
  }

  // Letters → US ticker
  if (/^[A-Z][A-Z0-9.\-]*$/.test(s)) return `us${s}`;

  return null;
}

export interface QuoteResult {
  /** Tencent code, e.g. "sh600036" */
  code: string;
  /** Stock name, e.g. "招商银行" */
  name: string;
  /** Current price */
  price: number;
  /** Day change percent */
  changePercent: number;
}

/**
 * Fetch live quotes for the symbol-tracked holdings (one batched request).
 * Holdings without a symbol or with an unresolvable symbol are skipped.
 */
export async function fetchQuotes(
  holdings: StockHolding[],
): Promise<Map<string, QuoteResult>> {
  const result = new Map<string, QuoteResult>();

  // symbol → tencent code (deduplicated)
  const symbolByCode = new Map<string, string>();
  for (const h of holdings) {
    if (!h.symbol) continue;
    const code = toTencentCode(h.symbol);
    if (code) symbolByCode.set(code, h.symbol);
  }
  if (symbolByCode.size === 0) return result;

  const codes = Array.from(symbolByCode.keys());
  const url = `${QUOTE_API}${codes.join(",")}`;

  const MAX_RETRIES = 2;
  let text: string | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await requestUrl({ url, method: "GET" });
      if (res.status === 200) {
        // The API returns GBK-encoded text; requestUrl's res.text assumes
        // UTF-8 and mangles Chinese names. Decode the raw bytes as GBK.
        text = decodeGbk(res.arrayBuffer);
        if (text) break;
      }
    } catch (e) {
      console.error(
        `Finance Dashboard: quote fetch attempt ${attempt + 1} failed`,
        e,
      );
    }
    if (attempt < MAX_RETRIES) {
      await sleep(800);
    }
  }
  if (text === null) return result;

  // Response lines: v_sh600036="1~招商银行~600036~40.86~...~0.74~1.84~...";
  const lineRe = /v_([a-z]{2}[A-Za-z0-9]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(text)) !== null) {
    const code = match[1];
    const fields = match[2].split("~");
    if (fields.length < 33) continue;

    const name = fields[1]?.trim() ?? "";
    const price = parseFloat(fields[3]);
    const changePercent = parseFloat(fields[32]);
    if (!name || isNaN(price) || price <= 0) continue;

    const symbol = symbolByCode.get(code);
    if (symbol) {
      result.set(symbol, {
        code,
        name,
        price,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
      });
    }
  }

  return result;
}

/** Fetch the display name for a symbol (used to auto-fill the form) */
export async function fetchQuoteName(symbol: string): Promise<string | null> {
  const code = toTencentCode(symbol);
  if (!code) return null;
  try {
    const res = await requestUrl({
      url: `${QUOTE_API}${code}`,
      method: "GET",
    });
    const text = decodeGbk(res.arrayBuffer);
    const m = text?.match(/="([^"]*)"/);
    if (!m) return null;
    const fields = m[1].split("~");
    const name = fields[1]?.trim();
    const price = parseFloat(fields[3]);
    return name && !isNaN(price) && price > 0 ? name : null;
  } catch {
    return null;
  }
}

/**
 * Decode a GBK-encoded response body.
 * Obsidian's requestUrl assumes UTF-8; for GBK content res.text produces
 * mojibake, so we decode the raw ArrayBuffer with TextDecoder("gbk").
 */
function decodeGbk(buffer: ArrayBuffer): string | null {
  try {
    return new TextDecoder("gbk").decode(buffer);
  } catch {
    // TextDecoder without GBK support — fall back to res.text behavior
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
