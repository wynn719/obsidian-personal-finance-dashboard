export type Locale = "en" | "zh";

interface TranslationStrings {
  // Dashboard
  "dashboard.title": string;
  "dashboard.btn.addSnapshot": string;
  "dashboard.btn.addCashFlow": string;
  "dashboard.btn.addDividend": string;
  "dashboard.btn.editHoldings": string;
  "dashboard.btn.refresh": string;
  "dashboard.btn.maskNumbers": string;

  // Page tabs
  "tab.workbench": string;
  "tab.assets": string;

  // Metric cards
  "metrics.totalAssets": string;
  "metrics.momChange": string;
  "metrics.monthlyIncome": string;
  "metrics.monthlyExpense": string;
  "metrics.monthlySurplus": string;
  "metrics.yearlyDividends": string;
  "metrics.unit": string;

  // Asset allocation
  "allocation.title": string;
  "allocation.empty": string;
  "allocation.col.category": string;
  "allocation.col.amount": string;
  "allocation.col.currentPercent": string;
  "allocation.col.targetPercent": string;
  "allocation.col.deviation": string;
  "allocation.col.rebalance": string;
  "allocation.rebalance.buy": string;
  "allocation.rebalance.sell": string;
  "allocation.rebalance.hold": string;
  "allocation.total": string;

  // Charts
  "chart.assetDistribution": string;
  "chart.monthlyIncomeVsExpense": string;
  "chart.noData": string;
  "chart.income": string;
  "chart.expense": string;
  "chart.netCashFlow": string;
  "chart.monthlyTotalAssets": string;

  // Monthly overview
  "overview.title": string;
  "overview.empty": string;
  "overview.col.month": string;
  "overview.col.salary": string;
  "overview.col.otherIncome": string;
  "overview.col.totalAssets": string;
  "overview.col.momPercent": string;
  "overview.col.investReturn": string;
  "overview.col.note": string;
  "overview.col.actions": string;
  "overview.deleteConfirm": string;

  // Dividend summary
  "dividend.title": string;
  "dividend.empty": string;
  "dividend.col.stock": string;
  "dividend.col.amounts": string;
  "dividend.col.total": string;
  "dividend.grandTotal": string;

  // Cash flow records
  "cashFlow.title": string;
  "cashFlow.empty": string;
  "cashFlow.col.date": string;
  "cashFlow.col.type": string;
  "cashFlow.col.category": string;
  "cashFlow.col.amount": string;
  "cashFlow.col.note": string;
  "cashFlow.col.actions": string;
  "cashFlow.filter.all": string;
  "cashFlow.filter.income": string;
  "cashFlow.filter.expense": string;
  "cashFlow.type.income": string;
  "cashFlow.type.expense": string;
  "cashFlow.deleteConfirm": string;
  "cashFlow.showingRecords": string;

  // Asset snapshot modal
  "modal.snapshot.titleAdd": string;
  "modal.snapshot.titleEdit": string;
  "modal.snapshot.month": string;
  "modal.snapshot.monthDesc": string;
  "modal.snapshot.monthPlaceholder": string;
  "modal.snapshot.categories": string;
  "modal.snapshot.categoryDesc": string;
  "modal.snapshot.detailsPlaceholder": string;
  "modal.snapshot.note": string;
  "modal.snapshot.noteDesc": string;
  "modal.snapshot.notePlaceholder": string;
  "modal.snapshot.save": string;
  "modal.snapshot.invalidMonth": string;
  "modal.snapshot.invalidAmount": string;
  "modal.snapshot.overwriteConfirm": string;
  "modal.snapshot.saved": string;

  // Cash flow modal
  "modal.cashFlow.titleAdd": string;
  "modal.cashFlow.titleEdit": string;
  "modal.cashFlow.type": string;
  "modal.cashFlow.typeIncome": string;
  "modal.cashFlow.typeExpense": string;
  "modal.cashFlow.date": string;
  "modal.cashFlow.amount": string;
  "modal.cashFlow.amountPlaceholder": string;
  "modal.cashFlow.category": string;
  "modal.cashFlow.categorySelect": string;
  "modal.cashFlow.note": string;
  "modal.cashFlow.notePlaceholder": string;
  "modal.cashFlow.save": string;
  "modal.cashFlow.invalidDate": string;
  "modal.cashFlow.invalidAmount": string;
  "modal.cashFlow.invalidCategory": string;
  "modal.cashFlow.savedIncome": string;
  "modal.cashFlow.savedExpense": string;

  // Dividend modal
  "modal.dividend.titleAdd": string;
  "modal.dividend.titleEdit": string;
  "modal.dividend.date": string;
  "modal.dividend.stockName": string;
  "modal.dividend.stockNameDesc": string;
  "modal.dividend.stockNamePlaceholder": string;
  "modal.dividend.amount": string;
  "modal.dividend.amountPlaceholder": string;
  "modal.dividend.note": string;
  "modal.dividend.notePlaceholder": string;
  "modal.dividend.save": string;
  "modal.dividend.invalidDate": string;
  "modal.dividend.invalidStockName": string;
  "modal.dividend.invalidAmount": string;
  "modal.dividend.saved": string;

  // Holdings module (stock allocation, embedded in dashboard)
  "holdings.totalValue": string;
  "holdings.holdingCount": string;
  "holdings.chartTitle": string;
  "holdings.tableTitle": string;
  "holdings.col.name": string;
  "holdings.col.amount": string;
  "holdings.col.share": string;
  "holdings.col.actions": string;
  "holdings.empty": string;
  "holdings.deleteConfirm": string;
  "holdings.btn.addHolding": string;
  "holdings.btn.refreshQuotes": string;
  "holdings.col.price": string;
  "holdings.col.change": string;
  "holdings.col.shares": string;
  "holdings.quoteUpdated": string;
  "holdings.quoteUpdatedAt": string;
  "holdings.quoteFailed": string;
  "holdings.currency": string;

  // Holding modal
  "modal.holding.titleAdd": string;
  "modal.holding.titleEdit": string;
  "modal.holding.name": string;
  "modal.holding.namePlaceholder": string;
  "modal.holding.symbol": string;
  "modal.holding.symbolPlaceholder": string;
  "modal.holding.symbolHint": string;
  "modal.holding.checking": string;
  "modal.holding.currency": string;
  "modal.holding.nameAutoHint": string;
  "modal.holding.shares": string;
  "modal.holding.sharesPlaceholder": string;
  "modal.holding.save": string;
  "modal.holding.invalidSymbol": string;
  "modal.holding.invalidShares": string;
  "modal.holding.symbolNotFound": string;
  "modal.holding.saved": string;

  // Holdings manage modal
  "modal.holdingsManage.title": string;

  // Market signals: index MA250 signal / TTM dividend yields / ETF premiums
  "signal.title": string;
  "signal.col.close": string;
  "signal.col.ma250": string;
  "signal.col.deviation": string;
  "signal.col.vsMa": string;
  "signal.zone.buy": string;
  "signal.zone.hold": string;
  "signal.zone.sell": string;
  "signal.zone.overheat": string;
  "signal.advice.buy": string;
  "signal.advice.hold": string;
  "signal.advice.sell": string;
  "signal.advice.overheat": string;
  "signal.empty": string;
  "signal.btn.refresh": string;

  "dividendYield.title": string;
  "dividendYield.col.name": string;
  "dividendYield.col.ttm": string;
  "dividendYield.col.price": string;
  "dividendYield.col.yield": string;
  "dividendYield.pending": string;
  "dividendYield.sortNote": string;
  "dividendYield.empty": string;
  "dividendYield.btn.refresh": string;

  "etfPremium.title": string;
  "etfPremium.col.code": string;
  "etfPremium.col.name": string;
  "etfPremium.col.price": string;
  "etfPremium.col.premium": string;
  "etfPremium.col.fee": string;
  "etfPremium.col.scale": string;
  "etfPremium.filter.low": string;
  "etfPremium.filter.all": string;
  "etfPremium.empty": string;
  "etfPremium.noneLow.title": string;
  "etfPremium.noneLow.body": string;
  "etfPremium.btn.refresh": string;

  "market.updatedAt": string;
  "market.count": string;
  "market.refreshFailed": string;
  "market.partialFailed": string;

