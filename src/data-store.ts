import { Plugin, TFile, EventRef } from "obsidian";
import {
  FinanceData,
  EMPTY_FINANCE_DATA,
  AssetSnapshot,
  CashFlowRecord,
  DividendRecord,
  CategoryAmount,
} from "./models";
import { generateId } from "./utils";

const DEFAULT_DATA_FOLDER = "Finance";

/**
 * Handles persistence of finance data to per-year Markdown files in the vault.
 *
 * File structure:
 *   Finance/2025.md
 *   Finance/2026.md
 *
 * Each file contains:
 * ---
 * # Asset Snapshots
 * ## 2025-03
 * > note text
 * | Category | Amount | Details |
 * |----------|--------|---------|
 * | 货币短债 | 1992493 | 微众 1029440, ... |
 *
 * # Cash Flow Records
 * | Date | Type | Category | Amount | Note |
 * |------|------|----------|--------|------|
 * | 2025-03-15 | income | 工资 | 63184 | 3月工资 |
 *
 * # Dividend Records
 * | Date | Stock | Amount | Note |
 * |------|-------|--------|------|
 * | 2025-06-15 | 五粮液 | 2578 | 五粮液第一次分红 |
 */
export class DataStore {
  private dataByYear: Map<string, FinanceData> = new Map();
  private currentYear: string;
  private plugin: Plugin;
  private dataFolderPath: string;
  private listeners: Array<() => void> = [];
  private fileChangeRef: EventRef | null = null;
  private isSaving = false;

  constructor(plugin: Plugin, dataFolderPath?: string) {
    this.plugin = plugin;
    this.dataFolderPath = dataFolderPath ?? DEFAULT_DATA_FOLDER;
    this.currentYear = String(new Date().getFullYear());
  }

  /** Update the data folder path (called when settings change) */
  setDataFolderPath(path: string): void {
    this.dataFolderPath = path;
  }

  getDataFolderPath(): string {
    return this.dataFolderPath;
  }

  /** Get the file path for a given year */
  private getYearFilePath(year: string): string {
    return `${this.dataFolderPath}/${year}.md`;
  }

  // ============================================================
  // Year management
  // ============================================================

  getCurrentYear(): string {
    return this.currentYear;
  }

  setCurrentYear(year: string): void {
    this.currentYear = year;
  }

  /** Scan the data folder for available year files (e.g. 2025.md → "2025") */
  async getAvailableYears(): Promise<string[]> {
    const adapter = this.plugin.app.vault.adapter;
    const years: string[] = [];

    if (await adapter.exists(this.dataFolderPath)) {
      const listing = await adapter.list(this.dataFolderPath);
      for (const filePath of listing.files) {
        const match = filePath.match(/(\d{4})\.md$/);
        if (match) {
          years.push(match[1]);
        }
      }
    }

    // Always include current calendar year
    const calendarYear = String(new Date().getFullYear());
    if (!years.includes(calendarYear)) {
      years.push(calendarYear);
    }

    return years.sort();
  }

  /** Get the current year's data */
  private getData(): FinanceData {
    return (
      this.dataByYear.get(this.currentYear) ?? {
        assetSnapshots: [],
        cashFlowRecords: [],
        dividendRecords: [],
      }
    );
  }

