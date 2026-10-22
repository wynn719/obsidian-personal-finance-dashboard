import { useEffect, useRef, useState } from "react";
import { Notice } from "obsidian";
import { Icon } from "../icon";
import { t } from "../../i18n";
import { getCurrentDate } from "../../utils";
import type { PomodoroSectionProps } from "../types";

/**
 * 番茄钟模块（独立卡片，位于指标卡下方）。
 *
 * - 25 / 5 / 15 三段计时，每完成 4 个番茄进入长休
 * - 只把「完成」的专注番茄写入 Misc.md（`# Pomodoro`，按天聚合），
 *   中途重置或跳过一律不计入，避免记录被意愿污染
 * - 计时基准用结束时间戳而非累加 tick，窗口休眠/切后台回来不会漂移
 * - 不按 layout 分叉 DOM（只走 CSS）：切换布局不会重建组件、不丢计时状态
 */

const FOCUS_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;
/** 每完成 N 个番茄进入一次长休 */
const LONG_BREAK_EVERY = 4;

type PomodoroMode = "focus" | "short" | "long";

const MODE_MINUTES: Record<PomodoroMode, number> = {
  focus: FOCUS_MINUTES,
  short: SHORT_BREAK_MINUTES,
  long: LONG_BREAK_MINUTES,
};

const MODE_ORDER: PomodoroMode[] = ["focus", "short", "long"];

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** 本地日期 → "YYYY-MM-DD" */
function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 本周一 00:00（周一为一周之始） */
function startOfWeek(now: Date): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

/** mm:ss */
function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * 完成提示音：用 Web Audio 合成一声短促「叮」，不依赖音频资源。
 * 浏览器策略或环境限制导致失败时静默降级（Notice 仍然提示）。
 */
function playChime(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.55);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // 静默降级：提示音不是功能必需项
  }
}

