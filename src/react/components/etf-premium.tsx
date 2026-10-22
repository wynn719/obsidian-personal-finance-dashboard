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
      key: "name",
      header: t("etfPremium.col.name"),
      cell: (r) => (
        <span className="finance-holding-name">
          {r.name}
          <span className="finance-holding-symbol">{r.code}</span>
        </span>
      ),
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
    <div className="finance-section finance-market-section finance-etf-section">
      <h2 className="finance-holdings-title">
        <span>
          <Icon name="scale" /> {t("etfPremium.title")}
          {rows.length > 0 ? (
            <span className="finance-count-chip">
              {t("market.count", { count: rows.length })}
            </span>
          ) : null}
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
          mobileMode="table"
          stickyLabel={false}
          className="finance-etf-table finance-mobile-table"
        />
      ) : rows.length === 0 ? (
        <p className="finance-empty">{t("etfPremium.empty")}</p>
      ) : (
        <>
          {/* 空态不是「没数据」，而是「全部越线」：用警示条把结论和最低值讲清楚，
              再给一个去看全部的出口，而不是丢一段灰字在空白卡里 */}
          <div className="finance-etf-alert">
            <div className="finance-etf-alert-head">
              <Icon name="alert-triangle" />
              <span>
                {t("etfPremium.noneLow.title", {
                  count: rows.length,
                  threshold: ETF_PREMIUM_THRESHOLD,
                })}
              </span>
            </div>
            <p className="finance-etf-alert-body">
              {t("etfPremium.noneLow.body", {
                name: lowest?.name ?? "",
                pct: lowest ? lowest.premium.toFixed(2) : "0.00",
              })}
            </p>
          </div>
          <div className="finance-etf-alert-foot">
            <button
              className="finance-etf-viewall"
              onClick={() => setShowAll(true)}
            >
              {t("etfPremium.viewAll", { count: rows.length })}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
