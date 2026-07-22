# React 迁移方案

将 Obsidian 个人财务仪表盘的 UI 层从命令式 DOM（`createEl`）迁移到 **React**。逻辑层保持不变。

---

## 1. 评估结论

**可行性：高。** 项目的逻辑层（DataStore / Calculator / models / i18n / utils）与 UI 层已天然解耦，迁移几乎不触碰业务逻辑。

| 维度 | 现状 | 迁移后 |
|---|---|---|
| UI 调试 | 命令式 DOM，无组件树，全量重渲染 | React DevTools 组件树 + 精细 diff |
| 状态管理 | 散在闭包 / 类字段 | hooks 集中管理 |
| 局部更新 | 每次 `render()` 整块重建 | 仅变更部分重渲染 |
| 复用性 | 7 个 `renderXxx()` 方法 | 7 个可组合组件 |

---

## 2. 迁移边界

### 需要迁移（UI 层，约 1680 行）

| 文件 | 行数 | 处理 |
|---|---|---|
| `src/views/dashboard-view.ts` | 972 | 全量重写为 React 组件树 |
| `src/modals/asset-snapshot-modal.ts` | 179 | 保留 `Modal` 外壳，内部表单改 React |
| `src/modals/cash-flow-modal.ts` | 179 | 同上 |
| `src/modals/dividend-modal.ts` | 162 | 同上 |

### 保持不变（逻辑层，约 2040 行）

| 文件 | 行数 | 说明 |
|---|---|---|
| `src/data-store.ts` | 709 | 观察者模式，React 直接订阅 |
| `src/calculator.ts` | 376 | 纯函数，组件里直接调用 |
| `src/i18n.ts` | 540 | `t()` 函数原样使用 |
| `src/models.ts` | 122 | 类型定义不变 |
| `src/utils.ts` | 105 | 格式化函数不变 |
| `src/main.ts` | 183 | 插件生命周期，几乎不动 |
| `src/settings.ts` | 192 | **保持 Obsidian 原生 `Setting`**，迁移零收益 |

---

## 3. 框架选型：React

| 维度 | React | Vue 3 | Svelte |
|---|---|---|---|
| esbuild 集成 | 原生 JSX，零配置 | SFC 需额外 loader | 需 svelte-preprocess |
| Obsidian 社区先例 | 最多 | 较少 | 常见 |
| DevTools | Electron 可用 | 可用 | 可用 |
| 迁移匹配度 | `renderXxx()` → 组件逐行对应 | 模板需重写思路 | 编译产物最小 |

**选 React**：esbuild 原生支持 JSX，`renderXxx()` 结构与组件一一对应，迁移路径最短。

**体积**：React + ReactDOM ≈ 45KB gz，可接受。后续若在意可一行切换 `preact/compat` 压到 ~3KB。

---

## 4. 迁移后目录结构

```
src/
├── main.ts                      # 不变（插件入口）
├── data-store.ts                # 不变
├── calculator.ts                # 不变
├── models.ts                    # 不变
├── i18n.ts                      # 不变
├── utils.ts                     # 不变
├── settings.ts                  # 不变（Obsidian 原生 Setting）
├── views/
│   └── dashboard-view.ts        # 改造：onOpen 里 createRoot 挂载 React
├── modals/
│   ├── asset-snapshot-modal.ts  # 改造：Modal 外壳 + React 表单
│   ├── cash-flow-modal.ts
│   └── dividend-modal.ts
└── ui/                          # 新增：React 组件
    ├── Dashboard.tsx            # 顶层容器
    ├── hooks/
    │   ├── useFinanceData.ts    # 订阅 DataStore → React state
    │   └── useMask.ts           # 隐私模式开关
    ├── components/
    │   ├── Header.tsx
    │   ├── MetricCards.tsx
    │   ├── AssetAllocation.tsx
    │   ├── Charts.tsx           # Chart.js 封装
    │   ├── MonthlyOverview.tsx
    │   ├── DividendSummary.tsx
    │   ├── CashFlowDetails.tsx
    │   └── Icon.tsx             # Lucide 图标封装
    └── forms/                   # Modal 内部表单
        ├── AssetSnapshotForm.tsx
        ├── CashFlowForm.tsx
        └── DividendForm.tsx
```

