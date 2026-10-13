import { useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { t } from "../../i18n";
import {
  fetchEtfPremiums,
  ETF_PREMIUM_THRESHOLD,
} from "../../etf-premium-service";
import { formatClockTime } from "../../utils";
import { DataTable, type Column } from "./data-table";
import type { EtfPremiumRow } from "../../models";
import type { EtfPremiumSectionProps } from "../types";

/** 溢价率带符号格式化："+15.50%" / "-0.16%" */
function formatSignedPct(v: number): string {
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

/**
 * 纳指/标普 ETF 低溢价监控（独立模块）：
 * 16 只场内 QDII ETF，默认只看溢价率 ≤ 3% 的标的，可切换全部；
 * 手动刷新，结果缓存于 Misc.md。
 */
export function EtfPremiumSection({ store }: EtfPremiumSectionProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const rows = store.getEtfPremiums();
  const lowRows = rows.filter((r) => r.premium <= ETF_PREMIUM_THRESHOLD);
  const visible = showAll ? rows : lowRows;
  const lowest = rows.length > 0 ? rows[0] : undefined; // 已按溢价率升序

  const lastUpdated = rows
    .map((r) => r.updatedAt)
    .filter(Boolean)
    .sort()
    .pop();

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const next = await fetchEtfPremiums();
      await store.updateEtfPremiums(next);
    } catch (e) {
      console.error("Finance Dashboard: ETF premium refresh failed", e);
      new Notice(t("market.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  const columns: Column<EtfPremiumRow>[] = [
    {
      key: "code",
      header: t("etfPremium.col.code"),
      cell: (r) => <span className="finance-holding-symbol">{r.code}</span>,
    },
    {
      key: "name",
      header: t("etfPremium.col.name"),
      excludeFromCard: true,
      cell: (r) => r.name,
    },
    {
      key: "price",
      header: t("etfPremium.col.price"),
      numeric: true,
      cell: (r) => r.price.toFixed(3),
    },
    {
      key: "premium",
      header: t("etfPremium.col.premium"),
      numeric: true,
      className: "finance-bold",
      cell: (r) => (
        <span
          className={
            r.premium <= ETF_PREMIUM_THRESHOLD ? "finance-etf-ok" : undefined
          }
        >
          {formatSignedPct(r.premium)}
        </span>
      ),
    },
    {
      key: "fee",
      header: t("etfPremium.col.fee"),
      numeric: true,
      hideOnMobile: true,
      cell: (r) => `${r.fee.toFixed(2)}%`,
    },
    {
      key: "scale",
      header: t("etfPremium.col.scale"),
      numeric: true,
      hideOnMobile: true,
      cell: (r) => r.scale.toFixed(2),
    },
  ];

  return (
    <div className="finance-section finance-market-section">
      <h2 className="finance-holdings-title">
        <span>
          <Icon name="scale" /> {t("etfPremium.title")}
        </span>
        <span className="finance-market-head-right">
          {rows.length > 0 ? (
            <span className="finance-etf-filter">
              <button
                className={!showAll ? "finance-etf-filter-active" : undefined}
                onClick={() => setShowAll(false)}
              >
                {t("etfPremium.filter.low")}
              </button>
              <button
                className={showAll ? "finance-etf-filter-active" : undefined}
                onClick={() => setShowAll(true)}
              >
                {t("etfPremium.filter.all")}
              </button>
            </span>
          ) : null}
          {lastUpdated ? (
            <span className="finance-quote-time">
              {t("market.updatedAt", { time: formatClockTime(lastUpdated) })}
            </span>
          ) : null}
          <button
            className={`finance-btn-small${
              refreshing ? " finance-btn-spinning" : ""
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("etfPremium.btn.refresh")}
          >
            <Icon name="refresh-cw" />
          </button>
        </span>
      </h2>

      {visible.length > 0 ? (
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(r) => r.code}
          mobileMode="card"
          stickyLabel={false}
        />
      ) : rows.length === 0 ? (
        <p className="finance-empty">{t("etfPremium.empty")}</p>
      ) : (
        <p className="finance-empty">
          {t("etfPremium.noneLow", {
            count: rows.length,
            name: lowest?.name ?? "",
            pct: lowest ? lowest.premium.toFixed(2) : "0.00",
          })}
        </p>
      )}
    </div>
  );
}
