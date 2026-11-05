import test from "node:test";
import assert from "node:assert/strict";
import { makePlan, makeStage, makeTrade } from "./helpers.mjs";

const acc = await import(process.env.ACC_BUNDLE);
const {
  applyTrade,
  emptyPosition,
  PositionCalculator,
  computeTriggerPrice,
  buildStageViews,
  budgetCheck,
  nextAction,
  buildCompareRows,
  computeDrawdown,
  computePlanMetrics,
  derivePlanStatus,
  planProgressPct,
  resolveFxRate,
  toListRow,
  filterPlanRows,
  sortPlanRows,
  sumPlansInCny,
  autoAmountCents,
} = acc;

test("moving weighted average cost includes fees", () => {
  const position = PositionCalculator.compute([
    makeTrade({ price: 10, quantity: 100, amountCents: 100000, feeCents: 500 }),
    makeTrade({ id: "t2", date: "2026-01-02", price: 20, quantity: 100, amountCents: 200000, feeCents: 500 }),
  ]);
  assert.equal(position.shares, 200);
  assert.equal(position.costBasisCents, 301000);
  assert.equal(position.avgCost, 15.05);
  assert.equal(position.investedCents, 301000);
});

test("partial sell realises P/L at the single rounding point and keeps avg cost", () => {
  let position = PositionCalculator.compute([
    makeTrade({ price: 10, quantity: 100, amountCents: 100000, feeCents: 500 }),
    makeTrade({ id: "t2", date: "2026-01-02", price: 20, quantity: 100, amountCents: 200000, feeCents: 500 }),
  ]);
  position = applyTrade(
    position,
    makeTrade({
      id: "s1",
      date: "2026-02-01",
      side: "sell",
      price: 25,
      quantity: 50,
      amountCents: 125000,
      feeCents: 300,
      stageOrder: null,
    }),
  );
  assert.equal(position.shares, 150);
  assert.equal(position.costBasisCents, 225750);
  assert.equal(position.realizedPnlCents, 49450);
  assert.equal(position.avgCost, 15.05);
});

test("full liquidation clears the cost basis and folds the residual into realised P/L", () => {
  let position = PositionCalculator.compute([
    makeTrade({ price: 10, quantity: 100, amountCents: 100000, feeCents: 500 }),
    makeTrade({ id: "t2", date: "2026-01-02", price: 20, quantity: 100, amountCents: 200000, feeCents: 500 }),
    makeTrade({ id: "s1", date: "2026-02-01", side: "sell", price: 25, quantity: 50, amountCents: 125000, feeCents: 300, stageOrder: null }),
  ]);
  position = applyTrade(
    position,
    makeTrade({
      id: "s2",
      date: "2026-02-02",
      side: "sell",
      price: 25,
      quantity: 150,
      amountCents: 375000,
      feeCents: 300,
      stageOrder: null,
    }),
  );
  assert.equal(position.shares, 0);
  assert.equal(position.costBasisCents, 0);
  assert.equal(position.avgCost, 0);
  assert.equal(position.realizedPnlCents, 198400);
  // 净投入 = 300500 - 499400 = -198400，与已实现盈亏互为镜像
  assert.equal(position.investedCents, -198400);
});

test("selling more than held is rejected instead of going negative", () => {
  const position = applyTrade(
    PositionCalculator.compute([makeTrade({ price: 10, quantity: 10, amountCents: 10000 })]),
    makeTrade({ id: "s1", date: "2026-02-01", side: "sell", price: 20, quantity: 99, amountCents: 198000 }),
  );
  assert.equal(position.shares, 10);
  assert.equal(position.invalidSellCount, 1);
});

test("fees count towards the budget, so remaining budget is exact", () => {
  const plan = makePlan({
    totalBudgetCents: 1000000,
    trades: [makeTrade({ amountCents: 100000, feeCents: 500 })],
  });
  const metrics = computePlanMetrics(plan);
  assert.equal(metrics.investedCents, 100500);
  assert.equal(metrics.remainingBudgetCents, 899500);
});

test("budget check: over-allocated, exact, and deliberately unallocated", () => {
  const base = { totalBudgetCents: 1000000, reserveRatio: 20 };
  const over = budgetCheck(
    makePlan({
      ...base,
      stages: [makeStage({ order: 1, plannedCents: 400000 }), makeStage({ order: 2, plannedCents: 500000 })],
    }),
  );
  assert.equal(over.reservedCents, 200000);
  assert.equal(over.deployableCents, 800000);
  assert.equal(over.allocatedCents, 900000);
  assert.equal(over.unallocatedCents, -100000);
  assert.equal(over.overAllocated, true);

  const exact = budgetCheck(
    makePlan({
      ...base,
      stages: [makeStage({ order: 1, plannedCents: 400000 }), makeStage({ order: 2, plannedCents: 400000 })],
    }),
  );
  assert.equal(exact.overAllocated, false);

  const slack = budgetCheck(makePlan({ ...base, stages: [makeStage({ order: 1, plannedCents: 100000 })] }));
  assert.equal(slack.overAllocated, false);
  assert.equal(slack.unallocatedCents, 700000);
  assert.equal(Math.round(slack.stageRatios[0] * 100) / 100, 12.5);
});

