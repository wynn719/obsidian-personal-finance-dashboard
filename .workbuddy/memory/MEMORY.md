# 项目长期记忆

Obsidian 个人财务仪表盘插件。架构基础见 `CODEBUDDY.md`，此处只记**决策、坑、操作口径**。

## 技术栈
- Preact 10（preact/compat 别名；类型仍用 @types/react）。settings.ts 仍是原生 Setting
- esbuild 0.17 无原生 alias → `preactAlias` resolve 插件。测试可用 `--alias:obsidian=<stub>` 在 node 跑纯函数
- 产物：main.js / styles.css 在仓库根，`npm run build` 后 cp 进 dist/

## 响应式：顶层下发 data-layout
- `responsive.tsx` 的 LayoutProvider 用 ResizeObserver 测**容器宽度**（非视口）→ 修掉分栏时视口宽叶片窄的失配
- 派生 `full|compact|mobile` → 根节点 `data-layout`（CSS）+ Context（`useLayout()`，JS 行为）
- 断点（容器宽）：full ≥1100 / compact 768–1099 / mobile <768
- CSS **无宽度类 @media**，全用 `[data-layout="x"]`；只留 hover:none / reduced-motion / print
- 通用表 `components/data-table.tsx`：`DataTable<T>` 列模型驱动，内部自己消费 useLayout

## 大屏瀑布流
- `.finance-masonry`：`grid-auto-rows:1px; grid-auto-flow:row dense`，`masonry.tsx` 逐项量高写 `gridRowEnd`；gutter 烘进跨度、子项 `margin:0`（手机端才恢复 16）
- **列数 = clamp(1, floor((W+16)/(MIN_COL+16)), 3)**，`MIN_COL = 460`。阈值：≥1412 三列 / 936–1411 两列 / 否则一列
- MIN_COL 不能再低：资产配置表 6 列需约 430px 内容宽 → 卡 ≥454；ETF 桌面 5 列需约 420
- hero（`data-span="2"`）跨两栏；跨栏在 JS 里判 `cols>=2`（CSS span 2 在 1 列网格会生成隐式列）
- 宽度 0 守卫：隐藏 panel 里 `clientWidth===0` 跳过；两张宽表（月度总览 / 现金流）不进 masonry
- 新增卡片：放进 `<Masonry maxCols={3}>`，`.finance-section` 自带卡片壳；**不要给子项写 margin**

## 日常开发环境（重要）
- fixture 用**三个文件级软链**（`npm run setup-fixture`）：main.js / manifest.json / styles.css → 仓库根。日常只开 `npm run dev`，Obsidian 里 Cmd+R 生效
- ⚠️ **dev 没跑时改源码，`main.js` 不更新，但 `styles.css` 直读源文件** → 「样式生效、JS 旧版」假象。核对看 mtime
- ⚠️ **esbuild charset=ASCII，中文转义成 `\uXXXX`** → 中文字串 grep 产物必然 0 命中，要用 i18n key / class 名核对
- ⚠️ 别用「整个目录软链」（曾两次指向 dist）。脚本已加保护
- 本 worktree 的 fixture **未在 Obsidian 注册**，首次需 Open folder as vault
- **typora vault 不自动同步**：他说「同步到 Typora」时手动 cp 三产物到 `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/typora/.obsidian/plugins/personal-finance-dashboard/`，**不动 data.json**，cp 后 md5 校验，不软链
- ⚠️ 腾讯企业代理扩展 `com.tencent.NGNAppProxy.NGNAppProxyEx`，DNS 走 10.28.0.21；向 10.x 查询视为「本地网络访问」，应用须获 系统设置→隐私与安全性→本地网络 授权。Obsidian 曾因此外部请求全失败

## 分支与提交
- `main` 与 origin/main 已同步。身份：本仓库 local `wynn719 <762671261@qq.com>`（全局是工作身份，勿混用）
- Release 由 `.github/workflows/release.yml` 在 push tag 时构建。⚠️ tag 已到 v1.0.12，manifest version 一直 1.0.0，口径未修