  // Accumulation (position tracker)
  "acc.title": string;
  "acc.btn.all": string;
  "acc.btn.new": string;
  "acc.btn.back": string;
  "acc.empty": string;
  "acc.empty.text": string;
  "acc.card.invested": string;
  "acc.card.next": string;
  "acc.card.done": string;
  "acc.card.pnl": string;
  "acc.warning.broken": string;
  "acc.warning.incomplete": string;
  "acc.warning.overBudget": string;
  "acc.warning.overInvested": string;
  "acc.warning.unallocated": string;
  "acc.warning.parse": string;

  "acc.list.title": string;
  "acc.list.empty": string;
  "acc.list.col.name": string;
  "acc.list.col.market": string;
  "acc.list.col.assetType": string;
  "acc.list.col.price": string;
  "acc.list.col.avgCost": string;
  "acc.list.col.invested": string;
  "acc.list.col.remaining": string;
  "acc.list.col.pnl": string;
  "acc.list.col.progress": string;
  "acc.list.col.next": string;
  "acc.list.col.status": string;
  "acc.list.col.actions": string;
  "acc.list.total": string;
  "acc.filter.market": string;
  "acc.filter.assetType": string;
  "acc.filter.status": string;
  "acc.filter.all": string;
  "acc.sort.label": string;
  "acc.sort.pnl": string;
  "acc.sort.usage": string;
  "acc.sort.updatedAt": string;
  "acc.sort.nextTrigger": string;

  "acc.plan.status.pending": string;
  "acc.plan.status.active": string;
  "acc.plan.status.completed": string;
  "acc.plan.status.archived": string;
  "acc.stage.status.pending": string;
  "acc.stage.status.triggered": string;
  "acc.stage.status.partial": string;
  "acc.stage.status.completed": string;
  "acc.stage.status.skipped": string;
  "acc.stage.status.voided": string;
  "acc.stage.kind.first": string;
  "acc.stage.kind.left": string;
  "acc.stage.kind.right": string;
  "acc.stage.mode.drop": string;
  "acc.stage.mode.target": string;
  "acc.stage.col.trigger": string;
  "acc.stage.col.planned": string;
  "acc.stage.col.actual": string;
  "acc.stage.col.status": string;
  "acc.stage.col.tradeDate": string;
  "acc.stage.col.reached": string;
  "acc.stage.reached.yes": string;
  "acc.stage.reached.no": string;

  "acc.market.CN": string;
  "acc.market.HK": string;
  "acc.market.US": string;
  "acc.market.OTHER": string;
  "acc.assetType.stock": string;
  "acc.assetType.etf": string;
  "acc.assetType.fund": string;
  "acc.assetType.bond": string;
  "acc.assetType.other": string;

  "acc.form.titleCreate": string;
  "acc.form.titleEdit": string;
  "acc.form.section.basic": string;
  "acc.form.section.budget": string;
  "acc.form.section.strategy": string;
  "acc.form.section.text": string;
  "acc.form.name": string;
  "acc.form.symbol": string;
  "acc.form.market": string;
  "acc.form.assetType": string;
  "acc.form.currency": string;
  "acc.form.createdAt": string;
  "acc.form.totalBudget": string;
  "acc.form.refPrice": string;
  "acc.form.currentPrice": string;
  "acc.form.reserveRatio": string;
  "acc.form.triggerMode": string;
  "acc.form.amountMode": string;
  "acc.form.amountMode.fixed": string;
  "acc.form.amountMode.ladder": string;
  "acc.form.amountMode.custom": string;
  "acc.form.requireConfirm": string;
  "acc.form.logic": string;
  "acc.form.review": string;
  "acc.form.stage.add": string;
  "acc.form.stage.remove": string;
  "acc.form.stage.label": string;
  "acc.form.stage.kind": string;
  "acc.form.stage.drop": string;
  "acc.form.stage.target": string;
  "acc.form.stage.planned": string;
  "acc.form.template": string;
  "acc.form.templateHint": string;
  "acc.form.reserved": string;
  "acc.form.deployable": string;
  "acc.form.allocated": string;
  "acc.form.unallocated": string;
  "acc.form.stageRatio": string;
  "acc.form.overBudgetConfirm": string;
  "acc.form.err.name": string;
  "acc.form.err.symbol": string;
  "acc.form.err.budget": string;
  "acc.form.err.refPrice": string;
  "acc.form.err.stageAmount": string;
  "acc.form.err.stageEmpty": string;
  "acc.form.saved": string;
  "acc.form.save": string;
  "acc.form.cancel": string;

  "acc.detail.metric.totalBudget": string;
  "acc.detail.metric.invested": string;
  "acc.detail.metric.remaining": string;
  "acc.detail.metric.usage": string;
  "acc.detail.metric.shares": string;
  "acc.detail.metric.avgCost": string;
  "acc.detail.metric.price": string;
  "acc.detail.metric.marketValue": string;
  "acc.detail.metric.pnl": string;
  "acc.detail.metric.pnlRate": string;
  "acc.detail.next.title": string;
  "acc.detail.next.stage": string;
  "acc.detail.next.trigger": string;
  "acc.detail.next.distance": string;
  "acc.detail.next.planned": string;
  "acc.detail.next.remaining": string;
  "acc.detail.next.reached": string;
  "acc.detail.next.confirmHint": string;
  "acc.detail.next.btn.trade": string;
  "acc.detail.next.btn.skip": string;
  "acc.detail.next.btn.confirm": string;
  "acc.detail.next.waitingLeft": string;
  "acc.detail.next.below": string;
  "acc.detail.next.above": string;
  "acc.detail.maxLoss": string;
  "acc.detail.maxGain": string;
  "acc.detail.next.none": string;
  "acc.detail.stages": string;
  "acc.detail.compare": string;
  "acc.detail.trades": string;
  "acc.detail.adjustments": string;
  "acc.detail.logic": string;
  "acc.detail.review": string;
  "acc.detail.price.title": string;
  "acc.detail.price.date": string;
  "acc.detail.price.value": string;
  "acc.detail.price.note": string;
  "acc.detail.price.save": string;
  "acc.detail.price.saved": string;
  "acc.detail.textEdit": string;
  "acc.detail.textSave": string;
  "acc.detail.textSaved": string;
  "acc.detail.overview": string;

  "acc.compare.col.stage": string;
  "acc.compare.col.planned": string;
  "acc.compare.col.actual": string;
  "acc.compare.col.deviation": string;
  "acc.compare.col.planUsage": string;
  "acc.compare.col.actualUsage": string;
  "acc.compare.total": string;
  "acc.compare.unassigned": string;

  "acc.trade.titleCreate": string;
  "acc.trade.titleEdit": string;
  "acc.trade.date": string;
  "acc.trade.stage": string;
  "acc.trade.side": string;
  "acc.trade.price": string;
  "acc.trade.qty": string;
  "acc.trade.amount": string;
  "acc.trade.fee": string;
  "acc.trade.note": string;
  "acc.trade.autoAmount": string;
  "acc.trade.deleteConfirm": string;
  "acc.trade.err.price": string;
  "acc.trade.err.qty": string;
  "acc.trade.saved": string;
  "acc.trade.side.buy": string;
  "acc.trade.side.sell": string;

  "acc.action.archive": string;
  "acc.action.archiveConfirm": string;
  "acc.action.archived": string;
  "acc.action.delete": string;
  "acc.action.deleteConfirm": string;
  "acc.action.deleteFailed": string;
  "acc.action.skip": string;
  "acc.action.skipPrompt": string;
  "acc.action.markConfirmed": string;
  "acc.action.editPlan": string;
  "acc.action.openFile": string;
  "acc.action.addTrade": string;

  "acc.err.writeFailed": string;
  "acc.err.brokenPlan": string;
  "acc.err.saveFailed": string;

  "acc.review.title": string;
  "acc.review.empty": string;

  // Commands & Ribbon
  "command.openDashboard": string;
  "command.addSnapshot": string;
  "command.addIncomeExpense": string;
  "command.addDividend": string;
  "command.refreshData": string;
  "command.addHolding": string;
  "command.addAccumulationPlan": string;
  "ribbon.openDashboard": string;

  // Year selector
  "dashboard.yearSelector": string;

