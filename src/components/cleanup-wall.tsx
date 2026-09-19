import { useEffect, useState, type ReactNode } from "react";
import { cleanupMinsNow, formatBell, leftClock, periodClock, periodNext, periodNow } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import type { EconomyFile } from "@/lib/economy";
import { CLEANUP_CATCH_MAX, CLEANUP_CASH, cleanupCatchOn, grantCleanupCatch, liveCleanupCrew } from "@/lib/cleanup";
import { cleanupJobsOf, setCleanupJobs } from "@/lib/hour-flow";
import { DraftField } from "@/components/draft-field";
import { Berty } from "@/components/berty";
import { isPhone } from "@/lib/layout";
import { cn } from "@/lib/utils";
import { agendaFor, prettyStage } from "@/lib/projects";
import { packOf, teachObjective } from "@/lib/teach";

export function CleanupStage({
  file,
  unlocked,
  onChange,
  off,
  cover = true,
  children,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  off?: boolean;
  /** Full coral wall. Off on Teach / Score so the desk still works. */
  cover?: boolean;
  children: ReactNode;
}) {
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "beat");
  const live = periodNow(bellsId, now);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const force = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("cleanup") === "1";
  const hot = Boolean(!off && ((live != null && clock?.live && clock.cleanup) || force));
  const [desk, setDesk] = useState(false);
  useEffect(() => {
    setDesk(false);
  }, [live, hot]);
  if (hot && !desk && cover) {
    return <CleanupWall file={file} unlocked={unlocked} live={live ?? 7} onChange={onChange} onDesk={() => setDesk(true)} />;
  }
  return children;
}

/** Compact job lists for Teach. Extra tidy catch stays here — not on the student wall. */
export function CleanupJobsPad({
  file,
  unlocked,
  onChange,
  hall,
  period,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  hall?: boolean;
  period?: number;
}) {
  const jobs = cleanupJobsOf(file);
  const [edit, setEdit] = useState(false);
  const writing = Boolean(unlocked && edit);
  return (
    <section className="tw-gadget tw-cleanup-mini shrink-0 bg-cleanup p-3 text-accent-fg" data-cleanup-pad>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-[11px] font-bold uppercase tracking-[0.18em]">Cleanup jobs · this hour</p>
        {unlocked ? (
          <button
            type="button"
            onClick={() => setEdit((v) => !v)}
            className="tw-tap min-h-9 rounded-md bg-black/35 px-3 text-[11px] font-semibold uppercase tracking-widest"
          >
            {edit ? "Done jobs" : "Edit jobs"}
          </button>
        ) : null}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {hall ? (
          <JobCard title="Hall tidy" jobs={jobs.hall} editing={writing} onSave={(lines) => onChange(setCleanupJobs(file, { hall: lines }))} />
        ) : (
          <>
            <JobCard title="Workshop" kicker="Still in the shop" jobs={jobs.shop} editing={writing} onSave={(lines) => onChange(setCleanupJobs(file, { shop: lines }))} />
            <JobCard title="Classroom" kicker="Waiting in the room" jobs={jobs.room} editing={writing} onSave={(lines) => onChange(setCleanupJobs(file, { room: lines }))} />
          </>
        )}
      </div>
      {unlocked ? <ExtraTidyCatch file={file} period={period} extra={jobs.extra} writing={writing} onChange={onChange} /> : null}
    </section>
  );
}

