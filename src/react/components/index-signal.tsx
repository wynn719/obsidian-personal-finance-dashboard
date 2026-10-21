import { useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { useLayout } from "../responsive";
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
  const { layout } = useLayout();
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

  const refreshBtn = (
    <button
      className={`finance-btn-small${refreshing ? " finance-btn-spinning" : ""}`}
      onClick={handleRefresh}
      disabled={refreshing}
      title={t("signal.btn.refresh")}
    >
      <Icon name="refresh-cw" />
    </button>
  );

  // 移动端：压成两行——① 指数名 + 年线信号 chip ／ 距年线 + 区间 chip
  //                      ② 收盘 + MA250 ／ 交易日 + 刷新
  // 长文案 advice 在移动端省略（区间 chip 已表达结论），桌面端保留。
  if (layout === "mobile") {
    const [name, sub] = t("signal.title").split(" · ");
    return (
      <div className="finance-section finance-market-section">
        {signal ? (
          <div className="finance-signal-compact">
            <div className="finance-signal-line">
              <span className="finance-signal-name">{name}</span>
              {sub ? (
                <span className="finance-signal-chip">{sub}</span>
              ) : null}
              <span className="finance-signal-spacer" />
              <span className="finance-signal-k">
                {t("signal.col.vsMa")}
              </span>
              <span
                className={`finance-signal-dev ${
                  signal.deviation >= 0 ? "is-up" : "is-down"
                }`}
              >
                {signal.deviation > 0 ? "+" : ""}
                {signal.deviation.toFixed(2)}%
              </span>
              <span className={`finance-zone-badge finance-zone-${signal.zone}`}>
                {zoneLabels[signal.zone]}
              </span>
            </div>
            <div className="finance-signal-line finance-signal-line-sub">
              <span className="finance-signal-kv">
                {t("signal.col.close")} <b>{signal.close.toFixed(2)}</b>
              </span>
              <span className="finance-signal-kv">
                {t("signal.col.ma250")} <b>{signal.ma250.toFixed(2)}</b>
              </span>
              <span className="finance-signal-spacer" />
              <span className="finance-signal-date">{signal.tradeDate}</span>
              {refreshBtn}
            </div>
          </div>
        ) : (
          <div className="finance-signal-compact">
            <p className="finance-empty">{t("signal.empty")}</p>
            {refreshBtn}
          </div>
        )}
      </div>
    );
  }

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
          {refreshBtn}
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
