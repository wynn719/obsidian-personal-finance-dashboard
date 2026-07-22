import { useEffect, useState } from "react";
import { t } from "../../i18n";
import { Icon } from "../icon";
import type { HeaderProps } from "../types";

function YearSelector({
  store,
  currentYear,
  onYearChange,
}: {
  store: HeaderProps["store"];
  currentYear: string;
  onYearChange: (year: string) => void;
}) {
  const [years, setYears] = useState<string[]>([currentYear]);
  useEffect(() => {
    store.getAvailableYears().then(setYears);
  }, [store]);
  return (
    <div className="finance-year-selector">
      <span className="finance-year-label">
        <Icon name="calendar" /> {t("dashboard.yearSelector")}
      </span>
      <div className="finance-year-select-wrapper">
        <select
          className="finance-year-select"
          value={currentYear}
          onChange={(e) => onYearChange(e.target.value)}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="finance-year-select-icon">
          <Icon name="chevron-down" />
        </span>
      </div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="finance-btn" onClick={onClick}>
      <Icon name={icon} /> {label}
    </button>
  );
}

export function Header({
  store,
  currentYear,
  onYearChange,
  maskNumbers,
  onToggleMask,
  onAddSnapshot,
  onAddCashFlow,
  onAddDividend,
  onRefresh,
}: HeaderProps) {
  return (
    <div className="finance-header">
      <div className="finance-header-title-row">
        <YearSelector
          store={store}
          currentYear={currentYear}
          onYearChange={onYearChange}
        />
      </div>
      <div className="finance-actions">
        <button
          className={`finance-btn${maskNumbers ? " finance-btn-active" : ""}`}
          onClick={onToggleMask}
        >
          <Icon name={maskNumbers ? "eye-off" : "eye"} />
        </button>
        <ActionButton
          icon="bar-chart-3"
          label={t("dashboard.btn.addSnapshot")}
          onClick={onAddSnapshot}
        />
        <ActionButton
          icon="banknote"
          label={t("dashboard.btn.addCashFlow")}
          onClick={onAddCashFlow}
        />
        <ActionButton
          icon="target"
          label={t("dashboard.btn.addDividend")}
          onClick={onAddDividend}
        />
        <ActionButton
          icon="refresh-cw"
          label={t("dashboard.btn.refresh")}
          onClick={onRefresh}
        />
      </div>
    </div>
  );
}
