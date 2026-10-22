# 项目长期记忆

Obsidian 个人财务仪表盘插件。架构基础见 `CODEBUDDY.md`，此处只记**决策、坑、操作口径**。

## 技术栈要点
- Preact 10（preact/compat 别名，原 React 18 迁来；类型仍用 @types/react）。settings.ts 仍是原生 Setting
- **esbuild 0.17 无原生 alias** → 用 `preactAlias` resolve 插件（createRequire 解析绝对路径）。测试可用 `--alias:obsidian=<stub>` 在 node 跑纯函数
- 产物 main.js 388KB（2026-10-22）

## 响应式：顶层下发 data-layout
- `responsive.tsx` 的 LayoutProvider 用 ResizeObserver 测**容器宽度**（非视口）→ 修掉 Obsidian 分栏时视口宽叶片窄的失配
- 派生 `full|compact|mobile` → 根节点 `data-layout`（CSS）+ Context（`useLayout()`，JS 行为）
- 断点（容器宽）：full ≥1100 / compact 768–1099 / mobile <768，常量集中一处
- CSS **无宽度类 @media**，全用 `[data-layout="x"]`；只留 hover:none / reduced-motion / print
- 通用表 `components/data-table.tsx`：`DataTable<T>` 列模型驱动，四张表复用，内部自己消费 useLayout

## 日常开发环境（重要）
- fixture 用**三个文件级软链**（`npm run setup-fixture`）：main.js / manifest.json / styles.css → 仓库根。日常只开 `npm run dev`，改完 Obsidian 里 Cmd+R 即生效，**不用 build 不用 cp**
- ⚠️ **dev 没跑时改源码，`main.js` 不会更新，但 `styles.css` 是直读源文件** → 会看到「样式生效、JS 旧版」的假象。核对产物新旧先看 `ls -la main.js` mtime vs 源码 mtime
- ⚠️ **esbuild 默认 charset=ASCII，中文被转义成 `\uXXXX`** → 用中文字串 grep 产物必然 0 命中。核对要用 i18n key / class 名 / 函数名等 ASCII 标识（如 `etfPremium.viewAll`、`finance-etf-viewall`）
- ⚠️ 别用「整个目录软链」（曾两次指向 dist，读的不是当前输出）。脚本已加保护：遇目录软链先摘链接本身
- 本 worktree 的 fixture **未在 Obsidian 注册**，首次需 Open folder as vault；已注册那个指向 `~/Codes/githubcode/...`（另一个 checkout）
- **typora 真实 vault 不做自动同步**（用户明确要求），需要时用户自己复制过去（iCloud vault 不适合软链）
- ⚠️ 用户 Mac 装腾讯企业代理扩展 `com.tencent.NGNAppProxy.NGNAppProxyEx`，DNS 走内网 10.28.0.21。向 10.x 的 DNS 查询被视为「本地网络访问」，**应用须获 系统设置→隐私与安全性→本地网络 授权**；Obsidian 曾因此外部请求全失败。排查：`scutil --dns` / `systemextensionsctl list` / `scutil --proxy` / `curl --noproxy '*'`

## 分支与提交
- `main` @ `2092b97`，**领先 origin/main 3 个提交未 push**（0afe099 移动端改版 / fcf6625 memory / 2092b97 删 ETF 空态按钮）；origin/main = ad16f3f
- 身份：本仓库 local `wynn719 <762671261@qq.com>`（全局是工作身份 wynnezheng@tencent.com，勿混用）
- Release 由 `.github/workflows/release.yml` 在 push tag 时自动构建。⚠️ tag 已到 v1.0.12，但 manifest version 一直 1.0.0，口径未修

## 页面 tab：工作台 / 资产配置
- tab 状态在 `FinanceApp`（localStorage `finance-dashboard:active-tab`，默认 workbench）
- **首屏顺序已拍板（2026-10-22）：番茄钟在前、市场信号在后，不换位**（打开工作台即「开始干活」的动作入口）。翻过来只需调 JSX 两行顺序
- 工作台 = 番茄钟 + `.finance-market-grid`（年线 / TTM / ETF）；资产配置 = MetricCards + 图表 + 月度总览 + 现金流
- **挂载策略不同**：工作台 panel 常驻仅 CSS 隐藏（卸载会丢番茄钟计时）；资产配置 panel 条件渲染（Chart.js 在 display:none 里按 0 宽初始化，切回不自愈）
- ⚠️ 卡片壳选择器多一层：`.finance-dashboard > .finance-tab-panel > .finance-section`，忘写会丢白底/边框/阴影
- Header（年份 + 全部操作按钮）整体在资产配置 panel 内；工作台顶部只有 tab 条 + 番茄钟 + 三信号卡
- 整页调试验证：esbuild 把 FinanceApp + obsidian stub 打成浏览器 bundle + playwright 截图。**必须显式给 `jsx:"automatic"`、`jsxImportSource:"preact"`、`nodePaths:[项目/node_modules]`**，否则 React is not defined。脚本在 `/tmp/pomo-v2/`