  /** Set the current year's data */
  private setData(data: FinanceData): void {
    this.dataByYear.set(this.currentYear, data);
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  async load(): Promise<void> {
    // Load current year first
    await this.loadYear(this.currentYear);
    // Also pre-load all available years so that getDividendsByYear etc. work synchronously
    const years = await this.getAvailableYears();
    for (const y of years) {
      if (y !== this.currentYear) {
        await this.loadYear(y);
      }
    }
  }

  async loadYear(year: string): Promise<void> {
    try {
      const adapter = this.plugin.app.vault.adapter;
      const filePath = this.getYearFilePath(year);

      if (await adapter.exists(filePath)) {
        const raw = await adapter.read(filePath);
        this.dataByYear.set(year, MarkdownParser.parse(raw));
      } else {
        this.dataByYear.set(year, {
          assetSnapshots: [],
          cashFlowRecords: [],
          dividendRecords: [],
        });
      }
    } catch (e) {
      console.error(`Finance Dashboard: Failed to load data for ${year}`, e);
      this.dataByYear.set(year, {
        assetSnapshots: [],
        cashFlowRecords: [],
        dividendRecords: [],
      });
    }
  }

  async save(): Promise<void> {
    this.isSaving = true;
    try {
      const adapter = this.plugin.app.vault.adapter;

      // Ensure folder exists
      if (!(await adapter.exists(this.dataFolderPath))) {
        await adapter.mkdir(this.dataFolderPath);
      }

      const filePath = this.getYearFilePath(this.currentYear);
      const markdown = MarkdownSerializer.serialize(this.getData());
      await adapter.write(filePath, markdown);
    } finally {
      setTimeout(() => {
        this.isSaving = false;
      }, 500);
    }
  }

  // ============================================================
  // File watcher – detect external edits to any year file
  // ============================================================

  startWatching(): void {
    this.fileChangeRef = this.plugin.app.vault.on(
      "modify",
      async (file: TFile) => {
        if (
          file.path.startsWith(this.dataFolderPath + "/") &&
          file.path.endsWith(".md") &&
          !this.isSaving
        ) {
          const match = file.path.match(/(\d{4})\.md$/);
          if (match) {
            const year = match[1];
            console.log(
              `Finance Dashboard: External change detected for ${year}, reloading…`,
            );
            await this.loadYear(year);
            if (year === this.currentYear) {
              this.notifyChange();
            }
          }
        }
      },
    );

    this.plugin.registerEvent(this.fileChangeRef);
  }

  stopWatching(): void {
    if (this.fileChangeRef) {
      this.plugin.app.vault.offref(this.fileChangeRef);
      this.fileChangeRef = null;
    }
  }

  /**
   * Switch to a different year, loading its data if needed.
   */
  async switchYear(year: string): Promise<void> {
    this.currentYear = year;
    if (!this.dataByYear.has(year)) {
      await this.loadYear(year);
    }
    this.notifyChange();
  }

  /**
   * Force reload data from disk (useful for manual refresh).
   */
  async reload(): Promise<void> {
    await this.loadYear(this.currentYear);
    this.notifyChange();
  }

  // ============================================================
  // Change listeners (for Dashboard refresh)
  // ============================================================

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyChange(): void {
    this.listeners.forEach((l) => l());
  }

  // ============================================================
  // Asset Snapshots
  // ============================================================

  getSnapshots(): AssetSnapshot[] {
    return this.getData().assetSnapshots;
  }

  getSnapshotByMonth(month: string): AssetSnapshot | undefined {
    return this.getData().assetSnapshots.find((s) => s.month === month);
  }

  getLatestSnapshot(): AssetSnapshot | undefined {
    const snapshots = this.getData().assetSnapshots;
    if (snapshots.length === 0) return undefined;
    return [...snapshots].sort((a, b) => b.month.localeCompare(a.month))[0];
  }

  async addOrUpdateSnapshot(snapshot: AssetSnapshot): Promise<void> {
    // Determine which year this snapshot belongs to
    const year = snapshot.month.substring(0, 4);
    const prevYear = this.currentYear;

    // Switch to the target year for saving
    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    const idx = data.assetSnapshots.findIndex(
      (s) => s.month === snapshot.month,
    );
    if (idx >= 0) {
      data.assetSnapshots[idx] = snapshot;
    } else {
      data.assetSnapshots.push(snapshot);
    }
    this.setData(data);
    await this.save();
    this.notifyChange();

    // Switch back if needed
    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async deleteSnapshot(month: string): Promise<void> {
    const data = this.getData();
    data.assetSnapshots = data.assetSnapshots.filter((s) => s.month !== month);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  // ============================================================
  // Cash Flow Records
  // ============================================================

  getCashFlowRecords(): CashFlowRecord[] {
    return this.getData().cashFlowRecords;
  }

  getCashFlowByMonth(month: string): CashFlowRecord[] {
    return this.getData().cashFlowRecords.filter((r) =>
      r.date.startsWith(month),
    );
  }

  async addCashFlow(record: CashFlowRecord): Promise<void> {
    // Determine which year this record belongs to
    const year = record.date.substring(0, 4);
    const prevYear = this.currentYear;

    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    data.cashFlowRecords.push(record);
    this.setData(data);
    await this.save();
    this.notifyChange();

    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async updateCashFlow(record: CashFlowRecord): Promise<void> {
    const data = this.getData();
    const idx = data.cashFlowRecords.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      data.cashFlowRecords[idx] = record;
      this.setData(data);
      await this.save();
      this.notifyChange();
    }
  }

  async deleteCashFlow(id: string): Promise<void> {
    const data = this.getData();
    data.cashFlowRecords = data.cashFlowRecords.filter((r) => r.id !== id);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  async deleteCashFlowByMonth(month: string): Promise<void> {
    const data = this.getData();
    data.cashFlowRecords = data.cashFlowRecords.filter(
      (r) => !r.date.startsWith(month),
    );
    this.setData(data);
    await this.save();
    this.notifyChange();
  }

  // ============================================================
  // Dividend Records
  // ============================================================

  getDividendRecords(): DividendRecord[] {
    return this.getData().dividendRecords;
  }

  getDividendsByYear(year: string): DividendRecord[] {
    // Since data is already per-year, just return all if matching current year
    if (year === this.currentYear) {
      return this.getData().dividendRecords;
    }
    // Load data for the requested year (may be different from currentYear)
    const data = this.dataByYear.get(year);
    if (data) {
      return data.dividendRecords;
    }
    // Fallback: year not loaded yet, return empty
    return [];
  }

  async addDividend(record: DividendRecord): Promise<void> {
    const year = record.date.substring(0, 4);
    const prevYear = this.currentYear;

    if (year !== this.currentYear) {
      await this.switchYear(year);
    }

    const data = this.getData();
    data.dividendRecords.push(record);
    this.setData(data);
    await this.save();
    this.notifyChange();

    if (year !== prevYear) {
      await this.switchYear(prevYear);
    }
  }

  async updateDividend(record: DividendRecord): Promise<void> {
    const data = this.getData();
    const idx = data.dividendRecords.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      data.dividendRecords[idx] = record;
      this.setData(data);
      await this.save();
      this.notifyChange();
    }
  }

  async deleteDividend(id: string): Promise<void> {
    const data = this.getData();
    data.dividendRecords = data.dividendRecords.filter((r) => r.id !== id);
    this.setData(data);
    await this.save();
    this.notifyChange();
  }
}

// ============================================================
// Markdown Parser – reads Markdown into FinanceData
// ============================================================

class MarkdownParser {
  static parse(markdown: string): FinanceData {
    const data: FinanceData = {
      assetSnapshots: [],
      cashFlowRecords: [],
      dividendRecords: [],
    };

    const lines = markdown.split("\n");
    let currentSection: "none" | "assets" | "cashflow" | "dividends" = "none";
    let currentMonth: string | null = null;
    let currentNote: string | null = null;
    let currentCategories: CategoryAmount[] = [];
    let inTable = false;
    let headerParsed = false;

    const flushSnapshot = () => {
      if (currentMonth && currentCategories.length > 0) {
        const totalAssets = currentCategories.reduce(
          (sum, c) => sum + c.amount,
          0,
        );
        data.assetSnapshots.push({
          id: `snap-${currentMonth}`,
          month: currentMonth,
          categories: [...currentCategories],
          totalAssets,
          note: currentNote ?? undefined,
        });
      }
      currentMonth = null;
      currentNote = null;
      currentCategories = [];
      inTable = false;
      headerParsed = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect top-level sections (# heading)
      if (/^#\s+/.test(line) && !/^##\s+/.test(line)) {
        // Flush any pending asset snapshot
        if (currentSection === "assets") {
          flushSnapshot();
        }

        if (line.includes("Asset Snapshots") || line.includes("资产快照")) {
          currentSection = "assets";
        } else if (
          line.includes("Cash Flow Records") ||
          line.includes("收支记录")
        ) {
          currentSection = "cashflow";
          inTable = false;
          headerParsed = false;
        } else if (
          line.includes("Dividend Records") ||
          line.includes("股息记录")
        ) {
          currentSection = "dividends";
          inTable = false;
          headerParsed = false;
        } else {
          currentSection = "none";
        }
        continue;
      }

      if (currentSection === "assets") {
        // Detect month heading (## YYYY-MM)
        const monthMatch = line.match(/^##\s+(\d{4}-\d{2})/);
        if (monthMatch) {
          flushSnapshot();
          currentMonth = monthMatch[1];
          continue;
        }

        // Detect note (> blockquote)
        if (line.startsWith(">")) {
          currentNote = line.substring(1).trim();
          continue;
        }

        // Parse table rows
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row (|---|---|---|)
          }

          const cells = this.parseTableRow(line);
          if (cells.length >= 2) {
            const category = cells[0];
            const amount = parseInt(cells[1], 10) || 0;
            const details = cells[2] || undefined;
            currentCategories.push({ category, amount, details });
          }
          continue;
        }

        // Empty line or non-table line resets table state
        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }

      if (currentSection === "cashflow") {
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row
          }

          const cells = this.parseTableRow(line);
          if (cells.length >= 4) {
            const record: CashFlowRecord = {
              id: generateId(),
              date: cells[0],
              type: cells[1] as "income" | "expense",
              category: cells[2],
              amount: parseInt(cells[3], 10) || 0,
              note: cells[4] || undefined,
            };
            data.cashFlowRecords.push(record);
          }
          continue;
        }

        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }

      if (currentSection === "dividends") {
        if (line.startsWith("|")) {
          if (!inTable) {
            inTable = true;
            headerParsed = false;
            continue; // Skip header row
          }
          if (!headerParsed) {
            headerParsed = true;
            continue; // Skip separator row
          }

          const cells = this.parseTableRow(line);
          if (cells.length >= 3) {
            const record: DividendRecord = {
              id: generateId(),
              date: cells[0],
              stockName: cells[1],
              amount: parseInt(cells[2], 10) || 0,
              note: cells[3] || undefined,
            };
            data.dividendRecords.push(record);
          }
          continue;
        }

        if (line === "") {
          inTable = false;
          headerParsed = false;
        }
      }
    }

    // Flush last pending asset snapshot
    if (currentSection === "assets") {
      flushSnapshot();
    }

    return data;
  }

  /** Parse a markdown table row into cell values */
  private static parseTableRow(line: string): string[] {
    return line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }
}

// ============================================================
// Markdown Serializer – writes FinanceData to Markdown
// ============================================================

class MarkdownSerializer {
  static serialize(data: FinanceData): string {
    const parts: string[] = [];

    // Header
    parts.push("# Asset Snapshots\n");

    // Sort snapshots by month descending (newest first)
    const sortedSnapshots = [...data.assetSnapshots].sort((a, b) =>
      b.month.localeCompare(a.month),
    );

    for (const snapshot of sortedSnapshots) {
      parts.push(`## ${snapshot.month}`);
      if (snapshot.note) {
        parts.push(`> ${snapshot.note}`);
      }
      parts.push("");
      parts.push("| Category | Amount | Details |");
      parts.push("|----------|--------|---------|");

      for (const cat of snapshot.categories) {
        const details = cat.details ?? "";
        parts.push(`| ${cat.category} | ${cat.amount} | ${details} |`);
      }
      parts.push("");
    }

    // Cash Flow Records
    parts.push("# Cash Flow Records\n");

    if (data.cashFlowRecords.length > 0) {
      parts.push("| Date | Type | Category | Amount | Note |");
      parts.push("|------|------|----------|--------|------|");

      // Sort by date descending
      const sortedCashFlow = [...data.cashFlowRecords].sort((a, b) =>
        b.date.localeCompare(a.date),
      );

      for (const record of sortedCashFlow) {
        const note = record.note ?? "";
        parts.push(
          `| ${record.date} | ${record.type} | ${record.category} | ${record.amount} | ${note} |`,
        );
      }
      parts.push("");
    }

    // Dividend Records
    parts.push("# Dividend Records\n");

    if (data.dividendRecords.length > 0) {
      parts.push("| Date | Stock | Amount | Note |");
      parts.push("|------|-------|--------|------|");

      // Sort by date ascending
      const sortedDividends = [...data.dividendRecords].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      for (const record of sortedDividends) {
        const note = record.note ?? "";
        parts.push(
          `| ${record.date} | ${record.stockName} | ${record.amount} | ${note} |`,
        );
      }
      parts.push("");
    }

    return parts.join("\n");
  }
}
