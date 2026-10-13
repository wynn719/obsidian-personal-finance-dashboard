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
- esbuild 已开 minify(prod) + define NODE_ENV=production + target es2022；prod main.js 370KB / gz 117KB（2026-10-13 含市场信号模块后）
- esbuild 0.17 无原生 alias，用 preactAlias resolve 插件（createRequire 解析绝对路径）；测试场景可用 CLI `--alias:obsidian=<stub>` 在 node 里跑纯函数
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

## 本地预览与部署点（两个）
- **fixture（测试）**：`npm run setup-fixture` 建软链；`open "obsidian://open?path=.../fixture"`；插件目录软链指向 `dist/`，`npm run build` 即自动生效。路径：/Users/wynnezheng/Codes/githubcode/obsidian-personal-finance-dashboard/fixture
- **typora（真实使用，2026-10-13 起）**：用户手动复制 dist 三件套到 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/typora/.obsidian/plugins/personal-finance-dashboard/`；**build 后需再次复制 + 重载插件**才生效（iCloud vault 不适合做软链）。
- 网络故障排查手段（2026-10-13 实战）：`scutil --proxy` 查系统代理 / `curl --noproxy '*'` 测直连 / 检查目标 vault Misc.md mtime 判断用户刷新是否落盘。

## 发布与文档（2026-10-13）
- GitHub：github.com/wynn719/obsidian-personal-finance-dashboard（public）。Release 由 `.github/workflows/release.yml` 在 push tag 时自动构建发布（dist 内 main.js/manifest.json/styles.css/zip）。
- ⚠️ 口径不一致（未修）：tag 已到 v1.0.12，但 `manifest.json` 的 version 一直写 1.0.0（历史各 tag 处也是 1.0.0）。README 版本徽章已改为 shields 动态 release 徽章。
- README 双语文档（2026-10-13 更新）：Commands 表、Releasing 段、Preact 架构树、fixture→dist 调试流程、收支表列序 `Date|Type|Category|Amount|Note`；新增 LICENSE（MIT，Copyright 2026 Wynne Zheng，若需改署名在此文件）。

## 分支
- main：本地领先 origin/main 3 提交（85cadf1 精度 / 6915d4c 移动端 / 19afa75 docs），尚未 push。市场信号模块改动（2026-10-13）在**工作区未提交**，待用户审 UI 后决定。

## 市场信号模块（2026-10-13，移植自 WorkBuddy 每日自动化）
- 三个独立手动刷新模块，位于资产配置行上方（`dashboard-app.tsx` 的 `.finance-market-grid`），各带刷新按钮 + 更新时间；数据缓存于 Misc.md，打开即见上次结果。
- ①年线策略信号：`src/index-signal-service.ts`（中证官网 index-perf，UA/Referer 优先、失败降级默认头）；插件端算 MA250/偏离度；四区间 buy<0 / hold 0-3 / sell 3-6 / overheat>6；解析按「OHLC 四价全同」剔除休市填充行；450 自然日约得 ~297 交易日。
- ②TTM 股息率：`src/dividend-yield-service.ts`（东财 RPT_SHAREBONUS_DET 批量 in 查询 + 复用 quote-service 取现价）；口径 1:1 复刻 ttm_yield.py（实施分配+有除权日；最近年报+最近中期；pending 检测）。与 westock 口径实测一致（招行两边 2.016），差异仅在 westock 两位舍入 vs 东财精确值。
- ③ETF 溢价：`src/etf-premium-service.ts`（腾讯 qt.gtimg.cn 一次批量 16 只）；实测字段 **[44]=规模(亿) [77]=溢价率(%) [78]=IOPV**；清单+费率内置（与自动化提示词一致）；≤3% 高亮 + 过滤切换。
- 数据层：models 增 IndexSignal/DividendYieldRow/EtfPremiumRow；`MiscMarkdownParser` 重构为按 `#` 分节 dispatch（新增 parseTableRowKeepEmpty 保空列 / extractTableRows），Serializer 增 3 个 section（已 export 便于 node round-trip 测试）。
- UI：`components/{index-signal,dividend-yield,etf-premium}.tsx`，均独立 section；样式在 styles.css「12.5 市场信号模块」段；移动端不隐藏（card 模式）。
- 验证手段：`/tmp/market-test/`（esbuild --alias stub）跑纯函数 + round-trip；fixture/Finance/Misc.md 已含今日真实缓存数据。

## 已知小历史
- calculator.getMonthlyCashFlow/getMonthlyTotalAssets 已修：加可选 year 参数跟随 currentYear（原先硬编码日历年）
- 股票持仓模块（2026-09-01）：原为独立 ItemView，后按用户要求合并进主仪表盘，成为 dashboard-app.tsx 内的 finance-holdings-section 双栏模块（左 Treemap + 右明细表）。数据存 Finance/Misc.md（settings.miscDataFilePath 可配）。fixture 插件目录 `fixture/.obsidian/plugins/personal-finance-dashboard` 是**指向 `dist/` 的软链**（2026-10-13 复核更正，此前误记成项目根目录）；`npm run build` 会 copy-dist 刷新它，`npm run dev`（watch）只写根目录 main.js、**不会**同步到 fixture，需手动 build 或 cp。
- **金额精度约定（2026-10-13）**：所有 amount 在"存储/写盘"前用 `utils.roundAmount(v, 2)` 归一（消除 `47×1290.88=60671.36000000001` 类 IEEE-754 乘法残留）。落点：`updateHoldingQuotes`、`holdingValue`、`MiscMarkdownSerializer`、`holding-form` 计算 amount 处；`MiscMarkdownParser` 解析时同样归一 → 旧文件下次保存自愈。注意：原始 API 数值（price/fxRate）round-trip 干净，只有做算术才会产生残留。
- 持仓 Treemap tooltip：mobile 布局下关闭（`useLayout()` → `tooltip.enabled: !isMobile`）；其他图表保留（移动端 tooltip 是读精确值的唯一途径）。
- 原 renderTotalAssetsChart 有 new Chart 未存实例的内存泄漏，React 迁移后由 useRef 自动管理消除