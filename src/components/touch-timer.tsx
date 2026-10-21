import { useEffect, useRef, useState } from "react";
import { ringBell } from "@/lib/bells";
import { cn } from "@/lib/utils";

const PRESETS = [5, 10, 15, 20];

/** Seconds left until an end timestamp. Never counts by ticking down. */
export function secondsLeft(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

/** New end timestamp for a paused remainder, measured from now. */
export function endFromRemain(remainSec: number, now: number): number {
  return now + Math.max(0, remainSec) * 1000;
}

export function formatClock(total: number): string {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function TouchTimer({
  title = "Timer",
  className,
  presets = PRESETS,
  size = "card",
  cleanupMin,
}: {
  title?: string;
  className?: string;
  presets?: number[];
  size?: "card" | "projector";
  cleanupMin?: number;
}) {
  const [remain, setRemain] = useState(10 * 60);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [run, setRun] = useState(false);
  const [up, setUp] = useState(false);
  const rang = useRef(false);
  const projector = size === "projector";

  useEffect(() => {
    if (!run || endAt == null) return;
    const tick = () => {
      const leftNow = secondsLeft(endAt, Date.now());
      setRemain(leftNow);
      if (leftNow > 0) return;
      setRun(false);
      setEndAt(null);
      setUp(true);
      if (!rang.current) {
        rang.current = true;
        ringBell();
      }
    };
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [run, endAt]);

  function arm(mins: number) {
    rang.current = false;
    setUp(false);
    setRun(false);
    setEndAt(null);
    setRemain(Math.max(0, Math.round(mins * 60)));
  }

  function pause() {
    if (endAt != null) setRemain(secondsLeft(endAt, Date.now()));
    setEndAt(null);
    setRun(false);
  }

  function start() {
    if (remain <= 0) return;
    rang.current = false;
    setUp(false);
    setEndAt(endFromRemain(remain, Date.now()));
    setRun(true);
  }

  const shown = remain;

  return (
    <section
      className={cn("rounded-xl bg-surface p-3", className)}
      data-touch-timer={size}
      onKeyDown={(e) => {
        if (e.key === "Escape" && run) pause();
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">{title}</p>
      {up ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-1 flex items-center gap-3 font-display font-semibold text-fg"
          style={{ fontSize: projector ? "48px" : "1.5rem", lineHeight: 1.1 }}
        >
          <span aria-hidden>⏰</span>
          Time's up
        </p>
      ) : (
        <p
          className={cn(
            "font-display font-semibold tabular-nums text-fg",
            projector ? "" : "tw-timer-read",
          )}
          style={projector ? { fontSize: "96px", lineHeight: 1 } : undefined}
          dir="ltr"
        >
          <bdi>{formatClock(shown)}</bdi>
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => arm(n)}
            className="tw-tap min-h-11 min-w-11 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            {n}m
          </button>
        ))}
        {cleanupMin != null ? (
          <button
            type="button"
            onClick={() => arm(cleanupMin)}
            className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
          >
            Cleanup
          </button>
        ) : null}
      </div>
      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={() => (run ? pause() : start())}
          className={cn("tw-tap min-h-12 flex-1 rounded-md text-sm font-semibold", run ? "bg-elevated text-muted" : "bg-accent text-accent-fg")}
        >
          {run ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => arm(10)}
          className="tw-tap min-h-12 rounded-md bg-elevated px-4 text-sm font-semibold"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
