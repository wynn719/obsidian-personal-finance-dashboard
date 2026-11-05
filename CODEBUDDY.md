# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

## Project Overview

Obsidian Personal Finance Dashboard — an Obsidian plugin for tracking personal assets, income/expenses, and dividends. Data is persisted as **per-year Markdown files** (e.g. `Finance/2025.md`, `Finance/2026.md`) inside the Obsidian Vault, parsed at load time into in-memory structures, and rendered via a custom `ItemView` with Chart.js visualizations.

## Build & Development Commands

### Install dependencies
```bash
npm install
```

### Development mode (watch & auto-rebuild)
```bash
npm run dev
```
Runs esbuild in watch mode. Output goes to `main.js` in project root. To test, symlink or copy `main.js`, `manifest.json`, and `styles.css` into your Obsidian vault's `.obsidian/plugins/personal-finance-dashboard/` directory.

### Production build
```bash
npm run build
```
Runs `tsc -noEmit -skipLibCheck` for type checking, then esbuild in production mode (no sourcemaps, tree-shaking), then copies `main.js`, `manifest.json`, `styles.css` into `dist/`.

### Type checking only
```bash
npx tsc -noEmit -skipLibCheck
```

## Fixture / Testing

`npm test` runs the unit tests: `scripts/test.mjs` bundles the pure modules (`src/accumulation/*`, no `obsidian` import) into a temporary ESM bundle with esbuild and hands it to Node's built-in test runner — no test framework is installed, and none should be added.

The `fixture/` directory is a sample Obsidian vault (`Finance/2025.md`, `Finance/2026.md`, `Finance/Misc.md`, plus a sample plan under `Finance/Investment/Accumulation/plans/`). Point Obsidian at it as a vault and enable the plugin for manual testing. `npm run setup-fixture` turns the plugin's three files into file-level symlinks to the repo-root build output.

## Architecture

### Entry Point & Plugin Lifecycle

`src/main.ts` — `FinanceDashboardPlugin` extends Obsidian's `Plugin`. On load it:
1. Reads persisted settings via `this.loadData()` (includes migration from legacy `dataFilePath` to `dataFolderPath`)
2. Creates `DataStore` and calls `load()` to parse all year files, then `startWatching()` for live file change detection
3. Creates `FinanceCalculator` wrapping the store
4. Registers the `FinanceDashboardView` as a custom view type (`finance-dashboard-view`)
5. Wires modal callbacks (`onAddSnapshot`, `onEditCashFlow`, etc.) from the view to modal openers
6. Registers ribbon icon, commands, and settings tab

### Data Layer — `src/data-store.ts`

Central persistence manager. Core design:

- **Per-year storage**: `dataByYear: Map<string, FinanceData>` holds parsed data keyed by year string (e.g. `"2025"`)
- **`currentYear`**: Tracks which year is active for the dashboard. `getData()` / `setData()` always operate on `currentYear`
- **Markdown ↔ Memory**: Two internal classes handle serialization:
  - `MarkdownParser.parse(markdown)` — State machine line-by-line parser. Detects sections via `# Asset Snapshots` / `# Cash Flow Records` / `# Dividend Records` headings. Asset snapshots have `## YYYY-MM` sub-headings with optional `>` blockquote notes and `|` table rows. Cash flow and dividends are flat tables
  - `MarkdownSerializer.serialize(data)` — Writes back to Markdown. Snapshots sorted by month descending, cash flow by date descending, dividends by date ascending
- **File watching**: Registers `vault.on("modify", ...)` to detect external edits to any `{dataFolder}/{year}.md` file. Uses `isSaving` flag + 500ms delay to avoid self-triggering
- **Cross-year writes**: Methods like `addCashFlow()` / `addDividend()` detect if the record's year differs from `currentYear`, temporarily switch to the target year for saving, then switch back
- **Observer pattern**: `listeners[]` array notified via `notifyChange()` — the dashboard view subscribes to re-render on data changes

### Calculation Layer — `src/calculator.ts`

`FinanceCalculator` — pure computation, no side effects. Key methods:
- `getDashboardMetrics(month)` — Computes 6 metric card values: total assets, MoM change (amount + %), monthly income/expense/surplus, yearly dividends
- `getAllocationRows(month, targets)` — Compares actual category percentages against target allocations, computes deviation
- `getMonthlyOverview(settings)` — Iterates all snapshots, calculates salary income, other income, per-category amounts, MoM%, and investment return (total change minus all income)
- `getMonthlyCashFlow(months)` — Last N months income vs expense with fallback to earliest data if recent months are empty
- `getDividendSummary(year)` — Groups dividends by stock name, sums amounts

### View Layer — `src/views/dashboard-view.tsx`

`FinanceDashboardView` extends `ItemView`. It is a thin shell: it clears `contentEl`, adds the `finance-dashboard` class and mounts the Preact app once via `createRoot` (`FinanceApp`). All rendering happens inside Preact components; modal callbacks are fields injected by `main.ts`. Sections rendered in order:
1. **Header** — Title, year selector dropdown (async populated via `getAvailableYears()`), action buttons (mask toggle, add snapshot/cashflow/dividend, refresh)
2. **Metric Cards** — 6-column grid of KPI cards
3. **Asset Allocation Table** — With deviation warnings (>10% highlighted)
4. **Charts** — Doughnut (asset distribution) + Bar+Line combo (monthly income vs expense vs net cash flow), using Chart.js
5. **Monthly Overview Table** — Dynamic columns based on discovered asset categories
6. **Dividend Summary** — Grouped by stock with grand total
7. **Cash Flow Details** — Filterable (all/income/expense) with pagination (max 50)

