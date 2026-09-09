import { useEffect, useState, type ReactNode } from "react";
import { formatBell, leftClock, periodClock, periodNext, periodNow } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import type { EconomyFile } from "@/lib/economy";
import { periodTitle } from "@/lib/economy";
import { CLASS_JOBS, CLEANUP_CATCH_MAX, CLEANUP_CASH, HALL_JOBS, WORKSHOP_JOBS, cleanupCatchOn, grantCleanupCatch, liveCleanupCrew } from "@/lib/cleanup";
import { Berty } from "@/components/berty";
import { isPhone, useLayout } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { agendaFor, prettyStage } from "@/lib/projects";
import { packOf, teachObjective } from "@/lib/teach";
import { crewsOf } from "@/lib/crews";
import { ProgressRing } from "@/components/progress-ring";
import { PeriodRewardChip } from "@/components/reward-bar";
import { shopBells } from "@/lib/economy";

export function CleanupStage({
  file,
  unlocked,
  onChange,
  off,
  children,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  off?: boolean;
  children: ReactNode;
}) {
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "beat");
  const live = periodNow(bellsId, now);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const hot = Boolean(!off && live != null && clock?.live && clock.cleanup);
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    setDesk(false);
  }, [live, hot]);
  if (hot && !desk) {
    return <CleanupWall file={file} unlocked={unlocked} live={live!} onChange={onChange} onDesk={() => setDesk(true)} />;
  }
  return children;
}

function CleanupWall({
  file,
  unlocked,
  live,
  onChange,
  onDesk,
}: {
  file: EconomyFile;
  unlocked: boolean;
  live: number;
  onChange: (next: EconomyFile) => void;
  onDesk: () => void;
}) {
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "fine");
  const today = todayIso();
  const layout = useLayout();
  const phone = layout === "mobile" || isPhone();
  const clock = periodClock(live, bellsId, now);
  if (!clock) return null;
  const tick = leftClock(clock.left);
  const hall = live === 6;
  const kids = liveCleanupCrew(file, live);
  const agenda = agendaFor(file, live);
  const obj = teachObjective(file, today, live);
  const pack = packOf(file, today, live);
  const crews = crewsOf(file, live, today);
  const nxt = periodNext(bellsId, now);
  const bells = shopBells(file);
  const title = periodTitle(live, bells);
  const phase = prettyStage(agenda.goal) || agenda.activityName || pack.label;
  const pct = Math.max(0, Math.min(100, clock.pct));

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden bg-cleanup text-accent-fg",
        phone
          ? "fixed inset-0 z-[80] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
          : "min-h-0 flex-1 rounded-xl px-5 py-4",
      )}
      role="dialog"
      aria-label="Cleanup"
    >
      <header className={cn("flex shrink-0 items-center gap-3", phone ? "gap-2" : "")}>
        <Berty pose="point" size={phone ? "sm" : "md"} alert />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]">
            Cleanup · P{live} {title ? `· ${title}` : ""}
          </p>
          <h1 className={cn("font-display font-semibold leading-none tracking-tight", phone ? "text-3xl" : "text-5xl")}>
            {hall ? "Hall tidy" : "Jobs now"}
          </h1>
          <p className={cn("mt-1 truncate", phone ? "text-sm" : "text-lg")}>
            <span className="font-semibold">{agenda.title || pack.label}</span>
            <span className="opacity-80"> · {phase}</span>
            {obj ? <span className="opacity-80"> · {obj}</span> : null}
          </p>
        </div>
        <ProgressRing pct={pct} label={tick.label} sub="left" tone="warn" size="md" live />
      </header>

      <div className={cn("mt-3 min-h-0 flex-1 gap-3 overflow-auto", phone || hall ? "flex flex-col" : "grid grid-cols-12")}>
        {hall ? (
          <JobCard title="Study hall" jobs={HALL_JOBS} phone={phone} className="col-span-7" />
        ) : (
          <>
            <JobCard title="Workshop" kicker="Still in the shop" jobs={WORKSHOP_JOBS} phone={phone} className="col-span-4" />
            <JobCard title="Classroom" kicker="Waiting in the room" jobs={CLASS_JOBS} phone={phone} className="col-span-4" />
          </>
        )}
        <div className={cn("flex min-h-0 flex-col gap-2", hall ? "col-span-5" : "col-span-4")}>
          <div className="rounded-xl bg-black/20 px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">This class</p>
            <p className="font-display text-2xl font-semibold leading-none">{agenda.title || "Class work"}</p>
            <p className="mt-1 text-sm opacity-90">{phase}</p>
            {obj ? <p className="mt-2 text-sm">{obj}</p> : null}
            <div className="mt-2">
              <PeriodRewardChip file={file} period={live} />
            </div>
            {nxt ? (
              <p className="mt-2 text-sm opacity-90">
                Next · P{nxt.period} {formatBell(nxt.start)}
              </p>
            ) : (
              <p className="mt-2 text-sm opacity-90">Last bell · sit with your crew</p>
            )}
          </div>
          {crews.length ? (
            <div className="min-h-0 flex-1 overflow-auto rounded-xl bg-black/20 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Crews · {kids.length} workers</p>
              <ul className="mt-1 space-y-1">
                {crews.map((c) => (
                  <li key={c.key} className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">{c.name}</span>
                    <span className="truncate opacity-80">{c.kids.map((k) => k.first).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <footer className="mt-2 shrink-0 rounded-xl bg-black/25 px-2 py-2">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-widest">
            Extra tidy · +${CLEANUP_CASH} cash · not XP
          </p>
          {unlocked ? (
            <button type="button" onClick={onDesk} className="tw-tap min-h-10 shrink-0 rounded-md bg-black/30 px-3 text-xs font-semibold uppercase tracking-widest">
              Desk
            </button>
          ) : null}
        </div>
        {unlocked ? (
          <div className="-mx-1 mt-2 flex flex-wrap gap-1 pb-1">
            {kids.map((s) => {
              const n = cleanupCatchOn(s, today);
              const maxed = n >= CLEANUP_CATCH_MAX;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={maxed}
                  onClick={() => !maxed && onChange(grantCleanupCatch(file, s.id, today))}
                  className={cn(
                    "tw-tap min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold",
                    maxed ? "bg-black/40 opacity-70" : "bg-black/30",
                  )}
                >
                  {s.first}
                  {n ? <span className="ml-1 font-mono text-[11px]">${n * CLEANUP_CASH}</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-1 text-sm opacity-90">Go extra. Teacher pays cash when they catch you.</p>
        )}
      </footer>
    </section>
  );
}

function JobCard({
  title,
  kicker,
  jobs,
  phone,
  className,
}: {
  title: string;
  kicker?: string;
  jobs: string[];
  phone?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl bg-black/20 px-3 py-3", className)}>
      {kicker ? <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">{kicker}</p> : null}
      <h2 className={cn("font-display font-semibold leading-none", phone ? "text-xl" : "text-3xl")}>{title}</h2>
      <ol className={cn("mt-2", phone ? "space-y-2" : "space-y-2")}>
        {jobs.map((j, i) => (
          <li key={j} className={cn("flex gap-2", phone ? "text-base leading-snug" : "text-xl leading-snug")}>
            <span className="w-6 shrink-0 font-mono text-sm opacity-70">{i + 1}</span>
            <span>{j}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
