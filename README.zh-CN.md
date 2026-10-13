# 💰 Obsidian 个人财务仪表盘

一款精心设计的 [Obsidian](https://obsidian.md) 插件，用于追踪个人资产、收支和股息 —— 所有数据以纯 Markdown 文件存储在你的 Vault 中。

> 🌐 English documentation: [README.md](README.md)

![Obsidian](https://img.shields.io/badge/Obsidian-v0.15.0+-7c3aed?logo=obsidian&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/github/v/release/wynn719/obsidian-personal-finance-dashboard?label=Version&color=blue)

---

## ✨ 功能特性

- 📊 **仪表盘概览** — 6 个核心指标卡片（总资产、环比变化、月收入/支出/结余、年度股息）
- 🎯 **资产配置追踪** — 实际配置与目标比例对比，偏离超过 10% 时高亮警告
- 📈 **交互式图表** — 环形图展示资产分布 + 柱状/折线组合图展示月度现金流趋势（基于 [Chart.js](https://www.chartjs.org/)）
- 📅 **月度总览表** — 追踪每月各类别资产金额、环比变化、工资收入和投资回报
- 💸 **收支管理** — 按分类记录收入和支出，支持筛选和分页
- 🏦 **股息追踪** — 按股票记录股息收入，支持自动补全和年度汇总
- 🗂️ **股票持仓占比** — 仪表盘内置模块，矩形树图 + 明细表展示各股票持仓；只需填写股票代码（A 股 / 港股 / 美股）+ 股数，名称自动获取，一键刷新实时行情计算市值（多币种自动按人民币换算）并持久化（数据存于独立的 `Misc.md` 文件）
- 🧭 **市场信号模块** — 三个独立的手动刷新模块（结果缓存于 `Misc.md`）：
  - **年线策略信号** — 中证红利低波动100（930955）相对 250 日均线的偏离度，自动判定买入 / 持有 / 卖出甜区 / 过热四区间
  - **高股息 TTM** — 9 只 A 股跟踪池：最近一次已实施年报 + 中期每股分红 ÷ 实时股价
  - **美股 ETF 溢价监控** — 16 只纳指 / 标普500 QDII ETF：实时溢价率（对比最新净值）、费率与规模，≤3% 标的自动高亮（可切换全部）
- 📁 **Markdown 优先** — 所有数据以可读的 Markdown 文件存储（每年一个文件），完全可移植、可版本控制
- 🔒 **隐私模式** — 一键将所有财务数字替换为 `***`
- 🌐 **双语支持** — 完整的中文和英文界面
- 🎨 **主题适配** — 自动适配 Obsidian 明/暗主题，专业金融风格设计
- 📱 **响应式布局** — 同时支持桌面端和移动端 Obsidian

---

## 🚀 安装

1. 从 [GitHub Releases](https://github.com/wynn719/obsidian-personal-finance-dashboard/releases) 下载最新的插件文件夹压缩包
2. 解压后将 `personal-finance-dashboard` 文件夹复制到你的 Vault 插件目录中：
   ```
   {你的Vault}/.obsidian/plugins/personal-finance-dashboard/
   ```
3. 打开 Obsidian **设置** → **第三方插件** → 启用 **"Personal Finance Dashboard"**

---

## 📖 使用指南

### 打开仪表盘

- 点击左侧边栏中的 **钱包图标**
- 或使用命令面板：`Open Finance Dashboard`

### 常用命令

所有操作都可以从命令面板调用：

| 命令 | 说明 |
|------|------|
| `Open Finance Dashboard` | 打开（或聚焦）仪表盘视图 |
| `Add Asset Snapshot` | 记录每月资产快照 |
| `Add Income/Expense` | 记录一笔收支 |
| `Add Dividend` | 记录股息收入 |
| `Add Stock Holding` | 添加股票持仓 |
| `Refresh Finance Data` | 从磁盘重新加载数据文件 |

### 股票持仓模块

- 仪表盘内的「股票持仓占比」区块，无需切换视图
- 顶部 **编辑股票持仓** 按钮打开管理弹窗；添加持仓只需填写：
  - **股票代码**：A 股如 `600036` / 港股如 `00700` / 美股如 `AAPL`
  - **持股数**：持有股数
  - 股票名称由行情接口自动获取写入，无需手填
- 点击 **🔄 刷新行情**（管理弹窗右上角或持仓卡片标题栏）获取实时价格，市值 = 股数 × 现价（按 2 位小数归一后）写回 `Misc.md`，涨跌幅按 A 股习惯涨红跌绿显示
- 支持 A 股 / 港股 / 美股多币种持仓：行情请求自动附带实时汇率（美元/港币兑人民币），市值与占比统一按人民币口径换算（现价列显示原币价）
- 点击树图色块（或明细表中的 ✏️ 按钮）编辑，🗑️ 删除
- 行情来源为腾讯公开行情接口（qt.gtimg.cn），无需 API Key

### 市场信号模块

三个相互独立的模块（位于资产配置行上方），各自带独立刷新按钮。不做后台轮询：点击 🔄 才会拉取数据，最近一次结果缓存于 `Misc.md`，下次打开仪表盘即可见。

| 模块 | 展示内容 | 数据来源 |
|------|----------|----------|
| **年线策略信号** | 中证红利低波动100（930955）：最新收盘 vs 250 日均线、偏离度与策略区间（买入区 < 0 / 持有区 0~3% / 卖出甜区 3~6% / 过热区 > 6%） | 中证指数公司官网 index-perf 接口 |
| **高股息 TTM** | 9 只 A 股跟踪池：最近一次已实施年报 + 中期每股分红 ÷ 实时股价，按股息率降序（与配套每日自动化口径完全一致） | 东方财富分红接口 + 腾讯行情 |
| **美股 ETF 溢价监控** | 16 只纳指 / 标普500 QDII ETF：现价、对比最新净值的溢价率、综合费率与规模；默认只显示 ≤3% 的标的，可切换全部 16 只 | 腾讯行情（qt.gtimg.cn） |

> 💡 ETF 溢价率由行情接口按「现价 ÷ 最新已公布净值 − 1」直接给出，与低溢价扫描口径一致；负值表示折价。

### 录入数据

仪表盘提供三种数据录入方式：

| 操作 | 说明 |
|------|------|
| **➕ 添加快照** | 记录每月资产快照 —— 输入各资产类别的金额 |
| **💰 添加收支** | 记录一笔收入或支出，包含日期、金额和分类 |
| **📈 添加股息** | 记录股息收入，包含股票名称、日期和金额 |

### 年份切换

使用仪表盘顶部的**年份选择器**下拉框在不同年份间切换。每年的数据存储在独立的 Markdown 文件中。

### 隐私模式

点击顶部的 **遮罩图标**（🔒）切换隐私模式 —— 所有财务数字将替换为 `***`。

---

## ⚙️ 配置

打开 **设置** → **Personal Finance Dashboard** 进行配置：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| **语言** | 界面语言（English / 中文） | 中文 |
| **数据文件夹** | Vault 内存放数据文件的相对路径 | `Finance` |
| **杂项数据文件路径** | 存放非年度数据（如股票持仓）的独立文件路径 | `Finance/Misc.md` |
| **资产类别** | 逗号分隔的资产类别名称 | 货币短债, 中长债, 黄金, 高股息, 港美A |
| **收入类别** | 逗号分隔的收入类别名称 | 工资, 副业, 投资收益, 其他收入 |
| **支出类别** | 逗号分隔的支出类别名称 | 房租, 餐饮, 交通, 娱乐, 其他支出 |
| **目标配置** | 各资产类别的目标百分比（总和须为 100%） | 25%, 20%, 5%, 10%, 40% |

---

## 📄 数据格式

所有数据以纯 Markdown 文件的形式存储在你的 Vault 中，位于配置的数据文件夹下（默认：`Finance/`）。每年对应一个文件（如 `Finance/2025.md`）。

### 文件结构

```
你的Vault/
└── Finance/
    ├── 2024.md
    ├── 2025.md
    ├── 2026.md
    └── Misc.md      ← 非年度数据（股票持仓）
```

### Markdown 格式

每个年度文件包含三个部分：

#### 资产快照

```markdown
# Asset Snapshots

## 2025-12
> 年末收官，股市震荡

| Category | Amount | Details |
|----------|--------|---------|
| 货币短债 | 1876542 | 微众 892340, 招商银行 583210, 支付宝 48920 |
| 中长债 | 218760 | 东财 98540, 理财通 82350 |
| 黄金 | 52380 | 支付宝 32180, 东财 20200 |
| 高股息 | 398540 | 中国神华 125600, 中国平安 98320 |
| 港美A | 1542680 | RSU 312450, 富途 398200 |

## 2025-11
> 港股反弹，A股震荡
...
```

#### 收支记录

```markdown
# Cash Flow Records

| Date | Type | Category | Amount | Note |
|------|------|----------|--------|------|
| 2025-12-01 | income | 工资 | 35000 | 12月工资 |
| 2025-12-15 | expense | 房租 | 5500 | 12月房租 |
| 2025-12-20 | income | 副业 | 8000 | 自由职业收入 |
```

#### 股息记录

```markdown
# Dividend Records

| Date | Stock | Amount | Note |
|------|-------|--------|------|
| 2025-06-15 | 中国神华 | 12500 | 年度分红 |
| 2025-07-20 | 招商银行 | 8600 | 中期分红 |
```

#### Misc.md（非年度数据）

非年度数据存放在独立文件中（默认 `Finance/Misc.md`）。每个 `#` 标题对应一种数据类型。

**股票持仓** —— 由持仓模块写入：

```markdown
# Stock Holdings

| Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt |
|------|--------|--------|--------|-------|---------|----------|--------|-----------|
| 五粮液 | 258588 | 000858 | 3600 | 71.83 | 0.79 | CNY | 1 | 2026-09-01T16:00:00+08:00 |
| 腾讯控股 | 189802 | 00700 | 430 | 441.4 | -2.56 | HKD | 0.857 | 2026-09-01T16:00:00+08:00 |
```

`Amount` = 股数 × 现价（原币口径），每次刷新行情时重算并**按 2 位小数归一**，文件里不会出现浮点误差残留；`FXRate` 为最近一次刷新时的人民币汇率（用于把非人民币持仓折算成人民币）；`Change%` 为当日涨跌幅。持仓占比在运行时按总市值自动计算，无需手工维护。

**市场信号缓存** —— 由三个信号模块在每次手动刷新时写入（也可手工编辑）：

```markdown
# Index Signal

| IndexCode | Name | TradeDate | Close | MA250 | Deviation% | Zone | UpdatedAt |
|-----------|------|-----------|-------|-------|------------|------|-----------|
| 930955 | 中证红利低波动100指数 | 2026-10-13 | 11495.63 | 11728.84 | -1.99 | buy | 2026-10-13T11:03:32.569Z |

# Dividend Yields

| Name | Symbol | DivType | AnnualPeriod | InterimPeriod | TTM | Price | Yield% | Pending | UpdatedAt |
|------|--------|---------|--------------|---------------|-----|-------|--------|---------|-----------|
| 招商银行 | 600036 | semi | 2025-12-31 | 2025-06-30 | 2.016 | 42.8 | 4.71 |  | 2026-10-13T11:03:32.569Z |

# ETF Premiums

| Code | Name | Price | Premium% | Fee% | Scale | UpdatedAt |
|------|------|-------|----------|------|-------|-----------|
| 513100 | 纳指ETF国泰 | 2.375 | 15.5 | 0.8 | 230.01 | 2026-10-13T11:03:32.432Z |
```

- `Index Signal` — `Zone` 取值为 `buy` / `hold` / `sell` / `overheat`；`Deviation%` = 收盘 ÷ MA250 − 1
- `Dividend Yields` — `DivType` 为 `semi`（年报+中期）或 `annual`（仅年报）；`Pending` 为空表示最新年报已实施
- `ETF Premiums` — `Premium%` 为对比最新净值的溢价率（负值即折价）；`Scale` 单位为亿元

> 💡 **提示**：由于数据是纯 Markdown 格式，你可以直接在 Obsidian 或任何文本编辑器中编辑它。插件会自动检测文件变更并刷新仪表盘。

---

## 🏗️ 项目架构

```
src/
├── main.ts                     # 插件入口 & 生命周期
├── data-store.ts               # 数据持久化（Markdown ↔ 内存），含 Misc.md 持仓
├── calculator.ts               # 纯计算层
├── quote-service.ts            # 实时行情 + 汇率（批量请求 qt.gtimg.cn）
├── index-signal-service.ts     # 年线策略信号（中证指数官网）
├── etf-premium-service.ts      # 纳指/标普 QDII ETF 溢价率（qt.gtimg.cn）
├── dividend-yield-service.ts   # TTM 股息率（东方财富 + 腾讯行情）
├── models.ts                   # TypeScript 接口 & 默认值
├── settings.ts                 # Obsidian 设置页
├── i18n.ts                     # 国际化（中/英）
├── utils.ts                    # 格式化 & 工具函数
├── react/                      # Preact UI 层
│   ├── dashboard-app.tsx       # 仪表盘顶层组件
│   ├── responsive.tsx          # 容器级响应式（LayoutProvider / useLayout）
│   ├── use-finance-data.ts     # store 订阅 hook
│   ├── chart.tsx               # Chart.js 封装
│   ├── holdings-chart.tsx      # 持仓矩形树图
│   ├── components/             # 指标卡、表格（含通用 DataTable）、市场信号区块组件
│   ├── forms/                  # 快照 / 收支 / 股息 / 持仓录入表单
│   └── hooks/                  # use-quote-refresh 等
├── views/
│   └── dashboard-view.tsx      # 仪表盘视图外壳（ItemView + createRoot 挂载）
└── modals/                     # 原生 Obsidian 弹窗外壳
    ├── asset-snapshot-modal.tsx
    ├── cash-flow-modal.tsx
    ├── dividend-modal.tsx
    ├── holding-modal.tsx
    └── holdings-manage-modal.tsx
```

### 核心设计理念

- **Markdown 即数据源** — 不使用私有数据库，数据保持可移植、可读性强
- **按年分文件** — 文件大小可控，便于年度对比
- **Preact UI 层** — 组件用 React 风格 JSX 编写、运行在 Preact 上（esbuild 把 `react` 别名到 `preact/compat`）；视图/弹窗外壳保持原生 Obsidian API（`ItemView` / `Modal` + `createRoot`）
- **容器级响应式** — 用 `ResizeObserver` 测量视图容器宽度，派生 `full` / `compact` / `mobile` 三档布局，经 `data-layout` 属性 + Context 统一下发；组件消费该信号而非猜测视口（解决 Obsidian 分栏场景的错配）
- **观察者模式** — `DataStore` 在数据变更时通知 UI 自动重新渲染
- **手动刷新 + 落盘缓存** — 市场数据模块（行情、指数信号、股息率、ETF 溢价）只在点击刷新时拉取，最近一次结果持久化到 `Misc.md`，无需后台轮询也能保持可见
- **跨年写入** — 添加记录到不同年份时自动处理文件切换

---

## 🛠️ 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) v20+（项目使用 Volta 锁定版本：`20.20.2`）
- 已安装 [Obsidian](https://obsidian.md)

### 开发配置

```bash
# 安装依赖
npm install

# 类型检查 + 打包 + 复制构建产物到 dist/
npm run build
```

`fixture/` 目录是一个可直接使用的 Obsidian Vault，包含示例财务数据（`Finance/2025.md`、`Finance/2026.md`、`Finance/Misc.md`）。在 Obsidian 中打开该文件夹作为 Vault 并启用插件即可开始测试。

> 💡 fixture Vault 的插件目录（`fixture/.obsidian/plugins/personal-finance-dashboard`）是指向 `dist/` 的软链，所以**让它更新的是 `npm run build`** —— 构建后在 Obsidian 中重载插件即可生效。`npm run dev` 是 watch 模式，只重建项目根目录的 `main.js`，fixture Vault 读不到它。若想让 watch 直接生效，先跑一次 `npm run setup-fixture`：它会把 fixture 的插件文件改指项目根目录产物（下次 `npm run build` 会重置回 `dist/` 链接）。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 生产构建 —— 类型检查 + 压缩打包 + 复制到 `dist/` |
| `npm run dev` | watch 模式 —— 增量重建项目根目录的 `main.js` |
| `npm run setup-fixture` | 把 fixture Vault 的插件文件改指项目根目录产物 |
| `npx tsc -noEmit -skipLibCheck` | 仅类型检查 |

### 发布流程

推送一个 tag（如 `git tag v1.0.13 && git push origin v1.0.13`），[release workflow](.github/workflows/release.yml) 会在 GitHub Actions 上构建并自动发布 Release，附上 `main.js`、`manifest.json`、`styles.css` 和 zip 包，无需手动打包。

### 技术栈

- **TypeScript** 5.3 — 启用 `strictNullChecks`
- **Preact** 10 — UI 层，经 `preact/compat` 别名直接运行为 React 风格代码
- **esbuild** — 极速打包（watch 模式 + 生产压缩构建）
- **Chart.js** 4 — 交互式图表，配合 `chartjs-chart-treemap` 渲染持仓树图
- **Obsidian API** — 插件框架（声明为 external 模块）

---

## 📝 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

## 🙏 致谢

- [Obsidian](https://obsidian.md) — 优秀的知识管理应用
- [Chart.js](https://www.chartjs.org/) — 简洁灵活的 JavaScript 图表库
- Obsidian 插件开发社区提供的优秀文档和示例
