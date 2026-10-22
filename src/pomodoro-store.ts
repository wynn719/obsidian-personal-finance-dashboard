import { Plugin, TAbstractFile, EventRef } from "obsidian";
import type { PomodoroDay } from "./models";
import { getCurrentDate } from "./utils";

/**
 * 番茄钟数据存储 —— 独立的 Markdown 文件（默认 `Finance/Pomodoro.md`）。
 *
 * 与 DataStore 分开的理由：Misc.md 里已经塞了持仓、指数信号、TTM 股息率、
 * ETF 溢价四类东西，番茄记录是唯一会高频写入（每 25 分钟一次）、
 * 且带时间序列的数据，单独落盘可以把写入半径收窄到一个文件，
 * 也让 iCloud 多设备同步时的冲突面变小。
 *
 * 文件格式（人可读、可手改）：
 *   # Pomodoro
 *
 *   | Date | Count | Minutes |
 *   |------|-------|---------|
 *   | 2026-10-22 | 3 | 75 |
 */

const DEFAULT_HEADING = "# Pomodoro";
const EMPTY_HINT = "<!-- 每完成一个番茄，这里会按天累加一行 -->";

/** 解析番茄文件 → 按日期升序的日聚合记录 */
export class PomodoroMarkdownParser {
  static parse(markdown: string): PomodoroDay[] {
    const lines = markdown.split("\n");

    // 只解析 `# Pomodoro` / `# 番茄` 节；纯表格（手写容错）按全文处理。
    // 若文件里存在其它标题却没有番茄节，返回空，避免把别的表读成番茄。
    let start = 0;
    let end = lines.length;
    let found = false;
    let sawHeading = false;
    for (let i = 0; i < lines.length; i += 1) {
      const trimmed = lines[i].trim();
      if (/^#\s+/.test(trimmed) && !/^##\s+/.test(trimmed)) {
        const title = trimmed.replace(/^#\s+/, "");
        if (found) {
          end = i;
          break;
        }
        sawHeading = true;
        if (title.includes("Pomodoro") || title.includes("番茄")) {
          found = true;
          start = i + 1;
        }
      }
    }
    if (sawHeading && !found) return [];

    const days: PomodoroDay[] = [];
    let inTable = false;
    let headerSkipped = false;

    for (const raw of lines.slice(start, end)) {
      const line = raw.trim();
      if (!line.startsWith("|")) {
        if (line === "") {
          inTable = false;
          headerSkipped = false;
        }
        continue;
      }
      if (!inTable) {
        inTable = true;
        headerSkipped = false;
        continue; // 表头行
      }
      if (!headerSkipped) {
        headerSkipped = true;
        continue; // 分隔行
      }
      const cells = line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => c === "" || /^:?-+:?$/.test(c))) continue;
      if (cells.length < 3) continue;

      const date = cells[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const count = Math.max(0, Math.round(parseFloat(cells[1]) || 0));
      const minutes = Math.max(0, Math.round(parseFloat(cells[2]) || 0));
      if (count === 0 && minutes === 0) continue;
      days.push({ date, count, minutes });
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
  }
}

/** 序列化 → 按日期升序的 Markdown 表格 */
export class PomodoroMarkdownSerializer {
  static serialize(days: PomodoroDay[]): string {
    const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
    const parts: string[] = [DEFAULT_HEADING, ""];

    if (sorted.length === 0) {
      parts.push(EMPTY_HINT);
    } else {
      parts.push("| Date | Count | Minutes |");
      parts.push("|------|-------|---------|");
      for (const d of sorted) {
        parts.push(`| ${d.date} | ${d.count} | ${d.minutes} |`);
      }
    }
    parts.push("");
    return parts.join("\n");
  }
}

export class PomodoroStore {
  private days: PomodoroDay[] = [];
  private listeners: Array<() => void> = [];
  private changeRef: EventRef | null = null;
  private isSaving = false;
  private filePath: string;

  constructor(
    private plugin: Plugin,
    filePath: string,
  ) {
    this.filePath = filePath;
  }

  // ============================================================
  // File path
  // ============================================================

  getFilePath(): string {
    return this.filePath;
  }

  async setFilePath(path: string): Promise<void> {
    if (path === this.filePath) return;
    this.filePath = path;
    await this.reload();
  }

  private getParentFolder(): string {
    const lastSlash = this.filePath.lastIndexOf("/");
    return lastSlash > 0 ? this.filePath.substring(0, lastSlash) : "";
  }

  // ============================================================
  // Load / save
  // ============================================================

  async load(): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      if (await adapter.exists(this.filePath)) {
        const raw = await adapter.read(this.filePath);
        this.days = PomodoroMarkdownParser.parse(raw);
      } else {
        this.days = [];
      }
    } catch (e) {
      console.error("Finance Dashboard: failed to load pomodoro data", e);
      this.days = [];
    }
  }

  private async save(): Promise<void> {
    this.isSaving = true;
    try {
      const adapter = this.plugin.app.vault.adapter;
      const parent = this.getParentFolder();
      if (parent && !(await adapter.exists(parent))) {
        await adapter.mkdir(parent);
      }
      await adapter.write(
        this.filePath,
        PomodoroMarkdownSerializer.serialize(this.days),
      );
    } finally {
      setTimeout(() => {
        this.isSaving = false;
      }, 500);
    }
  }

  async reload(): Promise<void> {
    await this.load();
    this.notify();
  }

  // ============================================================
  // Queries
  // ============================================================

  /** 按日期升序的日聚合记录 */
  getDays(): PomodoroDay[] {
    return [...this.days].sort((a, b) => a.date.localeCompare(b.date));
  }

  // ============================================================
  // Mutations
  // ============================================================

  /**
   * 记录一个完成的专注番茄（默认记到今天）。
   * 只有跑完的番茄会进来，重置/跳过不写入。
   */
  async record(minutes: number, date: string = getCurrentDate()): Promise<void> {
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    const existing = this.days.find((d) => d.date === date);
    if (existing) {
      existing.count += 1;
      existing.minutes += minutes;
    } else {
      this.days.push({ date, count: 1, minutes });
    }
    await this.save();
    this.notify();
  }

  // ============================================================
  // Change listeners
  // ============================================================

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // ============================================================
  // External edits（手改文件后自动刷新）
  // ============================================================

  startWatching(): void {
    if (this.changeRef) return;
    this.changeRef = this.plugin.app.vault.on(
      "modify",
      (file: TAbstractFile) => {
        if (file.path !== this.filePath) return;
        if (this.isSaving) return;
        window.setTimeout(() => {
          void this.reload();
        }, 500);
      },
    );
  }

  stopWatching(): void {
    if (this.changeRef) {
      this.plugin.app.vault.offref(this.changeRef);
      this.changeRef = null;
    }
  }
}
