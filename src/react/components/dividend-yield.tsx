import { useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { t } from "../../i18n";
import { fetchDividendYields } from "../../dividend-yield-service";
import { formatClockTime } from "../../utils";
import { DataTable, type Column } from "./data-table";
import type { DividendYieldRow } from "../../models";
import type { DividendYieldSectionProps } from "../types";

/**
 * TTM 股息率表（独立模块）：
 * 9 只 A 股跟踪池，口径与 WorkBuddy 每日股票分析自动化一致
 * （最近一次已实施年报 + 最近一次已实施中期）。
 * 手动刷新，结果缓存于 Misc.md。
 */

/** 高股息线：股息率 ≥ 5% 才标红，与表头说明文案保持一致 */
const DIVIDEND_YIELD_HIGHLIGHT = 5;

export function DividendYieldSection({
  store,
  maskNumbers,
}: DividendYieldSectionProps) {
  const [refreshing, setRefreshing] = useState(false);
  const rows = store.getDividendYields();
  const lastUpdated = rows
    .map((r) => r.updatedAt)
    .filter(Boolean)
    .sort()
    .pop();

  const mask = (v: string) => (maskNumbers ? "***" : v);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const { rows: next, failed } = await fetchDividendYields();
      if (next.length > 0) {
        await store.updateDividendYields(next);
      }
      if (failed.length > 0) {
        new Notice(t("market.partialFailed", { count: failed.length }));
      }
      if (next.length === 0) {
        new Notice(t("market.refreshFailed"));
      }
    } catch (e) {
      console.error("Finance Dashboard: dividend yield refresh failed", e);
      new Notice(t("market.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  const columns: Column<DividendYieldRow>[] = [
    {
      key: "name",
      header: t("dividendYield.col.name"),
      excludeFromCard: true,
      cell: (r) => (
        <span className="finance-holding-name">
          {r.name}
          <span className="finance-holding-symbol">{r.symbol}</span>
          {r.pendingAnnual ? (
            <span
              className="finance-dy-pending"
              title={t("dividendYield.pending", { period: r.pendingAnnual })}
            >
              ⚠
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "price",
      header: t("dividendYield.col.price"),
      numeric: true,
      cell: (r) => mask(r.price.toFixed(2)),
    },
    {
      key: "ttm",
      header: t("dividendYield.col.ttm"),
      numeric: true,
      cell: (r) => mask(`¥${r.ttmPerShare.toFixed(4)}`),
    },
    {
      key: "yield",
      header: t("dividendYield.col.yield"),
      numeric: true,
      className: "finance-dy-yield",
      cell: (r) => (
        // 只有够到高股息线才标红：全表标红等于没有层级（设计稿 2026-10-22）
        <span
          className={
            r.yieldPct >= DIVIDEND_YIELD_HIGHLIGHT
              ? "finance-dy-yield-high"
              : undefined
          }
        >
          {r.yieldPct.toFixed(2)}%
        </span>
      ),
    },
  ];

  return (
    <div className="finance-section finance-market-section finance-dy-section">
      <h2 className="finance-holdings-title">
        <span>
          <Icon name="percent" /> {t("dividendYield.title")}
          {rows.length > 0 ? (
            <span className="finance-count-chip">
              {t("market.count", { count: rows.length })}
            </span>
          ) : null}
        </span>
        <span className="finance-market-head-right">
          <button
            className={`finance-btn-small${
              refreshing ? " finance-btn-spinning" : ""
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("dividendYield.btn.refresh")}
          >
            <Icon name="refresh-cw" />
          </button>
        </span>
      </h2>

      {rows.length > 0 ? (
        <div className="finance-dy-meta">
          <span>{t("dividendYield.sortNote")}</span>
          {lastUpdated ? (
            <span className="finance-dy-updated">
              {formatClockTime(lastUpdated)}
            </span>
          ) : null}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.symbol}
        mobileMode="table"
        stickyLabel={false}
        className="finance-dy-table finance-mobile-table"
        emptyText={t("dividendYield.empty")}
      />
    </div>
  );
}
