# 💰 Obsidian 个人财务仪表盘

一款精心设计的 [Obsidian](https://obsidian.md) 插件，用于追踪个人资产、收支、股息，以及分批建仓 —— 所有数据以纯 Markdown 文件存储在你的 Vault 中。

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
- 📦 **分批建仓跟踪** — 先定预算、再拆阶段、最后用真实成交校验计划：
  - 每个阶段两种触发方式：相对「锁定的首次参考价」跌幅，或直接指定目标价
  - 三种金额策略（固定 / 递增 / 自定义），预算实时校验：已分配、未分配、各阶段占比
  - 成交与计划彻底分离：一个阶段可多笔成交、可部分执行、可带原因跳过
  - 移动加权平均成本、浮动盈亏、剩余预算、预算使用率，以及逐阶段的「计划 vs 实际」偏差表
  - 手动改价并留存价格点，最大浮亏/浮盈要么真实算出来，要么明确标「数据不完整」
  - 每个计划一个 Markdown 文件 —— 可手改、可往返、归档而非删除
- 📁 **Markdown 优先** — 所有数据以可读的 Markdown 文件存储，完全可移植、可版本控制
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
| `New Accumulation Plan` | 新建一个分批建仓计划 |
| `Refresh Finance Data` | 从磁盘重新加载数据文件 |

### 工作台 / 资产配置 tab

仪表盘分两个页面级 tab，切换后会记住上次停留的位置（localStorage）。

| Tab | 内容 |
|---|---|
| **工作台** | 建仓卡 + 三个市场信号模块（红利低波 100 年线信号、高股息 TTM、美股 ETF 溢价） |
| **资产配置** | 指标卡、资产配置偏离、股息汇总、持仓树图、三张图表、月度总览、现金流明细 |

两边的挂载策略刻意不同：进入建仓视图时，工作台面板只是隐藏而不卸载，返回后各信号卡的筛选/展开状态还在；资产配置面板在切换时重建，让 Chart.js 量到真实容器而不是 `display:none` 的零宽容器。

### 分批建仓跟踪

工作台第一张卡。点卡片标题或「全部」进入建仓视图 —— 它接管整个工作台面板，左上角有返回。

**计划列表** — 市场 / 资产类型 / 状态三组筛选，加四种排序（盈亏、预算使用率、更新时间、距触发）。每行展示现价、持仓均价、累计投入、剩余预算、浮动盈亏、建仓进度和下一次补仓价。

**新建计划** — 基础信息（名称、代码、市场、资产类型、币种、创建日期）、资金配置（总预算、首次参考买入价、当前市价、预留资金比例）、建仓策略：

| 概念 | 含义 |
|------|------|
| **阶段** | 一档建仓：首次建仓 / 左侧补仓 / 右侧确认 |
| **触发方式** | `跌幅` —— `参考价 × (1 − 跌幅%)`；`目标价` —— 直接指定价格。两套参数同时保留，切换模式不丢数据 |
| **金额策略** | `固定`（均分）/ `递增`（线性递增）/ `自定义` |
| **模板** | 一键生成 0 / −8 / −15 / −25 / −35% 加右侧确认共六档 |

预算校验是实时的：已分配、未分配、各阶段占比随输入即时重算。未分配预算允许保留，不强制分完。

**详情页** — 顶部十项指标（总预算、累计投入、剩余预算、预算使用率、持仓数量、持仓均价、当前价格、持仓市值、浮动盈亏、盈亏比例），下面依次是：

- **下一次建仓** — 阶段、触发价、当前价、距触发（低于/高于百分比）、计划金额、剩余预算。达到触发价会高亮提醒，但**不代表该买**：记录成交、调整金额、跳过本阶段，都由你手动决定。右侧确认阶段只认「标记已确认」，价格上涨永不自动触发。
- **阶段时间线** — 逐档展示计划额 vs 实际额、状态（待执行 / 已触发 / 部分执行 / 已完成 / 已跳过 / 已失效）与成交日期
- **计划与实际** — 逐档计划额、实际额、偏差、预算占比，外加一行「未分配成交」
- **实际成交** — 增改删；金额默认按 价格 × 数量 自动算但可改；手续费计入预算
- **更新现价** — 内联输入不弹窗，同时追加一个价格点（同一天覆盖），供最大浮亏使用
- **计划调整历史 / 投资逻辑 / 复盘** — 后两段是你自己的正文，插件只读不改

> 改计划永远动不了历史：阶段状态由「成交 + 现价」现场推导，编辑计划只会碰还没有成交的那些阶段。

### 股票持仓模块

- 资产配置 tab 内的「股票持仓占比」区块，无需切换视图
- 顶部 **编辑股票持仓** 按钮打开管理弹窗；添加持仓只需填写：
  - **股票代码**：A 股如 `600036` / 港股如 `00700` / 美股如 `AAPL`
  - **持股数**：持有股数
  - 股票名称由行情接口自动获取写入，无需手填
- 点击 **🔄 刷新行情**（管理弹窗右上角或持仓卡片标题栏）获取实时价格，市值 = 股数 × 现价（按 2 位小数归一后）写回 `Misc.md`，涨跌幅按 A 股习惯涨红跌绿显示
- 支持 A 股 / 港股 / 美股多币种持仓：行情请求自动附带实时汇率（美元/港币兑人民币），市值与占比统一按人民币口径换算（现价列显示原币价）
- 点击树图色块（或明细表中的 ✏️ 按钮）编辑，🗑️ 删除
- 行情来源为腾讯公开行情接口（qt.gtimg.cn），无需 API Key

### 市场信号模块

三个相互独立的模块（与建仓卡同处工作台瀑布流），各自带独立刷新按钮。不做后台轮询：点击 🔄 才会拉取数据，最近一次结果缓存于 `Misc.md`，下次打开仪表盘即可见。

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
| **建仓数据文件夹** | 存放分批建仓计划的目录（每个计划一个文件） | `Finance/Investment/Accumulation` |
| **参考汇率** | 1 单位外币折合人民币，仅在持仓行情拿不到汇率时用于跨币种汇总 | 0.92 / 7.10 |
| **资产类别** | 逗号分隔的资产类别名称 | 货币短债, 中长债, 黄金, 高股息, 港美A |
| **收入类别** | 逗号分隔的收入类别名称 | 工资, 副业, 投资收益, 其他收入 |
| **支出类别** | 逗号分隔的支出类别名称 | 房租, 餐饮, 交通, 娱乐, 其他支出 |
| **目标配置** | 各资产类别的目标百分比（总和须为 100%） | 25%, 20%, 5%, 10%, 40% |

---

## 📄 数据格式

所有数据以纯 Markdown 文件的形式存储在你的 Vault 中，位于配置的数据文件夹下（默认：`Finance/`）。每年对应一个文件（如 `Finance/2025.md`），每个建仓计划同样独占一个文件。

### 文件结构

```
你的Vault/
└── Finance/
    ├── 2024.md
    ├── 2025.md
    ├── 2026.md
    ├── Misc.md                        ← 非年度数据（股票持仓、信号缓存）
    └── Investment/
        └── Accumulation/
            ├── plans/                 ← 每个计划一个文件，如 600519-pl_7f3k2m9q.md
            └── archive/               ← 归档后的计划移到这里
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

非年度数据存放在独立文件（默认 `Finance/Misc.md`），每个 `#` 分节承载一种数据类型。

**股票持仓** —— 由持仓模块写入：

```markdown
# Stock Holdings

| Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt |
|------|--------|--------|--------|-------|---------|----------|--------|-----------|
| 五粮液 | 258588 | 000858 | 3600 | 71.83 | 0.79 | CNY | 1 | 2026-09-01T16:00:00+08:00 |
| 腾讯控股 | 189802 | 00700 | 430 | 441.4 | -2.56 | HKD | 0.857 | 2026-09-01T16:00:00+08:00 |
```

`Amount` = 股数 × 现价（原币），每次刷新行情重算并归一为 2 位小数，因此文件里不会积累浮点尾巴。`FXRate` 是刷新时的兑人民币汇率，用于把非人民币持仓折算成人民币。占比在运行时按总额计算，无需手工维护。

**市场信号缓存** —— 三个信号模块每次手动刷新时写入（同样可以手工改）：

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

- `Index Signal` —— `Zone` 取 `buy` / `hold` / `sell` / `overheat`；`Deviation%` = 收盘 ÷ MA250 − 1
- `Dividend Yields` —— `DivType` 为 `semi`（年报 + 中期）或 `annual`；`Pending` 为空表示最新年报已实施
- `ETF Premiums` —— `Premium%` 相对最新已公布净值（负值为折价）；`Scale` 单位为亿元

#### 建仓计划（每个计划一个文件）

计划文件 = 扁平 YAML frontmatter + 四张表 + 两段自由正文：

```markdown
---
id: pl_sample01
name: 贵州茅台
symbol: 600519
market: CN
assetType: stock
currency: CNY
createdAt: 2026-09-01
totalBudget: 125000.00
referencePrice: 1500
currentPrice: 1290.88
reserveRatio: 0
amountMode: custom
requireConfirmDefault: true
---

# Stages

| Order | Label | Kind | Mode | Anchor | Drop% | Target | Trigger | Planned | Confirm | ConfirmedAt | SkippedAt | SkipReason | VoidedAt |
|------|------|------|----------|--------|-------|--------|--------|----------|--------|--------|----------|----------|----------|
| 1 | 首次建仓 | first | drop | 1500 | 0.00 |  | 1500 | 10000.00 | true | 2026-09-12 |  |  |  |
| 2 | 左侧补仓 -8% | left | drop | 1500 | 8.00 |  | 1380 | 15000.00 | false |  |  |  |  |

# Trades

| ID | Date | Stage | Side | Price | Quantity | Amount | Fee | Note |
|----|------|------|------|------|----------|--------|-----|------|
| pl_t0001 | 2026-09-12 | 1 | buy | 1402.5 | 7 | 9817.50 | 5.00 | 提前建仓 |

# Prices

| Date | Price | Note |
|------|-------|------|
| 2026-09-12 | 1402.5 | 建仓日 |

# Adjustments

| Date | Stage | Field | Before | After | Note |
|------|------|-------|--------|--------|------|
| 2026-10-25 | 3 | planned | 18000.00 | 20000.00 | 加深档位 |

# Investment Thesis

高股息 + 强现金流，20 倍以下分批建仓。

# Review

右侧确认未触发，未走到最深一档。
```

- 金额固定 2 位小数、**不带千位分隔符**，币种写在 frontmatter 里
- `Trigger` 是**只读派生列** —— 永远按 `锚定价 × (1 − 跌幅%)`（或 `Target`）重算，手改无效。锚定价在创建时锁定，所以成交怎么变都不会把计划带跑
- 阶段状态（待执行 / 已触发 / 部分执行 / 已完成）由成交 + 现价**推导**；文件里只持久 `SkippedAt`、`VoidedAt`、`ConfirmedAt` 三个用户意图
- 未知 frontmatter 键、未知 `#` 分节、以及两段自由正文都会原样保留
- 解析不了的文件会被标记并**冻结写入**，绝不覆盖 —— 完整格式、手改规则与计算口径见 [docs/ACCUMULATION.md](docs/ACCUMULATION.md)

> 💡 **提示**：由于数据就是纯 Markdown，你可以直接在 Obsidian 或任意文本编辑器里改。插件会自动检测变更并刷新。

---

## 🏗️ 项目架构

```
src/
├── main.ts                     # 插件入口与生命周期
├── data-store.ts               # 年度文件 + Misc.md（持仓与信号缓存）
├── calculator.ts               # 年度数据的纯计算层
├── quote-service.ts            # 实时行情与汇率（批量，qt.gtimg.cn）
├── index-signal-service.ts     # 年线策略信号（中证指数官网）
├── etf-premium-service.ts      # 纳指/标普 QDII ETF 溢价（qt.gtimg.cn）
├── dividend-yield-service.ts   # TTM 股息率（东财 + 行情）
├── market-refresh.ts           # 四项远程刷新的唯一入口
├── market-code.ts              # A 股交易所前缀表
├── models.ts                   # TypeScript 接口与默认值
├── settings.ts                 # Obsidian 设置页
├── i18n.ts                     # 国际化（en/zh）
├── utils.ts                    # 格式化与工具函数
├── accumulation/               # 分批建仓 —— 纯 TS，不 import obsidian
│   ├── types.ts                # 计划 / 阶段 / 成交 / 价格点模型（整数分）
│   ├── money.ts                # 分运算与无千分位格式化
│   ├── table.ts                # Markdown 表格读写（保留空 cell）
│   ├── parser.ts               # frontmatter + 分节 → 计划（容错）
│   ├── serializer.ts           # 计划 → Markdown（往返安全）
│   ├── calc.ts                 # 成本、预算、触发、计划对比、回撤
│   ├── template.ts             # 默认阶段模板与金额策略
│   ├── store.ts                # AccumulationStore：adapter IO、写队列、hash 去重
│   └── stats.ts                # 组合复盘统计（第二批，占位）
├── react/                      # Preact UI 层
│   ├── dashboard-app.tsx       # 顶层组件与 tab 状态
│   ├── responsive.tsx          # 容器驱动的布局（LayoutProvider / useLayout）
│   ├── masonry.tsx             # 桌面瀑布流（逐项量高写行跨度）
│   ├── use-finance-data.ts     # 年度数据订阅 hook
│   ├── use-accumulation-data.ts# 建仓数据订阅 hook
│   ├── chart.tsx               # Chart.js 封装
│   ├── holdings-chart.tsx      # 持仓树图
│   ├── components/             # tab 条、通用 DataTable、指标卡、市场信号，
│   │                           #   以及 components/accumulation/*（卡片、列表、详情、时间线…）
│   ├── forms/                  # 快照 / 收支 / 股息 / 持仓 / 建仓表单
│   └── hooks/                  # use-quote-refresh
├── views/
│   └── dashboard-view.tsx      # ItemView 外壳（createRoot 挂载）
└── modals/                     # Obsidian 原生弹窗外壳
    ├── asset-snapshot-modal.tsx
    ├── cash-flow-modal.tsx
    ├── dividend-modal.tsx
    ├── holding-modal.tsx
    ├── holdings-manage-modal.tsx
    ├── accumulation-plan-modal.tsx
    └── accumulation-trade-modal.tsx
```

### 核心设计理念

- **Markdown 即事实来源** —— 不用私有数据库，数据可移植、可读、可手改
- **年度一文件、计划一文件** —— 年度数据便于逐年对比；计划独立成文，手改、归档、diff 都简单
- **Preact UI 层** —— 组件用 React 风格 JSX 编写，运行时由 Preact 承载（esbuild 把 `react` 别名到 `preact/compat`）；视图/弹窗外壳仍是 Obsidian 原生（`ItemView` / `Modal` + `createRoot`）
- **容器驱动的响应式** —— 在视图容器上挂 `ResizeObserver`，推导 `full` / `compact` / `mobile` 三档，通过 `data-layout` 属性 + Context 下发；组件不猜视口宽度（修掉 Obsidian 分栏时「视口宽、叶片窄」的失配）
- **观察者模式** —— `DataStore` 与 `AccumulationStore` 各自在数据变化时通知 UI 重渲染
- **手动刷新 + 落盘缓存** —— 行情、年线信号、股息率、ETF 溢价只在点击时拉取，结果写入 `Misc.md`，没有后台轮询
- **建仓模块不接行情** —— 价格只手动录入，不下单；「到触发价」永远不被当作买入信号
- **金额用整数分** —— 建仓模块所有金额以整数分存储，只在解析/写盘两个边界取整，Markdown 里不会积累浮点尾巴
- **阶段状态是派生态** —— 成交是唯一事实源，状态每次读时重算，这才是「改计划不会污染历史」的根本原因
- **跨年写入** —— 向其它年份添加记录时自动处理文件切换

---

## 🛠️ 开发指南

### 环境要求

- [Node.js](https://nodejs.org/) v20+（项目用 Volta 锁定 `20.20.2`）
- 已安装 [Obsidian](https://obsidian.md)

### 开发配置

```bash
# 安装依赖
npm install

# 类型检查 + 打包 + 复制构建产物到 dist/
npm run build
```

`fixture/` 是一个可直接打开的 Obsidian Vault，含示例财务数据（`Finance/2025.md`、`Finance/2026.md`、`Finance/Misc.md`），以及一份示例建仓计划（`Finance/Investment/Accumulation/plans/600519-pl_sample01.md`）。用 Obsidian 打开它并启用插件即可开始调试。

> 💡 `npm run setup-fixture` 会把 fixture vault 里的三个插件文件（`main.js` / `manifest.json` / `styles.css`）以**文件级软链**指向仓库根的构建产物，所以日常只开 `npm run dev` 就够，改完在 Obsidian 里 Cmd+R 生效。不要软链整个插件目录 —— 那两次把链接指到了 `dist/`，读到的是旧包。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run build` | 生产构建 —— 类型检查 + 压缩打包 + 复制到 `dist/` |
| `npm run dev` | 监听模式 —— 增量重建仓库根的 `main.js` |
| `npm test` | 单元测试 —— esbuild 打包纯逻辑模块后交给 `node --test` |
| `npm run setup-fixture` | 把 fixture vault 的插件文件重新指回仓库根构建产物 |
| `npx tsc -noEmit -skipLibCheck` | 仅类型检查 |

### 测试

`npm test` 不需要任何测试框架：`scripts/test.mjs` 把纯逻辑模块（`accumulation/*`，不 import obsidian）打成临时 ESM bundle，再交给 Node 内置的 test runner。覆盖：金额解析与格式化、移动加权成本（部分卖出 / 清仓 / 超卖）、预算边界、阶段状态流转、右侧确认、触发价锚定、下一次建仓提示、回撤样本不足、跨币种汇率回落、frontmatter 容错、空 cell 不串列、转义竖线、未知键保留、序列化幂等，以及 `AccumulationStore` 基于内存 adapter 的完整 CRUD。

### 发布

推送一个 tag（如 `git tag v1.0.13 && git push origin v1.0.13`）—— [release 工作流](.github/workflows/release.yml) 会在 GitHub Actions 上构建并发布，附带 `main.js`、`manifest.json`、`styles.css` 与 zip 包，无需手动打包。

### 技术栈

- **TypeScript** 5.3 —— 开启 `strictNullChecks`
- **Preact** 10 —— UI 层，通过 `preact/compat` 别名跑 React 风格代码
- **esbuild** —— 快速打包（监听模式 + 生产压缩）
- **Chart.js** 4 —— 交互式图表，另用 `chartjs-chart-treemap` 画持仓树图
- **Obsidian API** —— 插件框架（声明为 external 模块）
- **node:test** —— 单元测试，不引入额外依赖

---

## 📝 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- [Obsidian](https://obsidian.md) —— 优秀的知识库应用
- [Chart.js](https://www.chartjs.org/) —— 简洁灵活的 JavaScript 图表库
- Obsidian 插件开发社区提供的详尽文档与示例