test("stage status walks pending → triggered → partial → completed", () => {
  const plan = makePlan({
    referencePrice: 100,
    currentPrice: 100,
    totalBudgetCents: 1000000,
    stages: [makeStage({ order: 1, anchorPrice: 100, dropPct: 0, plannedCents: 1000000 })],
  });
  assert.equal(buildStageViews(plan)[0].status, "triggered");

  plan.currentPrice = 120;
  assert.equal(buildStageViews(plan)[0].status, "pending");

  plan.currentPrice = 100;
  plan.trades = [makeTrade({ amountCents: 400000, stageOrder: 1 })];
  assert.equal(buildStageViews(plan)[0].status, "partial");

  plan.trades = [makeTrade({ amountCents: 1000000, stageOrder: 1 })];
  assert.equal(buildStageViews(plan)[0].status, "completed");
});

test("voided beats skipped", () => {
  const plan = makePlan({
    stages: [makeStage({ order: 1, skippedAt: "2026-02-01", voidedAt: "2026-02-02" })],
  });
  assert.equal(buildStageViews(plan)[0].status, "voided");
});

test("right-side stage never triggers on price, only on manual confirmation", () => {
  const plan = makePlan({
    referencePrice: 100,
    currentPrice: 150,
    stages: [
      makeStage({
        order: 1,
        kind: "right",
        triggerMode: "target",
        targetPrice: 130,
        plannedCents: 3000000,
        requiresConfirm: true,
      }),
    ],
  });
  assert.equal(buildStageViews(plan)[0].priceReached, false);
  assert.equal(buildStageViews(plan)[0].status, "pending");

  plan.currentPrice = 300;
  assert.equal(buildStageViews(plan)[0].status, "pending");

  plan.stages[0].confirmedAt = "2026-03-01";
  assert.equal(buildStageViews(plan)[0].priceReached, true);
  assert.equal(buildStageViews(plan)[0].status, "triggered");
});

test("trigger price is anchored to the reference price and never drifts with fills", () => {
  const stage = makeStage({ order: 1, anchorPrice: 1500, dropPct: 8 });
  assert.equal(computeTriggerPrice(stage), 1380);

  const plan = makePlan({
    referencePrice: 1500,
    currentPrice: 1200,
    stages: [stage],
    trades: [makeTrade({ price: 1402.5, quantity: 7, amountCents: 981750, feeCents: 500 })],
  });
  assert.equal(buildStageViews(plan)[0].triggerPrice, 1380);
  assert.equal(computeTriggerPrice(plan.stages[0]), 1380);
});

test("trigger mode switch keeps both parameters and is reversible", () => {
  const { applyTriggerMode } = acc;
  const original = [makeStage({ order: 1, anchorPrice: 100, dropPct: 8 })];
  const asTarget = applyTriggerMode(original, "target");
  assert.equal(asTarget[0].triggerMode, "target");
  assert.equal(asTarget[0].targetPrice, 92);

  const backToDrop = applyTriggerMode(asTarget, "drop");
  assert.equal(backToDrop[0].triggerMode, "drop");
  assert.equal(backToDrop[0].dropPct, 8);
});

test("next action skips settled stages and honours the right-side ordering rule", () => {
  const plan = makePlan({
    totalBudgetCents: 3000000,
    referencePrice: 100,
    currentPrice: 95,
    stages: [
      makeStage({ order: 1, anchorPrice: 100, dropPct: 0, plannedCents: 1000000 }),
      makeStage({ order: 2, anchorPrice: 100, dropPct: 8, plannedCents: 1000000 }),
      makeStage({ order: 3, kind: "right", triggerMode: "target", targetPrice: 120, plannedCents: 1000000 }),
    ],
    trades: [makeTrade({ amountCents: 1000000, stageOrder: 1 })],
  });
  const next = nextAction(plan);
  assert.equal(next.stageOrder, 2);
  assert.equal(next.triggerPrice, 92);
  // 现价 95 仍在触发价 92 之上 → 尚未触发，但已是下一档候选
  assert.equal(next.priceReached, false);
  assert.ok(next.distancePct > 0);

  plan.currentPrice = 90;
  assert.equal(nextAction(plan).priceReached, true);

  plan.stages[1].skippedAt = "2026-02-01";
  assert.equal(nextAction(plan).stageOrder, 3);

  plan.stages[2].skippedAt = "2026-02-02";
  assert.equal(nextAction(plan), null);
});

test("plan progress only counts capped actual amounts", () => {
  const plan = makePlan({
    referencePrice: 100,
    currentPrice: 100,
    stages: [
      makeStage({ order: 1, plannedCents: 1000000, dropPct: 0 }),
      makeStage({ order: 2, plannedCents: 1000000, dropPct: 10 }),
    ],
    trades: [
      makeTrade({ amountCents: 500000, stageOrder: 1 }),
      makeTrade({ id: "t2", date: "2026-01-02", amountCents: 1800000, stageOrder: 2 }),
    ],
  });
  const views = buildStageViews(plan);
  assert.equal(planProgressPct(views), 75);
  assert.equal(derivePlanStatus(plan, views), "active");
});

