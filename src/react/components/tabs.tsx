import { Icon } from "../icon";
import type { TabsProps } from "../types";

/**
 * 页面级 tab 条（下划线式）。
 * 只负责渲染与回调，状态由调用方持有 —— 因为切 tab 时要决定
 * 哪些面板保持挂载（番茄钟必须常驻，否则计时器状态会丢）。
 */
export function Tabs({ value, onChange, items }: TabsProps) {
  return (
    <div className="finance-tabs" role="tablist">
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            role="tab"
            aria-selected={active}
            className={`finance-tab${active ? " is-active" : ""}`}
            onClick={() => onChange(item.key)}
          >
            {item.icon ? <Icon name={item.icon} /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
