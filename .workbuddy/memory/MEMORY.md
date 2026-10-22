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
- **fixture（测试，日常只用这条）**：`npm run setup-fixture` 在插件目录建**三个文件软链**（main.js / manifest.json / styles.css → 仓库根同名文件）。`npm run dev`（watch 输出根 main.js）改完即生效，不用 build、不用 cp，Obsidian 里 Cmd+R 即可。
  - ⚠️ 不要再用「整个目录软链」方案（2026-10-21 曾指向 dist，2026-10-22 曾指向主仓库 dist，两次都导致 fixture 读的不是当前输出）；`setup-fixture.sh` 已加保护：遇到目录软链先摘链接本身，再建文件软链（否则逐文件删除会顺着链接删进 dist）。
  - 2026-10-22 起**日常只开 `npm run dev`**，不跑 build（build 只在发布/验证产物时用）。
- **typora（真实使用）**：**助手不再自动同步**（2026-10-22 用户明确要求）。需要时由用户自己把产物复制到 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/typora/.obsidian/plugins/personal-finance-dashboard/`（iCloud vault 不适合软链），复制后需重载插件。
- 网络故障排查手段（2026-10-13 实战）：`scutil --proxy` 查系统代理 / `curl --noproxy '*'` 测直连 / 检查目标 vault Misc.md mtime 判断用户刷新是否落盘。
- **用户 Mac 网络环境（2026-10-19 查明）**：装有腾讯企业网络代理系统扩展 `com.tencent.NGNAppProxy.NGNAppProxyEx`，系统 DNS 指向内网 `10.28.0.21`（search domain tencent.com）。macOS 把向 10.x 发 DNS 查询视为「本地网络访问」，**应用需在 系统设置→隐私与安全性→本地网络 中获得授权**；Obsidian 曾因缺此授权导致全部外部请求失败（手机/Chrome/curl 均正常）。排查同类问题先跑：`scutil --dns` / `systemextensionsctl list` / `codesign --verify`。

## 发布与文档（2026-10-13）
- GitHub：github.com/wynn719/obsidian-personal-finance-dashboard（public）。Release 由 `.github/workflows/release.yml` 在 push tag 时自动构建发布（dist 内 main.js/manifest.json/styles.css/zip）。
- ⚠️ 口径不一致（未修）：tag 已到 v1.0.12，但 `manifest.json` 的 version 一直写 1.0.0（历史各 tag 处也是 1.0.0）。README 版本徽章已改为 shields 动态 release 徽章。
- README 双语文档（2026-10-13 更新）：Commands 表、Releasing 段、Preact 架构树、fixture→dist 调试流程、收支表列序 `Date|Type|Category|Amount|Note`；新增 LICENSE（MIT，Copyright 2026 Wynne Zheng，若需改署名在此文件）。

## 分支
- main：与 origin/main 已同步（2026-10-13 已 push 全部 4 个提交：85cadf1 精度 / 6915d4c 移动端 / 19afa75 docs / ad864ae 市场信号模块）。
- 提交身份：本仓库 local 配置 = `wynn719 <762671261@qq.com>`（全局配置为工作身份 wynnezheng@tencent.com，勿混用）。

## 市场信号模块（2026-10-13，移植自 WorkBuddy 每日自动化）
- 三个独立手动刷新模块，位于资产配置行上方（`dashboard-app.tsx` 的 `.finance-market-grid`），各带刷新按钮 + 更新时间；数据缓存于 Misc.md，打开即见上次结果。
- ①年线策略信号：`src/index-signal-service.ts`（中证官网 index-perf，UA/Referer 优先、失败降级默认头）；插件端算 MA250/偏离度；四区间 buy<0 / hold 0-3 / sell 3-6 / overheat>6；解析按「OHLC 四价全同」剔除休市填充行；450 自然日约得 ~297 交易日。
- ②TTM 股息率：`src/dividend-yield-service.ts`（东财 RPT_SHAREBONUS_DET 批量 in 查询 + 复用 quote-service 取现价）；口径 1:1 复刻 ttm_yield.py（实施分配+有除权日；最近年报+最近中期；pending 检测）。与 westock 口径实测一致（招行两边 2.016），差异仅在 westock 两位舍入 vs 东财精确值。
- ③ETF 溢价：`src/etf-premium-service.ts`（腾讯 qt.gtimg.cn 一次批量 16 只）；实测字段 **[44]=规模(亿) [77]=溢价率(%) [78]=IOPV**；清单+费率内置（与自动化提示词一致）；≤3% 高亮 + 过滤切换。
- 数据层：models 增 IndexSignal/DividendYieldRow/EtfPremiumRow；`MiscMarkdownParser` 重构为按 `#` 分节 dispatch（新增 parseTableRowKeepEmpty 保空列 / extractTableRows），Serializer 增 3 个 section（已 export 便于 node round-trip 测试）。
- UI：`components/{index-signal,dividend-yield,etf-premium}.tsx`，均独立 section；样式在 styles.css「12.5 市场信号模块」段；移动端不隐藏（card 模式）。
- 验证手段：`/tmp/market-test/`（esbuild --alias stub）跑纯函数 + round-trip；fixture/Finance/Misc.md 已含今日真实缓存数据。