`FinanceApp` (`src/react/dashboard-app.tsx`) owns the page-level tab state and derives all view data synchronously from `DataStore` / `FinanceCalculator` on every store notification.

Number masking: `maskNumbers` boolean toggles all financial values to `"***"`.

### Modal Layer — `src/modals/`

Thin Obsidian `Modal` subclasses; each one mounts a Preact form via `createRoot` in `onOpen` and unmounts it in `onClose`:
- `AssetSnapshotModal` — Month picker + dynamic category amount/details inputs from settings + note
- `CashFlowModal` — Type toggle (income/expense) dynamically switches category dropdown between `incomeCategories` and `expenseCategories`
- `DividendModal` — Stock name with HTML5 datalist autocomplete from historical records
- `HoldingModal` / `HoldingsManageModal` — one holding, or the whole holdings table
- `AccumulationPlanModal` / `AccumulationTradeModal` — position-tracker plan editor and trade recorder

All modals validate input, call the corresponding store method, show `Notice` on success.

### Models — `src/models.ts`

Core interfaces: `AssetSnapshot` (monthly, flat category list), `CashFlowRecord`, `DividendRecord`, `TargetAllocation`, `FinanceSettings`, `FinanceData`. Default settings use Chinese category presets (货币短债, 中长债, 黄金, 高股息, 港美A).

### i18n — `src/i18n.ts`

Full English + Chinese translation strings. `t(key, params?)` with `{placeholder}` interpolation. Module-level `currentLocale` set via `setLocale()`.

### Utilities — `src/utils.ts`

`generateId()`, `formatCurrency()`, `formatCurrencyCompact()` (万/k units for large numbers), `formatPercent()`, `formatChange()`, `getCurrentMonth/Date/Year()`, `createEl()`.

### Settings — `src/settings.ts`

`FinanceSettingTab` — Obsidian settings page. Configures locale, data folder path, target allocation percentages (with 100% validation), and comma-separated category lists (asset/income/expense). Category changes auto-sync target allocations.

### Styling — `styles.css`

Design system with CSS custom properties (`--fd-*`). Supports light/dark themes via Obsidian's `--background-*` / `--text-*` variables. Responsive rules are container-driven: `LayoutProvider` writes `data-layout="full|compact|mobile"` (container width ≥1100 / 768–1099 / <768) on the view root, and CSS uses `[data-layout="…"]` selectors — **no width media queries inside the dashboard**. Modal content lives outside that provider, so form grids there use plain viewport media queries. Includes print styles, reduced-motion support, and touch optimizations.

## Key Conventions

- **Data format**: Each year's data lives in `{dataFolderPath}/{year}.md`. The Markdown format is the source of truth — it's human-readable and editable
- **IDs**: Snapshot IDs use `snap-{YYYY-MM}` format; all other records use `generateId()` (timestamp + random)
- **Preact UI**: components are JSX running on Preact 10 (`react` → `preact/compat` via the esbuild `preactAlias` plugin); only the `ItemView` / `Modal` shells are imperative Obsidian APIs
- **External `obsidian` module**: Declared as external in esbuild config — it's provided by the Obsidian runtime
- **Node version**: Volta pinned to Node 20.20.2
- **TypeScript**: `strictNullChecks` enabled, `noImplicitAny` disabled. ESNext modules, ES6 target

## 分批建仓模块（Position Tracker）

`src/accumulation/` 是一个与 `DataStore` 完全解耦的独立模块，数据落在 `Finance/Investment/Accumulation/plans/{symbol}-{id}.md`（每计划一文件），归档移到 `archive/`。格式与手改规则见 `docs/ACCUMULATION.md`。

- **纯计算层**：`types.ts` / `money.ts` / `table.ts` / `parser.ts` / `serializer.ts` / `calc.ts` / `template.ts` 不 import obsidian，可直接用 `node --test` 跑（`npm test`）。
- **持久化**：`store.ts` 的 `AccumulationStore` 只用 `vault.adapter`（`exists/read/write/process/mkdir/list/rename/remove/trashSystem`），带按计划的写队列 + 内容 hash 自触发抑制；解析失败的文件只标记不写回。
- **金额**：一律整数「分」（`Cents`），只在 `toCents` 与写盘两个边界取整。不要复用 `utils.formatCurrency`（它带千位分隔符）。
- **阶段状态**：派生态。文件里只存 `skippedAt` / `voidedAt` / `confirmedAt`，`pending/triggered/partial/completed` 由成交 + 现价推导。
- **UI 入口**：工作台的 `AccumulationCard`，点进后整块面板切到 `AccumulationModule` 的 `list` / `detail` 视图栈。弹窗表单不在 `LayoutProvider` 内，网格断点用视口媒体查询而不是 `[data-layout]`。
