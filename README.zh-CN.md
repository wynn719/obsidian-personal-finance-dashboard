# 💰 Obsidian 个人财务仪表盘

一款精心设计的 [Obsidian](https://obsidian.md) 插件，用于追踪个人资产、收支和股息 —— 所有数据以纯 Markdown 文件存储在你的 Vault 中。

![Obsidian](https://img.shields.io/badge/Obsidian-v0.15.0+-7c3aed?logo=obsidian&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## ✨ 功能特性

- 📊 **仪表盘概览** — 6 个核心指标卡片（总资产、环比变化、月收入/支出/结余、年度股息）
- 🎯 **资产配置追踪** — 实际配置与目标比例对比，偏离超过 10% 时高亮警告
- 📈 **交互式图表** — 环形图展示资产分布 + 柱状/折线组合图展示月度现金流趋势（基于 [Chart.js](https://www.chartjs.org/)）
- 📅 **月度总览表** — 追踪每月各类别资产金额、环比变化、工资收入和投资回报
- 💸 **收支管理** — 按分类记录收入和支出，支持筛选和分页
- 🏦 **股息追踪** — 按股票记录股息收入，支持自动补全和年度汇总
- 🗂️ **股票持仓占比** — 仪表盘内置模块，矩形树图 + 明细表展示各股票持仓；只需填写股票代码（A 股 / 港股 / 美股）+ 股数，名称自动获取，一键刷新实时行情计算市值并持久化（数据存于独立的 `Misc.md` 文件）
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

### 股票持仓模块

- 仪表盘内的「股票持仓占比」区块，无需切换视图
- 顶部 **编辑股票持仓** 按钮打开管理弹窗；添加持仓只需填写：
  - **股票代码**：A 股如 `600036` / 港股如 `00700` / 美股如 `AAPL`
  - **持股数**：持有股数
  - 股票名称由行情接口自动获取写入，无需手填
- 点击 **🔄 刷新行情**（管理弹窗右上角或持仓卡片标题栏）获取实时价格，市值 = 股数 × 现价并写回 `Misc.md`，涨跌幅按 A 股习惯涨红跌绿显示
- 支持 A 股 / 港股 / 美股多币种持仓：行情请求自动附带实时汇率（美元/港币兑人民币），市值按右上角 **CNY / HKD / USD** 切换换算显示；现价列始终显示原币价
- 点击树图色块（或明细表中的 ✏️ 按钮）编辑，🗑️ 删除
- 行情来源为腾讯公开行情接口（qt.gtimg.cn），无需 API Key

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

每个文件包含三个部分：

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

| Date | Type | Amount | Category | Note |
|------|------|--------|----------|------|
| 2025-12-01 | income | 35000 | 工资 | 12月工资 |
| 2025-12-15 | expense | 5500 | 房租 | 12月房租 |
| 2025-12-20 | income | 8000 | 副业 | 自由职业收入 |
```

#### 股息记录

```markdown
# Dividend Records

| Date | Stock | Amount | Note |
|------|-------|--------|------|
| 2025-06-15 | 中国神华 | 12500 | 年度分红 |
| 2025-07-20 | 招商银行 | 8600 | 中期分红 |
```

#### 股票持仓（Misc.md）

非年度数据存放在独立文件中（默认 `Finance/Misc.md`）。每个 `#` 标题对应一种数据类型 —— 当前为股票持仓：

```markdown
# Stock Holdings

| Name | Amount | Note |
|------|--------|------|
| 五粮液 | 257800 | 白酒龙头 |
| 腾讯控股 | 189300 | 港股通 |
| 中国神华 | 95200 | 高股息 |
```

持仓占比在运行时按总市值自动计算，无需手工维护。

> 💡 **提示**：由于数据是纯 Markdown 格式，你可以直接在 Obsidian 或任何文本编辑器中编辑它。插件会自动检测文件变更并刷新仪表盘。

---

## 🏗️ 项目架构

```
src/
├── main.ts              # 插件入口 & 生命周期
├── data-store.ts        # 数据持久化（Markdown ↔ 内存）
├── calculator.ts        # 纯计算层
├── models.ts            # TypeScript 接口 & 默认值
├── settings.ts          # Obsidian 设置页
├── i18n.ts              # 国际化（中/英）
├── utils.ts             # 格式化 & 工具函数
├── views/
│   └── dashboard-view.ts  # 仪表盘 UI（ItemView）
└── modals/
    ├── asset-snapshot-modal.ts  # 月度快照录入
    ├── cash-flow-modal.ts       # 收支录入
    └── dividend-modal.ts        # 股息录入
```

### 核心设计理念

- **Markdown 即数据源** — 不使用私有数据库，数据保持可移植、可读性强
- **按年分文件** — 文件大小可控，便于年度对比
- **无 UI 框架** — 通过 Obsidian 的 `createEl()` API 进行纯命令式 DOM 操作
- **观察者模式** — `DataStore` 在数据变更时通知仪表盘视图自动重新渲染
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

# 将构建产物软链到 fixture Vault 的插件目录
ln -sf $(pwd)/main.js fixture/.obsidian/plugins/personal-finance-dashboard/main.js
ln -sf $(pwd)/manifest.json fixture/.obsidian/plugins/personal-finance-dashboard/manifest.json
ln -sf $(pwd)/styles.css fixture/.obsidian/plugins/personal-finance-dashboard/styles.css

# 启动开发模式（监听文件变更 & 自动重建）
npm run dev
```

`fixture/` 目录是一个可直接使用的 Obsidian Vault，包含示例财务数据（`Finance/2025.md`、`Finance/2026.md`）。在 Obsidian 中打开该文件夹作为 Vault 并启用插件即可开始测试。代码修改后会自动重建，重新加载插件即可生效。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（监听变更 & 自动重建） |
| `npm run build` | 生产构建（类型检查 + 打包 + 复制到 `dist/`） |
| `npx tsc -noEmit -skipLibCheck` | 仅类型检查 |

### 技术栈

- **TypeScript** 5.3 — 启用 `strictNullChecks`
- **esbuild** — 极速打包（构建 < 1 秒）
- **Chart.js** 4.x — 交互式图表可视化
- **Obsidian API** — 插件框架（声明为 external 模块）

---

## 📝 许可证

本项目基于 [MIT 许可证](LICENSE) 开源。

---

## 🙏 致谢

- [Obsidian](https://obsidian.md) — 优秀的知识管理应用
- [Chart.js](https://www.chartjs.org/) — 简洁灵活的 JavaScript 图表库
- Obsidian 插件开发社区提供的优秀文档和示例
