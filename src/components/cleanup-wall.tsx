import { useEffect, useState, type ReactNode } from "react";
import { leftClock, periodClock, periodNow } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { todayIso } from "@/lib/calendar";
import type { EconomyFile } from "@/lib/economy";
import { CLASS_JOBS, CLEANUP_CATCH_MAX, CLEANUP_CASH, HALL_JOBS, WORKSHOP_JOBS, cleanupCatchOn, grantCleanupCatch, liveCleanupCrew } from "@/lib/cleanup";
import { Berty } from "@/components/berty";
import { cn } from "@/lib/utils";

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
  const now = useShopClock(file.meta.config?.schedule, "beat");
  const live = periodNow(file.meta.config?.schedule, now);
  const clock = live != null ? periodClock(live, file.meta.config?.schedule, now) : null;
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
  const now = useShopClock(file.meta.config?.schedule, "fine");
  const today = todayIso();
  const clock = periodClock(live, file.meta.config?.schedule, now);
  if (!clock) return null;
  const tick = leftClock(clock.left);
  const hall = live === 6;
  const kids = liveCleanupCrew(file, live);
  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-cleanup px-3 py-3 text-accent-fg sm:px-5 sm:py-4"
      role="dialog"
      aria-label="Cleanup"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]">Cleanup · P{live}</p>
          <h1 className="font-display text-3xl font-semibold leading-none tracking-tight sm:text-5xl">Jobs now</h1>
          <p className="mt-1 max-w-xl text-sm sm:text-base">
            {hall
              ? "Hall stays productive and peaceful. Tidy your space. Line ready."
              : "Workshop: finish your station. Classroom: tidy while you wait. Caught going extra = cash."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Berty pose="point" size="md" alert />
          <p className="font-display text-4xl font-semibold tabular-nums leading-none sm:text-6xl">{tick.label}</p>
        </div>
      </header>

      <div className={cn("mt-3 grid min-h-0 flex-1 gap-2", hall ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
        {hall ? (
          <JobCard title="Study hall" jobs={HALL_JOBS} />
        ) : (
          <>
            <JobCard title="Workshop" kicker="If you are still in the shop" jobs={WORKSHOP_JOBS} />
            <JobCard title="Classroom" kicker="If you are waiting" jobs={CLASS_JOBS} />
          </>
        )}
      </div>

      <footer className="mt-3 rounded-lg bg-black/20 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest">
            Caught cleaning extra · +${CLEANUP_CASH} · any space
          </p>
          {unlocked ? (
            <button type="button" onClick={onDesk} className="min-h-9 rounded-md bg-black/25 px-3 text-xs font-semibold uppercase tracking-widest">
              Desk
            </button>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {kids.map((s) => {
            const n = cleanupCatchOn(s, today);
            const maxed = n >= CLEANUP_CATCH_MAX;
            return (
              <button
                key={s.id}
                type="button"
                disabled={!unlocked || maxed}
                onClick={() => unlocked && !maxed && onChange(grantCleanupCatch(file, s.id, today))}
                className={cn(
                  "min-h-11 rounded-md px-2.5 text-sm font-semibold",
                  maxed ? "bg-black/40 text-accent-fg/80" : unlocked ? "bg-black/25 hover:bg-black/40" : "bg-black/20",
                )}
                title={unlocked ? (maxed ? "Max bonus today" : `+$${CLEANUP_CASH}`) : s.first}
              >
                {s.first}
                {n ? <span className="ml-1 font-mono text-[11px]">${n * CLEANUP_CASH}</span> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] opacity-80">
          {unlocked ? `Tap a name when you catch extra cleanup. +$${CLEANUP_CASH}, max ${CLEANUP_CATCH_MAX} today. Wallet only — not XP.` : "Go extra. Teacher pays cash when they catch you helping any space."}
        </p>
      </footer>
    </section>
  );
}

function JobCard({ title, kicker, jobs }: { title: string; kicker?: string; jobs: string[] }) {
  return (
    <div className="flex min-h-0 flex-col rounded-lg bg-black/20 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{kicker ?? "Do this"}</p>
      <h2 className="font-display text-2xl font-semibold leading-none sm:text-3xl">{title}</h2>
      <ol className="mt-2 min-h-0 flex-1 space-y-1 overflow-auto text-sm sm:text-base">
        {jobs.map((j, i) => (
          <li key={j} className="flex gap-2">
            <span className="font-mono text-xs opacity-70">{i + 1}</span>
            <span>{j}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
