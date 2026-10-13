import { useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { t } from "../../i18n";
import { fetchIndexSignal } from "../../index-signal-service";
import { formatClockTime } from "../../utils";
import type { IndexSignalZone } from "../../models";
import type { IndexSignalSectionProps } from "../types";

/**
 * 红利低波100 年线策略信号卡（独立模块）：
 * 展示最新交易日 / 收盘 / MA250 / 偏离度 / 策略区间 / 操作建议，
 * 手动刷新（与持仓模块同模式），结果缓存于 Misc.md。
 */
export function IndexSignalSection({ store }: IndexSignalSectionProps) {
  const [refreshing, setRefreshing] = useState(false);
  const signal = store.getIndexSignal();

  // t() 在渲染期求值，保证切换语言后立即生效
  const zoneLabels: Record<IndexSignalZone, string> = {
    buy: t("signal.zone.buy"),
    hold: t("signal.zone.hold"),
    sell: t("signal.zone.sell"),
    overheat: t("signal.zone.overheat"),
  };
  const zoneAdvice: Record<IndexSignalZone, string> = {
    buy: t("signal.advice.buy"),
    hold: t("signal.advice.hold"),
    sell: t("signal.advice.sell"),
    overheat: t("signal.advice.overheat"),
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const next = await fetchIndexSignal();
      await store.updateIndexSignal(next);
    } catch (e) {
      console.error("Finance Dashboard: index signal refresh failed", e);
      new Notice(t("market.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="finance-section finance-market-section">
      <h2 className="finance-holdings-title">
        <span>
          <Icon name="trending-up" /> {t("signal.title")}
        </span>
        <span className="finance-market-head-right">
          {signal ? (
            <span className="finance-quote-time">
              {t("market.updatedAt", {
                time: formatClockTime(signal.updatedAt),
              })}
            </span>
          ) : null}
          <button
            className={`finance-btn-small${
              refreshing ? " finance-btn-spinning" : ""
            }`}
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("signal.btn.refresh")}
          >
            <Icon name="refresh-cw" />
          </button>
        </span>
      </h2>

      {signal ? (
        <div className="finance-signal-body">
          <div className="finance-signal-hero">
            <span
              className={`finance-signal-dev finance-signal-${signal.zone}`}
            >
              {signal.deviation > 0 ? "+" : ""}
              {signal.deviation.toFixed(2)}%
            </span>
            <span className={`finance-zone-badge finance-zone-${signal.zone}`}>
              {zoneLabels[signal.zone]}
            </span>
          </div>
          <div className="finance-signal-meta">
            <span>
              {t("signal.col.close")} <b>{signal.close.toFixed(2)}</b>
            </span>
            <span>
              {t("signal.col.ma250")} <b>{signal.ma250.toFixed(2)}</b>
            </span>
            <span>{signal.tradeDate}</span>
          </div>
          <p className="finance-signal-advice">{zoneAdvice[signal.zone]}</p>
        </div>
      ) : (
        <p className="finance-empty">{t("signal.empty")}</p>
      )}
    </div>
  );
}
