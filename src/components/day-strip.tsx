import { bellTimes, formatBell, periodNow, periodPast, windowsOverlap } from "@/lib/bells";
import type { DaySpecial } from "@/lib/store";
import { cn } from "@/lib/utils";

export function DayStrip({
  schedule,
  shop,
  view,
  now,
  onPeriod,
  specials,
}: {
  schedule?: string;
  shop: number[];
  view?: number | null;
  now?: Date;
  onPeriod?: (period: number) => void;
  specials?: DaySpecial[];
}) {
  const live = periodNow(schedule, now);
  const times = bellTimes(schedule);
  return (
    <ol data-day-strip>
      {times.map((b) => {
        const hall = b.period === 6;
        const mine = shop.includes(b.period);
        const current = live === b.period;
        const looking = view === b.period;
        const gone = periodPast(b.period, schedule, now);
        const hit = (specials ?? []).find((s) => {
          if (s.period === b.period) return true;
          if (s.start && s.end) return windowsOverlap(s.start, s.end, b.start, b.end);
          return false;
        });
        return (
          <li key={b.period}>
            <button
              type="button"
              disabled={!onPeriod}
              onClick={() => onPeriod?.(b.period)}
              className={cn(
                "tw-gadget flex h-full min-h-10 w-full flex-col items-start justify-center px-1.5 py-1 text-left",
                hit && !current ? "ring-1 ring-gold" : "",
                current
                  ? "bg-accent text-accent-fg ring-2 ring-accent tw-live"
                  : looking
                    ? "bg-surface ring-2 ring-fg"
                    : gone
                      ? "bg-elevated/50 text-subtle"
                      : mine
                        ? "bg-surface"
                        : hall
                          ? "bg-elevated text-muted"
                          : "bg-transparent text-subtle",
              )}
            >
              <span className={cn("text-xs font-semibold", !mine && !hall && !current ? "font-normal" : "", gone && !current && !looking ? "text-subtle" : "")}>
                {hall ? "P6 SH" : `P${b.period}`}
                {hit ? <span className="ml-1 text-[9px] font-bold uppercase text-gold">{hit.who || "ASM"}</span> : null}
              </span>
              <span className={cn("font-mono text-[10px] tabular-nums", current ? "text-accent-fg/80" : "text-muted")}>
                {mine || hall || current ? `${formatBell(b.start)}–${formatBell(b.end)}` : formatBell(b.start)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}