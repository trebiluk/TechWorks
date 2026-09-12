import { useMemo, useState } from "react";
import { Crown } from "lucide-react";
import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { money, periodTitle, shopBells } from "@/lib/economy";
import { isSubDay } from "@/lib/store";
import { cycleProgress, todayIso, weekOn } from "@/lib/calendar";
import { QuarterChip } from "@/components/quarter-chip";
import { applySort, decorateRank, type RankedStudent, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { periodPaceLine, prettyStage } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { featureOn } from "@/lib/features";
import { Berty, BertyPeek } from "@/components/berty";
import { periodNow } from "@/lib/bells";
import { weekRace, type ClassRace, type CrewRace, type TodayJob } from "@/lib/week-race";
import { MarkChip } from "@/components/ui";
import { ProgressRing } from "@/components/progress-ring";
import { markOf } from "@/lib/nav-marks";

const OPT_KEY = "techworks-week-opts-v1";

type WeekOpts = {
  view: "race" | "classes" | "roster";
  codes: boolean;
  xp: boolean;
  pay: boolean;
  effort: boolean;
  phase: boolean;
};

const DEFAULT_OPTS: WeekOpts = {
  view: "race",
  codes: true,
  xp: true,
  pay: true,
  effort: false,
  phase: true,
};

function loadOpts(): WeekOpts {
  try {
    return { ...DEFAULT_OPTS, ...(JSON.parse(window.localStorage.getItem(OPT_KEY) || "{}") as Partial<WeekOpts>) };
  } catch {
    return DEFAULT_OPTS;
  }
}

function Opt({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", on ? "bg-gold text-bg" : "bg-elevated text-muted")}
    >
      {label}
    </button>
  );
}

function chaseLine(row: { hold: boolean; gapPct: number; possible: number }) {
  if (row.possible <= 0) return "Today";
  if (row.hold) return "Hold this";
  if (row.gapPct <= 0) return "Tied";
  const n = Math.max(1, Math.round(row.gapPct));
  return n === 1 ? "1 back" : `${n} back`;
}

export function WeekBoard({
  file,
  list,
  bells,
  cycle,
  onPeriod,
  onYear,
  onData,
}: {
  file: EconomyFile;
  list: ScoredStudent[];
  bells: { period: number; grade: number }[];
  cycle: number;
  onPeriod?: (period: number) => void;
  onYear?: () => void;
  onData?: () => void;
}) {
  const today = todayIso();
  const days = weekOn(today)?.days ?? [];
  const [sort, setSort] = useState<SortKey>("combo");
  const [opts, setOpts] = useState<WeekOpts>(loadOpts);
  const ranked = applySort(decorateRank(file, list.filter((s) => s.period !== 6)), sort);
  const shown = shopBells(file);
  const cyc = cycleProgress(today);
  const cycleXp = ranked.reduce((n, s) => n + s.xp, 0);
  const cycleCash = ranked.reduce((n, s) => n + s.quarter, 0);
  const maxXp = Math.max(1, ...shown.map((b) => ranked.filter((s) => s.period === b.period).reduce((n, s) => n + s.xp, 0)));
  const maxCash = Math.max(1, ...shown.map((b) => ranked.filter((s) => s.period === b.period).reduce((n, s) => n + s.quarter, 0)));
  const race = useMemo(() => weekRace(file, today), [file, today]);
  const live = periodNow();
  const berty = featureOn(file, "berty");

  function set<K extends keyof WeekOpts>(key: K, value: WeekOpts[K]) {
    setOpts((o) => {
      const next = { ...o, [key]: value };
      try {
        window.localStorage.setItem(OPT_KEY, JSON.stringify(next));
      } catch {
        /* */
      }
      return next;
    });
  }

  function codesOf(s: RankedStudent) {
    return (s.days ?? ["", "", "", ""]).slice(0, 4).map((code, di) => (days[di] && isSubDay(file, days[di]) ? "SUB" : code || (days[di] && days[di] <= today ? "·" : "")));
  }

  function KidRow({ s }: { s: RankedStudent }) {
    return (
      <tr className="border-t border-border">
        <td className="px-3 py-1.5 font-medium">{s.first}</td>
        <td className="py-1.5 text-sm text-muted">{s.crewName}</td>
        {opts.xp ? <td className="py-1.5 text-right font-mono text-sm tabular-nums text-gold">{s.xp}</td> : null}
        {opts.codes
          ? codesOf(s).map((code, di) => (
              <td key={di} className="px-1 py-1.5 text-center font-mono text-xs">
                {code}
              </td>
            ))
          : null}
        {opts.effort ? <td className="py-1.5 text-right font-mono text-xs tabular-nums text-muted">{s.effortPct != null ? `${s.effortPct}%` : "—"}</td> : null}
        {opts.pay ? <td className="px-3 py-1.5 text-right font-mono tabular-nums">{money(s.quarter)}</td> : null}
      </tr>
    );
  }

  function KidHead() {
    return (
      <thead className="text-subtle">
        <tr>
          <th className="px-3 py-1 text-left font-medium">
            <button type="button" onClick={() => setSort("name")} className={cn("underline-offset-4", sort === "name" ? "text-gold underline" : "")}>
              First
            </button>
          </th>
          <th className="py-1 text-left font-medium">
            <button type="button" onClick={() => setSort("crew")} className={cn("underline-offset-4", sort === "crew" ? "text-gold underline" : "")}>
              Crew
            </button>
          </th>
          {opts.xp ? (
            <th className="py-1 text-right font-medium">
              <button type="button" onClick={() => setSort("level")} className={cn(sort === "level" ? "text-gold underline" : "")}>
                XP
              </button>
            </th>
          ) : null}
          {opts.codes
            ? ["1", "2", "3", "4"].map((d) => (
                <th key={d} className="px-1 py-1 text-center font-medium">
                  {d}
                </th>
              ))
            : null}
          {opts.effort ? <th className="py-1 text-right font-medium">Effort</th> : null}
          {opts.pay ? (
            <th className="px-3 py-1 text-right font-medium">
              <button type="button" onClick={() => setSort("wallet")} className={cn(sort === "wallet" ? "text-gold underline" : "")}>
                $
              </button>
            </th>
          ) : null}
        </tr>
      </thead>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain">
      {berty ? <BertyPeek className="absolute bottom-1 right-2" /> : null}
      <header className="rounded-xl bg-surface px-3 py-2.5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <QuarterChip />
              <p className="text-sm text-muted">
                Cycle {cycle} · as of {race.asOfLabel}
              </p>
            </div>
            <p className="mt-0.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {race.shop.possible > 0 ? (
                <>
                  <span className="font-mono text-gold">{Math.round(race.shop.pct)}%</span>
                  <span className="ml-3 font-mono text-lg text-muted sm:text-2xl">
                    {race.shop.earned}/{race.shop.possible} · {race.shop.n3} threes
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono text-gold">{cycleXp} XP</span>
                  <span className="ml-3 font-mono text-lg text-muted sm:text-2xl">{money(cycleCash)}</span>
                </>
              )}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {race.shop.possible > 0
                ? "As of yesterday · today still in play"
                : "Score today. Tomorrow this wall crowns a lead."}
            </p>
          </div>
          {onYear || onData ? (
            <div className="flex flex-wrap items-center gap-1">
              {onYear ? (
                <MarkChip mark={markOf("year")} title="Year" onClick={onYear}>
                  Year
                </MarkChip>
              ) : null}
              {onData ? (
                <MarkChip mark={markOf("data")} title="Data" onClick={onData}>
                  Data
                </MarkChip>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-subtle">
            <span>Cycle · school days</span>
            <span>
              {cyc.done}/{cyc.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-fg" style={{ width: `${cyc.total ? Math.round((cyc.done / cyc.total) * 100) : 0}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Opt on={opts.view === "race"} label="Race" onClick={() => set("view", "race")} />
        <Opt on={opts.view === "classes"} label="Classes" onClick={() => set("view", "classes")} />
        <Opt on={opts.view === "roster"} label="Roster" onClick={() => set("view", "roster")} />
        {opts.view !== "race" ? (
          <>
            <span className="text-subtle">·</span>
            <Opt on={opts.codes} label="Codes" onClick={() => set("codes", !opts.codes)} />
            <Opt on={opts.xp} label="XP" onClick={() => set("xp", !opts.xp)} />
            <Opt on={opts.pay} label="$" onClick={() => set("pay", !opts.pay)} />
            <Opt on={opts.effort} label="Effort" onClick={() => set("effort", !opts.effort)} />
            <Opt on={opts.phase} label="Phase" onClick={() => set("phase", !opts.phase)} />
            <SortBar value={sort} onChange={setSort} keys={["combo", "level", "wallet", "crew", "name"]} />
          </>
        ) : null}
      </div>

      {opts.view === "race" ? (
        <RacePane race={race} berty={berty} live={live} onPeriod={onPeriod} />
      ) : opts.view === "classes" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((b) => {
            const kids = ranked.filter((s) => s.period === b.period);
            const xp = kids.reduce((n, s) => n + s.xp, 0);
            const cash = kids.reduce((n, s) => n + s.quarter, 0);
            const effort = kids.length ? Math.round(kids.reduce((n, s) => n + (s.effortPct ?? 0), 0) / kids.length) : 0;
            const pace = opts.phase ? periodPaceLine(file, b.period) : null;
            return (
              <article key={b.period} className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-surface p-3">
                <button type="button" onClick={() => onPeriod?.(b.period)} className="text-left">
                  <p className="text-sm font-medium uppercase tracking-wider text-subtle">{periodTitle(b.period, bells)}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-gold">{xp ? `${xp} XP` : "—"}</p>
                  <p className="font-mono text-sm text-muted">{money(cash)}</p>
                </button>
                <div className="mt-2 space-y-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full bg-gold" style={{ width: `${Math.round((xp / maxXp) * 100)}%` }} />
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full bg-fg" style={{ width: `${Math.round((cash / maxCash) * 100)}%` }} />
                  </div>
                </div>
                <p className="mt-2 text-sm text-subtle">
                  {kids.length} workers{effort ? ` · ${effort}% effort` : ""}
                </p>
                {pace ? (
                  <p className={cn("mt-1 text-sm", pace.behind.length ? "text-loss" : "text-muted")}>
                    {prettyStage(pace.goal)}
                    {pace.behind.length ? ` · ${pace.behind.map((c) => c.name).join(", ")} behind` : " · on pace"}
                  </p>
                ) : null}
                <table className="mt-2 w-full text-left text-sm">
                  <KidHead />
                  <tbody>
                    {kids.map((s) => (
                      <KidRow key={s.id} s={s} />
                    ))}
                  </tbody>
                </table>
              </article>
            );
          })}
        </div>
      ) : (
        <article className="min-h-0 flex-1 overflow-auto rounded-xl bg-surface p-4">
          <table className="w-full text-left text-sm">
            <thead className="text-subtle">
              <tr>
                <th className="px-3 py-1 font-medium">P</th>
                <th className="px-3 py-1 font-medium">First</th>
                <th className="py-1 font-medium">Crew</th>
                {opts.xp ? <th className="py-1 text-right font-medium">XP</th> : null}
                {opts.codes
                  ? ["1", "2", "3", "4"].map((d) => (
                      <th key={d} className="px-1 py-1 text-center font-medium">
                        {d}
                      </th>
                    ))
                  : null}
                {opts.effort ? <th className="py-1 text-right font-medium">Effort</th> : null}
                {opts.pay ? <th className="px-3 py-1 text-right font-medium">$</th> : null}
              </tr>
            </thead>
            <tbody>
              {ranked.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-1.5 font-mono text-xs text-subtle">P{s.period}</td>
                  <td className="px-3 py-1.5 font-medium">{s.first}</td>
                  <td className="py-1.5 text-sm text-muted">{s.crewName}</td>
                  {opts.xp ? <td className="py-1.5 text-right font-mono text-sm tabular-nums text-gold">{s.xp}</td> : null}
                  {opts.codes
                    ? codesOf(s).map((code, di) => (
                        <td key={di} className="px-1 py-1.5 text-center font-mono text-xs">
                          {code}
                        </td>
                      ))
                    : null}
                  {opts.effort ? <td className="py-1.5 text-right font-mono text-xs tabular-nums text-muted">{s.effortPct != null ? `${s.effortPct}%` : "—"}</td> : null}
                  {opts.pay ? <td className="px-3 py-1.5 text-right font-mono tabular-nums">{money(s.quarter)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      )}
      {opts.view === "race" && race.shop.possible > 0 ? <TodayStrip jobs={race.jobs} live={live} onPeriod={onPeriod} /> : null}
    </div>
  );
}

function TodayStrip({
  jobs,
  live,
  onPeriod,
}: {
  jobs: TodayJob[];
  live: number | null;
  onPeriod?: (period: number) => void;
}) {
  if (!jobs.length) return null;
  return (
    <section className="tw-gadget p-2">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">Today · project · activity · assignment</p>
      <div className="mt-1 flex gap-1 overflow-x-auto pb-1">
        {jobs.map((j) => {
          const on = live === j.period;
          return (
            <button
              key={j.period}
              type="button"
              onClick={() => onPeriod?.(j.period)}
              className={cn(
                "tw-tap min-h-11 min-w-[10rem] flex-1 rounded-lg px-3 py-2 text-left",
                on ? "bg-gold text-bg" : "bg-elevated",
              )}
            >
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", on ? "opacity-80" : "text-subtle")}>
                {j.title}
                {on ? " · now" : ""}
              </p>
              <p className="mt-0.5 truncate font-display text-sm font-semibold leading-tight">{j.project}</p>
              <p className={cn("truncate text-xs", on ? "opacity-80" : "text-muted")}>
                {j.activity} · look for a {j.expect}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RacePane({
  race,
  berty,
  live,
  onPeriod,
}: {
  race: ReturnType<typeof weekRace>;
  berty: boolean;
  live: number | null;
  onPeriod?: (period: number) => void;
}) {
  const racing = race.shop.possible > 0;
  if (!racing) {
    return <StartingGrid jobs={race.jobs} live={live} onPeriod={onPeriod} />;
  }
  const leadClasses = race.classes.filter((c) => c.hold);
  const chaseClasses = race.classes.filter((c) => !c.hold);
  const leadCrews = race.crews.filter((c) => c.hold);
  const chaseCrews = race.crews.filter((c) => !c.hold);
  return (
    <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-2">
      <section className="flex min-h-0 flex-col gap-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">Classes · hold the lead</p>
        {leadClasses.length === 1 ? (
          <ClassLead row={leadClasses[0]!} berty={berty} onPeriod={onPeriod} />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {leadClasses.map((c) => (
              <ClassCard key={c.period} row={c} onPeriod={onPeriod} />
            ))}
          </div>
        )}
        <ChaseList
          empty="Every class is on the crown. Keep it."
          rows={chaseClasses}
          onPeriod={onPeriod}
          kind="class"
        />
      </section>
      <section className="flex min-h-0 flex-col gap-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">Crews · keep the crown</p>
        {leadCrews.length === 1 ? (
          <CrewLead row={leadCrews[0]!} berty={berty} onPeriod={onPeriod} />
        ) : leadCrews.length ? (
          <div className="grid gap-2">
            {leadCrews.map((c, i) => (
              <CrewLead key={`${c.period}|${c.key}`} row={c} berty={berty && i === 0} onPeriod={onPeriod} compact />
            ))}
          </div>
        ) : (
          <p className="tw-gadget p-3 text-sm text-muted">Crews lock in after yesterday’s 3 / 2 / 1. First crew to the top owns the wall.</p>
        )}
        <ChaseList
          empty={race.crews.length ? "Every crew is on the crown. Keep it." : "Add crews, then score. The wall will crown them."}
          rows={chaseCrews}
          onPeriod={onPeriod}
          kind="crew"
        />
      </section>
    </div>
  );
}

function StartingGrid({ jobs, live, onPeriod }: { jobs: TodayJob[]; live: number | null; onPeriod?: (period: number) => void }) {
  return (
    <section className="flex min-h-0 flex-col gap-2">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-subtle">Today’s heat · score today, lock tomorrow</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((j) => {
          const on = live === j.period;
          return (
            <button
              key={j.period}
              type="button"
              onClick={() => onPeriod?.(j.period)}
              className={cn("tw-tap min-h-11 rounded-xl p-3 text-left", on ? "bg-gold text-bg" : "bg-surface")}
            >
              <p className={cn("flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider", on ? "opacity-80" : "text-subtle")}>
                <span>{j.title}{on ? " · now" : ""}</span>
              </p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight">{j.project}</p>
              <p className={cn("text-sm", on ? "opacity-90" : "text-muted")}>{j.activity}</p>
              <p className={cn("mt-1 truncate text-xs", on ? "opacity-80" : "text-subtle")}>{j.assignment}</p>
              <p className={cn("text-xs font-semibold", on ? "opacity-90" : "text-gold")}>Look for a {j.expect}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ClassLead({
  row,
  berty,
  onPeriod,
}: {
  row: ClassRace;
  berty: boolean;
  onPeriod?: (period: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPeriod?.(row.period)}
      className="tw-tap relative overflow-hidden rounded-xl bg-gold p-4 text-left text-bg"
    >
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider opacity-90">
        <Crown className="size-4" aria-hidden /> #1 class · hold the lead
      </p>
      <div className="mt-2 flex items-end gap-3">
        <div className="min-w-0 flex-1">
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{row.name}</p>
      <p className="font-mono text-4xl font-semibold tabular-nums leading-none sm:text-5xl">{Math.round(row.pct)}%</p>
        </div>
        <ProgressRing pct={row.pct} label={`${Math.round(row.pct)}%`} sub="#1" tone="gold" size="lg" live />
      </div>
      <p className="mt-2 text-sm opacity-90">
        {row.project} · {row.activity}
      </p>
      <p className="text-xs opacity-80">
        {row.assignment} · look for a {row.expect}
      </p>
      <p className="mt-2 font-mono text-sm tabular-nums opacity-80">
        {row.earned}/{row.possible} earned · {row.n3} threes · {row.nKids} workers
      </p>
      {berty ? <Berty pose="celebrate" size="md" className="pointer-events-none absolute -bottom-1 right-1 opacity-90" /> : null}
    </button>
  );
}

function ClassCard({ row, onPeriod }: { row: ClassRace; onPeriod?: (period: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPeriod?.(row.period)}
      className="tw-tap rounded-xl bg-gold p-3 text-left text-bg"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider opacity-90">#1 class · hold the lead</p>
        <Crown className="size-5" aria-hidden />
      </div>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight">{row.name}</p>
      <p className="font-mono text-3xl font-semibold tabular-nums leading-none">{Math.round(row.pct)}%</p>
      <p className="mt-1 truncate text-sm opacity-90">
        {row.project} · {row.activity}
      </p>
    </button>
  );
}

function CrewLead({
  row,
  berty,
  onPeriod,
  compact,
}: {
  row: CrewRace;
  berty: boolean;
  onPeriod?: (period: number) => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPeriod?.(row.period)}
      className={cn("tw-tap relative overflow-hidden rounded-xl bg-gold text-left text-bg", compact ? "p-3" : "p-4")}
    >
      <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider opacity-90">
        <Crown className="size-4" aria-hidden /> #1 crew · keep the crown
      </p>
      <div className="mt-1 flex items-end gap-3">
        <div className="min-w-0 flex-1">
      <p className={cn("mt-1 font-display font-semibold tracking-tight", compact ? "text-2xl" : "text-3xl")}>{row.name}</p>
      <p className={cn("font-mono font-semibold tabular-nums leading-none", compact ? "text-3xl" : "text-4xl")}>{Math.round(row.pct)}%</p>
        </div>
        <ProgressRing pct={row.pct} label={`${Math.round(row.pct)}%`} sub="#1" tone="gold" size={compact ? "md" : "lg"} live />
      </div>
      <p className="mt-1 text-sm opacity-90">
        P{row.period} · {row.project} · {row.activity}
      </p>
      <p className="text-xs opacity-80">
        {row.earned}/{row.possible} earned · {row.nKids} workers · look for a 3
      </p>
      {berty && !compact ? <Berty pose="celebrate" size="md" className="pointer-events-none absolute -bottom-1 right-2 opacity-90" /> : null}
    </button>
  );
}

function ChaseList({
  rows,
  kind,
  empty,
  onPeriod,
}: {
  rows: Array<ClassRace | CrewRace>;
  kind: "class" | "crew";
  empty: string;
  onPeriod?: (period: number) => void;
}) {
  if (!rows.length) {
    return <p className="tw-gadget px-3 py-3 text-sm text-muted">{empty}</p>;
  }
  return (
    <ul className="tw-gadget divide-y divide-border/40 p-1">
      {rows.slice(0, 12).map((c) => {
        const key = kind === "crew" ? `${(c as CrewRace).period}|${(c as CrewRace).key}` : String((c as ClassRace).period);
        const sub =
          kind === "crew"
            ? `P${(c as CrewRace).period} · ${(c as CrewRace).activity}`
            : `${c.project} · ${c.activity}`;
        return (
          <li key={key}>
            <button type="button" onClick={() => onPeriod?.(c.period)} className="tw-tap flex min-h-11 w-full items-center gap-2 rounded-md px-2 py-2 text-left">
              <RankMark n={c.rank} hold={c.hold} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{c.name}</span>
                <span className="block truncate text-xs text-muted">{sub}</span>
              </span>
              <span className="w-20 shrink-0">
                <i className="block h-1.5 overflow-hidden rounded-full bg-elevated">
                  <i className="block h-full bg-gold" style={{ width: `${Math.min(100, c.pct)}%` }} />
                </i>
                <span className="mt-0.5 block text-right text-[10px] font-semibold uppercase tracking-wider text-subtle">{chaseLine(c)}</span>
              </span>
              <span className="w-12 text-right font-mono text-sm font-semibold tabular-nums text-gold">{c.pct ? `${Math.round(c.pct)}%` : "—"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RankMark({ n, hold }: { n: number; hold: boolean }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
        hold ? "bg-gold text-bg" : n <= 3 ? "bg-elevated text-fg" : "bg-elevated text-muted",
      )}
    >
      {n}
    </span>
  );
}