---

## 5. 关键模式

### 5.1 数据桥 hook

让 React 接上 DataStore 的观察者模式：

```tsx
// src/ui/hooks/useFinanceData.ts
import { useEffect, useState } from "react";
import type { DataStore } from "../../data-store";
import type { FinanceCalculator } from "../../calculator";
import type { FinanceSettings } from "../../models";

export function useFinanceData(
  store: DataStore,
  calculator: FinanceCalculator,
  settings: FinanceSettings,
) {
  const [, setTick] = useState(0);
  const rerender = () => setTick((n) => n + 1);

  useEffect(() => {
    const unsub = store.onChange(() => rerender());
    return unsub;
  }, [store]);

  const latestSnapshot = store.getLatestSnapshot();
  const month = latestSnapshot?.month ?? getCurrentMonth();
  const year = store.getCurrentYear();

  return { store, calculator, settings, month, year };
}
```

### 5.2 视图挂载点

`dashboard-view.ts` 改造为挂载 React：

```tsx
// src/views/dashboard-view.ts
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { Dashboard } from "../ui/Dashboard";

export class FinanceDashboardView extends ItemView {
  private root: Root | null = null;
  // ... store/calculator/settings 注入

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("finance-dashboard");
    this.root = createRoot(container);
    this.root.render(
      <Dashboard
        store={this.store}
        calculator={this.calculator}
        settings={this.settings}
        onAddSnapshot={this.onAddSnapshot}
        onAddCashFlow={this.onAddCashFlow}
        onAddDividend={this.onAddDividend}
        onEditSnapshot={this.onEditSnapshot}
        onEditCashFlow={this.onEditCashFlow}
        onEditDividend={this.onEditDividend}
        onRefreshData={this.onRefreshData}
      />,
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
  }
}
```

### 5.3 Chart.js 封装

Chart.js 在 React 里用 `useRef` + `useEffect`，**卸载时必须 destroy**：

```tsx
// src/ui/components/Charts.tsx
import { useEffect, useRef } from "react";
import { Chart } from "chart.js";

export function PieChart({ snapshot, maskNumbers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !snapshot) return;
    const filtered = snapshot.categories.filter((c) => c.amount > 0);
    if (filtered.length === 0) return;

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: { /* 原配置搬过来 */ },
      options: { /* 原配置搬过来 */ },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [snapshot, maskNumbers]); // 数据或遮罩变才重建

  return <canvas ref={canvasRef} />;
}
```

### 5.4 Lucide 图标封装

Obsidian 的 `setIcon` 需在 DOM 就绪后调用，用 ref 包一层：

```tsx
// src/ui/components/Icon.tsx
import { useEffect, useRef } from "react";
import { setIcon } from "obsidian";

export function Icon({ name, size }: { name: string; size?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name);
      if (size) ref.current.style.width = ref.current.style.height = `${size}px`;
    }
  }, [name, size]);
  return <span ref={ref} className="finance-icon" />;
}
```

### 5.5 Modal 改造

保留 `Modal` 外壳（Obsidian 管 open/close/focus/escape），内部渲染 React 表单：

```tsx
// src/modals/cash-flow-modal.ts
import { Modal, App } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { CashFlowForm } from "../ui/forms/CashFlowForm";

export class CashFlowModal extends Modal {
  private root: Root | null = null;
  // ...

  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl);
    this.root.render(
      <CashFlowForm
        settings={this.settings}
        existingRecord={this.existingRecord}
        onSubmit={(record) => { /* 调 DataStore */ this.close(); }}
        onCancel={() => this.close()}
      />,
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
  }
}
```

---

## 6. 执行计划

**分支**：从 `main` 起 `feature/react-migration`，全程在分支上做，`main` 保持可用。