  // Settings
  "settings.title": string;
  "settings.language": string;
  "settings.languageDesc": string;
  "settings.targetAllocation": string;
  "settings.targetAllocationDesc": string;
  "settings.targetTotal": string;
  "settings.targetWarning": string;
  "settings.dataFolderPath": string;
  "settings.dataFolderPathDesc": string;
  "settings.miscDataFilePath": string;
  "settings.miscDataFilePathDesc": string;
  "settings.miscDataFilePathInvalid": string;
  "settings.accumulationFolderPath": string;
  "settings.accumulationFolderPathDesc": string;
  "settings.fxRates": string;
  "settings.fxRatesDesc": string;
  "settings.fxRate.hkd": string;
  "settings.fxRate.usd": string;
  "settings.assetCategories": string;
  "settings.categories": string;
  "settings.categoriesDesc.asset": string;
  "settings.incomeCategories": string;
  "settings.categoriesDesc.income": string;
  "settings.expenseCategories": string;
  "settings.categoriesDesc.expense": string;
}

const en: TranslationStrings = {
  // Dashboard
  "dashboard.title": "Finance Dashboard",
  "dashboard.btn.addSnapshot": "Add Snapshot",
  "dashboard.btn.addCashFlow": "Add Income/Expense",
  "dashboard.btn.addDividend": "Add Dividend",
  "dashboard.btn.editHoldings": "Edit Holdings",
  "dashboard.btn.refresh": "Refresh",
  "dashboard.btn.maskNumbers": "Mask",

  // Page tabs
  "tab.workbench": "Workbench",
  "tab.assets": "Allocation",

  // Metric cards
  "metrics.totalAssets": "Total Assets",
  "metrics.momChange": "MoM Change",
  "metrics.monthlyIncome": "Monthly Income",
  "metrics.monthlyExpense": "Monthly Expense",
  "metrics.monthlySurplus": "Monthly Surplus",
  "metrics.yearlyDividends": "Yearly Dividends",
  "metrics.unit": "¥",

  // Asset allocation
  "allocation.title": "Asset Allocation",
  "allocation.empty":
    "No asset data for the current month. Add a snapshot to get started.",
  "allocation.col.category": "Category",
  "allocation.col.amount": "Amount (¥)",
  "allocation.col.currentPercent": "Current %",
  "allocation.col.targetPercent": "Target %",
  "allocation.col.deviation": "Deviation",
  "allocation.col.rebalance": "Rebalance",
  "allocation.rebalance.buy": "Buy {amount}",
  "allocation.rebalance.sell": "Sell {amount}",
  "allocation.rebalance.hold": "Hold",
  "allocation.total": "Total",

  // Charts
  "chart.assetDistribution": "Asset Distribution",
  "chart.monthlyIncomeVsExpense": "Monthly Income vs Expense",
  "chart.noData": "No data",
  "chart.income": "Income",
  "chart.expense": "Expense",
  "chart.netCashFlow": "Net Cash Flow",
  "chart.monthlyTotalAssets": "Monthly Total Assets",

  // Monthly overview
  "overview.title": "Monthly Overview",
  "overview.empty": "No data yet.",
  "overview.col.month": "Month",
  "overview.col.salary": "Salary",
  "overview.col.otherIncome": "Other Income",
  "overview.col.totalAssets": "Total Assets",
  "overview.col.momPercent": "MoM %",
  "overview.col.investReturn": "Invest Return",
  "overview.col.note": "Note",
  "overview.col.actions": "Actions",
  "overview.deleteConfirm":
    "Delete all data for {month}? This will remove the asset snapshot and all related cash flow records for this month.",

  // Dividend summary
  "dividend.title": "Dividend Summary",
  "dividend.empty": "No dividend records this year.",
  "dividend.col.stock": "Stock",
  "dividend.col.amounts": "Amounts",
  "dividend.col.total": "Total",
  "dividend.grandTotal": "Grand Total",

  // Cash flow records
  "cashFlow.title": "Cash Flow Records",
  "cashFlow.empty": "No records yet.",
  "cashFlow.col.date": "Date",
  "cashFlow.col.type": "Type",
  "cashFlow.col.category": "Category",
  "cashFlow.col.amount": "Amount",
  "cashFlow.col.note": "Note",
  "cashFlow.col.actions": "Actions",
  "cashFlow.filter.all": "All",
  "cashFlow.filter.income": "Income",
  "cashFlow.filter.expense": "Expense",
  "cashFlow.type.income": "Income",
  "cashFlow.type.expense": "Expense",
  "cashFlow.deleteConfirm": "Delete this record?",
  "cashFlow.showingRecords": "Showing 50 of {count} records",

  // Asset snapshot modal
  "modal.snapshot.titleAdd": "Add Asset Snapshot",
  "modal.snapshot.titleEdit": "Edit Asset Snapshot",
  "modal.snapshot.month": "Month",
  "modal.snapshot.monthDesc": "Select the month for this snapshot",
  "modal.snapshot.monthPlaceholder": "YYYY-MM",
  "modal.snapshot.categories": "Asset Categories",
  "modal.snapshot.categoryDesc": "Enter total amount for this category",
  "modal.snapshot.detailsPlaceholder": "Details (optional)",
  "modal.snapshot.note": "Note",
  "modal.snapshot.noteDesc": "Optional note for this month",
  "modal.snapshot.notePlaceholder": "e.g. Market crash",
  "modal.snapshot.save": "Save",
  "modal.snapshot.invalidMonth": "Please enter a valid month (YYYY-MM)",
  "modal.snapshot.invalidAmount": "Invalid amount for {category}",
  "modal.snapshot.overwriteConfirm":
    "A snapshot for {month} already exists. Overwrite?",
  "modal.snapshot.saved": "Asset snapshot for {month} saved!",

  // Cash flow modal
  "modal.cashFlow.titleAdd": "Add Income / Expense",
  "modal.cashFlow.titleEdit": "Edit Record",
  "modal.cashFlow.type": "Type",
  "modal.cashFlow.typeIncome": "Income",
  "modal.cashFlow.typeExpense": "Expense",
  "modal.cashFlow.date": "Date",
  "modal.cashFlow.amount": "Amount",
  "modal.cashFlow.amountPlaceholder": "Enter amount",
  "modal.cashFlow.category": "Category",
  "modal.cashFlow.categorySelect": "-- Select --",
  "modal.cashFlow.note": "Note",
  "modal.cashFlow.notePlaceholder": "Optional note",
  "modal.cashFlow.save": "Save",
  "modal.cashFlow.invalidDate": "Please select a date",
  "modal.cashFlow.invalidAmount": "Please enter a valid positive amount",
  "modal.cashFlow.invalidCategory": "Please select a category",
  "modal.cashFlow.savedIncome": "Income record saved!",
  "modal.cashFlow.savedExpense": "Expense record saved!",

  // Dividend modal
  "modal.dividend.titleAdd": "Add Dividend",
  "modal.dividend.titleEdit": "Edit Dividend",
  "modal.dividend.date": "Date",
  "modal.dividend.stockName": "Stock Name",
  "modal.dividend.stockNameDesc": "Name of the stock paying dividend",
  "modal.dividend.stockNamePlaceholder": "e.g. Apple",
  "modal.dividend.amount": "Amount",
  "modal.dividend.amountPlaceholder": "Dividend amount",
  "modal.dividend.note": "Note",
  "modal.dividend.notePlaceholder": "Optional note",
  "modal.dividend.save": "Save",
  "modal.dividend.invalidDate": "Please select a date",
  "modal.dividend.invalidStockName": "Please enter a stock name",
  "modal.dividend.invalidAmount": "Please enter a valid positive amount",
  "modal.dividend.saved": "Dividend record saved!",

  // Holdings view (stock allocation)
  "holdings.totalValue": "Total Holdings Value",
  "holdings.holdingCount": "{count} holdings",
  "holdings.chartTitle": "Stock Holdings Treemap",
  "holdings.tableTitle": "Holdings Details",
  "holdings.col.name": "Name",
  "holdings.col.amount": "Amount",
  "holdings.col.share": "Share",
  "holdings.col.actions": "Actions",
  "holdings.empty": "No holdings yet. Click \"Add Holding\" to create one.",
  "holdings.deleteConfirm": "Delete this holding?",
  "holdings.btn.addHolding": "Add Holding",
  "holdings.btn.refreshQuotes": "Refresh Quotes",
  "holdings.col.price": "Price",
  "holdings.col.change": "Change",
  "holdings.col.shares": "Shares",
  "holdings.quoteUpdated": "Quotes updated ({success}/{total})",
  "holdings.quoteUpdatedAt": "Updated {time}",
  "holdings.quoteFailed": "Failed to fetch quotes",
  "holdings.currency": "Display currency",

  // Holding modal
  "modal.holding.titleAdd": "Add Stock Holding",
  "modal.holding.titleEdit": "Edit Stock Holding",
  "modal.holding.name": "Stock Name",
  "modal.holding.namePlaceholder": "Auto-filled from the stock code",
  "modal.holding.symbol": "Stock Code",
  "modal.holding.symbolPlaceholder": "e.g. 600036 / 00700 / AAPL",
  "modal.holding.symbolHint": "Name is fetched from the quote API after entering the code",
  "modal.holding.checking": "Looking up…",
  "modal.holding.currency": "Trading currency",
  "modal.holding.nameAutoHint": "Enter a valid stock code, the name fills in automatically",
  "modal.holding.shares": "Shares",
  "modal.holding.sharesPlaceholder": "Number of shares",
  "modal.holding.save": "Save",
  "modal.holding.invalidSymbol": "Please enter a stock code",
  "modal.holding.invalidShares": "Please enter a valid positive share count",
  "modal.holding.symbolNotFound": "Stock code not found",
  "modal.holding.saved": "Holding saved!",

  // Holdings manage modal
  "modal.holdingsManage.title": "Stock Holdings Details",

  // Market signals: index MA250 signal / TTM dividend yields / ETF premiums
  "signal.title": "Dividend Low-Vol 100 · MA250 Signal",
  "signal.col.close": "Close",
  "signal.col.ma250": "MA250",
  "signal.col.deviation": "Deviation",
  "signal.col.vsMa": "vs MA250",
  "signal.zone.buy": "Buy zone",
  "signal.zone.hold": "Hold zone",
  "signal.zone.sell": "Sell sweet spot",
  "signal.zone.overheat": "Overheated",
  "signal.advice.buy": "Below the annual line — accumulation zone.",
  "signal.advice.hold":
    "0–3% above the annual line — hold above the break-even line.",
  "signal.advice.sell":
    "Entering the sell sweet spot (+3%–+6%, sweet point ≈ +5%).",
  "signal.advice.overheat":
    "Overheated (above +6%) — opportunity cost rising.",
  "signal.empty": "No signal yet. Click refresh to fetch the index history.",
  "signal.btn.refresh": "Refresh index signal",

  "dividendYield.title": "High Dividend TTM",
  "dividendYield.col.name": "Name / Code",
  "dividendYield.col.ttm": "TTM / share",
  "dividendYield.col.price": "Price",
  "dividendYield.col.yield": "Yield",
  "dividendYield.pending":
    "The latest annual report ({period}) is not yet implemented; the annual part uses the previous implemented plan.",
  "dividendYield.empty": "No dividend yield data. Click refresh to fetch.",
  "dividendYield.sortNote": "Sorted by yield · 5% and above highlighted",
  "dividendYield.btn.refresh": "Refresh dividend yields",

  "etfPremium.title": "US ETF Premium Monitor",
  "etfPremium.col.code": "Code",
  "etfPremium.col.name": "Name",
  "etfPremium.col.price": "Price",
  "etfPremium.col.premium": "Premium",
  "etfPremium.col.fee": "Fee",
  "etfPremium.col.scale": "Scale (100M)",
  "etfPremium.filter.low": "≤3%",
  "etfPremium.filter.all": "All",
  "etfPremium.empty": "No premium data. Click refresh to fetch.",
  "etfPremium.noneLow.title": "All {count} ETFs are above {threshold}%",
  "etfPremium.noneLow.body":
    "Lowest: {name} +{pct}% — nothing under the threshold.",
  "etfPremium.btn.refresh": "Refresh ETF premiums",

  "market.updatedAt": "Updated {time}",
  "market.count": "{count} items",
  "market.refreshFailed": "Refresh failed — check your network and try again",
  "market.partialFailed": "{count} symbol(s) failed to fetch",

  // Accumulation (position tracker)
  "acc.title": "Position Tracker",
  "acc.btn.all": "All",
  "acc.btn.new": "New plan",
  "acc.btn.back": "Back",
  "acc.empty": "No accumulation plan yet",
  "acc.empty.text": "Nothing here yet",
  "acc.card.invested": "Invested",
  "acc.card.next": "Next at {price}",
  "acc.card.done": "All stages settled",
  "acc.card.pnl": "Unrealized P/L",
  "acc.warning.broken": "File could not be parsed — editing is frozen",
  "acc.warning.incomplete": "Incomplete data",
  "acc.warning.overBudget": "Stage amounts exceed the budget",
  "acc.warning.overInvested": "Invested more than the total budget",
  "acc.warning.unallocated": "{amount} left unallocated",
  "acc.warning.parse": "{count} line(s) could not be parsed and were kept as-is",

  "acc.list.title": "Accumulation Plans",
  "acc.list.empty": "No plan matches the current filters",
  "acc.list.col.name": "Symbol",
  "acc.list.col.market": "Market",
  "acc.list.col.assetType": "Type",
  "acc.list.col.price": "Price",
  "acc.list.col.avgCost": "Avg cost",
  "acc.list.col.invested": "Invested",
  "acc.list.col.remaining": "Remaining",
  "acc.list.col.pnl": "P/L",
  "acc.list.col.progress": "Progress",
  "acc.list.col.next": "Next buy",
  "acc.list.col.status": "Status",
  "acc.list.col.actions": "Actions",
  "acc.list.total": "Total (CNY)",
  "acc.filter.market": "Market",
  "acc.filter.assetType": "Type",
  "acc.filter.status": "Status",
  "acc.filter.all": "All",
  "acc.sort.label": "Sort",
  "acc.sort.pnl": "P/L",
  "acc.sort.usage": "Budget used",
  "acc.sort.updatedAt": "Updated",
  "acc.sort.nextTrigger": "Next trigger",

  "acc.plan.status.pending": "Not started",
  "acc.plan.status.active": "In progress",
  "acc.plan.status.completed": "Completed",
  "acc.plan.status.archived": "Archived",
  "acc.stage.status.pending": "Pending",
  "acc.stage.status.triggered": "Triggered",
  "acc.stage.status.partial": "Partial",
  "acc.stage.status.completed": "Done",
  "acc.stage.status.skipped": "Skipped",
  "acc.stage.status.voided": "Void",
  "acc.stage.kind.first": "Initial buy",
  "acc.stage.kind.left": "Add on dip",
  "acc.stage.kind.right": "Right-side confirm",
  "acc.stage.mode.drop": "Drawdown",
  "acc.stage.mode.target": "Target price",
  "acc.stage.col.trigger": "Trigger",
  "acc.stage.col.planned": "Planned",
  "acc.stage.col.actual": "Actual",
  "acc.stage.col.status": "Status",
  "acc.stage.col.tradeDate": "Date",
  "acc.stage.col.reached": "Reached",
  "acc.stage.reached.yes": "Reached",
  "acc.stage.reached.no": "Waiting",

  "acc.market.CN": "A-share",
  "acc.market.HK": "HK",
  "acc.market.US": "US",
  "acc.market.OTHER": "Other",
  "acc.assetType.stock": "Stock",
  "acc.assetType.etf": "ETF",
  "acc.assetType.fund": "Fund",
  "acc.assetType.bond": "Bond",
  "acc.assetType.other": "Other",

  "acc.form.titleCreate": "New Accumulation Plan",
  "acc.form.titleEdit": "Edit Accumulation Plan",
  "acc.form.section.basic": "Basics",
  "acc.form.section.budget": "Capital",
  "acc.form.section.strategy": "Strategy",
  "acc.form.section.text": "Notes",
  "acc.form.name": "Name",
  "acc.form.symbol": "Symbol",
  "acc.form.market": "Market",
  "acc.form.assetType": "Asset type",
  "acc.form.currency": "Currency",
  "acc.form.createdAt": "Created",
  "acc.form.totalBudget": "Total budget",
  "acc.form.refPrice": "Reference buy price",
  "acc.form.currentPrice": "Current price",
  "acc.form.reserveRatio": "Reserved %",
  "acc.form.triggerMode": "Trigger mode",
  "acc.form.amountMode": "Amount mode",
  "acc.form.amountMode.fixed": "Fixed",
  "acc.form.amountMode.ladder": "Increasing",
  "acc.form.amountMode.custom": "Custom",
  "acc.form.requireConfirm": "Manual confirm by default",
  "acc.form.logic": "Thesis",
  "acc.form.review": "Review",
  "acc.form.stage.add": "Add stage",
  "acc.form.stage.remove": "Remove",
  "acc.form.stage.label": "Label",
  "acc.form.stage.kind": "Kind",
  "acc.form.stage.drop": "Drop %",
  "acc.form.stage.target": "Target",
  "acc.form.stage.planned": "Amount",
  "acc.form.template": "Use template",
  "acc.form.templateHint": "0 / -8 / -15 / -25 / -35% then right-side confirm",
  "acc.form.reserved": "Reserved",
  "acc.form.deployable": "Deployable",
  "acc.form.allocated": "Allocated",
  "acc.form.unallocated": "Unallocated",
  "acc.form.stageRatio": "Stage share",
  "acc.form.overBudgetConfirm": "Stage amounts exceed the deployable budget. Save anyway?",
  "acc.form.err.name": "Name is required",
  "acc.form.err.symbol": "Symbol is required",
  "acc.form.err.budget": "Total budget must be greater than 0",
  "acc.form.err.refPrice": "Reference price must be greater than 0",
  "acc.form.err.stageAmount": "Every stage needs a non-negative amount",
  "acc.form.err.stageEmpty": "At least one stage is required",
  "acc.form.saved": "Plan saved",
  "acc.form.save": "Save",
  "acc.form.cancel": "Cancel",

  "acc.detail.metric.totalBudget": "Budget",
  "acc.detail.metric.invested": "Invested",
  "acc.detail.metric.remaining": "Remaining",
  "acc.detail.metric.usage": "Used",
  "acc.detail.metric.shares": "Shares",
  "acc.detail.metric.avgCost": "Avg cost",
  "acc.detail.metric.price": "Price",
  "acc.detail.metric.marketValue": "Market value",
  "acc.detail.metric.pnl": "Unrealized",
  "acc.detail.metric.pnlRate": "Return",
  "acc.detail.next.title": "Next Entry",
  "acc.detail.next.stage": "Stage",
  "acc.detail.next.trigger": "Trigger price",
  "acc.detail.next.distance": "Distance",
  "acc.detail.next.planned": "Planned",
  "acc.detail.next.remaining": "Remaining budget",
  "acc.detail.next.reached": "Price condition met — confirm before you buy",
  "acc.detail.next.confirmHint": "Right-side confirm is manual only. Price crossing never counts.",
  "acc.detail.next.btn.trade": "Record trade",
  "acc.detail.next.btn.skip": "Skip stage",
  "acc.detail.next.btn.confirm": "Mark confirmed",
  "acc.detail.next.waitingLeft": "Waiting for the left-side stages to settle",
  "acc.detail.next.below": "below {pct}",
  "acc.detail.next.above": "above {pct}",
  "acc.detail.maxLoss": "Max drawdown",
  "acc.detail.maxGain": "Max gain",
  "acc.detail.next.none": "All stages settled",
  "acc.detail.stages": "Stage Timeline",
  "acc.detail.compare": "Plan vs Actual",
  "acc.detail.trades": "Trades",
  "acc.detail.adjustments": "Plan Changes",
  "acc.detail.logic": "Thesis",
  "acc.detail.review": "Review",
  "acc.detail.price.title": "Update Price",
  "acc.detail.price.date": "Date",
  "acc.detail.price.value": "Price",
  "acc.detail.price.note": "Note",
  "acc.detail.price.save": "Save price",
  "acc.detail.price.saved": "Price updated",
  "acc.detail.textEdit": "Edit",
  "acc.detail.textSave": "Save text",
  "acc.detail.textSaved": "Text saved",
  "acc.detail.overview": "Overview",

  "acc.compare.col.stage": "Stage",
  "acc.compare.col.planned": "Planned",
  "acc.compare.col.actual": "Actual",
  "acc.compare.col.deviation": "Deviation",
  "acc.compare.col.planUsage": "Plan %",
  "acc.compare.col.actualUsage": "Actual %",
  "acc.compare.total": "Total",
  "acc.compare.unassigned": "Unassigned trades",

  "acc.trade.titleCreate": "Record Trade",
  "acc.trade.titleEdit": "Edit Trade",
  "acc.trade.date": "Date",
  "acc.trade.stage": "Stage",
  "acc.trade.side": "Side",
  "acc.trade.price": "Price",
  "acc.trade.qty": "Quantity",
  "acc.trade.amount": "Amount",
  "acc.trade.fee": "Fee",
  "acc.trade.note": "Note",
  "acc.trade.autoAmount": "Auto-calculated from price × quantity, editable",
  "acc.trade.deleteConfirm": "Delete this trade?",
  "acc.trade.err.price": "Price must be greater than 0",
  "acc.trade.err.qty": "Quantity must be greater than 0",
  "acc.trade.saved": "Trade saved",
  "acc.trade.side.buy": "Buy",
  "acc.trade.side.sell": "Sell",

  "acc.action.archive": "Archive",
  "acc.action.archiveConfirm": "Archive this plan? It moves to the archive folder.",
  "acc.action.archived": "Plan archived",
  "acc.action.delete": "Delete",
  "acc.action.deleteConfirm": "Delete this plan file? This cannot be undone.",
  "acc.action.deleteFailed": "Could not delete the plan file",
  "acc.action.skip": "Skip",
  "acc.action.skipPrompt": "Why skip this stage?",
  "acc.action.markConfirmed": "Mark confirmed",
  "acc.action.editPlan": "Edit plan",
  "acc.action.openFile": "Open source file",
  "acc.action.addTrade": "Add trade",

  "acc.err.writeFailed": "Failed to write the plan file",
  "acc.err.brokenPlan": "This plan file cannot be parsed, so it is read-only",
  "acc.err.saveFailed": "Save failed",

  "acc.review.title": "Review",
  "acc.review.empty": "Review lands in the next batch",

  // Commands & Ribbon
  "command.openDashboard": "Open Finance Dashboard",
  "command.addSnapshot": "Add Asset Snapshot",
  "command.addIncomeExpense": "Add Income/Expense",
  "command.addDividend": "Add Dividend",
  "command.refreshData": "Refresh Finance Data",
  "command.addHolding": "Add Stock Holding",
  "command.addAccumulationPlan": "New Accumulation Plan",
  "ribbon.openDashboard": "Open Finance Dashboard",

  // Year selector
  "dashboard.yearSelector": "Year",

  // Settings
  "settings.title": "Finance Dashboard Settings",
  "settings.language": "Language",
  "settings.languageDesc": "Select the display language for the plugin",
  "settings.targetAllocation": "Target Asset Allocation",
  "settings.targetAllocationDesc":
    "Set target percentages for each asset category. They should sum to 100%.",
  "settings.targetTotal": "Total: {total}%",
  "settings.targetWarning": " ⚠️ Should be 100%",
  "settings.dataFolderPath": "Data Folder Path",
  "settings.dataFolderPathDesc":
    "Path to the folder that stores yearly Markdown data files (relative to vault root, e.g. Finance)",
  "settings.miscDataFilePath": "Misc Data File Path",
  "settings.miscDataFilePathDesc":
    "Path to the Markdown file storing non-yearly data such as stock holdings (relative to vault root, e.g. Finance/Misc.md)",
  "settings.miscDataFilePathInvalid":
    "Misc data file path must not be a year-style file (e.g. Finance/2025.md) – it would collide with yearly data files.",
  "settings.accumulationFolderPath": "Accumulation Folder",
  "settings.accumulationFolderPathDesc":
    "Folder for accumulation plan files, one Markdown file per plan (relative to vault root, e.g. Finance/Investment/Accumulation). Independent of the yearly data folder.",
  "settings.fxRates": "Reference FX Rates",
  "settings.fxRatesDesc":
    "CNY per 1 unit of foreign currency. Used only for cross-currency aggregation once live holding quotes are unavailable.",
  "settings.fxRate.hkd": "HKD → CNY",
  "settings.fxRate.usd": "USD → CNY",
  "settings.assetCategories": "Asset Categories",
  "settings.categories": "Categories",
  "settings.categoriesDesc.asset": "Comma-separated list of asset categories",
  "settings.incomeCategories": "Income Categories",
  "settings.categoriesDesc.income": "Comma-separated list of income categories",
  "settings.expenseCategories": "Expense Categories",
  "settings.categoriesDesc.expense":
    "Comma-separated list of expense categories",
};