## 番茄钟
- `components/pomodoro.tsx`，25/5/15，每 4 个长休
- 计时用结束时间戳 `endAt` + `remainingRef`，interval 只依赖 `[running]` → 不漂移；不分叉 DOM，切布局不丢状态
- 数据独立文件 `Finance/Pomodoro.md`（`pomodoroDataFilePath`），`src/pomodoro-store.ts` 自带 Parser/Serializer/watcher；格式 `# Pomodoro` + `Date | Count | Minutes`。只记**完成**的番茄
- 组件自己订阅 `pomodoroStore.onChange`，不走 DataStore
- 样式在「13.6 番茄钟模块」，**必须排在 mobile 段之后**，否则压不过 `[data-layout="mobile"] .finance-btn` 的 26px 方块约束
- 移动端 `grid-template-areas: "dial panel" / "trend trend"`，环 96；panel 用 `display:contents` 把 actions/stats 提成网格项。改 `.finance-pomodoro-mode-btn` 必须保留 `flex: 1 1 0`

## 市场信号：三个 service 的硬口径
- 年线信号：中证官网 index-perf（UA/Referer 优先，失败降级默认头）；MA250/偏离度端上算；区间 buy<0 / hold 0–3 / sell 3–6 / overheat>6；按「OHLC 四价全同」剔休市行
- TTM 股息率：东财 RPT_SHAREBONUS_DET 批量 in + quote-service 现价；口径 1:1 复刻 ttm_yield.py（实施分配+有除权日、最近年报+最近中期、pending 检测）。与 westock 实测一致（招行 2.016）
- ETF 溢价：腾讯 qt.gtimg.cn 批量 16 只；字段 **[44]=规模(亿) [77]=溢价率(%) [78]=IOPV**
- 数据存 Misc.md，Parser 按 `#` 分节 dispatch（parseTableRowKeepEmpty 保空列）；Serializer 三 section 已 export 便于 round-trip 测试

## 色口径（2026-10-22 拍板）
- **卡片外观全端统一（2026-10-22）**：`--fd-card-radius: 18px` + `--fd-card-shadow` + `--fd-card-padding: 12px`，`border: none`。规格取自番茄钟卡，落点 = `.finance-metric-card` / section 壳（4 组选择器）/ `.finance-chart-container` / `.finance-dt-card` / mobile 的 hero·dy·etf·pomodoro·canvas·holdings-empty。**卡片圆角与控件圆角分开**：按钮/胶囊/输入框仍用 `--fd-radius-sm/md`，不要混。padding 曾有三种值（桌面 16、移动 12、番茄钟/dy/etf 16），现统一 12，**移动端不要再给单个模块写 padding**
- 去描边后**画布必须染灰**：`.finance-dashboard` 与视图容器（`.view-content`）都吃 `--fd-page-bg`，**桌面端也染**（原先只染 mobile）。不染灰 → 白卡在 `--background-primary` 上直接隐形。连带删掉 `.finance-metric-card:hover` / `.finance-chart-container:hover` 的 border-color 反馈（没有描边可高亮）
- **一个模块只允许一层卡片**（2026-10-22 追加）：卡内不得再出现白框或灰框。为此 `.finance-table-wrapper` 去掉描边与底色、`.finance-empty` 去掉灰底虚线框与内边距、`.finance-section > .finance-table` 去掉描边。表头灰底 + 行分隔线足以撑结构
- **内容区不带内边距，标题→内容 `--fd-title-content-gap: 8px`**（2026-10-22）：卡片 padding 是唯一缩进线。`.finance-empty` / `.finance-holdings-empty` padding 归零；表格首尾单元格 `padding-left/right: 0`（桌面与移动两套表都做了），这样标题、表头、单元格落在同一条左/右缘线上。各模块原有的 `h2 { margin-bottom }` 覆盖（mobile 2px、番茄钟 10px）已全部删除，统一走 token。唯一保留自带 padding 的是 `.finance-etf-alert`（琥珀提示条是独立色块，不是内容容器）
- **移动端图表卡已改回有壳**：`.finance-chart-container` 在 mobile 恢复白底 + 16 padding，`canvas` 反而去掉底色/圆角/阴影/内边距（此前是外壳透明、canvas 自己当卡 → 标题浮在灰底上）。连带 `[data-layout=mobile] .finance-holdings-empty` 不再自带白卡
- **卡片标题统一（2026-10-22）**：`--fd-card-title-size / -weight / -line`，桌面 16px/700/1.5、移动端 14px/600/1.5（`[data-layout="mobile"]` 上覆盖 token）。原先 `1.02em` + 各模块零散覆盖（mobile 17px、dy/etf 与番茄钟 14px）导致同页两种字号，现已全部删掉，**不要再给单个模块写 h2 font-size**
- **标题图标间距统一 `--fd-title-icon-gap: 8px`**（2026-10-22）：h2 与 `h2 > span`、`.finance-holdings-title span` 三处都用这个 token。曾有三种值（番茄钟 0 / 市场三卡 4 / 其余 8）。`.finance-count-chip` 的 `margin-left` 已删，间距交给父级 flex 的 gap
- **每个卡片标题都必须有 icon**：移动端信号卡的紧凑分支（`.finance-signal-compact`）曾漏掉，标题只有文字；现用 `.finance-signal-title` 包 `Icon + name`，gap 走同一 token。新增卡片标题时记得带上
- **标题图标垂直居中**：`.finance-icon` 设 `display:inline-flex + line-height:0`（容器高度=svg 高度），且 `.finance-section h2 > span` 也要 `inline-flex`——否则包裹层内图标按基线落位，比文字低 1~2px（番茄钟标题没走 `.finance-holdings-title` 就是这个坑）
- **图标颜色别依赖继承**（2026-10-22 踩过）：Obsidian 主题的 `.svg-icon`（setIcon 会给 svg 加这个类）会用 `--icon-color` 直接给 svg 上色，把 button/span 继承下来的颜色顶掉。凡是不在 `h2` 内的图标（如移动端信号卡 `.finance-signal-head` 里的刷新按钮）拿不到 `.finance-section h2 .finance-icon svg` 那条 muted 规则，就会和同级按钮不同色。解法：`.finance-icon svg, .finance-icon svg.svg-icon { color: currentColor }` 做兜底，关键控件再显式写 `(0,2,1)` 以上特异性的 color
- **买入区 = 绿**（`--fd-down`），与偏离度同色系；此前桌面是 accent 蓝导致跨端不一致
- 高股息线 **5%**（`DIVIDEND_YIELD_HIGHLIGHT`）以上才标红，其余墨色
- UI 主体近黑单色，红绿琥珀只给数据。A 股 token `--fd-up #D0372B` / `--fd-down #0E8A5F` / `--fd-link #0066CC` 与账本语义 `--fd-positive/negative`（绿正红负）**两套并存未统一**
- 新增 `--fd-track` / `--fd-bar`（:root 实色 + .theme-dark 半透明白），tab 条与 ETF 筛选都是「轨道 + 白滑块」

