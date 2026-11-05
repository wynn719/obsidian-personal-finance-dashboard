import test from "node:test";
import assert from "node:assert/strict";

const acc = await import(process.env.ACC_BUNDLE);
const { AccumulationStore, parsePlan, buildStageViews, computePlanMetrics } = acc;

/** 内存文件系统：只实现 AccumulationStore 用到的那几个 adapter 方法 */
function makeAdapter() {
  const files = new Map();
  const folders = new Set();
  const isFolder = (path) => folders.has(path) || [...files.keys()].some((k) => k.startsWith(`${path}/`));
  return {
    files,
    async exists(path) {
      return files.has(path) || isFolder(path);
    },
    async read(path) {
      if (!files.has(path)) throw new Error(`ENOENT ${path}`);
      return files.get(path);
    },
    async write(path, data) {
      files.set(path, data);
    },
    async mkdir(path) {
      folders.add(path);
    },
    async list(path) {
      const out = [];
      for (const key of files.keys()) {
        if (!key.startsWith(`${path}/`)) continue;
        const rest = key.slice(path.length + 1);
        if (!rest.includes("/")) out.push(key);
      }
      return { files: out, folders: [] };
    },
    async rename(from, to) {
      files.set(to, files.get(from));
      files.delete(from);
    },
    async remove(path) {
      files.delete(path);
    },
    async trashSystem(path) {
      files.delete(path);
      return true;
    },
    // 模拟 Obsidian 的原子替换
    async process(path, fn) {
      files.set(path, fn(files.get(path) ?? ""));
    },
  };
}

function makePlugin(adapter) {
  return { app: { vault: { adapter, on: () => ({ id: "evt" }), offref: () => {} } } };
}

const input = {
  name: "测试标的",
  symbol: "TEST",
  market: "CN",
  assetType: "etf",
  currency: "CNY",
  createdAt: "2026-01-01",
  totalBudgetCents: 1000000,
  referencePrice: 10,
  currentPrice: 9.5,
  reserveRatio: 0,
  amountMode: "custom",
  requireConfirmDefault: true,
  logic: "只做验证",
  stages: [
    { order: 1, label: "首次", kind: "first", triggerMode: "drop", anchorPrice: 10, dropPct: 0, plannedCents: 400000, requiresConfirm: true },
    { order: 2, label: "补仓", kind: "left", triggerMode: "drop", anchorPrice: 10, dropPct: 10, plannedCents: 600000, requiresConfirm: false },
  ],
};

test("create writes one markdown file under plans/ and it parses back", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();

  const plan = await store.createPlan(input);
  const path = store.getPath(plan.id);
  assert.ok(path.startsWith("Finance/Investment/Accumulation/plans/"));
  assert.ok(path.endsWith(`TEST-${plan.id}.md`));
  assert.ok(adapter.files.has(path));

  const raw = adapter.files.get(path);
  assert.ok(raw.includes("totalBudget: 10000.00"));
  assert.ok(raw.includes("# Stages"));
  // 建计划时录的现价要留下第一个价格点，否则回撤永远算不出来
  assert.ok(raw.includes("# Prices"));
  assert.equal(parsePlan(raw, path).stages.length, 2);
});

test("price updates keep one point per day and drive the metrics", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  const plan = await store.createPlan(input);

  await store.setPrice(plan.id, 9.2, "2026-02-01");
  await store.setPrice(plan.id, 8.8, "2026-02-01");
  await store.setPrice(plan.id, 9.0, "2026-02-02");

  const reloaded = store.getPlan(plan.id);
  // 建计划时写入的「当天现价」仍在，同一天两次改价只保留最后一次
  assert.equal(reloaded.prices.length, 3);
  assert.equal(reloaded.prices.filter((point) => point.date === "2026-02-01").length, 1);
  assert.equal(reloaded.prices[0].price, 8.8);
  assert.equal(reloaded.currentPrice, 9);
  assert.equal(reloaded.priceUpdatedAt, "2026-02-02");

  const views = buildStageViews(reloaded);
  assert.equal(views[0].status, "triggered");
  // 第 2 档触发价 = 10 × (1 − 10%) = 9，现价正好 9 → 已触发（边界含等号）
  assert.equal(views[1].status, "triggered");
  assert.equal(buildStageViews({ ...reloaded, currentPrice: 9.5 })[1].status, "pending");
});

test("trades accumulate into position cost without touching the plan stages", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  const plan = await store.createPlan(input);

  await store.addTrade(plan.id, {
    id: "pl_t1",
    date: "2026-02-01",
    stageOrder: 1,
    side: "buy",
    price: 9.5,
    quantity: 100,
    amountCents: 95000,
    feeCents: 500,
    note: "",
  });

  const reloaded = store.getPlan(plan.id);
  assert.equal(reloaded.trades.length, 1);
  assert.equal(reloaded.stages[0].plannedCents, 400000);
  const metrics = computePlanMetrics(reloaded);
  assert.equal(metrics.investedCents, 95500);
  assert.equal(metrics.shares, 100);
  assert.equal(metrics.avgCost, 9.55);
});

test("reload picks up files written by hand", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  const plan = await store.createPlan(input);
  const path = store.getPath(plan.id);

  adapter.files.set(path, adapter.files.get(path).replace("currentPrice: 9.5", "currentPrice: 7.77"));
  await store.reload();

  assert.equal(store.getPlan(plan.id).currentPrice, 7.77);
});

test("archive moves the file into archive/ and keeps the plan reachable", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  const plan = await store.createPlan(input);
  const before = store.getPath(plan.id);

  await store.archivePlan(plan.id);

  const after = store.getPath(plan.id);
  assert.notEqual(after, before);
  assert.ok(after.startsWith("Finance/Investment/Accumulation/archive/"));
  assert.equal(adapter.files.has(before), false);
  assert.ok(adapter.files.has(after));
  assert.ok(store.getPlan(plan.id).archivedAt);
});

test("delete removes the file and the in-memory entry", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  const plan = await store.createPlan(input);
  const path = store.getPath(plan.id);

  await store.deletePlan(plan.id);

  assert.equal(adapter.files.has(path), false);
  assert.equal(store.getPlan(plan.id), undefined);
});

test("a corrupt file is reported and never overwritten", async () => {
  const adapter = makeAdapter();
  const broken = "---\nname: Broken\n  nested: illegal\n---\n";
  adapter.files.set("Finance/Investment/Accumulation/plans/broken.md", broken);

  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();

  assert.equal(store.getPlans().length, 0);
  assert.equal(store.getBrokenPlans().length, 1);
  assert.equal(store.getBrokenPlans()[0].path, "Finance/Investment/Accumulation/plans/broken.md");
  // 冻结写入：原文必须一字不动
  assert.equal(adapter.files.get("Finance/Investment/Accumulation/plans/broken.md"), broken);
  assert.ok(store.getWarnings().some((w) => w.code === "file.parseFailed"));
});

test("legacy settings without the accumulation folder still resolve to the default", async () => {
  const adapter = makeAdapter();
  const store = new AccumulationStore(makePlugin(adapter), "Finance/Investment/Accumulation");
  await store.load();
  assert.ok(adapter.files.size === 0);
  assert.equal(store.getFolderPath(), "Finance/Investment/Accumulation");
});
