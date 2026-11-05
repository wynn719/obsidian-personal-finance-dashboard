import test from "node:test";
import assert from "node:assert/strict";

const acc = await import(process.env.ACC_BUNDLE);
const { parsePlan, serializePlan, computeTriggerPrice, buildStageViews, PlanParseError } = acc;

const SAMPLE = `---
id: pl_7f3k2m9q
name: 贵州茅台
symbol: 600519
market: CN
assetType: stock
currency: CNY
createdAt: 2026-09-01
updatedAt: 2026-11-03T14:20:11+08:00
totalBudget: 125000.00
referencePrice: 1500.00
currentPrice: 1290.88
priceUpdatedAt: 2026-11-03
reserveRatio: 0
amountMode: custom
requireConfirmDefault: true
myCustomKey: 保留我
---

# Stages

| Order | Label | Kind | Mode | Anchor | Drop% | Target | Trigger | Planned | Confirm | ConfirmedAt | SkippedAt | SkipReason | VoidedAt |
|------|------|------|----------|--------|-------|--------|--------|----------|--------|--------|----------|----------|----------|
| 1 | 首次建仓 | first | drop | 1500.00 | 0.00 |  | 1500.00 | 10000.00 | true | 2026-09-12 |  |  |  |
| 2 | 左侧补仓-8% | left | drop | 1500.00 | 8.00 |  | 9999.00 | 15000.00 | false |  |  |  |  |
| 3 | 右侧确认突破 | right | target | 1500.00 |  | 1560.00 | 1560.00 | 30000.00 | true |  |  |  |  |

# Trades

| ID | Date | Stage | Side | Price | Quantity | Amount | Fee | Note |
|----|------|------|------|------|------|------|--------|------|
| pl_t1a2b3 | 2026-09-12 | 1 | buy | 1402.50 | 7 | 9817.50 | 5.00 | 止盈 \\| 止损 备注 |

# Prices

| Date | Price | Note |
|------|------|------|
| 2026-09-12 | 1402.50 | 建仓日 |
| 2026-10-20 | 1318.00 | 手动 |
| 2026-10-20 | 1300.00 | 同日覆盖 |

# Adjustments

| Date | Stage | Field | Before | After | Note |
|------|------|------|--------|--------|------|
| 2026-10-25 | 3 | planned | 18000.00 | 20000.00 | 加深档位 |

# Investment Thesis

高股息 + 强现金流，20 倍以下分批建仓。
第二行带 | 竖线和 # 井号。

# Review

（建仓完成后填写）

# My Custom Section

这里是我自己写的笔记，插件不要动它。
`;

test("frontmatter and every section parse into the expected shape", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  assert.equal(plan.id, "pl_7f3k2m9q");
  assert.equal(plan.name, "贵州茅台");
  assert.equal(plan.symbol, "600519");
  assert.equal(plan.market, "CN");
  assert.equal(plan.assetType, "stock");
  assert.equal(plan.currency, "CNY");
  assert.equal(plan.totalBudgetCents, 12500000);
  assert.equal(plan.referencePrice, 1500);
  assert.equal(plan.currentPrice, 1290.88);
  assert.equal(plan.priceUpdatedAt, "2026-11-03");
  assert.equal(plan.reserveRatio, 0);
  assert.equal(plan.amountMode, "custom");
  assert.equal(plan.stages.length, 3);
  assert.equal(plan.trades.length, 1);
  assert.equal(plan.adjustments.length, 1);
  assert.equal(plan.warnings.length, 0);
});

test("empty cells keep their column position instead of shifting the row", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  const stage2 = plan.stages[1];
  assert.equal(stage2.targetPrice, undefined);
  assert.equal(stage2.plannedCents, 1500000);
  assert.equal(stage2.requiresConfirm, false);
  assert.equal(stage2.skipReason, undefined);

  const stage3 = plan.stages[2];
  assert.equal(stage3.kind, "right");
  assert.equal(stage3.triggerMode, "target");
  assert.equal(stage3.targetPrice, 1560);
  assert.equal(stage3.dropPct, 0);
  assert.equal(stage3.requiresConfirm, true);
});

test("the trigger column is read-only: it is recomputed from anchor and drop", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  // 文件里被手改成 9999，读入后必须按锚定价重算
  assert.equal(computeTriggerPrice(plan.stages[1]), 1380);
  assert.equal(buildStageViews(plan)[1].triggerPrice, 1380);
});

test("escaped pipes survive the table round trip", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  assert.equal(plan.trades[0].note, "止盈 | 止损 备注");
  const text = serializePlan(plan);
  assert.ok(text.includes("止盈 \\| 止损 备注"));
});

test("same-day price points collapse to the last one", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  assert.equal(plan.prices.length, 2);
  assert.equal(plan.prices[1].date, "2026-10-20");
  assert.equal(plan.prices[1].price, 1300);
});

