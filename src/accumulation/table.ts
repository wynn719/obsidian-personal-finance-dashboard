/**
 * Markdown 表格的最小读写工具。
 *
 * 关键差异（与 data-store.ts 里的 `parseMarkdownTableRow` 相反）：
 * 这里**保留空 cell**，靠列位置解析。用丢空格的切分会把
 * 「目标价为空的阶段行」整行往后串列，金额跑到备注列上去。
 */

/** 单元格转义：竖线必须转义，换行压成空格 */
export function escapeCell(value: string): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/**
 * 切一行表格，保留空 cell，识别 `\|` 转义。
 * 只 trim 每个 cell 的两端——内部空格必须保留（fixture 里有「五 粮 液」）。
 */
export function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);

  const cells: string[] = [];
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\" && s[i + 1] === "|") {
      buf += "|";
      i += 1;
      continue;
    }
    if (ch === "|") {
      cells.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  cells.push(buf.trim());
  return cells;
}

export function isTableLine(line: string): boolean {
  return line.trim().startsWith("|");
}

/** 分隔行：只由 | - : 与空白组成，且至少有一个 - */
export function isSeparatorLine(line: string): boolean {
  const s = line.trim();
  if (!s.startsWith("|") && !s.includes("-")) return false;
  return /^[|\-:\s]+$/.test(s) && s.includes("-");
}

export interface ParsedTable {
  /** 表头（缺失时为空数组） */
  header: string[];
  rows: string[][];
  /** 与 rows 一一对应的原始行，语义解析失败时原样回写 */
  rowLines: string[];
  /** 不是表格行的非空行（原样保留） */
  orphan: string[];
  /** 是否识别到表头 + 分隔行 */
  hasHeader: boolean;
}

/** 解析一段表格行；容错优先，绝不因为一行脏数据丢整表 */
export function parseTable(lines: string[]): ParsedTable {
  const tableLines: string[] = [];
  const orphan: string[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    if (isTableLine(line)) tableLines.push(line);
    else orphan.push(line);
  }

  if (tableLines.length === 0)
    return { header: [], rows: [], rowLines: [], orphan, hasHeader: false };

  const secondIsSeparator = tableLines.length > 1 && isSeparatorLine(tableLines[1]);
  const hasHeader = secondIsSeparator;
  const header = hasHeader ? splitRow(tableLines[0]) : [];
  const bodyLines = (hasHeader ? tableLines.slice(2) : tableLines).filter(
    (l) => !isSeparatorLine(l),
  );
  const rows = bodyLines.map(splitRow);

  return { header, rows, rowLines: bodyLines, orphan, hasHeader };
}

/** 生成对齐行 */
export function alignRow(aligns: Array<"left" | "right">): string {
  const cells = aligns.map((a) => (a === "right" ? "---:" : "---"));
  return `|${cells.join("|")}|`;
}

/** 生成一行表格；值需已格式化（金额/日期/布尔） */
export function buildRow(cells: string[]): string {
  return `| ${cells.map(escapeCell).join(" | ")} |`;
}

/** 表头行（不转义，表头由代码固定） */
export function buildHeader(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}