const zh: TranslationStrings = {
  // Dashboard
  "dashboard.title": "财务仪表盘",
  "dashboard.btn.addSnapshot": "添加资产快照",
  "dashboard.btn.addCashFlow": "添加收支记录",
  "dashboard.btn.addDividend": "添加股息记录",
  "dashboard.btn.editHoldings": "编辑股票持仓",
  "dashboard.btn.refresh": "刷新",
  "dashboard.btn.maskNumbers": "隐藏金额",

  // Page tabs
  "tab.workbench": "工作台",
  "tab.assets": "资产配置",

  // Metric cards
  "metrics.totalAssets": "总资产",
  "metrics.momChange": "环比变化",
  "metrics.monthlyIncome": "本月收入",
  "metrics.monthlyExpense": "本月支出",
  "metrics.monthlySurplus": "本月结余",
  "metrics.yearlyDividends": "年度股息",
  "metrics.unit": "元",

  // Asset allocation
  "allocation.title": "资产配置",
  "allocation.empty": "当前月份暂无资产数据，请先添加资产快照。",
  "allocation.col.category": "类别",
  "allocation.col.amount": "金额 (¥)",
  "allocation.col.currentPercent": "当前占比",
  "allocation.col.targetPercent": "目标占比",
  "allocation.col.deviation": "偏差",
  "allocation.col.rebalance": "调仓建议",
  "allocation.rebalance.buy": "买入 {amount}",
  "allocation.rebalance.sell": "卖出 {amount}",
  "allocation.rebalance.hold": "持有",
  "allocation.total": "合计",

  // Charts
  "chart.assetDistribution": "资产分布",
  "chart.monthlyIncomeVsExpense": "月度收支对比",
  "chart.noData": "暂无数据",
  "chart.income": "收入",
  "chart.expense": "支出",
  "chart.netCashFlow": "净现金流",
  "chart.monthlyTotalAssets": "月度总资产对比",

  // Monthly overview
  "overview.title": "月度总览",
  "overview.empty": "暂无数据。",
  "overview.col.month": "月份",
  "overview.col.salary": "工资",
  "overview.col.otherIncome": "其他收入",
  "overview.col.totalAssets": "总资产",
  "overview.col.momPercent": "环比 %",
  "overview.col.investReturn": "投资收益",
  "overview.col.note": "备注",
  "overview.col.actions": "操作",
  "overview.deleteConfirm":
    "确定删除 {month} 的所有数据吗？这将移除该月的资产快照及所有相关收支记录。",

  // Dividend summary
  "dividend.title": "股息汇总",
  "dividend.empty": "今年暂无股息记录。",
  "dividend.col.stock": "股票",
  "dividend.col.amounts": "金额明细",
  "dividend.col.total": "合计",
  "dividend.grandTotal": "总计",

  // Cash flow records
  "cashFlow.title": "收支记录",
  "cashFlow.empty": "暂无记录。",
  "cashFlow.col.date": "日期",
  "cashFlow.col.type": "类型",
  "cashFlow.col.category": "分类",
  "cashFlow.col.amount": "金额",
  "cashFlow.col.note": "备注",
  "cashFlow.col.actions": "操作",
  "cashFlow.filter.all": "全部",
  "cashFlow.filter.income": "收入",
  "cashFlow.filter.expense": "支出",
  "cashFlow.type.income": "收入",
  "cashFlow.type.expense": "支出",
  "cashFlow.deleteConfirm": "确定删除这条记录吗？",
  "cashFlow.showingRecords": "显示 {count} 条记录中的前 50 条",

  // Asset snapshot modal
  "modal.snapshot.titleAdd": "添加资产快照",
  "modal.snapshot.titleEdit": "编辑资产快照",
  "modal.snapshot.month": "月份",
  "modal.snapshot.monthDesc": "选择快照对应的月份",
  "modal.snapshot.monthPlaceholder": "YYYY-MM",
  "modal.snapshot.categories": "资产类别",
  "modal.snapshot.categoryDesc": "输入该类别的总金额",
  "modal.snapshot.detailsPlaceholder": "明细（可选）",
  "modal.snapshot.note": "备注",
  "modal.snapshot.noteDesc": "本月可选备注",
  "modal.snapshot.notePlaceholder": "如：港美股大跌",
  "modal.snapshot.save": "保存",
  "modal.snapshot.invalidMonth": "请输入有效的月份（YYYY-MM）",
  "modal.snapshot.invalidAmount": "{category} 的金额无效",
  "modal.snapshot.overwriteConfirm": "{month} 的快照已存在，是否覆盖？",
  "modal.snapshot.saved": "{month} 的资产快照已保存！",

  // Cash flow modal
  "modal.cashFlow.titleAdd": "添加收支记录",
  "modal.cashFlow.titleEdit": "编辑记录",
  "modal.cashFlow.type": "类型",
  "modal.cashFlow.typeIncome": "收入",
  "modal.cashFlow.typeExpense": "支出",
  "modal.cashFlow.date": "日期",
  "modal.cashFlow.amount": "金额",
  "modal.cashFlow.amountPlaceholder": "输入金额",
  "modal.cashFlow.category": "分类",
  "modal.cashFlow.categorySelect": "-- 请选择 --",
  "modal.cashFlow.note": "备注",
  "modal.cashFlow.notePlaceholder": "可选备注",
  "modal.cashFlow.save": "保存",
  "modal.cashFlow.invalidDate": "请选择日期",
  "modal.cashFlow.invalidAmount": "请输入有效的正数金额",
  "modal.cashFlow.invalidCategory": "请选择分类",
  "modal.cashFlow.savedIncome": "收入记录已保存！",
  "modal.cashFlow.savedExpense": "支出记录已保存！",

  // Dividend modal
  "modal.dividend.titleAdd": "添加股息记录",
  "modal.dividend.titleEdit": "编辑股息记录",
  "modal.dividend.date": "日期",
  "modal.dividend.stockName": "股票名称",
  "modal.dividend.stockNameDesc": "派息股票的名称",
  "modal.dividend.stockNamePlaceholder": "如：五粮液",
  "modal.dividend.amount": "金额",
  "modal.dividend.amountPlaceholder": "股息金额",
  "modal.dividend.note": "备注",
  "modal.dividend.notePlaceholder": "可选备注",
  "modal.dividend.save": "保存",
  "modal.dividend.invalidDate": "请选择日期",
  "modal.dividend.invalidStockName": "请输入股票名称",
  "modal.dividend.invalidAmount": "请输入有效的正数金额",
  "modal.dividend.saved": "股息记录已保存！",

  // Holdings view (stock allocation)
  "holdings.totalValue": "持仓总市值",
  "holdings.holdingCount": "{count} 条持仓",
  "holdings.chartTitle": "股票持仓占比",
  "holdings.tableTitle": "持仓明细",
  "holdings.col.name": "名称",
  "holdings.col.amount": "金额",
  "holdings.col.share": "占比",
  "holdings.col.actions": "操作",
  "holdings.empty": "暂无持仓数据，点击「添加持仓」开始记录。",
  "holdings.deleteConfirm": "确定删除这条持仓吗？",
  "holdings.btn.addHolding": "添加持仓",
  "holdings.btn.refreshQuotes": "刷新行情",
  "holdings.col.price": "现价",
  "holdings.col.change": "涨跌",
  "holdings.col.shares": "股数",
  "holdings.quoteUpdated": "行情已更新（{success}/{total}）",
  "holdings.quoteUpdatedAt": "更新于 {time}",
  "holdings.quoteFailed": "行情获取失败",
  "holdings.currency": "计价币种",

  // Holding modal
  "modal.holding.titleAdd": "添加股票持仓",
  "modal.holding.titleEdit": "编辑股票持仓",
  "modal.holding.name": "股票名称",
  "modal.holding.namePlaceholder": "输入代码后自动填充",
  "modal.holding.symbol": "股票代码",
  "modal.holding.symbolPlaceholder": "如：600036 / 00700 / AAPL",
  "modal.holding.symbolHint": "填写代码后自动获取股票名称",
  "modal.holding.checking": "查询中…",
  "modal.holding.currency": "交易币种",
  "modal.holding.nameAutoHint": "输入有效代码后自动填充名称",
  "modal.holding.shares": "持股数",
  "modal.holding.sharesPlaceholder": "持有股数",
  "modal.holding.save": "保存",
  "modal.holding.invalidSymbol": "请输入股票代码",
  "modal.holding.invalidShares": "请输入有效的正数股数",
  "modal.holding.symbolNotFound": "未找到该股票代码",
  "modal.holding.saved": "持仓已保存！",

  // Holdings manage modal
  "modal.holdingsManage.title": "股票持仓占比明细",

  // Market signals: index MA250 signal / TTM dividend yields / ETF premiums
  "signal.title": "红利低波100 · 年线信号",
  "signal.col.close": "收盘",
  "signal.col.ma250": "MA250",
  "signal.col.deviation": "偏离度",
  "signal.col.vsMa": "距年线",
  "signal.zone.buy": "买入区",
  "signal.zone.hold": "持有区",
  "signal.zone.sell": "卖出甜区",
  "signal.zone.overheat": "过热区",
  "signal.advice.buy": "跌破年线，低吸区。",
  "signal.advice.hold": "年线上方 0~3%，保本线之上，继续持有。",
  "signal.advice.sell": "进入卖出甜区 +3%~+6%（甜点约 +5%）。",
  "signal.advice.overheat": "过热区（+6% 以上），机会成本上升。",
  "signal.empty": "暂无信号数据，点击刷新拉取指数行情。",
  "signal.btn.refresh": "刷新指数信号",

  "dividendYield.title": "高股息 TTM",
  "dividendYield.col.name": "名称 / 代码",
  "dividendYield.col.ttm": "TTM 每股",
  "dividendYield.col.price": "现价",
  "dividendYield.col.yield": "股息率",
  "dividendYield.pending":
    "最新年报（{period}）尚未实施，年报部分取更早一期已实施方案。",
  "dividendYield.empty": "暂无股息率数据，点击刷新拉取。",
  "dividendYield.sortNote": "按股息率降序 · 5% 以上标红",
  "dividendYield.btn.refresh": "刷新股息率",

  "etfPremium.title": "美股 ETF 溢价监控",
  "etfPremium.col.code": "代码",
  "etfPremium.col.name": "名称",
  "etfPremium.col.price": "现价",
  "etfPremium.col.premium": "溢价率",
  "etfPremium.col.fee": "费率",
  "etfPremium.col.scale": "规模(亿)",
  "etfPremium.filter.low": "≤3%",
  "etfPremium.filter.all": "全部",
  "etfPremium.empty": "暂无溢价数据，点击刷新拉取。",
  "etfPremium.noneLow.title": "{count} 只标的溢价率均高于 {threshold}%",
  "etfPremium.noneLow.body": "最低 {name} +{pct}%，暂无符合阈值的标的。",
  "etfPremium.btn.refresh": "刷新溢价数据",

  "market.updatedAt": "更新于 {time}",
  "market.count": "{count} 只",
  "market.refreshFailed": "刷新失败，请检查网络后重试",
  "market.partialFailed": "{count} 只数据获取失败",

  // Accumulation (position tracker)
  "acc.title": "分批建仓",
  "acc.btn.all": "全部",
  "acc.btn.new": "新建计划",
  "acc.btn.back": "返回",
  "acc.empty": "还没有建仓计划",
  "acc.empty.text": "暂无内容",
  "acc.card.invested": "已投",
  "acc.card.next": "下一档 {price}",
  "acc.card.done": "各档均已了结",
  "acc.card.pnl": "浮动盈亏",
  "acc.warning.broken": "文件解析失败，已冻结写入",
  "acc.warning.incomplete": "数据不完整",
  "acc.warning.overBudget": "各阶段金额超过可分配预算",
  "acc.warning.overInvested": "累计投入已超过总预算",
  "acc.warning.unallocated": "尚有 {amount} 未分配",
  "acc.warning.parse": "{count} 行无法解析，已原样保留",

  "acc.list.title": "建仓计划",
  "acc.list.empty": "没有符合筛选条件的计划",
  "acc.list.col.name": "标的",
  "acc.list.col.market": "市场",
  "acc.list.col.assetType": "类型",
  "acc.list.col.price": "现价",
  "acc.list.col.avgCost": "持仓均价",
  "acc.list.col.invested": "累计投入",
  "acc.list.col.remaining": "剩余预算",
  "acc.list.col.pnl": "浮动盈亏",
  "acc.list.col.progress": "建仓进度",
  "acc.list.col.next": "下一次",
  "acc.list.col.status": "状态",
  "acc.list.col.actions": "操作",
  "acc.list.total": "合计（人民币）",
  "acc.filter.market": "市场",
  "acc.filter.assetType": "类型",
  "acc.filter.status": "状态",
  "acc.filter.all": "全部",
  "acc.sort.label": "排序",
  "acc.sort.pnl": "盈亏",
  "acc.sort.usage": "预算使用率",
  "acc.sort.updatedAt": "更新时间",
  "acc.sort.nextTrigger": "距触发",

  "acc.plan.status.pending": "未开始",
  "acc.plan.status.active": "进行中",
  "acc.plan.status.completed": "已完成",
  "acc.plan.status.archived": "已归档",
  "acc.stage.status.pending": "待执行",
  "acc.stage.status.triggered": "已触发",
  "acc.stage.status.partial": "部分执行",
  "acc.stage.status.completed": "已完成",
  "acc.stage.status.skipped": "已跳过",
  "acc.stage.status.voided": "已失效",
  "acc.stage.kind.first": "首次建仓",
  "acc.stage.kind.left": "左侧补仓",
  "acc.stage.kind.right": "右侧确认",
  "acc.stage.mode.drop": "跌幅触发",
  "acc.stage.mode.target": "目标价",
  "acc.stage.col.trigger": "触发价",
  "acc.stage.col.planned": "计划",
  "acc.stage.col.actual": "实际",
  "acc.stage.col.status": "状态",
  "acc.stage.col.tradeDate": "成交日期",
  "acc.stage.col.reached": "触发",
  "acc.stage.reached.yes": "已达到",
  "acc.stage.reached.no": "未触发",

  "acc.market.CN": "A股",
  "acc.market.HK": "港股",
  "acc.market.US": "美股",
  "acc.market.OTHER": "其它",
  "acc.assetType.stock": "个股",
  "acc.assetType.etf": "ETF",
  "acc.assetType.fund": "基金",
  "acc.assetType.bond": "债券",
  "acc.assetType.other": "其它",

  "acc.form.titleCreate": "新建建仓计划",
  "acc.form.titleEdit": "编辑建仓计划",
  "acc.form.section.basic": "基础信息",
  "acc.form.section.budget": "资金配置",
  "acc.form.section.strategy": "建仓策略",
  "acc.form.section.text": "投资逻辑与复盘",
  "acc.form.name": "标的名称",
  "acc.form.symbol": "标的代码",
  "acc.form.market": "市场",
  "acc.form.assetType": "资产类型",
  "acc.form.currency": "计价币种",
  "acc.form.createdAt": "创建日期",
  "acc.form.totalBudget": "计划总预算",
  "acc.form.refPrice": "首次参考买入价",
  "acc.form.currentPrice": "当前市场价格",
  "acc.form.reserveRatio": "预留资金比例",
  "acc.form.triggerMode": "触发方式",
  "acc.form.amountMode": "金额策略",
  "acc.form.amountMode.fixed": "固定金额",
  "acc.form.amountMode.ladder": "递增金额",
  "acc.form.amountMode.custom": "自定义",
  "acc.form.requireConfirm": "默认需要人工确认",
  "acc.form.logic": "投资逻辑",
  "acc.form.review": "复盘",
  "acc.form.stage.add": "添加阶段",
  "acc.form.stage.remove": "删除",
  "acc.form.stage.label": "阶段名称",
  "acc.form.stage.kind": "类型",
  "acc.form.stage.drop": "跌幅%",
  "acc.form.stage.target": "目标价",
  "acc.form.stage.planned": "计划金额",
  "acc.form.template": "套用模板",
  "acc.form.templateHint": "0 / -8 / -15 / -25 / -35% 加右侧确认",
  "acc.form.reserved": "预留",
  "acc.form.deployable": "可分配",
  "acc.form.allocated": "已分配",
  "acc.form.unallocated": "未分配",
  "acc.form.stageRatio": "阶段占比",
  "acc.form.overBudgetConfirm": "各阶段金额已超过可分配预算，仍然保存？",
  "acc.form.err.name": "请填写标的名称",
  "acc.form.err.symbol": "请填写标的代码",
  "acc.form.err.budget": "计划总预算需大于 0",
  "acc.form.err.refPrice": "参考买入价需大于 0",
  "acc.form.err.stageAmount": "每个阶段的金额不能为负",
  "acc.form.err.stageEmpty": "至少需要一个建仓阶段",
  "acc.form.saved": "计划已保存",
  "acc.form.save": "保存",
  "acc.form.cancel": "取消",

  "acc.detail.metric.totalBudget": "计划总预算",
  "acc.detail.metric.invested": "累计投入",
  "acc.detail.metric.remaining": "剩余预算",
  "acc.detail.metric.usage": "预算使用率",
  "acc.detail.metric.shares": "持仓数量",
  "acc.detail.metric.avgCost": "持仓均价",
  "acc.detail.metric.price": "当前价格",
  "acc.detail.metric.marketValue": "持仓市值",
  "acc.detail.metric.pnl": "浮动盈亏",
  "acc.detail.metric.pnlRate": "盈亏比例",
  "acc.detail.next.title": "下一次建仓",
  "acc.detail.next.stage": "阶段",
  "acc.detail.next.trigger": "触发价",
  "acc.detail.next.distance": "距触发",
  "acc.detail.next.planned": "计划金额",
  "acc.detail.next.remaining": "剩余预算",
  "acc.detail.next.reached": "已达触发价 —— 请确认后再买入",
  "acc.detail.next.confirmHint": "右侧确认只能手动标记，价格上涨不算触发。",
  "acc.detail.next.btn.trade": "记录成交",
  "acc.detail.next.btn.skip": "跳过本阶段",
  "acc.detail.next.btn.confirm": "标记已确认",
  "acc.detail.next.waitingLeft": "等待左侧阶段了结",
  "acc.detail.next.below": "低于 {pct}",
  "acc.detail.next.above": "高于 {pct}",
  "acc.detail.maxLoss": "最大浮亏",
  "acc.detail.maxGain": "最大浮盈",
  "acc.detail.next.none": "所有阶段均已了结",
  "acc.detail.stages": "建仓阶段",
  "acc.detail.compare": "计划与实际",
  "acc.detail.trades": "实际成交",
  "acc.detail.adjustments": "计划调整历史",
  "acc.detail.logic": "投资逻辑",
  "acc.detail.review": "复盘",
  "acc.detail.price.title": "更新现价",
  "acc.detail.price.date": "日期",
  "acc.detail.price.value": "价格",
  "acc.detail.price.note": "备注",
  "acc.detail.price.save": "保存价格",
  "acc.detail.price.saved": "价格已更新",
  "acc.detail.textEdit": "编辑",
  "acc.detail.textSave": "保存正文",
  "acc.detail.textSaved": "正文已保存",
  "acc.detail.overview": "总览",

  "acc.compare.col.stage": "阶段",
  "acc.compare.col.planned": "计划",
  "acc.compare.col.actual": "实际",
  "acc.compare.col.deviation": "偏差",
  "acc.compare.col.planUsage": "计划占比",
  "acc.compare.col.actualUsage": "实际占比",
  "acc.compare.total": "合计",
  "acc.compare.unassigned": "未分配成交",

  "acc.trade.titleCreate": "记录成交",
  "acc.trade.titleEdit": "修改成交",
  "acc.trade.date": "成交日期",
  "acc.trade.stage": "对应阶段",
  "acc.trade.side": "方向",
  "acc.trade.price": "成交价格",
  "acc.trade.qty": "买入数量",
  "acc.trade.amount": "成交金额",
  "acc.trade.fee": "手续费",
  "acc.trade.note": "备注",
  "acc.trade.autoAmount": "按 价格 × 数量 自动计算，可手动覆盖",
  "acc.trade.deleteConfirm": "删除这笔成交？",
  "acc.trade.err.price": "成交价格需大于 0",
  "acc.trade.err.qty": "成交数量需大于 0",
  "acc.trade.saved": "成交已保存",
  "acc.trade.side.buy": "买入",
  "acc.trade.side.sell": "卖出",

  "acc.action.archive": "归档",
  "acc.action.archiveConfirm": "归档这个计划？文件会移到 archive 目录。",
  "acc.action.archived": "计划已归档",
  "acc.action.delete": "删除",
  "acc.action.deleteConfirm": "删除这个计划文件？不可撤销。",
  "acc.action.deleteFailed": "删除计划文件失败",
  "acc.action.skip": "跳过",
  "acc.action.skipPrompt": "跳过本阶段的原因？",
  "acc.action.markConfirmed": "标记已确认",
  "acc.action.editPlan": "编辑计划",
  "acc.action.openFile": "打开源文件",
  "acc.action.addTrade": "新增成交",

  "acc.err.writeFailed": "写入计划文件失败",
  "acc.err.brokenPlan": "该计划文件无法解析，当前为只读",
  "acc.err.saveFailed": "保存失败",

  "acc.review.title": "历史复盘",
  "acc.review.empty": "复盘视图在第二批交付",

  // Commands & Ribbon
  "command.openDashboard": "打开财务仪表盘",
  "command.addSnapshot": "添加资产快照",
  "command.addIncomeExpense": "添加收支记录",
  "command.addDividend": "添加股息记录",
  "command.refreshData": "刷新财务数据",
  "command.addHolding": "添加股票持仓",
  "command.addAccumulationPlan": "新建建仓计划",
  "ribbon.openDashboard": "打开财务仪表盘",

  // Year selector
  "dashboard.yearSelector": "年份",

  // Settings
  "settings.title": "财务仪表盘设置",
  "settings.language": "语言",
  "settings.languageDesc": "选择插件的显示语言",
  "settings.targetAllocation": "目标资产配置",
  "settings.targetAllocationDesc":
    "设置每个资产类别的目标百分比，总和应为 100%。",
  "settings.targetTotal": "合计：{total}%",
  "settings.targetWarning": " ⚠️ 应为 100%",
  "settings.dataFolderPath": "数据文件夹路径",
  "settings.dataFolderPathDesc":
    "存储年度 Markdown 数据文件的文件夹路径（相对于 Vault 根目录，如 Finance）",
  "settings.miscDataFilePath": "杂项数据文件路径",
  "settings.miscDataFilePathDesc":
    "存储非年度数据（如股票持仓）的 Markdown 文件路径（相对于 Vault 根目录，如 Finance/Misc.md）",
  "settings.miscDataFilePathInvalid":
    "杂项数据文件路径不能是年份样式文件（如 Finance/2025.md），会与年度数据文件冲突。",
  "settings.accumulationFolderPath": "建仓数据文件夹",
  "settings.accumulationFolderPathDesc":
    "分批建仓计划的存放目录，每个计划一个 Markdown 文件（相对于 Vault 根目录，如 Finance/Investment/Accumulation）。与年度数据文件夹互相独立。",
  "settings.fxRates": "参考汇率",
  "settings.fxRatesDesc":
    "1 单位外币折合人民币。仅当持仓行情里拿不到汇率时，用于跨币种汇总。",
  "settings.fxRate.hkd": "港币 → 人民币",
  "settings.fxRate.usd": "美元 → 人民币",
  "settings.assetCategories": "资产类别",
  "settings.categories": "类别",
  "settings.categoriesDesc.asset": "以逗号分隔的资产类别列表",
  "settings.incomeCategories": "收入类别",
  "settings.categoriesDesc.income": "以逗号分隔的收入类别列表",
  "settings.expenseCategories": "支出类别",
  "settings.categoriesDesc.expense": "以逗号分隔的支出类别列表",
};

const translations: Record<Locale, TranslationStrings> = { en, zh };

let currentLocale: Locale = "en";

/**
 * Set the current locale for the i18n module.
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale.
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key, with optional interpolation.
 * Usage: t("modal.snapshot.saved", { month: "2025-03" })
 */
export function t(
  key: keyof TranslationStrings,
  params?: Record<string, string | number>,
): string {
  let text =
    translations[currentLocale]?.[key] ?? translations["en"][key] ?? key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}