## 页面 tab：工作台 / 资产配置
- tab 状态在 `FinanceApp`（localStorage `finance-dashboard:active-tab`，默认 workbench）
- 工作台 = `.finance-masonry` 内三张信号卡；资产配置 = Header + masonry（hero 跨两栏 → 资产配置 → 股息汇总 → 持仓 Treemap → 三图表）+ 月度总览 + 现金流
- **挂载策略不同**：工作台 panel 常驻仅 CSS 隐藏（切回不丢卡内状态）；资产配置条件渲染（Chart.js 在 display:none 里按 0 宽初始化，切回不自愈）
- **卡片壳已全局化**：挂在 `.finance-section` 上，不依赖容器。Header（年份 + 全部操作按钮）在资产配置 panel 内

## 市场信号：三个 service 的硬口径
- `src/market-refresh.ts` 是四项远程数据的唯一入口（年线 / TTM / ETF / 持仓行情），`FinanceApp` 挂载时 `autoRefreshAll(store)`。四步**串行**（避免并发写 Misc.md 互相覆盖），单项失败只 `console.error`。`AUTO_REFRESH_MIN_INTERVAL = 5min` 去重
- 卡片刷新按钮保留（强制刷新），但组件与 `useQuoteRefresh` 都改调 market-refresh 的 helper，**不要再在组件里直接调 service 的 fetch**
- 年线信号：中证官网 index-perf；MA250/偏离度端上算；buy<0 / hold 0–3 / sell 3–6 / overheat>6；按「OHLC 四价全同」剔休市行
- TTM 股息率：东财 RPT_SHAREBONUS_DET + quote-service 现价；1:1 复刻 ttm_yield.py
- ETF 溢价：腾讯 qt.gtimg.cn 批量；字段 **[44]=规模(亿) [77]=溢价率(%) [78]=IOPV**
- 数据存 Misc.md，Parser 按 `#` 分节 dispatch（`parseTableRowKeepEmpty` 保空列）

## 色口径
- **卡片外观全端统一**：`--fd-card-radius: 12px` + `--fd-card-shadow` + `--fd-card-padding: 12px`，`border: none`。唯一落点是 `.finance-section`。**卡片圆角与控件圆角分开**（控件用 `--fd-radius-sm/md`）。**任何模块不要单独写 padding**
- 去描边后**画布必须染灰**：`.finance-dashboard` 与 `.view-content` 都吃 `--fd-page-bg`，桌面端也染
- **一个模块只允许一层卡片**：卡内不得再出现白框/灰框
- **内容区不带内边距，标题→内容 `--fd-title-content-gap: 8px`**：表格首尾单元格 `padding-left/right: 0`，标题/表头/单元格同一条缘线
- **卡片标题统一全端一档**：`--fd-card-title-size/-weight/-line` = 14px / 600 / 1.5，**不要给单个模块写 h2 font-size**
- **标题图标间距 `--fd-title-icon-gap: 8px`**；`.finance-holdings-title span` 必须写 `> span`（后代选择器会命中 ETF 过滤药丸）
- **每个卡片标题都必须有 icon**；`.finance-icon` 要 `inline-flex + line-height:0`（否则比文字低 1~2px）
- **图标颜色别依赖继承**：Obsidian 的 `.svg-icon` 会用 `--icon-color` 顶掉颜色 → `.finance-icon svg { color: currentColor }` 兜底
- **买入区 = 绿**（`--fd-down`）；高股息线 5% 以上才标红
- UI 主体近黑单色，红绿琥珀只给数据。A 股 token `--fd-up #D0372B` / `--fd-down #0E8A5F` / `--fd-link #0066CC` 与账本语义 `--fd-positive/negative`（绿正红负）**两套并存未统一**
- `--fd-track` / `--fd-bar`（:root 实色 + .theme-dark 半透明白）用于 tab 条与胶囊

## 网络请求层（2026-11-03 曾改造，**已回滚，不要重加**）
- **所有远程请求用 `requestUrl`**。试过 `http-client.ts` 双通道（失败降级 Node `https`）→ **iOS 直接崩，已回滚**
- iOS 崩因：移动端是 Capacitor 壳，**没有 Node 内置模块**；桌面 `require` 能用 ≠ 移动端能用
- 若要重做：`Platform.isDesktopApp` 门控 + 惰性 require。另有语义坑：`requestUrl` 非 2xx 会 **throw**
- 桌面端 TLS 全挂（`ERR_SSL_PROTOCOL_ERROR`）属 Obsidian Chromium 栈问题，插件修不了