## 约定与坑
- **自定义 `button` 必须显式给 `height` + `min-height: 0`**（2026-10-22 踩过）：Obsidian 主题会给 `button` 设 `--input-height`，只写 padding 的话实际高度不受控——ETF 的「≤3% / 全部」切换按钮就因此比旁边的刷新按钮高一截。凡是要和其它控件对齐的小按钮，都按这个写。**另一个连带症状**：按钮被主题撑高后，`align-items: baseline` 会把文字顶到上方，看着像「不居中」（番茄钟专注/短休/长休就是），必须换 `align-items: center` + `justify-content: center` + `line-height` 收紧
- **卡片刷新按钮用 `.finance-refresh-btn`**（2026-10-22）：年线 / TTM / ETF / 持仓占比 四处共用，规格取自 TTM 卡（桌面 32×32、移动 22×22、`--fd-radius-sm`、透明底、muted 图标 14px）。**不要再用 `.finance-btn-small`** —— 那是表内编辑/删除行操作按钮的类，两者曾经混用，改一处会牵连另一处。移动端缩放写在 `[data-layout="mobile"] .finance-refresh-btn`
- **金额精度**：写盘前一律 `utils.roundAmount(v, 2)`（消 `47×1290.88=60671.36000000001` 残留）。落点 updateHoldingQuotes / holdingValue / Serializer / holding-form；Parser 也归一 → 旧文件下次保存自愈。原始 API 值（price/fxRate）本干净，只有算术才残留
- mobile 持仓空态：父级 `.finance-chart-container` 已是白卡（2026-10-22 改），`.finance-holdings-empty` 只保留 flex 布局与 padding，**不要再给它白底/阴影**（曾是必需，因为当时图表外壳透明）；CTA 用 `.finance-holdings-cta` 恢复 38px 高+文字（否则被 26px 方块规则压成图标）
- TTM section 是 `.finance-market-grid` 子元素，覆盖 padding 必须写 `[data-layout="mobile"] .finance-market-grid > .finance-dy-section`（0,3,0）
- 持仓 Treemap tooltip mobile 下关闭；其他图表保留（移动端 tooltip 是读精确值唯一途径）
- 设计稿：移动端高密度 Ardot 738377014719826 / 工作台 739108669130272。**暗色版未做**；未做还有 header 收纳「···」、Pad 断点
