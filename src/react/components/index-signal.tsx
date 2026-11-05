import { useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { useLayout } from "../responsive";
import { t } from "../../i18n";
import { refreshIndexSignal } from "../../market-refresh";
import { formatClockTime } from "../../utils";
import type { IndexSignalZone } from "../../models";
import type { IndexSignalSectionProps } from "../types";

/**
 * 红利低波100 年线策略信号卡（独立模块）：
 * 展示最新交易日 / 收盘 / MA250 / 偏离度 / 策略区间 / 操作建议，
 * 手动刷新（与持仓模块同模式），结果缓存于 Misc.md。
 *
 * 全端统一为紧凑三行结构（原移动端版面）：
 *   ① 指数名 + 年线策略 chip ／ 更新时间 + 刷新
 *   ② 距年线（说明）+ 偏离度大数值 + 区间 chip
 *   ③ 收盘 + MA250 ／ 交易日
 * 桌面多一行操作建议（窄屏没有横向余量，只在卡片右侧补一条 10px 时间）。
 */
export function IndexSignalSection({ store }: IndexSignalSectionProps) {
  const [refreshing, setRefreshing] = useState(false);
  const { layout } = useLayout();
  const signal = store.getIndexSignal();
  const wide = layout !== "mobile";

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
      await refreshIndexSignal(store);
    } catch (e) {
      console.error("Finance Dashboard: index signal refresh failed", e);
      new Notice(t("market.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  const refreshBtn = (
    <button
      className={`finance-refresh-btn${refreshing ? " finance-btn-spinning" : ""}`}
      onClick={handleRefresh}
      disabled={refreshing}
      title={t("signal.btn.refresh")}
    >
      <Icon name="refresh-cw" />
    </button>
  );

  const [name, sub] = t("signal.title").split(" · ");

  return (
    <div className="finance-section finance-market-section">
      {signal ? (
        <div className="finance-signal-compact">
          <div className="finance-signal-head">
            {/* 与其它卡片标题一致：图标 + 名称，间距取 --fd-title-icon-gap */}
            <span className="finance-signal-title">
              <Icon name="trending-up" />
              <span className="finance-signal-name">{name}</span>
            </span>
            {sub ? <span className="finance-signal-chip">{sub}</span> : null}
            <span className="finance-signal-spacer" />
            {wide ? (
              <span className="finance-quote-time">
                {t("market.updatedAt", {
                  time: formatClockTime(signal.updatedAt),
                })}
              </span>
            ) : null}
            {refreshBtn}
          </div>
          <div className="finance-signal-hero">
            <span className="finance-signal-hero-col">
              <span className="finance-signal-k">{t("signal.col.vsMa")}</span>
              <span
                className={`finance-signal-dev ${
                  signal.deviation >= 0 ? "is-up" : "is-down"
                }`}
              >
                {signal.deviation > 0 ? "+" : ""}
                {signal.deviation.toFixed(2)}%
              </span>
            </span>
            <span className={`finance-zone-badge finance-zone-${signal.zone}`}>
              {zoneLabels[signal.zone]}
            </span>
          </div>
          <div className="finance-signal-foot">
            <span className="finance-signal-kv">
              {t("signal.col.close")} <b>{signal.close.toFixed(2)}</b>
            </span>
            <span className="finance-signal-kv">
              {t("signal.col.ma250")} <b>{signal.ma250.toFixed(2)}</b>
            </span>
            <span className="finance-signal-spacer" />
            <span className="finance-signal-date">{signal.tradeDate}</span>
          </div>
          {wide ? (
            <p className="finance-signal-advice">{zoneAdvice[signal.zone]}</p>
          ) : null}
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