## 约定与坑
- **窄屏底部留白**：`--fd-bottom-reserve: 160px` + `env(safe-area-inset-bottom)`，同时挂 mobile 与 compact（只写 mobile 时 768 以上会撞操作栏）
- ⚠️ **Obsidian 的 `button:not(.clickable-icon)` 特异性是 (0,1,1)，压过单个 class (0,1,0)**：它强制 `background-color: var(--interactive-normal)` + `box-shadow: var(--input-shadow)` + `padding: 4px 16px` + `width: 100%`。自定义按钮想透明/自己定宽，必须把特异性抬到 ≥(0,1,1)（加容器前缀或 `button.类名`），hover 还要一并重声明，否则基础态反过来压住 hover。已修：建仓卡计划行、卡片图标按钮、建仓视图与表单按钮；**未修**：`.finance-tab` / `.finance-filter-btn` / `.finance-btn-small` / `.finance-btn`（全局各处的灰底与撑满宽度都来自这里）
- **自定义 `button` 必须显式给 `height` + `min-height: 0`**：主题设了 `--input-height`，只写 padding 高度不受控。对齐问题还要 `align-items/justify-content: center` + 收紧 line-height
- **卡片刷新按钮用 `.finance-refresh-btn`**（22×22 全端一档）。**不要用 `.finance-btn-small`** —— 那是表内行操作按钮的类
- **金额精度**：写盘前一律 `utils.roundAmount(v, 2)`
- TTM / ETF 的 `table-layout: fixed` 与 nth-child 列宽只给 mobile（桌面 ETF 有 5 列，提升为全局会压成 0 宽）
- 持仓 Treemap tooltip mobile 下关闭；其他图表保留
- 整页调试验证：esbuild 打包 + playwright 截图，**必须显式 `jsx:"automatic"`、`jsxImportSource:"preact"`、`nodePaths`**。脚本在 `/tmp/fd-preview/`（可能已失效）
- 移动端回归用「旧版对照」：`git archive HEAD` 建旧副本，两边同宽截图逐像素比对
- 番茄钟 2026-11-02 已整体移除，**不要再加回**（vault 里 `Finance/Pomodoro.md` 仍残留，插件不读写）

## 分批建仓（Position Tracker，2026-11-05 落地第一批）
- 第一个模块的整体规范见 `docs/ACCUMULATION.md`；数据落 `Finance/Investment/Accumulation/plans/{symbol}-{id}.md`，独立 `AccumulationStore`，不碰 `DataStore` 的 Finance/* 通道
- 入口在工作台第一张卡 → 整块切视图栈（list / detail），**不新增页级 tab**
- **金额一律整数分**（`Cents`），只在 toCents / 写盘取整；`utils.formatCurrency` 带千分位且被 29 处引用，**不许改**，本模块自带 `formatCents`
- **阶段状态是派生态**：文件只存 `skippedAt / voidedAt / confirmedAt`，其余由成交+现价推导；右侧确认只认 `confirmedAt`，涨价永不触发
- 触发价锚定 `referencePrice`；`Trigger` 列只读，读入时按 `Drop%`/`Target` 重算
- `investedCents` = 净现金流（买入额+买入费−卖出额+卖出费），剩余预算/使用率都用它
- 自触发抑制用**内容 hash**（`isSaving` 布尔是 DataStore 实例级的，跨 store 无效）；写盘用 `adapter.process` 原子替换，缺失时回落 `write`
- 归档必须「rename + 写 archivedAt + 重绑 id→path」同一队列完成，否则 `vault.on("rename")` 会让计划从列表消失
- **弹窗里的表单不在 LayoutProvider 内**，拿不到 `data-layout` → 表单网格用视口媒体查询；`[data-layout]` 只服务面板内模块
- 表格手改多一列会整行串位 → 解析器对超列数发 `stage.extraColumns` / `trade.extraColumns` 告警
- 序列化同时掐正文首尾空行，否则每次保存多一行空行、幂等性破掉
- 测试：`npm test`（esbuild 打包 → `node --test`，45 例，含 8 例 store 集成）。预览：`/tmp/fd-preview/` 的 `preview-acc.tsx` + `acc.html`，固定 bundle 路径 `/tmp/fd-preview/acc-bundle.mjs`（别用 `tail -1` 取 tmpdir，会拿到旧包）
- 第二批未做：历史复盘与策略统计（`src/accumulation/stats.ts` 只有占位）
