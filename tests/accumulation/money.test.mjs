import test from "node:test";
import assert from "node:assert/strict";

const acc = await import(process.env.ACC_BUNDLE);
const { parseMoneyToCents, formatCents, formatPrice, formatPct, convertCents, toCents, parseNumber } = acc;

test("parseMoneyToCents handles separators, currency marks and junk", () => {
  assert.equal(parseMoneyToCents("1,234.56"), 123456);
  assert.equal(parseMoneyToCents("￥1234.5"), 123450);
  assert.equal(parseMoneyToCents("$1000"), 100000);
  assert.equal(parseMoneyToCents("-5.5"), -550);
  assert.equal(parseMoneyToCents(""), null);
  assert.equal(parseMoneyToCents("abc"), null);
  assert.equal(parseMoneyToCents(undefined), null);
});

test("formatCents never groups thousands and keeps 2 decimals", () => {
  assert.equal(formatCents(12500000), "125000.00");
  assert.equal(formatCents(981750), "9817.50");
  assert.equal(formatCents(5), "0.05");
  assert.equal(formatCents(0), "0.00");
  assert.equal(formatCents(-108966, { sign: true }), "-1089.66");
  assert.equal(formatCents(108966, { sign: true }), "+1089.66");
  assert.equal(formatCents(12500000, { decimals: 0 }), "125000");
  // 关键回归：不能出现千位逗号
  assert.ok(!formatCents(12500000).includes(","));
});

test("toCents / parseNumber round-trip without float artefacts", () => {
  assert.equal(toCents(1290.88), 129088);
  assert.equal(toCents(47 * 1290.88), 6067136);
  assert.equal(parseNumber("8.00"), 8);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("abc"), null);
});

test("formatPrice trims trailing zeros and formatPct signs values", () => {
  assert.equal(formatPrice(1500), "1500");
  assert.equal(formatPrice(1290.88), "1290.88");
  assert.equal(formatPrice(2.045), "2.045");
  assert.equal(formatPrice(0), "0");
  assert.equal(formatPct(12.3), "+12.30%");
  assert.equal(formatPct(-4.48), "-4.48%");
  assert.equal(formatPct(0), "0.00%");
  assert.equal(formatPct(null), "—");
});

test("convertCents goes through CNY and is a no-op for same currency", () => {
  assert.equal(convertCents(100000, "USD", "CNY", 7.1), 710000);
  assert.equal(convertCents(710000, "CNY", "USD", 7.1), 100000);
  assert.equal(convertCents(12345, "CNY", "CNY", 1), 12345);
  assert.equal(convertCents(100000, "HKD", "CNY", 0), 100000); // fxRate 非法时按 1 兜底
});
