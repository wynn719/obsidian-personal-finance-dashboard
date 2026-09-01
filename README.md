# 💰 Obsidian Personal Finance Dashboard

A beautifully designed [Obsidian](https://obsidian.md) plugin for tracking personal assets, income, expenses, and dividends — all within your vault, powered by plain Markdown files.

![Obsidian](https://img.shields.io/badge/Obsidian-v0.15.0+-7c3aed?logo=obsidian&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

---

## ✨ Features

- 📊 **Dashboard Overview** — 6 key metric cards (total assets, MoM change, monthly income/expense/surplus, yearly dividends)
- 🎯 **Asset Allocation Tracking** — Compare actual allocations vs target percentages, with deviation warnings (>10% highlighted)
- 📈 **Interactive Charts** — Doughnut chart for asset distribution + Bar/Line combo chart for monthly cash flow trends (powered by [Chart.js](https://www.chartjs.org/))
- 📅 **Monthly Overview Table** — Track each month's category amounts, MoM% changes, salary income, and investment returns
- 💸 **Cash Flow Management** — Record income and expenses with categories, filterable and paginated
- 🏦 **Dividend Tracking** — Log dividend income by stock, with autocomplete and yearly summaries
- 🗂️ **Stock Holdings Treemap** — Dashboard module with a treemap + details table for stock holdings; just enter a stock code (A-share / HK / US) + share count — names auto-fetch, one-click quote refresh computes and persists market value (stored in a standalone `Misc.md` file)
- 📁 **Markdown-First** — All data stored as human-readable Markdown files (one file per year), fully portable and versionable
- 🔒 **Privacy Mode** — One-click toggle to mask all financial numbers with `***`
- 🌐 **Bilingual** — Full English & Chinese (中文) support
- 🎨 **Theme-Aware** — Adapts to Obsidian's light/dark themes with a professional fintech design system
- 📱 **Responsive** — Works on both desktop and mobile Obsidian

---

## 🚀 Installation

1. Download the latest plugin folder package from [GitHub Releases](https://github.com/wynn719/obsidian-personal-finance-dashboard/releases)
2. Extract and copy the `personal-finance-dashboard` folder into your vault's plugin directory:
   ```
   {your-vault}/.obsidian/plugins/personal-finance-dashboard/
   ```
3. Open Obsidian **Settings** → **Community Plugins** → Enable **"Personal Finance Dashboard"**

---

## 📖 Usage

### Opening the Dashboard

- Click the **📊 wallet icon** in the left sidebar ribbon
- Or use the Command Palette: `Open Finance Dashboard`

### Stock Holdings Module

- The "Stock Holdings Treemap" section inside the dashboard — no view switching needed
- Use the **Edit Holdings** button in the dashboard header to open the manage modal; adding a holding only needs:
  - **Stock code**: A-share `600036` / HK `00700` / US `AAPL`
  - **Share count**: number of shares held
  - The stock name is fetched automatically from the quote API
- Click **🔄 Refresh Quotes** (manage modal top-right or the holdings card header) to fetch live prices — market value = shares × price, written back to `Misc.md` on every refresh, with day change shown red-up/green-down (A-share convention)
- Multi-currency holdings (A-share / HK / US): the quote request automatically includes live FX rates (USD/HKD → CNY); switch the top-right **CNY / HKD / USD** toggle to convert market values, while the price column always shows the native currency
- Click any treemap block (or the ✏️ button in the details table) to edit; 🗑️ to delete
- Quotes come from Tencent's public quote API (qt.gtimg.cn), no API key required

### Recording Data

The dashboard provides three types of data entry through modal dialogs:

| Action | What it does |
|--------|-------------|
| **➕ Add Snapshot** | Record a monthly asset snapshot — enter amounts for each asset category |
| **💰 Add Cash Flow** | Log an income or expense entry with date, amount, and category |
| **📈 Add Dividend** | Record dividend income with stock name, date, and amount |

### Year Navigation

Use the **year selector dropdown** in the dashboard header to switch between years. Each year's data is stored in a separate Markdown file.

### Privacy Mode

Click the **mask icon** (🔒) in the header to toggle privacy mode — all financial numbers will be replaced with `***`.

---

## ⚙️ Configuration

Open **Settings** → **Personal Finance Dashboard** to configure:

| Setting | Description | Default |
|---------|-------------|---------|
| **Language** | Display language (English / 中文) | 中文 |
| **Data Folder** | Vault-relative path for data files | `Finance` |
| **Misc Data File Path** | Vault-relative path of the standalone file for non-yearly data (e.g. stock holdings) | `Finance/Misc.md` |
| **Asset Categories** | Comma-separated asset category names | 货币短债, 中长债, 黄金, 高股息, 港美A |
| **Income Categories** | Comma-separated income category names | 工资, 副业, 投资收益, 其他收入 |
| **Expense Categories** | Comma-separated expense category names | 房租, 餐饮, 交通, 娱乐, 其他支出 |
| **Target Allocations** | Target percentage for each asset category (must sum to 100%) | 25%, 20%, 5%, 10%, 40% |

---

## 📄 Data Format

All data is stored as plain Markdown files in your vault under the configured data folder (default: `Finance/`). Each year gets its own file (e.g., `Finance/2025.md`).

### File Structure

```
your-vault/
└── Finance/
    ├── 2024.md
    ├── 2025.md
    ├── 2026.md
    └── Misc.md      ← non-yearly data (stock holdings)
```

### Markdown Format

Each file contains three sections:

#### Asset Snapshots

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

#### Cash Flow Records

```markdown
# Cash Flow Records

| Date | Type | Amount | Category | Note |
|------|------|--------|----------|------|
| 2025-12-01 | income | 35000 | 工资 | 12月工资 |
| 2025-12-15 | expense | 5500 | 房租 | 12月房租 |
| 2025-12-20 | income | 8000 | 副业 | 自由职业收入 |
```

#### Dividend Records

```markdown
# Dividend Records

| Date | Stock | Amount | Note |
|------|-------|--------|------|
| 2025-06-15 | 中国神华 | 12500 | 年度分红 |
| 2025-07-20 | 招商银行 | 8600 | 中期分红 |
```

#### Stock Holdings (Misc.md)

Non-yearly data lives in a standalone file (default `Finance/Misc.md`). Each `#` section holds one data type — currently stock holdings:

```markdown
# Stock Holdings

| Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt |
|------|--------|--------|--------|-------|---------|----------|--------|-----------|
| 五粮液 | 257800 | 000858 | 3600 | 71.83 | 0.79 | CNY | 1 | 2026-09-01T16:00:00+08:00 |
| 腾讯控股 | 189802 | 00700 | 430 | 441.4 | -2.56 | HKD | 0.857 | 2026-09-01T16:00:00+08:00 |
```

Share percentages are computed at runtime from the total amount — nothing to maintain by hand.

> 💡 **Tip**: Since data is plain Markdown, you can edit it directly in Obsidian or any text editor. The plugin will auto-detect changes and refresh.

---

## 🏗️ Architecture

```
src/
├── main.ts              # Plugin entry point & lifecycle
├── data-store.ts        # Data persistence (Markdown ↔ Memory)
├── calculator.ts        # Pure computation layer
├── models.ts            # TypeScript interfaces & defaults
├── settings.ts          # Obsidian settings tab
├── i18n.ts              # Internationalization (en/zh)
├── utils.ts             # Formatting & helper utilities
├── views/
│   └── dashboard-view.ts  # Dashboard UI (ItemView)
└── modals/
    ├── asset-snapshot-modal.ts  # Monthly snapshot entry
    ├── cash-flow-modal.ts       # Income/expense entry
    └── dividend-modal.ts        # Dividend entry
```

### Key Design Decisions

- **Markdown as Source of Truth** — No proprietary database; data stays portable and human-readable
- **Per-Year Files** — Keeps files manageable and allows easy year-over-year comparison
- **No UI Framework** — Pure imperative DOM manipulation via Obsidian's `createEl()` API
- **Observer Pattern** — `DataStore` notifies the dashboard view on any data change for automatic re-rendering
- **Cross-Year Writes** — Adding records to a different year automatically handles file switching

---

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (project uses Volta pin: `20.20.2`)
- [Obsidian](https://obsidian.md) installed

### Setup

```bash
# Install dependencies
npm install

# Symlink build outputs into the fixture vault's plugin directory
ln -sf $(pwd)/main.js fixture/.obsidian/plugins/personal-finance-dashboard/main.js
ln -sf $(pwd)/manifest.json fixture/.obsidian/plugins/personal-finance-dashboard/manifest.json
ln -sf $(pwd)/styles.css fixture/.obsidian/plugins/personal-finance-dashboard/styles.css

# Start dev mode (watch & auto-rebuild)
npm run dev
```

The `fixture/` directory is a ready-to-use Obsidian vault with sample financial data (`Finance/2025.md`, `Finance/2026.md`). Open it as a vault in Obsidian and enable the plugin to start testing. Any code changes will auto-rebuild and take effect after reloading the plugin.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode with watch & auto-rebuild |
| `npm run build` | Production build (type check + bundle + copy to `dist/`) |
| `npx tsc -noEmit -skipLibCheck` | Type checking only |

### Tech Stack

- **TypeScript** 5.3 — with `strictNullChecks` enabled
- **esbuild** — Fast bundling (< 1s builds)
- **Chart.js** 4.x — Interactive chart visualizations
- **Obsidian API** — Plugin framework (declared as external module)

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md) — The wonderful knowledge base app
- [Chart.js](https://www.chartjs.org/) — Simple yet flexible JavaScript charting
- The Obsidian plugin development community for their excellent documentation and examples