test("prose keeps pipes, hashes and blank lines verbatim", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  assert.ok(plan.logic.startsWith("高股息 + 强现金流"));
  assert.ok(plan.logic.includes("第二行带 | 竖线和 # 井号。"));
  assert.equal(plan.review, "（建仓完成后填写）");
});

test("unknown frontmatter keys and unknown sections are preserved", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  assert.deepEqual(plan.extraFrontmatter, ["myCustomKey: 保留我"]);
  assert.equal(plan.unknownSections.length, 1);
  assert.equal(plan.unknownSections[0].title, "My Custom Section");

  const text = serializePlan(plan);
  assert.ok(text.includes("myCustomKey: 保留我"));
  assert.ok(text.includes("# My Custom Section"));
  assert.ok(text.includes("这里是我自己写的笔记，插件不要动它。"));
});

test("missing frontmatter fields degrade with warnings instead of throwing", () => {
  const raw = `---
name: Bare Plan
---

# Stages

| Order | Label | Kind | Mode | Anchor | Drop% | Target | Trigger | Planned | Confirm | ConfirmedAt | SkippedAt | SkipReason | VoidedAt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | only | left | drop | 10 | 5 |  | 9.5 | 100.00 | false |  |  |  |  |
`;
  const plan = parsePlan(raw, "600519-pl_bare01.md");
  assert.equal(plan.id, "pl_bare01");
  assert.equal(plan.currency, "CNY");
  assert.equal(plan.market, "OTHER");
  assert.equal(plan.totalBudgetCents, 0);
  const codes = plan.warnings.map((w) => w.code);
  assert.ok(codes.includes("frontmatter.missingId"));
  assert.ok(codes.includes("frontmatter.missingSymbol"));
});

test("nested YAML in frontmatter is rejected rather than silently dropped", () => {
  const raw = `---
name: Bad
  nested: value
---
`;
  assert.throws(() => parsePlan(raw, "bad.md"), PlanParseError);
});

test("unparsable table lines stay as orphan rows and do not block their neighbours", () => {
  const raw = `---
id: pl_orphan
name: Orphan
symbol: 000001
totalBudget: 10000
referencePrice: 10
---

# Stages

| Order | Label | Kind | Mode | Anchor | Drop% | Target | Trigger | Planned | Confirm | ConfirmedAt | SkippedAt | SkipReason | VoidedAt |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | good | first | drop | 10 | 0 |  | 10 | 1000.00 | true |  |  |  |  |
| not-a-row |
| 2 | also good | left | drop | 10 | 10 |  | 9 | 2000.00 | false |  |  |  |  |
`;
  const plan = parsePlan(raw, "x-pl_orphan.md");
  assert.equal(plan.stages.length, 2);
  assert.equal(plan.orphanRows.Stages.length, 1);

  const text = serializePlan(plan);
  assert.ok(text.includes("| not-a-row |"));

  const again = parsePlan(text, "x-pl_orphan.md");
  assert.equal(again.stages.length, 2);
  assert.equal(again.orphanRows.Stages.length, 1);
});

test("serialize + parse is idempotent", () => {
  const first = serializePlan(parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md"));
  const second = serializePlan(parsePlan(first, "600519-pl_7f3k2m9q.md"));
  assert.equal(second, first);
});

test("amounts are written without thousands separators", () => {
  const plan = parsePlan(SAMPLE, "600519-pl_7f3k2m9q.md");
  const text = serializePlan(plan);
  assert.ok(text.includes("| 10000.00 |"));
  assert.ok(text.includes("totalBudget: 125000.00"));
  assert.ok(!text.includes("125,000"));
});

test("template stages balance exactly against the deployable budget", () => {
  const { buildTemplateStages, applyAmountMode } = acc;
  const stages = buildTemplateStages(12500000, 1500);
  assert.equal(stages.length, 6);
  const sum = stages.reduce((total, stage) => total + stage.plannedCents, 0);
  assert.equal(sum, 12500000);
  assert.equal(stages[0].kind, "first");
  assert.equal(stages[5].kind, "right");
  assert.equal(stages[5].requiresConfirm, true);
  assert.equal(computeTriggerPrice(stages[1]), 1380);
  assert.equal(computeTriggerPrice(stages[5]), 1560);

  const fixed = applyAmountMode(stages, "fixed", 12000000);
  const fixedSum = fixed.reduce((total, stage) => total + stage.plannedCents, 0);
  assert.equal(fixedSum, 12000000);
  assert.equal(new Set(fixed.map((stage) => stage.plannedCents)).size <= 2, true);

  const custom = applyAmountMode(stages, "custom", 12000000);
  assert.deepEqual(
    custom.map((stage) => stage.plannedCents),
    stages.map((stage) => stage.plannedCents),
  );
});
