import { memo, useMemo } from "react";
import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatBell, leftClock, periodClock, periodNext, periodNow } from "@/lib/bells";
import { abOn, deskBellId } from "@/lib/store";
import { FeatureCards } from "@/components/feature-cards";
import { PollWall } from "@/components/polls";
import { SpecialBanner } from "@/components/special-banner";
import { cycleDayLabel, daySlot, isSchoolDay, quarterNow, todayIso } from "@/lib/calendar";
import { currentCycleOf } from "@/lib/roles";
import { crewsOf } from "@/lib/crews";
import { applySort, byCombo } from "@/lib/rank";
import { jobCardOf } from "@/lib/projects";
import { JobCard } from "@/components/job-card";
import { useShopClock } from "@/lib/use-clock";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/progress-ring";
import { BertyPeek } from "@/components/berty";
import { showBerty, bertyPose } from "@/lib/berty";
import { featureOn } from "@/lib/features";

const CREW_EDGE = [
  "var(--color-period-1)",
  "var(--color-period-2)",
  "var(--color-period-3)",
  "var(--color-period-4)",
  "var(--color-period-5)",
] as const;

function mark(rankBoard: "skill" | "perk", s: { xp: number; quarter: number }) {
  return rankBoard === "perk" ? `$${Math.round(s.quarter)}` : `${s.xp}`;
}

