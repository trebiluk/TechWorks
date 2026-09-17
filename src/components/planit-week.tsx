import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import { planitLiveWeek, planitStripHasWork } from "@/lib/planit";
import { cn } from "@/lib/utils";

export function PlanitWeek({
  file,
  period,
  date,
}: {
  file: EconomyFile;
  period: number;
  date: string;
}) {
  const days = planitLiveWeek(file, period, date);
  if (!planitStripHasWork(days)) return null;
  const course = periodTitle(period, shopBells(file));
  return (
    <article className="tw-planit-strip-card mt-1" data-planit-strip>
      <p className="tw-fill-label font-semibold uppercase tracking-wider text-muted">This week · {course}</p>
      <ol className="tw-planit-strip mt-2">
        {days.map((d) => (
          <li
            key={d.date}
            className={cn("tw-planit-day", d.live ? "tw-planit-day-live" : "", d.set ? "" : "opacity-50")}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gold">{d.dow}</p>
            <p className="tw-planit-day-title mt-0.5 font-display font-semibold leading-snug">{d.title || "—"}</p>
          </li>
        ))}
      </ol>
    </article>
  );
}
