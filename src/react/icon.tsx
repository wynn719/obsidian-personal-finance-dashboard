import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";

interface IconProps {
  name: string;
  className?: string;
}

/** 封装 Obsidian setIcon，在 DOM 挂载后调用。name 变化时重新渲染图标。 */
export function Icon({ name, className }: IconProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      setIcon(ref.current, name);
    }
  }, [name]);
  return <span ref={ref} className={className ?? "finance-icon"} />;
}
