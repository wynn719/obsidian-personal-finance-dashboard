import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * 桌面瀑布流容器。
 *
 * 为什么不用 CSS `columns`：原生多列不支持跨栏，而总资产 hero 要占两栏。
 * 也不能用 `grid-template-rows: masonry`（Chromium 未实装）。
 * 因此采用「CSS Grid + 逐项量高写行跨度」：每张卡的真实高度 = 它占用的隐式行数，
 * 行单位 1px（零量化误差），gutter 直接烘进跨度，配合 `dense` 让后续单栏卡
 * 回填上方空洞（等价最短列优先）。
 *
 * 移动端由 CSS 退化为 `display:block`，本组件检测到非 grid 即跳过，像素不受影响。
 */

interface MasonryProps {
  /** 最大列数。实际列数由容器宽度与最小卡宽（460px）推导。 */
  maxCols?: number;
  children: ReactNode;
}

/** 与 styles.css 的 --fd-masonry-gap 必须一致（运行时从这里读，改 token 即可）。 */
const FALLBACK_GAP = 16;
/** 最小可读卡宽：资产配置表 6 列（含「再平衡」文案）需要约 430px 内容宽，
 *  ETF 5 列需要约 420px；加上卡片 padding 后卡宽不得低于 460。 */
const MIN_COL = 460;

export function Masonry({ maxCols = 3, children }: MasonryProps) {
  const ref = useRef<HTMLDivElement>(null);

  const layout = () => {
    const el = ref.current;
    if (!el) return;
    // 移动端容器是 block：不参与网格，直接跳过
    const style = getComputedStyle(el);
    if (style.display !== "grid") return;

    const width = el.clientWidth;
    // 隐藏的 tab 面板宽度为 0：保留上一轮结果，等 RO 再次回调
    if (!width) return;

    const gap =
      Math.round(
        parseFloat(style.getPropertyValue("--fd-masonry-gap")) || FALLBACK_GAP,
      ) || FALLBACK_GAP;
    const cols = Math.max(
      1,
      Math.min(maxCols, Math.floor((width + gap) / (MIN_COL + gap))),
    );

    const template = `repeat(${cols}, minmax(0, 1fr))`;
    if (el.style.gridTemplateColumns !== template) {
      el.style.gridTemplateColumns = template;
    }
    if (el.dataset.cols !== String(cols)) el.dataset.cols = String(cols);

    for (const child of Array.from(el.children) as HTMLElement[]) {
      const height = child.getBoundingClientRect().height;
      // 字体/图表尚未就绪时高度为 0，跳过，等子项 RO 修正
      if (!height) continue;

      // 行跨度 = 卡片高度 + gutter；子项在桌面 margin 归零（见 .finance-masonry > *）
      const span = `span ${Math.ceil(height) + gap}`;
      if (child.style.gridRowEnd !== span) child.style.gridRowEnd = span;

      // 跨栏必须在 JS 里判：1 列网格写 span 2 会生成隐式列，把整页撑坏
      const column = cols >= 2 && child.dataset.span === "2" ? "span 2" : "";
      if (child.style.gridColumn !== column) child.style.gridColumn = column;
    }
  };

  // 每次提交后、绘制前同步套版，避免首屏出现未排布的闪动
  useLayoutEffect(() => {
    layout();
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(layout);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // layout 只依赖 maxCols，闭包内读的都是实时 DOM，故无需其它依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxCols]);

  return (
    <div className="finance-masonry" ref={ref}>
      {children}
    </div>
  );
}
