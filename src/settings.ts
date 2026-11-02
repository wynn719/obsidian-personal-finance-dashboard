import { App, PluginSettingTab, Setting, Notice, setIcon } from "obsidian";
import type FinanceDashboardPlugin from "./main";
import { FinanceSettings, TargetAllocation } from "./models";
import { t, setLocale, Locale } from "./i18n";

export class FinanceSettingTab extends PluginSettingTab {
  plugin: FinanceDashboardPlugin;

  constructor(app: App, plugin: FinanceDashboardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: t("settings.title") });

    const settings = this.plugin.settings;

    // ============================================================
    // Language
    // ============================================================
    new Setting(containerEl)
      .setName(t("settings.language"))
      .setDesc(t("settings.languageDesc"))
      .addDropdown((dropdown) => {
        dropdown
          .addOption("en", "English")
          .addOption("zh", "中文")
          .setValue(settings.locale)
          .onChange(async (value) => {
            settings.locale = value as Locale;
            setLocale(settings.locale);
            await this.plugin.saveSettings();
            // Re-render settings page with new locale
            this.display();
            // Trigger Dashboard re-render with new locale
            await this.plugin.dataStore.reload();
          });
      });

    // ============================================================
    // Data Folder Path
    // ============================================================
    new Setting(containerEl)
      .setName(t("settings.dataFolderPath"))
      .setDesc(t("settings.dataFolderPathDesc"))
      .addText((text) => {
        text
          .setPlaceholder("Finance")
          .setValue(settings.dataFolderPath)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              settings.dataFolderPath = trimmed;
              this.plugin.dataStore.setDataFolderPath(trimmed);
              await this.plugin.saveSettings();
            }
          });
        text.inputEl.style.width = "300px";
      });

    // ============================================================
    // Misc Data File Path (standalone non-yearly data, e.g. stock holdings)
    // ============================================================
    new Setting(containerEl)
      .setName(t("settings.miscDataFilePath"))
      .setDesc(t("settings.miscDataFilePathDesc"))
      .addText((text) => {
        text
          .setPlaceholder("Finance/Misc.md")
          .setValue(settings.miscDataFilePath)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed.length > 0) {
              // Guard against colliding with a per-year data file
              if (/(\d{4})\.md$/.test(trimmed)) {
                new Notice(t("settings.miscDataFilePathInvalid"));
                return;
              }
              settings.miscDataFilePath = trimmed;
              this.plugin.dataStore.setMiscDataFilePath(trimmed);
              await this.plugin.saveSettings();
              await this.plugin.dataStore.reloadMisc();
            }
          });
        text.inputEl.style.width = "300px";
      });

    // ============================================================
    // Target Allocations
    // ============================================================
    containerEl.createEl("h3", { text: t("settings.targetAllocation") });
    containerEl.createEl("p", {
      text: t("settings.targetAllocationDesc"),
      cls: "setting-item-description",
    });

    settings.targetAllocations.forEach((alloc, idx) => {
      new Setting(containerEl).setName(alloc.category).addText((text) => {
        text
          .setPlaceholder("Target %")
          .setValue(String(alloc.percentage))
          .onChange(async (value) => {
            const num = parseFloat(value);
            if (!isNaN(num) && num >= 0) {
              settings.targetAllocations[idx].percentage = num;
              await this.plugin.saveSettings();
            }
          });
        text.inputEl.type = "number";
        text.inputEl.style.width = "80px";
      });
    });

    // Show total
    const total = settings.targetAllocations.reduce(
      (sum, a) => sum + a.percentage,
      0,
    );
    const totalEl = containerEl.createEl("p", {
      text: t("settings.targetTotal", { total: total.toString() }),
    });
    if (Math.abs(total - 100) > 0.01) {
      totalEl.style.color = "#e84393";
      totalEl.textContent += t("settings.targetWarning");
    } else {
      totalEl.style.color = "#00b894";
      const checkIcon = totalEl.createSpan({ cls: "finance-icon" });
      setIcon(checkIcon, "check-circle");
    }

    // ============================================================
    // Asset Categories
    // ============================================================
    containerEl.createEl("h3", { text: t("settings.assetCategories") });

    new Setting(containerEl)
      .setName(t("settings.categories"))
      .setDesc(t("settings.categoriesDesc.asset"))
      .addTextArea((text) => {
        text
          .setValue(settings.assetCategories.join(", "))
          .onChange(async (value) => {
            settings.assetCategories = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);

            // Sync target allocations
            this.syncTargetAllocations(settings);
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 2;
        text.inputEl.style.width = "100%";
      });

    // ============================================================
    // Income Categories
    // ============================================================
    containerEl.createEl("h3", { text: t("settings.incomeCategories") });

    new Setting(containerEl)
      .setName(t("settings.categories"))
      .setDesc(t("settings.categoriesDesc.income"))
      .addTextArea((text) => {
        text
          .setValue(settings.incomeCategories.join(", "))
          .onChange(async (value) => {
            settings.incomeCategories = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 2;
        text.inputEl.style.width = "100%";
      });

    // ============================================================
    // Expense Categories
    // ============================================================
    containerEl.createEl("h3", { text: t("settings.expenseCategories") });

    new Setting(containerEl)
      .setName(t("settings.categories"))
      .setDesc(t("settings.categoriesDesc.expense"))
      .addTextArea((text) => {
        text
          .setValue(settings.expenseCategories.join(", "))
          .onChange(async (value) => {
            settings.expenseCategories = value
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 2;
        text.inputEl.style.width = "100%";
      });
  }

  /**
   * Ensure target allocations stay in sync with asset categories.
   * Add new categories with 0%, keep existing ones.
   */
  private syncTargetAllocations(settings: FinanceSettings): void {
    const existing = new Map(
      settings.targetAllocations.map((a) => [a.category, a.percentage]),
    );

    settings.targetAllocations = settings.assetCategories.map((cat) => ({
      category: cat,
      percentage: existing.get(cat) ?? 0,
    }));
  }
}
