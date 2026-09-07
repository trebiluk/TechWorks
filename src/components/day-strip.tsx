import { bellTimes, formatBell, periodNow, periodPast } from "@/lib/bells";
import { cn } from "@/lib/utils";

export function DayStrip({
  schedule,
  shop,
  view,
  now,
  onPeriod,
}: {
  schedule?: string;
  shop: number[];
  view?: number | null;
  now?: Date;
  onPeriod?: (period: number) => void;
}) {
  const live = periodNow(schedule, now);
  const times = bellTimes(schedule);
  return (
    <ol className="grid grid-cols-5 gap-1 lg:grid-cols-10">
      {times.map((b) => {
        const hall = b.period === 6;
        const mine = shop.includes(b.period);
        const current = live === b.period;
        const looking = view === b.period;
        const gone = periodPast(b.period, schedule, now);
        return (
          <li key={b.period}>
            <button
              type="button"
              disabled={!onPeriod}
              onClick={() => onPeriod?.(b.period)}
              className={cn(
                "tw-gadget flex h-full min-h-10 w-full flex-col items-start justify-center px-1.5 py-1 text-left",
                current
                  ? "bg-accent text-accent-fg ring-2 ring-accent"
                  : looking
                    ? "bg-surface ring-2 ring-fg"
                    : gone
                      ? "bg-elevated/50 text-subtle"
                      : mine
                        ? "bg-surface"
                        : hall
                          ? "bg-elevated text-muted"
                          : "bg-elevated/60 text-subtle",
              )}
            >
              <span className={cn("text-xs font-semibold", gone && !current && !looking ? "text-subtle" : "")}>
                {hall ? "P6 SH" : `P${b.period}`}
              </span>
              <span className={cn("font-mono text-[10px] tabular-nums", current ? "text-white/80" : "text-muted")}>
                {formatBell(b.start)}–{formatBell(b.end)}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}