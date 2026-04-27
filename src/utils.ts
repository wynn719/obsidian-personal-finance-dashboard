/**
 * Utility functions for the Finance Dashboard plugin.
 */

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/** Format number as currency string (Chinese Yuan) */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Format percentage with sign */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Format change amount with sign */
export function formatChange(amount: number): string {
  const sign = amount > 0 ? "+" : "";
  return `${sign}${formatCurrency(amount)}`;
}

/** Get current month in YYYY-MM format */
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Get current date in YYYY-MM-DD format */
export function getCurrentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Get current year as string */
export function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

/** Create a DOM element with optional classes and text */
export function createEl(
  tag: string,
  options?: {
    cls?: string | string[];
    text?: string;
    attr?: Record<string, string>;
  },
): HTMLElement {
  const el = document.createElement(tag);
  if (options?.cls) {
    const classes = Array.isArray(options.cls) ? options.cls : [options.cls];
    el.classList.add(...classes);
  }
  if (options?.text) {
    el.textContent = options.text;
  }
  if (options?.attr) {
    Object.entries(options.attr).forEach(([k, v]) => el.setAttribute(k, v));
  }
  return el;
}
