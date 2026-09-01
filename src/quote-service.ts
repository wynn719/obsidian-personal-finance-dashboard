import { requestUrl } from "obsidian";
import type { HoldingCurrency, StockHolding } from "./models";

/**
 * Live quote service based on Tencent's public quote API (qt.gtimg.cn).
 *
 * - No API key required, supports A-share / HK / US mixed batch queries.
 * - FX rates (USD→CNY, HKD→CNY) come from the same API via `wh` codes,
 *   fetched in the same batched request as the stock quotes.
 * - Response is GBK-encoded `v_<code>="..."` lines, fields separated by `~`.
 *   Field indices: [1]=name [3]=current price [31]=change [32]=change%
 * - Obsidian's requestUrl bypasses browser CORS restrictions; GBK content
 *   is decoded manually via TextDecoder("gbk").
 *
 * Symbol → Tencent code + currency rules (first char disambiguates market):
 *   A-share 600xxx/601xxx/603xxx/605xxx/688xxx/689xxx → sh<code>, CNY
 *   A-share 000xxx/001xxx/002xxx/003xxx/300xxx/301xxx → sz<code>, CNY
 *   4/8-digit starting with 0/4/8 (Beijing SE etc.) → bj<code>, CNY
 *   5-digit all-numeric → hk<code> (HK), HKD
 *   Otherwise (letters) → us<code> (US), USD
 */

const QUOTE_API = "https://qt.gtimg.cn/q=";

/** FX quote codes: CNY per 1 unit of the foreign currency */
const FX_CODES: Partial<Record<HoldingCurrency, string>> = {
  USD: "whUSDCNY",
  HKD: "whHKDCNY",
};

export interface ResolvedSymbol {
  /** Tencent quote code, e.g. "sh600036" */
  code: string;
  /** Native trading currency */
  currency: HoldingCurrency;
}

/** Resolve a user-entered stock symbol to a Tencent quote code + currency */
export function resolveSymbol(symbol: string): ResolvedSymbol | null {
  const s = symbol.trim().toUpperCase();
  if (!s) return null;

  // Pure digits → A-share / HK
  if (/^\d+$/.test(s)) {
    if (s.length === 5) return { code: `hk${s}`, currency: "HKD" };
    if (s.length !== 6) return null;
    if (/^(60|68)/.test(s)) return { code: `sh${s}`, currency: "CNY" };
    if (/^(00|30)/.test(s)) return { code: `sz${s}`, currency: "CNY" };
    if (/^(43|83|87|88|92)/.test(s)) return { code: `bj${s}`, currency: "CNY" };
    return { code: `sh${s}`, currency: "CNY" };
  }

  // Letters → US ticker
  if (/^[A-Z][A-Z0-9.\-]*$/.test(s)) return { code: `us${s}`, currency: "USD" };

  return null;
}

/** Resolve a user-entered stock symbol to a Tencent quote code (legacy) */
export function toTencentCode(symbol: string): string | null {
  return resolveSymbol(symbol)?.code ?? null;
}

export interface QuoteResult {
  /** Tencent code, e.g. "sh600036" */
  code: string;
  /** Stock name, e.g. "招商银行" */
  name: string;
  /** Current price (native currency) */
  price: number;
  /** Day change percent */
  changePercent: number;
  /** Native trading currency */
  currency: HoldingCurrency;
  /** FX rate to CNY (CNY per 1 unit of currency); 1 for A-shares */
  fxRate: number;
}

export interface QuotesBundle {
  /** symbol → quote result */
  quotes: Map<string, QuoteResult>;
}

/**
 * Fetch live quotes + FX rates for the holdings (one batched request).
 * The request includes whUSDCNY/whHKDCNY when any non-A-share holding exists.
 */
export async function fetchQuotes(
  holdings: StockHolding[],
): Promise<QuotesBundle> {
  const quotes = new Map<string, QuoteResult>();
  const fxRates = new Map<HoldingCurrency, number>();

  // symbol → resolved code (deduplicated)
  const resolvedByCode = new Map<string, { symbol: string; res: ResolvedSymbol }>();
  const neededCurrencies = new Set<HoldingCurrency>();
  for (const h of holdings) {
    if (!h.symbol) continue;
    const res = resolveSymbol(h.symbol);
    if (!res) continue;
    resolvedByCode.set(res.code, { symbol: h.symbol, res });
    if (res.currency !== "CNY") neededCurrencies.add(res.currency);
  }
  if (resolvedByCode.size === 0) return { quotes };

  // Append FX codes to the same batched request
  const fxCodeToCurrency = new Map<string, HoldingCurrency>();
  for (const cur of neededCurrencies) {
    const fxCode = FX_CODES[cur];
    if (fxCode) fxCodeToCurrency.set(fxCode, cur);
  }

  const codes = [
    ...Array.from(resolvedByCode.keys()),
    ...Array.from(fxCodeToCurrency.keys()),
  ];
  const text = await requestWithRetry(`${QUOTE_API}${codes.join(",")}`);
  if (text === null) return { quotes };

  // Response lines: v_sh600036="1~招商银行~600036~40.86~..."; v_whUSDCNY="310~美元人民币~USDCNY~6.7220~...";
  const lineRe = /v_([a-zA-Z0-9]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = lineRe.exec(text)) !== null) {
    const code = match[1];
    const fields = match[2].split("~");
    if (fields.length < 33) continue;

    const name = fields[1]?.trim() ?? "";
    const price = parseFloat(fields[3]);
    const changePercent = parseFloat(fields[32]);
    if (!name || isNaN(price) || price <= 0) continue;

    // FX line → record rate and skip
    const fxCurrency = fxCodeToCurrency.get(code);
    if (fxCurrency) {
      fxRates.set(fxCurrency, price);
      continue;
    }

    const entry = resolvedByCode.get(code);
    if (entry) {
      quotes.set(entry.symbol, {
        code,
        name,
        price,
        changePercent: isNaN(changePercent) ? 0 : changePercent,
        currency: entry.res.currency,
        // A-share → 1; others fall back to 1 if the FX line was missing
        fxRate:
          entry.res.currency === "CNY"
            ? 1
            : (fxRates.get(entry.res.currency) ?? 1),
      });
    }
  }

  return { quotes };
}

/** Fetch the display name + currency for a symbol (used to auto-fill the form) */
export async function fetchQuoteName(
  symbol: string,
): Promise<{ name: string; currency: HoldingCurrency } | null> {
  const res = resolveSymbol(symbol);
  if (!res) return null;
  try {
    const response = await requestUrl({
      url: `${QUOTE_API}${res.code}`,
      method: "GET",
    });
    const text = decodeGbk(response.arrayBuffer);
    const m = text?.match(/="([^"]*)"/);
    if (!m) return null;
    const fields = m[1].split("~");
    const name = fields[1]?.trim();
    const price = parseFloat(fields[3]);
    return name && !isNaN(price) && price > 0
      ? { name, currency: res.currency }
      : null;
  } catch {
    return null;
  }
}

/** GET with GBK decoding and retry, returns null on persistent failure */
async function requestWithRetry(url: string): Promise<string | null> {
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await requestUrl({ url, method: "GET" });
      if (res.status === 200) {
        // The API returns GBK-encoded text; requestUrl's res.text assumes
        // UTF-8 and mangles Chinese names. Decode the raw bytes as GBK.
        const text = decodeGbk(res.arrayBuffer);
        if (text) return text;
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
  return null;
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