test("compare rows carry deviation, skip reason and unassigned trades", () => {
  const plan = makePlan({
    totalBudgetCents: 2000000,
    referencePrice: 100,
    stages: [
      makeStage({ order: 1, plannedCents: 1000000, dropPct: 0 }),
      makeStage({ order: 2, plannedCents: 1000000, dropPct: 10, skippedAt: "2026-02-01", skipReason: "逻辑变了" }),
    ],
    trades: [
      makeTrade({ amountCents: 600000, stageOrder: 1 }),
      makeTrade({ id: "t2", date: "2026-01-03", amountCents: 200000, feeCents: 0, stageOrder: null }),
    ],
  });
  const rows = buildCompareRows(plan);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].deviationCents, -400000);
  assert.equal(rows[1].status, "skipped");
  assert.equal(rows[1].skipReason, "逻辑变了");
  assert.equal(rows[2].stageOrder, 0);
  assert.equal(rows[2].actualCents, 200000);
});

test("max drawdown needs at least two price points and never fakes a number", () => {
  const plan = makePlan({
    trades: [makeTrade({ amountCents: 100000, feeCents: 0, price: 10, quantity: 100 })],
    prices: [{ date: "2026-01-05", price: 9, note: "" }],
  });
  const incomplete = computeDrawdown(plan);
  assert.equal(incomplete.incomplete, true);
  assert.equal(incomplete.maxLossPct, null);

  plan.prices = [
    { date: "2026-01-05", price: 9, note: "" },
    { date: "2026-01-06", price: 12, note: "" },
    { date: "2026-01-07", price: 10, note: "" },
  ];
  const result = computeDrawdown(plan);
  assert.equal(result.incomplete, false);
  assert.equal(result.sampleCount, 3);
  assert.equal(result.maxLossPct, -10);
  assert.equal(result.maxGainPct, 20);
});

test("fx rate resolution falls back in the documented order", () => {
  const plan = makePlan({ currency: "USD", symbol: "AAPL", fxRateOverride: 7.5 });
  const holdings = [{ symbol: "AAPL", currency: "USD", fxRate: 7.2 }];
  assert.equal(resolveFxRate(plan, holdings, { USD: 7.1 }), 7.5);

  plan.fxRateOverride = undefined;
  assert.equal(resolveFxRate(plan, holdings, { USD: 7.1 }), 7.2);

  assert.equal(resolveFxRate(plan, [], { USD: 7.1 }), 7.1);
  assert.equal(resolveFxRate(makePlan({ currency: "CNY" }), [], {}), 1);
});

test("list rows can be filtered, sorted and summed across currencies", () => {
  const winning = makePlan({
    id: "a",
    symbol: "AAA",
    totalBudgetCents: 1000000,
    referencePrice: 10,
    currentPrice: 12,
    trades: [makeTrade({ price: 10, quantity: 1000, amountCents: 1000000, feeCents: 0 })],
  });
  const losing = makePlan({
    id: "b",
    symbol: "BBB",
    market: "US",
    currency: "USD",
    totalBudgetCents: 2000000,
    referencePrice: 20,
    currentPrice: 15,
    trades: [makeTrade({ price: 20, quantity: 1000, amountCents: 2000000, feeCents: 0 })],
  });

  const rows = [toListRow(winning, 1), toListRow(losing, 7.1)];
  assert.equal(filterPlanRows(rows, { market: "US", assetType: "all", status: "all" }).length, 1);
  assert.equal(filterPlanRows(rows, { market: "all", assetType: "all", status: "all" }).length, 2);

  const byPnl = sortPlanRows(rows, "pnl", "desc");
  assert.equal(byPnl[0].plan.id, "a"); // +200 元 vs -5000 美元折算后的负值

  const totals = sumPlansInCny(rows);
  // 跨币种汇总必须先折算，不能直接把美元分和人民币分相加
  assert.equal(totals.budgetCents, 1000000 + Math.round(2000000 * 7.1));
  assert.equal(totals.investedCents, 1000000 + Math.round(2000000 * 7.1));
});

test("auto amount rounds price × quantity to cents", () => {
  assert.equal(autoAmountCents(1290.88, 47), 6067136);
  assert.equal(autoAmountCents(0, 10), 0);
});

test("empty plan degrades gracefully", () => {
  const plan = makePlan({ stages: [], trades: [], prices: [] });
  const views = buildStageViews(plan);
  assert.deepEqual(views, []);
  assert.equal(nextAction(plan), null);
  assert.equal(budgetCheck(plan).allocatedCents, 0);
  assert.equal(computeDrawdown(plan).incomplete, true);
  assert.equal(computePlanMetrics(plan).shares, 0);
  assert.equal(derivePlanStatus(plan, views), "pending");
  assert.equal(emptyPosition().shares, 0);
});
