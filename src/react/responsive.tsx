import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * 顶层统一下发的响应式模式。
 *
 * 设计原则（shadcn 式分级 + 顶层下发）：
 * - 测量层：LayoutProvider 用 ResizeObserver 监听仪表盘根容器（contentEl），
 *   测的是【容器宽度】而非视口宽度——修掉 Obsidian 分栏时"视口宽但叶子窄"的失配。
 * - 下发层：派生 layout 模式 → 写入根容器 data-layout 属性（供 CSS 消费），
 *   同时通过 React Context 下发（供组件做行为级适配）。
 * - 组件层：只消费 useLayout()，不自行判定断点；纯样式由 [data-layout] CSS 处理。
 *
 * 与宽度无关的规则（触屏 hover:none、reduced-motion、print）保留 @media，
 * 不塞进 data-layout——那是正交关注点。
 */
export type LayoutMode = "full" | "compact" | "mobile";

interface LayoutState {
  layout: LayoutMode;
  /** 容器内容区宽度（px），调试/精细化场景可用。 */
  width: number;
}

const LayoutContext = createContext<LayoutState>({ layout: "full", width: 0 });

/** 容器宽度阈值——基于叶子实际宽度，非视口。 */
const FULL_MIN = 1100; // ≥1100 → full
const COMPACT_MIN = 768; // 768–1099 → compact；<768 → mobile

export function deriveLayout(width: number): LayoutMode {
  if (width >= FULL_MIN) return "full";
  if (width >= COMPACT_MIN) return "compact";
  return "mobile";
}

/** 消费下发下来的布局模式（行为级适配用；纯样式走 [data-layout] CSS）。 */
export function useLayout(): LayoutState {
  return useContext(LayoutContext);
}

interface LayoutProviderProps {
  /** 被测量的容器节点（仪表盘根 contentEl）。data-layout 属性会写到它上面。 */
  container: HTMLElement;
  children: ReactNode;
}

export function LayoutProvider({ container, children }: LayoutProviderProps) {
  const [state, setState] = useState<LayoutState>({ layout: "full", width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      // clientWidth 含 padding，减掉得到内容区宽度（组件实际可用空间）
      const cs = getComputedStyle(container);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const width = Math.max(0, container.clientWidth - padX);
      const layout = deriveLayout(width);
      // 下发给 CSS
      container.setAttribute("data-layout", layout);
      // 下发给 JS 消费者（模式不变则不触发重渲染）
      setState((prev) => (prev.layout === layout ? prev : { layout, width }));
    };
    measure(); // 同步初值，避免首屏闪烁
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  return (
    <LayoutContext.Provider value={state}>{children}</LayoutContext.Provider>
  );
}