function ExtraTidyCatch({
  file,
  period,
  extra,
  writing,
  onChange,
}: {
  file: EconomyFile;
  period?: number;
  extra: string;
  writing: boolean;
  onChange: (next: EconomyFile) => void;
}) {
  const today = todayIso();
  const kids = period != null ? liveCleanupCrew(file, period) : [];
  return (
    <div className="mt-2 rounded-lg bg-black/25 p-2" data-extra-tidy>
      <p className="text-[11px] font-bold uppercase tracking-widest">
        Extra tidy · +${CLEANUP_CASH} · not XP · teacher catch
      </p>
      {writing ? (
        <DraftField
          value={extra}
          editing
          onCommit={(v) => onChange(setCleanupJobs(file, { extra: v }))}
          placeholder="Extra tidy line"
          className="mt-2 min-h-10 w-full rounded-lg bg-black/25 px-2 text-sm font-semibold"
        />
      ) : (
        <p className="mt-1 text-sm font-semibold opacity-90">{extra}</p>
      )}
      {kids.length ? (
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
      ) : null}
    </div>
  );
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
  const clock =
    periodClock(live, bellsId, now) ??
    ({ start: "12:00", end: "12:40", live: true, pct: 82, left: 1.53, cleanup: true } as const);
  const jobs = cleanupJobsOf(file);
  const [editJobs, setEditJobs] = useState(false);
  const tick = leftClock(clock.left);
  const hall = live === 6;
  const agenda = agendaFor(file, live);
  const obj = teachObjective(file, today, live);
  const pack = packOf(file, today, live);
  const nxt = periodNext(bellsId, now);
  const lead = Math.max(1, cleanupMinsNow());
  const leftPct = Math.max(0, Math.min(100, (clock.left / lead) * 100));
  const urgent = clock.left < 1;
  const phase = prettyStage(agenda.goal) || agenda.activityName || pack.label;
  const sub = [agenda.title, phase, obj].filter((x, i, a) => Boolean(x) && a.indexOf(x) === i).join(" · ");

  return (
    <section
      className={cn(
        "tw-cleanup flex flex-col overflow-hidden bg-cleanup text-accent-fg",
        phone
          ? "fixed inset-0 z-[80] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
          : "min-h-0 flex-1 rounded-xl px-5 py-3",
      )}
      data-cleanup-wall
      data-urgent={urgent ? "1" : undefined}
      role="dialog"
      aria-label="Cleanup"
    >
      <header className={cn("tw-cleanup-hero flex shrink-0 items-end", phone ? "gap-2" : "gap-4")}>
        <Berty pose="point" size={phone ? "lg" : "xl"} alert />
        <div className="min-w-0 flex-1">
          <p className="tw-cleanup-kicker font-black uppercase tracking-[0.18em]">
            Clean up now · P{live}
            {nxt ? ` · next P${nxt.period} ${formatBell(nxt.start)}` : " · last bell"}
          </p>
          <p
            className={cn(
              "tw-cleanup-clock font-display font-black tabular-nums tracking-tight",
              urgent ? "tw-blink" : "",
            )}
          >
            {tick.label}
          </p>
          <div className="tw-cleanup-drain tw-led" aria-hidden>
            <span style={{ width: `${leftPct}%` }} />
          </div>
          <p className="tw-cleanup-sub mt-1 font-bold uppercase tracking-widest">Left</p>
          {sub ? <p className="tw-cleanup-sub mt-0.5 truncate opacity-90">{sub}</p> : null}
        </div>
        {unlocked ? (
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => setEditJobs((v) => !v)}
              className="tw-tap min-h-10 rounded-md bg-black/40 px-3 text-xs font-semibold uppercase tracking-widest"
            >
              {editJobs ? "Done jobs" : "Edit jobs"}
            </button>
            <button type="button" onClick={onDesk} className="tw-tap min-h-10 rounded-md bg-black/40 px-3 text-xs font-semibold uppercase tracking-widest">
              Desk
            </button>
          </div>
        ) : null}
      </header>

      <div className="tw-cleanup-cards" data-stack={phone || hall ? "1" : undefined}>
        {hall ? (
          <JobCard title="Hall tidy" jobs={jobs.hall} editing={editJobs} onSave={(lines) => onChange(setCleanupJobs(file, { hall: lines }))} />
        ) : (
          <>
            <JobCard title="Workshop" kicker="Still in the shop" jobs={jobs.shop} editing={editJobs} onSave={(lines) => onChange(setCleanupJobs(file, { shop: lines }))} />
            <JobCard title="Classroom" kicker="Waiting in the room" jobs={jobs.room} editing={editJobs} onSave={(lines) => onChange(setCleanupJobs(file, { room: lines }))} />
          </>
        )}
      </div>
    </section>
  );
}

function JobCard({
  title,
  kicker,
  jobs,
  editing,
  onSave,
}: {
  title: string;
  kicker?: string;
  jobs: string[];
  editing?: boolean;
  onSave?: (lines: string[]) => void;
}) {
  const rows = editing ? (jobs.length < 5 ? [...jobs, ...Array(5 - jobs.length).fill("")] : jobs).slice(0, 8) : jobs;
  return (
    <div className="tw-cleanup-card">
      {kicker ? <p className="tw-cleanup-tag">{kicker}</p> : null}
      <h2>{title}</h2>
      <ol>
        {rows.map((j, i) => (
          <li key={`${title}-${i}`}>
            <span>{i + 1}</span>
            {editing && onSave ? (
              <DraftField
                value={j}
                editing
                onCommit={(v) => {
                  const next = [...rows];
                  next[i] = v;
                  onSave(next);
                }}
                placeholder="A cleanup job"
                className="min-h-9 min-w-0 flex-1 rounded-lg bg-black/25 px-2 text-sm font-semibold"
              />
            ) : (
              <span>{j}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
