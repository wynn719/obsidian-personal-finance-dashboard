# 项目长期记忆

## obsidian-personal-finance-dashboard
Obsidian 个人财务仪表盘插件。按年 Markdown 文件存储财务数据（Finance/YYYY.md），逻辑层与 UI 解耦。

## 技术栈（2026-07-23 Preact 迁移后）
- TypeScript 5.3 + esbuild + Chart.js 4 + Obsidian API(external)
- **UI 层：Preact 10（preact/compat 别名）**——原 React 18 迁移而来，运行时经 esbuild 别名重定向，类型仍用 @types/react
- 逻辑层不变：data-store.ts（观察者模式 onChange）、calculator.ts（纯函数）、models/i18n/utils
- settings.ts 保留 Obsidian 原生 Setting（未迁移）

## 关键架构
- UI 层在 `src/react/`：dashboard-app.tsx(顶层) + use-finance-data.ts(hook 订阅 store) + icon.tsx + chart.tsx + components/ + forms/
- 视图/Modal 外壳在 src/views/dashboard-view.tsx、src/modals/*.tsx：createRoot 挂载（preact/compat），onClose 先 root.unmount() 再 contentEl.empty()
- maskNumbers 为顶层 useState 下发；Chart.js 用 useRef+useEffect+destroy；Icon 用 useEffect+ref 调 setIcon
- esbuild 已开 minify(prod) + define NODE_ENV=production + target es2022；prod main.js 288KB / gz 94KB
- esbuild 0.17 无原生 alias，用 preactAlias resolve 插件（createRequire 解析绝对路径）
- **通用表格组件 `src/react/components/data-table.tsx`**：DataTable\<T\> 列模型驱动，内部消费 useLayout() 统一处理移动端适配（mobileMode card/table + stickyLabel + actions + summaryRow）。4 张表（CashFlow/MonthlyOverview/AssetAllocation/DividendSummary）全部复用，各自只声明列+模式。卡片类名 `finance-dt-*`。

## 响应式策略（2026-07-23 重构：顶层下发 data-layout）
- manifest.json: `isDesktopOnly: false` → 桌面+移动(iOS/Android)均支持
- **架构：shadcn 式分级 + 顶层统一下发**
  - 测量层 `src/react/responsive.tsx`：`LayoutProvider` 用 ResizeObserver 测【容器宽度】(contentEl.clientWidth 减 padding)，**非视口** → 修掉 Obsidian 分栏时视口宽但叶子窄的失配
  - 下发层：派生 `layout: full|compact|mobile` → 写根节点 `data-layout` 属性(供CSS) + React Context(供JS行为)
  - 组件层：`useLayout()` 消费；纯样式走 `[data-layout="x"] .cls` CSS，不自行判断点
- 断点(容器宽)：full≥1100 / compact 768-1099 / mobile<768
- 接线：dashboard-view 传 `container={this.contentEl}` → FinanceApp 包 `<LayoutProvider>` → contentEl 上写 data-layout（无额外 wrapper div，不破坏 `.finance-dashboard > .finance-section` 直系选择器）
- **CSS 已清空所有宽度类 @media**，全部改 `[data-layout]`；仅保留正交 @media：hover:none(触屏,已解耦≤480限制)/reduced-motion/print
- 阈值常量集中在 responsive.tsx（FULL_MIN=1100/COMPACT_MIN=768），改断点只动一处
- Chart.js 仍 responsive:true+maintainAspectRatio:false；charts 列数现在靠默认 auto-fit，仅 mobile 锁 1 列
- 待办：组件级行为适配(如 mobile 折叠宽表)可按需 `useLayout()`；图表高度按宽度动态化

## 本地预览
- `npm run setup-fixture` 建 fixture 软链接；`npm run dev` watch；`open "obsidian://open?path=.../fixture"` 打开测试 Vault
- fixture 路径：/Users/wynnezheng/Codes/githubcode/obsidian-personal-finance-dashboard/fixture

## 分支
- main：已合并 feature/react-migration（快进，2026-07-24）。含 Preact 迁移 + 响应式架构 + DataTable。本地领先 origin/main 4 提交，尚未 push。
- feature/react-migration：已并入 main，可保留或删除。

## 已知小历史
- calculator.getMonthlyCashFlow/getMonthlyTotalAssets 已修：加可选 year 参数跟随 currentYear（原先硬编码日历年）
- 股票持仓模块（2026-09-01）：原为独立 ItemView，后按用户要求合并进主仪表盘，成为 dashboard-app.tsx 内的 finance-holdings-section 双栏模块（左 Treemap + 右明细表）。数据存 Finance/Misc.md（settings.miscDataFilePath 可配）。fixture 插件目录当前是**拷贝**非软链（setup-fixture 后被覆盖），每次改完需手动 cp main.js/manifest.json/styles.css 过去。
- 原 renderTotalAssetsChart 有 new Chart 未存实例的内存泄漏，React 迁移后由 useRef 自动管理消除