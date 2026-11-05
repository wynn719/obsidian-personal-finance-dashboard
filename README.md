# 💰 Obsidian Personal Finance Dashboard

A beautifully designed [Obsidian](https://obsidian.md) plugin for tracking personal assets, income, expenses, dividends — and staged position building — all within your vault, powered by plain Markdown files.

> 🌐 中文文档见 [README.zh-CN.md](README.zh-CN.md)

![Obsidian](https://img.shields.io/badge/Obsidian-v0.15.0+-7c3aed?logo=obsidian&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/github/v/release/wynn719/obsidian-personal-finance-dashboard?label=Version&color=blue)

---

## ✨ Features

- 📊 **Dashboard Overview** — 6 key metric cards (total assets, MoM change, monthly income/expense/surplus, yearly dividends)
- 🎯 **Asset Allocation Tracking** — Compare actual allocations vs target percentages, with deviation warnings (>10% highlighted)
- 📈 **Interactive Charts** — Doughnut chart for asset distribution + Bar/Line combo chart for monthly cash flow trends (powered by [Chart.js](https://www.chartjs.org/))
- 📅 **Monthly Overview Table** — Track each month's category amounts, MoM% changes, salary income, and investment returns
- 💸 **Cash Flow Management** — Record income and expenses with categories, filterable and paginated
- 🏦 **Dividend Tracking** — Log dividend income by stock, with autocomplete and yearly summaries
- 🗂️ **Stock Holdings Treemap** — Dashboard module with a treemap + details table for stock holdings; just enter a stock code (A-share / HK / US) + share count — names auto-fetch, one-click quote refresh computes market value (multi-currency, valued in CNY) and writes it back to the standalone `Misc.md` file
- 🧭 **Market Signal Modules** — Three independent, manually-refreshed modules (results cached to `Misc.md`):
  - **MA250 strategy signal** — CSI Dividend Low-Volatility 100 (930955): deviation from its 250-day moving average with buy / hold / sell-sweet-spot / overheated zones
  - **High dividend TTM** — 9-stock A-share tracker: latest implemented annual + interim dividend per share ÷ live price
  - **US ETF premium monitor** — 16 Nasdaq / S&P 500 QDII ETFs: live premium vs latest NAV, fee & scale, rows ≤ 3% highlighted (filterable)
- 📦 **Position Tracker (分批建仓)** — Plan a budget, split it into staged entries, and track real fills against the plan:
  - Two trigger modes per stage: drawdown vs the locked reference buy price, or an explicit target price
  - Three amount strategies (fixed / increasing / custom) with live budget validation — allocated, unallocated, and per-stage share
  - Record real trades independently of the plan: multiple fills per stage, partial execution, skipping a stage with a reason
  - Moving weighted-average cost, unrealized P/L, remaining budget, budget usage, and a per-stage plan-vs-actual deviation table
  - Manual price updates with a price history, so max drawdown is either genuinely computed or explicitly marked “incomplete”
  - One Markdown file per plan — hand-editable, round-trip safe, archived instead of deleted
- 📁 **Markdown-First** — All data stored as human-readable Markdown files, fully portable and versionable
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

### Commands

Every action is also available from the Command Palette:

| Command | Description |
|---------|-------------|
| `Open Finance Dashboard` | Open (or focus) the dashboard view |
| `Add Asset Snapshot` | Record a monthly asset snapshot |
| `Add Income/Expense` | Log a cash flow record |
| `Add Dividend` | Record dividend income |
| `Add Stock Holding` | Add a stock holding |
| `New Accumulation Plan` | Create a staged position-building plan |
| `Refresh Finance Data` | Reload data files from disk |

### Workbench & Allocation Tabs

The dashboard is split into two page-level tabs; the active one is remembered across reloads (localStorage).

| Tab | Contents |
|-----|----------|
| **Workbench** | Position tracker card + the three market-signal modules (MA250 strategy signal, high-dividend TTM, ETF premium) |
| **Allocation** | Metric cards, allocation vs target, dividend summary, holdings treemap, three charts, monthly overview, cash-flow details |

Two different mounting strategies on purpose: the workbench panel stays mounted (only hidden) when you enter the position-tracker view, so each signal card keeps its filters and expanded state on the way back; the allocation panel is rebuilt on switch so Chart.js measures a real container instead of a `display:none` one.

### Position Tracker (分批建仓)

The first card on the workbench. Click its title or **All** to open the tracker — it takes over the workbench panel, with a back button in the top-left corner.

**Plan list** — market / asset type / status filters plus four sort keys (P&L, budget used, updated, distance to trigger). Each row shows price, average cost, invested, remaining budget, floating P&L, progress and the next trigger price.

**Creating a plan** — basics (name, symbol, market, asset type, currency, created date), capital (total budget, reference buy price, current price, reserved %), and the strategy:

| Concept | Meaning |
|---------|---------|
| **Stage** | One entry: initial buy, add-on-dip, or right-side confirmation |
| **Trigger mode** | `drawdown` — `reference price × (1 − drop%)`; `target` — an explicit price. Both parameters are kept, so switching modes never loses data |
| **Amount strategy** | `fixed` (equal split), `increasing` (linear ramp), or `custom` |
| **Template** | One click fills 0 / −8 / −15 / −25 / −35 % plus a right-side confirmation stage |

Budget validation is live: allocated, unallocated, and each stage's share are recomputed on every keystroke. Unallocated budget is allowed — it does not have to be distributed.

**Detail page** — ten metrics on top (budget, invested, remaining, usage, shares, average cost, current price, market value, unrealized P&L and its rate), then:

- **Next entry** — stage, trigger price, current price, distance (below/above), planned amount, remaining budget. Reaching the trigger is highlighted, but it is **not** a buy signal: record a trade, adjust the amount, or skip the stage yourself. Right-side confirmation only ever triggers on an explicit “mark confirmed”, never on a price rise.
- **Stage timeline** — planned vs actual per stage, status (pending / triggered / partial / done / skipped / void), trade date
- **Plan vs actual** — per-stage planned, actual, deviation, and share of budget, including a row for trades not assigned to any stage
- **Trades** — add / edit / delete; amount auto-computes from price × quantity but stays editable; fees count towards the budget
- **Price update** — inline, no dialog; also appends a price point (one per day) used for max drawdown
- **Plan changes**, **thesis** and **review** — the latter two are free text you own; the plugin never rewrites them

> Planning never overwrites history: stage status is *derived* from trades + current price, and editing a plan only touches stages that have no fills yet.

### Stock Holdings Module

- The "Stock Holdings Treemap" section inside the allocation tab — no view switching needed
- Use the **Edit Holdings** button in the dashboard header to open the manage modal; adding a holding only needs:
  - **Stock code**: A-share `600036` / HK `00700` / US `AAPL`
  - **Share count**: number of shares held
  - The stock name is fetched automatically from the quote API
- Click **🔄 Refresh Quotes** (manage modal top-right or the holdings card header) to fetch live prices — market value = shares × price is written back to `Misc.md` on every refresh (rounded to 2 decimals), with day change shown red-up/green-down (A-share convention)
- Multi-currency holdings (A-share / HK / US): the quote request automatically includes live FX rates (USD/HKD → CNY); market values and shares are uniformly converted to CNY behind the scenes (the price column shows the native currency)
- Click any treemap block (or the ✏️ button in the details table) to edit; 🗑️ to delete
- Quotes come from Tencent's public quote API (qt.gtimg.cn), no API key required

### Market Signal Modules

Three independent modules sit next to the position-tracker card — each is self-contained with its own refresh button. Nothing polls in the background: data is fetched only when you click 🔄, and the last result is cached in `Misc.md` so it's still visible next time you open the dashboard.

| Module | What it shows | Data source |
|--------|---------------|-------------|
| **MA250 strategy signal** | CSI Dividend Low-Volatility 100 (930955): latest close vs the 250-day average, deviation, and strategy zone (buy < 0 / hold 0–3% / sell sweet spot 3–6% / overheated > 6%) | csindex.com.cn (index-perf) |
| **High dividend TTM** | 9 A-share tracker stocks: latest implemented annual + interim dividend per share ÷ live price, sorted by yield (the exact definition used by the companion daily automation) | East Money dividend API + Tencent quotes |
| **US ETF premium monitor** | 16 Nasdaq / S&P 500 QDII ETFs: price, premium vs latest published NAV, combined fee and scale; shows only ≤ 3% rows by default, toggle for all 16 | Tencent quotes (qt.gtimg.cn) |

> 💡 The ETF premium is computed by the quote API as price ÷ latest published NAV − 1 — the same definition as the low-premium scanner. Negative values mean a discount.

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
| **Accumulation Folder** | Vault-relative folder holding one Markdown file per position plan | `Finance/Investment/Accumulation` |
| **Reference FX Rates** | CNY per 1 HKD / USD, used only when live holding quotes have no rate | 0.92 / 7.10 |
| **Asset Categories** | Comma-separated asset category names | 货币短债, 中长债, 黄金, 高股息, 港美A |
| **Income Categories** | Comma-separated income category names | 工资, 副业, 投资收益, 其他收入 |
| **Expense Categories** | Comma-separated expense category names | 房租, 餐饮, 交通, 娱乐, 其他支出 |
| **Target Allocations** | Target percentage for each asset category (must sum to 100%) | 25%, 20%, 5%, 10%, 40% |

---

## 📄 Data Format

All data is stored as plain Markdown files in your vault under the configured data folder (default: `Finance/`). Each year gets its own file (e.g., `Finance/2025.md`); each position plan gets its own file too.

### File Structure

```
your-vault/
└── Finance/
    ├── 2024.md
    ├── 2025.md
    ├── 2026.md
    ├── Misc.md                        ← non-yearly data (holdings, signal caches)
    └── Investment/
        └── Accumulation/
            ├── plans/                 ← one file per plan, e.g. 600519-pl_7f3k2m9q.md
            └── archive/               ← archived plans live here
```

### Markdown Format

Each year file contains three sections:

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

| Date | Type | Category | Amount | Note |
|------|------|----------|--------|------|
| 2025-12-01 | income | 工资 | 35000 | 12月工资 |
| 2025-12-15 | expense | 房租 | 5500 | 12月房租 |
| 2025-12-20 | income | 副业 | 8000 | 自由职业收入 |
```

#### Dividend Records

```markdown
# Dividend Records

| Date | Stock | Amount | Note |
|------|-------|--------|------|
| 2025-06-15 | 中国神华 | 12500 | 年度分红 |
| 2025-07-20 | 招商银行 | 8600 | 中期分红 |
```

#### Misc.md — Non-Yearly Data

Non-yearly data lives in a standalone file (default `Finance/Misc.md`). Each `#` section holds one data type.

**Stock Holdings** — written by the holdings module:

```markdown
# Stock Holdings

| Name | Amount | Symbol | Shares | Price | Change% | Currency | FXRate | UpdatedAt |
|------|--------|--------|--------|-------|---------|----------|--------|-----------|
| 五粮液 | 258588 | 000858 | 3600 | 71.83 | 0.79 | CNY | 1 | 2026-09-01T16:00:00+08:00 |
| 腾讯控股 | 189802 | 00700 | 430 | 441.4 | -2.56 | HKD | 0.857 | 2026-09-01T16:00:00+08:00 |
```

`Amount` = shares × price in the native currency — recomputed and rounded to 2 decimals on every quote refresh, so the file never picks up floating-point artifacts. `FXRate` is the CNY rate at the last refresh (used to value non-CNY holdings in CNY). Share percentages are computed at runtime from the total amount — nothing to maintain by hand.

**Market signal caches** — written by the three signal modules on each manual refresh (also safe to edit by hand):

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

- `Index Signal` — `Zone` is `buy` / `hold` / `sell` / `overheat`; `Deviation%` is close ÷ MA250 − 1
- `Dividend Yields` — `DivType` is `semi` (annual + interim) or `annual`; an empty `Pending` cell means the latest annual report is already implemented
- `ETF Premiums` — `Premium%` is vs the latest published NAV (negative = discount); `Scale` is in 100M CNY

#### Accumulation plans — one file per plan

A plan file is a flat YAML frontmatter plus four tables and two free-text sections:

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

- Money is written with 2 decimals and **no thousands separators**; the currency lives in frontmatter
- The `Trigger` column is a **read-only derived column** — it is always recomputed from `Anchor × (1 − Drop%)` (or `Target`), so editing it by hand has no effect. Anchor prices are locked at creation, which is why fills never shift the plan
- Stage status (`pending` / `triggered` / `partial` / `completed`) is **derived** from trades + current price; only `SkippedAt`, `VoidedAt` and `ConfirmedAt` are persisted
- Unknown frontmatter keys, unknown `#` sections and the two free-text sections are preserved verbatim
- A file the parser cannot understand is reported and frozen (never overwritten) — see [docs/ACCUMULATION.md](docs/ACCUMULATION.md) for the full format, hand-editing rules and calculation definitions

> 💡 **Tip**: Since data is plain Markdown, you can edit it directly in Obsidian or any text editor. The plugin will auto-detect changes and refresh.

---

## 🏗️ Architecture

```
src/
├── main.ts                     # Plugin entry point & lifecycle
├── data-store.ts               # Year files + Misc.md (holdings & signal caches)
├── calculator.ts               # Pure computation layer for the yearly data
├── quote-service.ts            # Live quotes + FX rates (batched, qt.gtimg.cn)
├── index-signal-service.ts     # MA250 strategy signal (csindex.com.cn)
├── etf-premium-service.ts      # Nasdaq/S&P QDII ETF premiums (qt.gtimg.cn)
├── dividend-yield-service.ts   # TTM dividend yields (East Money + quotes)
├── market-refresh.ts           # Single entry point for the four remote refreshes
├── market-code.ts              # A-share exchange prefix table
├── models.ts                   # TypeScript interfaces & defaults
├── settings.ts                 # Obsidian settings tab
├── i18n.ts                     # Internationalization (en/zh)
├── utils.ts                    # Formatting & helper utilities
├── accumulation/               # Position tracker — pure TS, no obsidian import
│   ├── types.ts                # Plan / stage / trade / price models (integer cents)
│   ├── money.ts                # Cent arithmetic & comma-free formatting
│   ├── table.ts                # Markdown table I/O (empty cells preserved)
│   ├── parser.ts               # frontmatter + sections → plan (tolerant)
│   ├── serializer.ts           # plan → Markdown (round-trip safe)
│   ├── calc.ts                 # Cost basis, budget, triggers, plan-vs-actual, drawdown
│   ├── template.ts             # Default stage template & amount strategies
│   ├── store.ts                # AccumulationStore: adapter IO, write queue, hash dedupe
│   └── stats.ts                # Portfolio review statistics (batch 2, placeholder)
├── react/                      # Preact UI layer
│   ├── dashboard-app.tsx       # Top-level dashboard component & tab state
│   ├── responsive.tsx          # Container-driven layout (LayoutProvider / useLayout)
│   ├── masonry.tsx             # Desktop masonry grid (measured row spans)
│   ├── use-finance-data.ts     # Yearly store subscription hook
│   ├── use-accumulation-data.ts# Accumulation store subscription hook
│   ├── chart.tsx               # Chart.js wrappers
│   ├── holdings-chart.tsx      # Holdings treemap
│   ├── components/             # Tabs, generic DataTable, metric cards, market signals,
│   │                           #   and components/accumulation/* (card, list, detail, timeline…)
│   ├── forms/                  # Snapshot / cash flow / dividend / holding / accumulation forms
│   └── hooks/                  # use-quote-refresh
├── views/
│   └── dashboard-view.tsx      # ItemView shell (createRoot mount)
└── modals/                     # Native Obsidian modal shells
    ├── asset-snapshot-modal.tsx
    ├── cash-flow-modal.tsx
    ├── dividend-modal.tsx
    ├── holding-modal.tsx
    ├── holdings-manage-modal.tsx
    ├── accumulation-plan-modal.tsx
    └── accumulation-trade-modal.tsx
```

### Key Design Decisions

- **Markdown as Source of Truth** — No proprietary database; data stays portable and human-readable
- **Per-Year Files, Per-Plan Files** — Yearly data stays comparable year over year; a plan is its own file so hand-editing, archiving and diffing stay trivial
- **Preact UI Layer** — Components are written with React-style JSX and run on Preact (esbuild aliases `react` → `preact/compat`); the view/modal shells stay native Obsidian (`ItemView` / `Modal` + `createRoot`)
- **Container-Driven Responsive Layout** — A `ResizeObserver` on the view container derives a `full` / `compact` / `mobile` layout and dispatches it via a `data-layout` attribute + context; components consume that instead of guessing from the viewport (fixes the Obsidian split-pane mismatch)
- **Observer Pattern** — `DataStore` and `AccumulationStore` each notify the UI on any data change for automatic re-rendering
- **Manual Refresh, Cached to Disk** — Market data modules (quotes, index signal, dividend yields, ETF premiums) fetch only on demand and persist their last result to `Misc.md`, so the view stays current without background polling
- **No Live Prices in the Tracker** — The position tracker deliberately takes manual prices only. It never places orders, and “price hit the trigger” is never treated as a buy signal
- **Integer Cents** — All money in the tracker is stored as integer cents, rounded only at the parse/write boundary, so Markdown never accumulates float artefacts
- **Derived Stage State** — Trades are the single source of truth: stage status is recomputed on read, which is what makes plan edits unable to corrupt history
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

# Type check + bundle + copy the build output to dist/
npm run build
```

The `fixture/` directory is a ready-to-use Obsidian vault with sample financial data (`Finance/2025.md`, `Finance/2026.md`, `Finance/Misc.md`) plus a sample position plan (`Finance/Investment/Accumulation/plans/600519-pl_sample01.md`). Open it as a vault in Obsidian and enable the plugin to start testing.

> 💡 `npm run setup-fixture` points the fixture vault's three plugin files (`main.js` / `manifest.json` / `styles.css`) at the **repo-root build output** with file-level symlinks, so `npm run dev` alone is enough for watch-driven iteration — reload the plugin in Obsidian (Cmd/Ctrl+R) to pick up a rebuild. Never symlink the whole plugin folder: that has twice ended up pointing at `dist/` and silently loading a stale bundle.

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Production build — type check + minified bundle + copy to `dist/` |
| `npm run dev` | Watch mode — incremental rebuild of the repo-root `main.js` |
| `npm test` | Unit tests — bundles the pure modules with esbuild, then runs `node --test` |
| `npm run setup-fixture` | Re-point the fixture vault's plugin files at the repo-root build output |
| `npx tsc -noEmit -skipLibCheck` | Type checking only |

### Tests

`npm test` needs no test framework: `scripts/test.mjs` bundles the pure modules (`accumulation/*`, no `obsidian` import) into a temporary ESM bundle, then hands it to Node's built-in test runner. Covered: money parsing/formatting, moving weighted-average cost (partial sells, full liquidation, oversell), budget boundaries, stage status derivation, right-side confirmation, trigger-price anchoring, next-entry hints, insufficient-drawdown samples, cross-currency FX fallbacks, frontmatter tolerance, empty-cell column integrity, escaped pipes, unknown-key preservation, serialization idempotency, and `AccumulationStore` CRUD against an in-memory adapter.

### Releasing

Push a tag (e.g. `git tag v1.0.13 && git push origin v1.0.13`) — the [release workflow](.github/workflows/release.yml) builds the plugin on GitHub Actions and publishes a release with `main.js`, `manifest.json`, `styles.css` and a zip. No manual packaging.

### Tech Stack

- **TypeScript** 5.3 — with `strictNullChecks` enabled
- **Preact** 10 — UI layer, running React-style code via the `preact/compat` alias
- **esbuild** — fast bundling (watch mode + minified production builds)
- **Chart.js** 4 — interactive charts, plus `chartjs-chart-treemap` for the holdings treemap
- **Obsidian API** — plugin framework (declared as an external module)
- **node:test** — unit tests, no extra dependency

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md) — The wonderful knowledge base app
- [Chart.js](https://www.chartjs.org/) — Simple yet flexible JavaScript charting
- The Obsidian plugin development community for their excellent documentation and examples