export function PomodoroSection({ pomodoroStore }: PomodoroSectionProps) {
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(FOCUS_MINUTES * 60_000);
  /** 本组已完成的番茄数（决定长休节奏） */
  const [rounds, setRounds] = useState(0);

  // 订阅独立 store：写入统计后只是本卡片重渲染，不再牵动整个仪表盘
  const [, setTick] = useState(0);
  useEffect(
    () => pomodoroStore.onChange(() => setTick((t) => t + 1)),
    [pomodoroStore],
  );

  // 剩余时间同时存 ref：计时循环只依赖 running 启停，读 ref 拿基准，避免每 tick 重建定时器
  const remainingRef = useRef(FOCUS_MINUTES * 60_000);
  const setRemaining = (ms: number) => {
    remainingRef.current = ms;
    setRemainingMs(ms);
  };

  const switchMode = (next: PomodoroMode) => {
    setMode(next);
    setRemaining(MODE_MINUTES[next] * 60_000);
    setRunning(false);
  };

  const handleComplete = () => {
    playChime();
    if (mode === "focus") {
      const done = rounds + 1;
      setRounds(done);
      void pomodoroStore.record(FOCUS_MINUTES);
      const next: PomodoroMode =
        done % LONG_BREAK_EVERY === 0 ? "long" : "short";
      switchMode(next);
      new Notice(
        t("pomodoro.notice.focusDone", { minutes: FOCUS_MINUTES }),
      );
    } else {
      switchMode("focus");
      new Notice(t("pomodoro.notice.breakDone"));
    }
  };

  // 计时循环每 tick 都要调用最新的完成逻辑（闭包里带着当前 mode/rounds）
  const completeRef = useRef(handleComplete);
  completeRef.current = handleComplete;

  useEffect(() => {
    if (!running) return;
    const endAt = Date.now() + remainingRef.current;
    const id = window.setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(id);
        setRunning(false);
        completeRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  // ===== 统计（每次渲染从独立 store 读，写入后由 onChange 触发重渲染） =====
  const days = pomodoroStore.getDays();
  const todayKey = getCurrentDate();
  const weekStartKey = dateKey(startOfWeek(new Date()));
  const countIn = (predicate: (date: string) => boolean) =>
    days.reduce(
      (acc, d) =>
        predicate(d.date)
          ? { count: acc.count + d.count, minutes: acc.minutes + d.minutes }
          : acc,
      { count: 0, minutes: 0 },
    );
  const today = countIn((date) => date === todayKey);
  const week = countIn((date) => date >= weekStartKey && date <= todayKey);

  const monday = startOfWeek(new Date());
  const weekdayLabels = t("pomodoro.weekdays").split(" ");
  const weekBars = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dateKey(d);
    const row = days.find((x) => x.date === key);
    return {
      key,
      count: row?.count ?? 0,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      label: weekdayLabels[i] ?? "",
    };
  });
  const maxCount = Math.max(1, ...weekBars.map((b) => b.count));

  // ===== 计时显示 =====
  const totalMs = MODE_MINUTES[mode] * 60_000;
  const isBreak = mode !== "focus";
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  const started = remainingMs < totalMs;
  const modeLabel = t(
    mode === "focus"
      ? "pomodoro.mode.focus"
      : mode === "short"
        ? "pomodoro.mode.short"
        : "pomodoro.mode.long",
  );
  const toggleLabel = running
    ? t("pomodoro.btn.pause")
    : started
      ? t("pomodoro.btn.resume")
      : t("pomodoro.btn.start");

  const handleReset = () => {
    setRemaining(totalMs);
    setRunning(false);
  };

  /** 跳过当前阶段：专注不计入统计，休息直接回到专注 */
  const handleSkip = () => {
    switchMode(isBreak ? "focus" : "short");
  };

  return (
    <section
      className="finance-section finance-pomodoro-section"
      data-mode={mode}
      data-running={running}
    >
      <h2>
        <span>
          <Icon name="timer" /> {t("pomodoro.title")}
        </span>
        <span className="finance-pomodoro-head-meta">
          {t("pomodoro.rounds", {
            count: rounds % LONG_BREAK_EVERY,
            total: LONG_BREAK_EVERY,
          })}
        </span>
      </h2>

      <div className="finance-pomodoro-body">
        <div className="finance-pomodoro-dial">
          <svg className="finance-pomodoro-ring" viewBox="0 0 120 120">
            <circle
              className="finance-pomodoro-ring-track"
              cx="60"
              cy="60"
              r={RING_RADIUS}
            />
            <circle
              className="finance-pomodoro-ring-progress"
              cx="60"
              cy="60"
              r={RING_RADIUS}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
            />
          </svg>
          <div className="finance-pomodoro-dial-center">
            <span className="finance-pomodoro-clock">{formatClock(remainingMs)}</span>
            <span className="finance-pomodoro-mode-label">{modeLabel}</span>
          </div>
        </div>

        <div className="finance-pomodoro-panel">
          <div className="finance-pomodoro-modes">
            {MODE_ORDER.map((m) => (
              <button
                key={m}
                className={`finance-pomodoro-mode-btn${
                  m === mode ? " is-active" : ""
                }`}
                onClick={() => switchMode(m)}
              >
                {t(
                  m === "focus"
                    ? "pomodoro.mode.focus"
                    : m === "short"
                      ? "pomodoro.mode.short"
                      : "pomodoro.mode.long",
                )}
                <span className="finance-pomodoro-mode-min">
                  {MODE_MINUTES[m]}
                </span>
              </button>
            ))}
          </div>

          <div className="finance-pomodoro-actions">
            <button
              className="finance-btn finance-btn-cta finance-pomodoro-toggle"
              onClick={() => setRunning((r) => !r)}
            >
              <Icon name={running ? "pause" : "play"} />
              <span>{toggleLabel}</span>
            </button>
            <button
              className="finance-btn finance-pomodoro-icon-btn"
              onClick={handleReset}
              title={t("pomodoro.btn.reset")}
              aria-label={t("pomodoro.btn.reset")}
            >
              <Icon name="rotate-ccw" />
            </button>
            <button
              className="finance-btn finance-pomodoro-icon-btn"
              onClick={handleSkip}
              title={t("pomodoro.btn.skip")}
              aria-label={t("pomodoro.btn.skip")}
            >
              <Icon name="skip-forward" />
            </button>
          </div>

          <div className="finance-pomodoro-stats">
            <div className="finance-pomodoro-stat">
              <span className="finance-pomodoro-stat-label">
                {t("pomodoro.stat.today")}
              </span>
              <span className="finance-pomodoro-stat-value">
                {t("pomodoro.stat.count", { count: today.count })}
                <em>
                  {t("pomodoro.stat.minutes", { count: today.minutes })}
                </em>
              </span>
            </div>
            <div className="finance-pomodoro-stat">
              <span className="finance-pomodoro-stat-label">
                {t("pomodoro.stat.week")}
              </span>
              <span className="finance-pomodoro-stat-value">
                {t("pomodoro.stat.count", { count: week.count })}
                <em>
                  {t("pomodoro.stat.minutes", { count: week.minutes })}
                </em>
              </span>
            </div>
          </div>
        </div>

        <div className="finance-pomodoro-trend">
          <span className="finance-pomodoro-trend-label">
            {t("pomodoro.week.chart")}
          </span>
          <div className="finance-pomodoro-week">
            {weekBars.map((b) => (
              <div
                key={b.key}
                className={`finance-pomodoro-day${
                  b.isToday ? " is-today" : ""
                }${b.isFuture ? " is-future" : ""}`}
                title={`${b.key} · ${b.count}`}
              >
                <div className="finance-pomodoro-bar-track">
                  <div
                    className="finance-pomodoro-bar"
                    style={{
                      height: b.count > 0 ? `${(b.count / maxCount) * 100}%` : "0",
                    }}
                  />
                </div>
                <span className="finance-pomodoro-dow">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