### 阶段 1 — 脚手架（不改功能）

- [ ] 起分支 `feature/react-migration`
- [ ] 装依赖：`npm i react react-dom && npm i -D @types/react @types/react-dom`
- [ ] 改 `tsconfig.json`：`"jsx": "react-jsx"`，`"moduleResolution": "bundler"`
- [ ] 改 `esbuild.config.mjs`：`loader: { ".tsx": "tsx" }`，entry 仍 `src/main.ts`
- [ ] 新建 `src/ui/` 目录
- [ ] **验证**：`npm run dev` 通过，插件正常加载，旧界面照常跑

### 阶段 2 — 数据桥

- [ ] 写 `useFinanceData` hook（订阅 store → state）
- [ ] 写 `useMask` hook（隐私模式开关）
- [ ] 写 `Icon` 组件封装
- [ ] **验证**：hook 能拿到正确数据（console 打印）

### 阶段 3 — 组件迁移（按依赖顺序，每块独立验证）

- [ ] `MetricCards`（6 张卡片，最简单，先打通渲染链路）
- [ ] `AssetAllocation`（表格 + 偏离 >10% 高亮）
- [ ] `DividendSummary`（表格 + 汇总行）
- [ ] `MonthlyOverview`（动态列表格 + 编辑/删除操作）
- [ ] `CashFlowDetails`（筛选 + 分页，状态最多）
- [ ] `Charts`（3 个 Chart.js，注意 destroy）
- [ ] `Header`（年份选择器 + 操作按钮 + 遮罩开关）
- [ ] 改造 `dashboard-view.ts` 的 `onOpen`/`onClose` 挂载/卸载 React
- [ ] **验证**：每替换一块，对照 fixture 数据确认渲染正确

### 阶段 4 — Modals 改造

- [ ] `AssetSnapshotForm`（月度快照 + 动态类别输入）
- [ ] `CashFlowForm`（收支类型切换联动类别下拉）
- [ ] `DividendForm`（股票名 datalist 自动补全）
- [ ] 三个 `Modal` 子类改为外壳 + React 表单
- [ ] **验证**：三种录入流程都能正确写回 DataStore

### 阶段 5 — 验证 & 收尾

- [ ] fixture 数据全量回归：
  - [ ] 6 指标卡片数值正确
  - [ ] 资产配置偏离 >10% 高亮
  - [ ] 3 个图表（环形 + 柱状/折线 + 总资产趋势）
  - [ ] 月度总览动态列、环比%、投资回报
  - [ ] 股息按股票分组 + 年度汇总
  - [ ] 收支筛选（全部/收入/支出）+ 分页 ≤50
- [ ] 隐私模式切换
- [ ] 年份切换 + 跨年写入
- [ ] 明暗主题、响应式断点（≤480px）
- [ ] 删除旧命令式渲染代码
- [ ] `npm run build` 通过
- [ ] 合并到 `main`

---

## 7. 风险与应对

| 风险 | 应对 |
|---|---|
| Chart.js 重复创建导致内存泄漏 | `useEffect` cleanup 里 `chart.destroy()`，依赖数组精确控制（`[snapshot, maskNumbers]`） |
| `setIcon` 调用时机 | 用 `Icon` 组件在 `useEffect` + `ref` 里调，组件卸载自动清理 |
| 全量重渲染 vs diff | 数据变就整树重渲染，与现状一致；React diff 比手动 `empty()` 更高效 |
| Modal 焦点 / Escape 行为 | 保留 `Modal` 外壳，Obsidian 原生管理，不自己实现 |
| 回归风险 | 阶段 3 每块独立验证，旧代码可临时并存到全部替换完再删 |
| bundle 体积 | React ~45KB gz，可接受；后续可切 `preact/compat` |

---

## 8. 工作量评估

整体中等偏小。阶段 3 的组件化是主体，但因有现成逻辑和清晰的 `renderXxx` 结构，基本是"翻译"而非"重设计"。每阶段产出可独立验证，风险可控。