## 页面级 tab：工作台 / 资产配置（2026-10-22）
- `src/react/components/tabs.tsx` 只渲染 tab 条，状态在 `FinanceApp`（localStorage key `finance-dashboard:active-tab`，默认 `workbench`）。
- **工作台** = 番茄钟 + `.finance-market-grid`（年线信号 / TTM 股息率 / ETF 溢价）；**资产配置** = MetricCards + summary-grid + 三图表 + 月度总览 + 现金流。
- **挂载策略不同（重要）**：工作台 panel 常驻、仅 CSS `[data-active="false"] { display:none }` —— 卸载会丢番茄钟计时；资产配置 panel **条件渲染** —— Chart.js 在 display:none 容器里按 0 宽初始化，切回来不一定自愈。
- ⚠️ 卡片壳选择器已加一层：`.finance-dashboard > .finance-tab-panel > .finance-section`。新增顶层 section 时若忘了这层，卡片会丢白底/边框/阴影。
- **Header（年份选择器 + 全部数据操作按钮）整体放在资产配置 panel 内**（2026-10-22 调整）：工作台 tab 顶部只有 tab 条 + 番茄钟 + 三信号卡。原先的 `HeaderProps.showYearSelector` 已删除。
- mobile 持仓空态：`[data-layout=mobile] .finance-chart-container` 无卡片外壳（透明无边框），所以空态需自带 `.finance-holdings-empty` 白卡（圆角 18 + `--fd-card-shadow`）；CTA 用 `.finance-holdings-cta` 恢复 38px 高 + 文字（否则被 `.finance-btn` 的 26px 方块规则压成图标）。
- 整页调试脚手架：esbuild 把 `FinanceApp` + obsidian stub 打成浏览器 bundle（`--alias:obsidian=stub`、`react→preact/compat`），playwright 截图；mock 副本在 `/tmp/pomo-test/app-mock.tsx`。

## 番茄钟模块（2026-10-21）
- 主看板 MetricCards 下方独立卡片：`src/react/components/pomodoro.tsx`。25/5/15，每完成 4 个番茄长休。
- 计时用结束时间戳（`endAt`）+ `remainingRef`，interval 只依赖 `[running]` → 不漂移、不每 tick 重建定时器；不按 layout 分叉 DOM，切布局不丢状态。
- 数据：**独立文件** `Finance/Pomodoro.md`（设置项 `pomodoroDataFilePath` 可改），由独立 `src/pomodoro-store.ts`（`PomodoroStore` + 自带 Parser/Serializer/watcher）承载，**不再写 Misc.md**。格式 `# Pomodoro` + `Date | Count | Minutes`（按天聚合、日期升序）。`store.record(minutes)` 只记**完成**的番茄，重置/跳过不计；`store.getDays()`。
- 组件自己订阅 `pomodoroStore.onChange`（只有本卡片重渲染），不再依赖 DataStore.notifyChange。
- 布局三列 `148px fit-content(340px) minmax(0,300px)` + `justify-content:center`（宽屏对称留白）；compact 128/300/200；mobile 单列。
- 样式在 styles.css「13.6 番茄钟模块」，**必须排在 mobile 段之后**，否则压不过 `[data-layout="mobile"] .finance-btn` 的 26px 方块约束。

