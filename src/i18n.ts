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

  // Holding modal
  "modal.holding.titleAdd": string;
  "modal.holding.titleEdit": string;
  "modal.holding.name": string;
  "modal.holding.namePlaceholder": string;
  "modal.holding.symbol": string;
  "modal.holding.symbolPlaceholder": string;
  "modal.holding.symbolHint": string;
  "modal.holding.checking": string;
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

  // Commands & Ribbon
  "command.openDashboard": string;
  "command.addSnapshot": string;
  "command.addIncomeExpense": string;
  "command.addDividend": string;
  "command.refreshData": string;
  "command.addHolding": string;
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

  // Holding modal
  "modal.holding.titleAdd": "Add Stock Holding",
  "modal.holding.titleEdit": "Edit Stock Holding",
  "modal.holding.name": "Stock Name",
  "modal.holding.namePlaceholder": "Auto-filled from the stock code",
  "modal.holding.symbol": "Stock Code",
  "modal.holding.symbolPlaceholder": "e.g. 600036 / 00700 / AAPL",
  "modal.holding.symbolHint": "Name is fetched from the quote API after entering the code",
  "modal.holding.checking": "Looking up…",
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

  // Commands & Ribbon
  "command.openDashboard": "Open Finance Dashboard",
  "command.addSnapshot": "Add Asset Snapshot",
  "command.addIncomeExpense": "Add Income/Expense",
  "command.addDividend": "Add Dividend",
  "command.refreshData": "Refresh Finance Data",
  "command.addHolding": "Add Stock Holding",
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

  // Holding modal
  "modal.holding.titleAdd": "添加股票持仓",
  "modal.holding.titleEdit": "编辑股票持仓",
  "modal.holding.name": "股票名称",
  "modal.holding.namePlaceholder": "输入代码后自动填充",
  "modal.holding.symbol": "股票代码",
  "modal.holding.symbolPlaceholder": "如：600036 / 00700 / AAPL",
  "modal.holding.symbolHint": "填写代码后自动获取股票名称",
  "modal.holding.checking": "查询中…",
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

  // Commands & Ribbon
  "command.openDashboard": "打开财务仪表盘",
  "command.addSnapshot": "添加资产快照",
  "command.addIncomeExpense": "添加收支记录",
  "command.addDividend": "添加股息记录",
  "command.refreshData": "刷新财务数据",
  "command.addHolding": "添加股票持仓",
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
