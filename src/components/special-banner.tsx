import { formatBell, specialLive } from "@/lib/bells";
import { specialsOn } from "@/lib/store";
import type { EconomyFile } from "@/lib/economy";
import { cn } from "@/lib/utils";

export function SpecialBanner({
  file,
  date,
  now,
  compact,
}: {
  file: EconomyFile;
  date: string;
  now?: Date;
  compact?: boolean;
}) {
  const list = specialsOn(file, date);
  if (!list.length) return null;
  return (
    <article className="tw-gadget shrink-0 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Special today · all periods</p>
      <ul className={cn("mt-1 grid gap-1", compact ? "" : "sm:grid-cols-2")}>
        {list.map((s, i) => {
          const live = s.start && s.end ? specialLive(s.start, s.end, now) : false;
          return (
            <li key={`${s.title}-${s.start ?? i}`} className={cn("rounded-lg px-2 py-1.5", live ? "bg-gold text-bg" : "bg-elevated")}>
              <p className={cn("font-display font-semibold tracking-tight", compact ? "text-lg" : "text-xl")}>
                {s.who ? `${s.who} · ` : ""}
                {s.title}
                {s.period ? <span className="ml-1 text-sm font-medium">P{s.period}</span> : null}
              </p>
              <p className={cn("text-xs", live ? "text-bg/80" : "text-muted")}>
                {s.place || "See board"}
                {s.start && s.end ? ` · ${formatBell(s.start)}–${formatBell(s.end)}` : ""}
                {live ? " · now" : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
