import { useEffect, useState, type ReactNode } from "react";
import { formatBell, leftClock, periodClock, periodNext, periodNow } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import type { EconomyFile } from "@/lib/economy";
import { CLASS_JOBS, CLEANUP_CATCH_MAX, CLEANUP_CASH, HALL_JOBS, WORKSHOP_JOBS, cleanupCatchOn, grantCleanupCatch, liveCleanupCrew } from "@/lib/cleanup";
import { Berty } from "@/components/berty";
import { isPhone } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { agendaFor, prettyStage } from "@/lib/projects";
import { packOf, teachObjective } from "@/lib/teach";
import { ProgressRing } from "@/components/progress-ring";

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
  const phone = isPhone();
  const clock = periodClock(live, bellsId, now);
  if (!clock) return null;
  const tick = leftClock(clock.left);
  const hall = live === 6;
  const kids = liveCleanupCrew(file, live);
  const agenda = agendaFor(file, live);
  const obj = teachObjective(file, today, live);
  const pack = packOf(file, today, live);
  const nxt = periodNext(bellsId, now);
  const pct = Math.max(0, Math.min(100, clock.pct));
  const phase = prettyStage(agenda.goal) || agenda.activityName || pack.label;
  const sub = [agenda.title, phase, obj].filter((x, i, a) => Boolean(x) && a.indexOf(x) === i).join(" · ");

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
      <div className={cn("flex shrink-0 items-end gap-3", phone ? "gap-2" : "gap-5")}>
        <Berty pose="point" size={phone ? "lg" : "xl"} alert />
        <div className="min-w-0 flex-1">
          <p className={cn("font-black uppercase tracking-[0.18em]", phone ? "text-sm" : "text-xl")}>
            Clean up now · P{live}
            {nxt ? ` · next P${nxt.period} ${formatBell(nxt.start)}` : " · last bell"}
          </p>
          <p
            className={cn(
              "font-display font-semibold tabular-nums leading-none tracking-tight",
              phone ? "text-6xl" : "text-[clamp(5.5rem,16vmin,10rem)]",
              clock.left < 60 ? "tw-blink" : "",
            )}
          >
            {tick.label}
          </p>
          <p className={cn("mt-1 font-bold uppercase tracking-widest", phone ? "text-sm" : "text-2xl")}>
            Left · cleanup score is live
          </p>
          {sub ? <p className={cn("mt-1 truncate opacity-90", phone ? "text-sm" : "text-xl")}>{sub}</p> : null}
        </div>
        <ProgressRing pct={pct} label={tick.label} sub="left" tone="warn" size="lg" live />
      </div>

      <div className={cn("mt-4 min-h-0 flex-1 gap-3", phone || hall ? "flex flex-col overflow-auto" : "grid min-h-0 grid-cols-2")}>
        {hall ? (
          <JobCard title="Hall tidy" jobs={HALL_JOBS} phone={phone} />
        ) : (
          <>
            <JobCard title="Workshop" kicker="Still in the shop" jobs={WORKSHOP_JOBS} phone={phone} />
            <JobCard title="Classroom" kicker="Waiting in the room" jobs={CLASS_JOBS} phone={phone} />
          </>
        )}
      </div>

      <footer className="mt-3 shrink-0 rounded-xl bg-black/30 px-3 py-3">
        <div className="flex items-center gap-2">
          <p className={cn("min-w-0 flex-1 font-black uppercase tracking-widest", phone ? "text-xs" : "text-base")}>
            Extra tidy · +${CLEANUP_CASH} cash · not XP · go get caught
          </p>
          {unlocked ? (
            <button type="button" onClick={onDesk} className="tw-tap min-h-10 shrink-0 rounded-md bg-black/40 px-3 text-xs font-semibold uppercase tracking-widest">
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
                    maxed ? "bg-black/50 opacity-70" : "bg-black/35",
                  )}
                >
                  {s.first}
                  {n ? <span className="ml-1 font-mono text-[11px]">${n * CLEANUP_CASH}</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className={cn("mt-1 font-semibold", phone ? "text-sm" : "text-lg")}>Go extra. Teacher pays cash when they catch you cleaning.</p>
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
    <div className={cn("flex min-h-0 flex-1 flex-col rounded-xl bg-black/20 px-4 py-4", className)}>
      {kicker ? <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-80">{kicker}</p> : null}
      <h2 className={cn("font-display font-semibold leading-none", phone ? "text-3xl" : "text-6xl")}>{title}</h2>
      <ol className={cn("mt-3 min-h-0 flex-1", phone ? "space-y-2" : "space-y-4")}>
        {jobs.map((j, i) => (
          <li key={j} className={cn("flex gap-3 font-semibold", phone ? "text-xl leading-snug" : "text-4xl leading-snug")}>
            <span className={cn("shrink-0 font-mono opacity-80", phone ? "w-6 text-base" : "w-10 text-3xl")}>{i + 1}</span>
            <span>{j}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