## 移动端高密度版面（2026-10-20 落地，对齐 Ardot 738377014719826）
- 设计源：iCloud `Workbuddy/2026-10-20-10-23-17/`（390×844 主屏 + 说明面板 + Pad 1194×834）。三动作：一主四从 / 一行一语义 / 卡片堆→数据表。
- 只作用 mobile（<768）：`MetricCards` 走 `MobileMetrics`（hero + 四列指标带）；`IndexSignalSection` 走两行紧凑分支（标题按 ` · ` 拆名称+chip，省略 advice）；TTM 表 `mobileMode="table"` 四列（名称/现价/TTM/股息率）行高 58。桌面与 compact 原样保留。
- 视觉：圆角 18、零描边、`--fd-card-shadow` 极轻阴影分块；字号阶梯 34/15/13/11/10；区块间距 12。
- **A 股色 token 独立**：`--fd-up #D0372B` / `--fd-down #0E8A5F` / `--fd-link #0066CC`，与账本语义 `--fd-positive/negative`（绿正红负）并存 → 桌面仍绿正红负，**口径分叉未统一，待哥拍板**。
- 特异性坑：TTM section 是 `.finance-market-grid` 子元素，覆盖其 padding 必须写 `[data-layout="mobile"] .finance-market-grid > .finance-dy-section`（0,3,0）。
- 验证：`/tmp/mobile-preview.html` mock 主题变量 + 引真实 styles.css，`npx playwright screenshot --channel=chrome --viewport-size="390,844" --color-scheme={light,dark}`。`--device "iPhone 13"` 会走 webkit，与 `--channel` 冲突。
- 未做：header 按钮收纳进「···」、Pad 断点（横排 hero + 行业列 + 相对股息率分布条）、表尾「—」说明与查看全部。

## 已知小历史
- calculator.getMonthlyCashFlow/getMonthlyTotalAssets 已修：加可选 year 参数跟随 currentYear（原先硬编码日历年）
- 股票持仓模块（2026-09-01）：原为独立 ItemView，后按用户要求合并进主仪表盘，成为 dashboard-app.tsx 内的 finance-holdings-section 双栏模块（左 Treemap + 右明细表）。数据存 Finance/Misc.md（settings.miscDataFilePath 可配）。fixture 插件目录 `fixture/.obsidian/plugins/personal-finance-dashboard` 是**指向 `dist/` 的软链**（2026-10-13 复核更正，此前误记成项目根目录）；`npm run build` 会 copy-dist 刷新它，`npm run dev`（watch）只写根目录 main.js、**不会**同步到 fixture，需手动 build 或 cp。**软链是 git 跟踪的**，改目标会出现在 `git status` 里；改完必须在 Obsidian 里 Cmd+R 重载（`npm run build` 不会热重载，也没法用 osascript 代按——System Events 权限违例）。
- **金额精度约定（2026-10-13）**：所有 amount 在"存储/写盘"前用 `utils.roundAmount(v, 2)` 归一（消除 `47×1290.88=60671.36000000001` 类 IEEE-754 乘法残留）。落点：`updateHoldingQuotes`、`holdingValue`、`MiscMarkdownSerializer`、`holding-form` 计算 amount 处；`MiscMarkdownParser` 解析时同样归一 → 旧文件下次保存自愈。注意：原始 API 数值（price/fxRate）round-trip 干净，只有做算术才会产生残留。
- 持仓 Treemap tooltip：mobile 布局下关闭（`useLayout()` → `tooltip.enabled: !isMobile`）；其他图表保留（移动端 tooltip 是读精确值的唯一途径）。
- 原 renderTotalAssetsChart 有 new Chart 未存实例的内存泄漏，React 迁移后由 useRef 自动管理消除