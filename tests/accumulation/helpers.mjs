/** 测试用的对象构造器：只造数据，不做断言。 */

export function makeStage(overrides = {}) {
  return {
    order: 1,
    label: "stage",
    kind: "left",
    triggerMode: "drop",
    anchorPrice: 100,
    dropPct: 8,
    plannedCents: 1000000,
    requiresConfirm: false,
    ...overrides,
  };
}

export function makeTrade(overrides = {}) {
  return {
    id: `t${Math.random().toString(36).slice(2, 8)}`,
    date: "2026-01-01",
    stageOrder: 1,
    side: "buy",
    price: 10,
    quantity: 100,
    amountCents: 100000,
    feeCents: 0,
    note: "",
    ...overrides,
  };
}

export function makePlan(overrides = {}) {
  return {
    id: "pl_test",
    name: "Test",
    symbol: "TEST",
    market: "CN",
    assetType: "stock",
    currency: "CNY",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01T00:00:00.000Z",
    totalBudgetCents: 12500000,
    referencePrice: 100,
    currentPrice: 100,
    reserveRatio: 0,
    amountMode: "custom",
    requireConfirmDefault: true,
    stages: [],
    trades: [],
    prices: [],
    adjustments: [],
    logic: "",
    review: "",
    extraFrontmatter: [],
    unknownSections: [],
    orphanRows: {},
    warnings: [],
    ...overrides,
  };
}
