import { calendarMeta, formatSchoolDate, quarterNow, sessions, spanProgress, todayIso, yearProgress } from "@/lib/calendar";
import { MARKING } from "@/data/solvay-2026-27";
import { money, score, type EconomyFile } from "@/lib/economy";
import { skillXp } from "@/lib/skills";
import { endSession } from "@/lib/store";
import { QuarterChip } from "@/components/quarter-chip";
import { cn } from "@/lib/utils";
import { featureOn } from "@/lib/features";
import { BertyPeek } from "@/components/berty";
import { MarkChip } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";

export function YearBoard({
  file,
  onChange,
  onWeek,
  onData,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onWeek?: () => void;
  onData?: () => void;
}) {
  const today = todayIso();
  const blocks = sessions();
  const archive = file.meta.sessions ?? [];
  const live = score(file).filter((s) => s.period !== 6);
  const liveXp = live.reduce((n, s) => n + skillXp(file, s.id), 0);
  const liveCash = live.reduce((n, s) => n + s.quarter, 0);
  const yearCash = archive.reduce((n, a) => n + a.cash, 0) + liveCash;
  const yearXp = archive.reduce((n, a) => n + (a.xp ?? 0), 0) + liveXp;
  const yr = yearProgress(today);
  const q = quarterNow(today);
  const liveBlock = blocks.find((b) => b.label === file.meta.quarterName) ?? blocks[0];
  const liveSpan = liveBlock ? spanProgress(liveBlock.start, liveBlock.end, today) : { done: 0, total: 0 };
  const maxCash = Math.max(1, ...archive.map((a) => a.cash), liveCash);
  const maxXp = Math.max(1, ...archive.map((a) => a.xp ?? 0), liveXp);

  function close() {
    const ok = window.confirm(
      `Archive ${file.meta.quarterName}: ${money(liveCash)} and ${liveXp} XP for ${live.length} workers? Names stay. Tech kids leave. Study hall is year-long.`,
    );
    if (!ok) return;
    onChange(endSession(file));
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      {featureOn(file, "berty") ? <BertyPeek className="absolute bottom-1 right-2" /> : null}
      <header className="rounded-xl bg-surface px-3 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <QuarterChip />
              <p className="text-sm text-muted">
                {calendarMeta.district} · {calendarMeta.year}
              </p>
            </div>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
              <span className="font-mono text-gold">{yearXp} XP</span>
              <span className="ml-3 font-mono text-2xl text-muted">{money(yearCash)}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              Year = closed sessions + live {file.meta.quarterName}. Not one kid’s career. Study hall stays.
            </p>
          </div>
          <p className="text-sm text-subtle">
            {formatSchoolDate(calendarMeta.first)} → {formatSchoolDate(calendarMeta.last)} · Q{q.n}
          </p>
        </div>
        {onWeek || onData ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {onWeek ? (
              <MarkChip mark={markOf("week")} title="Week" onClick={onWeek}>
                Week
              </MarkChip>
            ) : null}
            {onData ? (
              <MarkChip mark={markOf("data")} title="Data" onClick={onData}>
                Data
              </MarkChip>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-subtle">
            <span>Year · school days</span>
            <span>
              {yr.done}/{yr.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-fg" style={{ width: `${yr.total ? Math.round((yr.done / yr.total) * 100) : 0}%` }} />
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {blocks.map((b) => {
          const closed = archive.find((a) => a.label === b.label);
          const isLive = file.meta.quarterName === b.label;
          const span = spanProgress(b.start, b.end, today);
          const cash = closed?.cash ?? (isLive ? liveCash : 0);
          const xp = closed?.xp ?? (isLive ? liveXp : 0);
          const head = closed?.headcount ?? (isLive ? live.length : 0);
          return (
            <article key={b.label} className={cn("rounded-xl bg-surface p-4", isLive ? "ring-1 ring-fg" : "")}>
              <p className="text-sm font-medium uppercase tracking-wider text-subtle">
                {b.label}
                {isLive ? " · live" : closed ? " · closed" : " · next"}
              </p>
              <p className="mt-1 font-mono text-sm text-muted">
                {formatSchoolDate(b.start)} → {formatSchoolDate(b.end)}
              </p>
              <p className="text-sm text-subtle">
                {b.weeks.length} weeks · {span.total} school days
                {isLive ? ` · ${Math.max(0, span.total - span.done)} left` : ""}
              </p>
              <p className="mt-3 font-display text-2xl font-semibold tabular-nums text-gold">{xp ? `${xp} XP` : "—"}</p>
              <p className="font-mono text-sm text-muted">{closed || isLive ? money(cash) : "—"}</p>
              <div className="mt-2 space-y-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full bg-gold" style={{ width: `${Math.round((xp / maxXp) * 100)}%` }} />
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div className="h-full bg-fg" style={{ width: `${Math.round((cash / maxCash) * 100)}%` }} />
                </div>
              </div>
              {head ? <p className="mt-2 text-sm text-subtle">{head} workers</p> : null}
            </article>
          );
        })}
      </div>

      <section className="rounded-xl bg-surface p-4">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Marking (grade at full quarter only)</p>
        <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {MARKING.map((m) => {
            const done = today > m.end;
            const now = today <= m.end && (MARKING.find((x) => today <= x.end)?.id === m.id);
            return (
              <li key={m.id} className={cn("rounded-md px-2 py-2", now ? "bg-elevated" : "")}>
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
                  {m.label}
                  {m.grade ? " · grade" : " · check"}
                </p>
                <p className="font-mono text-sm">{formatSchoolDate(m.end)}</p>
                <p className="text-xs text-muted">{done ? "passed" : now ? "current" : "ahead"}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {liveBlock ? (
        <p className="text-sm text-muted">
          Live session {liveBlock.label}: {liveSpan.done}/{liveSpan.total} days · {live.length} on the roster · {liveXp} XP · {money(liveCash)} perks
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pb-2">
        <button type="button" onClick={close} className="min-h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg">
          End session · archive year
        </button>
        <p className="text-sm text-muted">Archives XP and $. Then you drop the next Tech roster.</p>
      </div>
    </div>
  );
}