export const PhoneFeed = memo(function PhoneFeed({
  file,
  list,
  rankBoard,
  onRankBoard,
  onOpenId,
  onPeriod,
  unlocked,
  onHelp,
  onPrints,
  onOpenMod,
}: {
  file: EconomyFile;
  list: ScoredStudent[];
  rankBoard: "skill" | "perk";
  onRankBoard: (next: "skill" | "perk") => void;
  onOpenId: (id: string) => void;
  onPeriod: (period: number) => void;
  unlocked: boolean;
  onHelp?: () => void;
  onPrints?: () => void;
  onOpenMod?: (id: string) => void;
}) {
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "beat");
  const today = todayIso();
  const cycle = currentCycleOf(file);
  const slot = daySlot(today);
  const q = quarterNow(today);
  const letter = abOn(file, today);
  const shop = useMemo(() => shopBells(file).map((b) => b.period), [file]);
  const live = periodNow(bellsId, now);
  const nxt = periodNext(bellsId, now);
  const shown =
    live != null && shop.includes(live)
      ? live
      : nxt && shop.includes(nxt.period)
        ? nxt.period
        : (shop[0] ?? 1);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const crews = crewsOf(file, shown, today);
  const ranked = useMemo(
    () => applySort(byCombo(file, list.filter((s) => s.period !== 6)), rankBoard === "perk" ? "wallet" : "level"),
    [file, list, rankBoard],
  );
  const byId = useMemo(() => new Map(ranked.map((s) => [s.id, s])), [ranked]);
  const job = jobCardOf(file, shown);
  const left = clock?.live ? leftClock(clock.left).label : null;
  const pct = clock?.live ? clock.pct : 0;
  const passing = isSchoolDay(today) && !clock?.live && Boolean(nxt);
  const bertyOn = showBerty(featureOn(file, "berty"), { cleanup: Boolean(clock?.cleanup), passing });

  return (
    <div className="phone-feed flex min-h-[12rem] flex-1 flex-col gap-2.5 overflow-auto pb-3">
      <SpecialBanner file={file} date={today} now={now} compact />
      <FeatureCards file={file} unlocked={unlocked} period={shown} onOpen={onOpenMod} compact />
      <PollWall file={file} period={shown} />
      <section
        className={cn(
          "tw-gadget tw-hud px-3 py-3",
          clock?.cleanup ? "bg-cleanup text-accent-fg" : "text-fg",
          clock?.live && !clock.cleanup ? "tw-live" : "",
        )}
      >
        <div className="flex items-center gap-3">
          {clock?.live ? (
            <ProgressRing
              pct={Math.max(4, Math.min(100, pct))}
              label={clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}m`}
              tone={clock.cleanup ? "warn" : "accent"}
              size="md"
              live
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-display text-3xl font-bold leading-none tracking-tight">
              {clock?.live ? `P${live}` : nxt ? `P${nxt.period}` : "Done"}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums">
              {clock?.cleanup ? "Cleanup" : left ?? (nxt ? formatBell(nxt.start) : "—")}
            </p>
          </div>
          {bertyOn ? <BertyPeek pose={bertyPose({ live: Boolean(clock?.live), cleanup: Boolean(clock?.cleanup), passing })} /> : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-elevated px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
            {letter} day
          </span>
          <span className="rounded-full bg-elevated px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
            {cycleDayLabel(slot.label, cycle) || `Cycle ${cycle}`}
          </span>
          <span className="rounded-full bg-elevated px-2.5 py-1 text-xs font-bold uppercase tracking-wide">{q.label}</span>
          {onHelp ? (
            <button type="button" onClick={onHelp} className="tw-tap rounded-full bg-elevated px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
              Help
            </button>
          ) : null}
          {onPrints ? (
            <button type="button" onClick={onPrints} className="tw-tap rounded-full bg-elevated px-2.5 py-1 text-xs font-bold uppercase tracking-wide">
              Prints
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onRankBoard(rankBoard === "skill" ? "perk" : "skill")}
            className="tw-tap ml-auto min-h-9 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg"
          >
            {rankBoard === "skill" ? "XP" : "$"}
          </button>
        </div>
      </section>

      <section className="phone-goal tw-gadget tw-hud rounded-xl px-3 py-3">
        <JobCard job={job} period={shown} compact />
      </section>

      {crews.length ? (
      <section>
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Crews</p>
          {unlocked ? (
            <button type="button" onClick={() => onPeriod(shown)} className="text-xs font-bold uppercase tracking-wide text-accent">
              Score
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {crews.map((crew, i) => {
            const rows = crew.kids
              .map((k) => byId.get(k.id))
              .filter(Boolean)
              .sort((a, b) => (rankBoard === "perk" ? b!.quarter - a!.quarter : b!.xp - a!.xp));
            const lead = rows[0];
            return (
              <article
                key={crew.key}
                className="rounded-xl border-l-4 bg-surface px-2.5 py-2"
                style={{ borderLeftColor: CREW_EDGE[i % CREW_EDGE.length] }}
              >
                <button
                  type="button"
                  onClick={unlocked ? () => onPeriod(shown) : undefined}
                  className="tw-tap mb-1 block w-full text-left font-display text-lg font-bold tracking-tight text-fg"
                >
                  {crew.name}
                </button>
                <ul>
                  {rows.length ? (
                    rows.map((s) => (
                      <li key={s!.id}>
                        <button
                          type="button"
                          onClick={() => onOpenId(s!.id)}
                          className={cn(
                            "tw-tap flex w-full min-h-9 items-center gap-1 text-left",
                            lead?.id === s!.id ? "font-bold" : "font-medium",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm text-fg">{s!.first}</span>
                          <span className="shrink-0 font-mono text-sm tabular-nums text-accent">{mark(rankBoard, s!)}</span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="py-1 text-sm text-muted">—</li>
                  )}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
      ) : null}

      {ranked.some((s) => s.xp > 0 || s.quarter > 0) ? (
      <section className="rounded-xl bg-surface px-3 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">School · {rankBoard === "skill" ? "XP" : "$"}</p>
        <ol className="mt-1">
          {ranked.slice(0, 5).map((s, n) => (
            <li key={s.id}>
              <button type="button" onClick={() => onOpenId(s.id)} className="tw-tap flex w-full min-h-11 items-center gap-2.5 text-left">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full font-mono text-sm font-bold",
                    n === 0 ? "bg-gold text-bg" : n < 3 ? "bg-elevated text-accent" : "bg-elevated text-muted",
                  )}
                >
                  {n + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-base font-semibold text-fg">{s.first}</span>
                <span className="font-mono text-base font-bold tabular-nums text-accent">{mark(rankBoard, s)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      ) : null}
    </div>
  );
});
