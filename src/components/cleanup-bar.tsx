import { useEffect, useRef } from "react";
import type { EconomyFile } from "@/lib/economy";
import { leftClock, periodClock, periodNow, previewCleanupSound, ringBell } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { wallMode } from "@/lib/hour-flow";
import { Berty } from "@/components/berty";
import { cn } from "@/lib/utils";

/** Cleanup bell + a soft chime when Enter becomes Agenda. Mount once. */
export function CleanupAlarm({ file, schedule }: { file?: EconomyFile; schedule?: string }) {
  const bellsId = schedule ?? (file ? deskBellId(file) : undefined);
  const now = useShopClock(bellsId, "beat");
  const rang = useRef("");
  const prev = useRef<string>("");
  const live = periodNow(bellsId, now);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const hot = Boolean(clock?.cleanup);
  const mode = file ? wallMode(file, todayIso(), now) : hot ? "cleanup" : "";
  useEffect(() => {
    if (live == null) {
      prev.current = mode;
      return;
    }
    const date = now.toISOString().slice(0, 10);
    if (hot) {
      const key = `c-${date}-P${live}`;
      if (rang.current !== key) {
        rang.current = key;
        ringBell();
      }
    } else if (file && mode === "agenda" && prev.current === "enter") {
      const key = `a-${date}-P${live}`;
      if (rang.current !== key) {
        rang.current = key;
        previewCleanupSound("chime");
      }
    }
    prev.current = mode;
  }, [hot, live, now, mode, file]);
  return null;
}

export function CleanupBar({ schedule }: { schedule?: string }) {
  const now = useShopClock(schedule, "fine");
  const live = periodNow(schedule, now);
  const clock = live != null ? periodClock(live, schedule, now) : null;
  const hot = Boolean(clock?.cleanup);
  if (live == null || !clock?.live || !hot) return null;
  const tick = leftClock(clock.left);
  return (
    <div
      className={cn(
        "mb-1 flex items-center justify-between gap-3 rounded-lg px-3 py-2",
        hot ? "bg-cleanup text-accent-fg" : "bg-surface",
      )}
      role="status"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Berty pose="point" size="icon" alert />
        <p className={cn("text-xs font-semibold uppercase tracking-widest", hot ? "" : "text-subtle")}>
          {hot ? "Cleanup" : `P${live} left`}
        </p>
      </div>
      <p className={cn("font-display text-2xl font-semibold tabular-nums leading-none tracking-tight", hot ? "" : "text-fg")}>
        {tick.label}
      </p>
    </div>
  );
}

export function CleanupChip({ schedule, className }: { schedule?: string; className?: string }) {
  const now = useShopClock(schedule, "fine");
  const live = periodNow(schedule, now);
  if (live == null) return null;
  const clock = periodClock(live, schedule, now);
  if (!clock?.live) return null;
  const tick = leftClock(clock.left);
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center rounded-md px-2 font-mono text-sm tabular-nums",
        clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-elevated text-fg",
        className,
      )}
    >
      P{live} {tick.label}
    </span>
  );
}
