import { useState } from "react";
import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { money, periodTitle, shopBells } from "@/lib/economy";
import { isSubDay } from "@/lib/store";
import { cycleProgress, formatSchoolDate, todayIso, weekOn } from "@/lib/calendar";
import { QuarterChip } from "@/components/quarter-chip";
import { applySort, decorateRank, type RankedStudent, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { periodPaceLine, prettyStage } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { featureOn } from "@/lib/features";
import { BertyPeek } from "@/components/berty";

const OPT_KEY = "techworks-week-opts-v1";

type WeekOpts = {
  view: "classes" | "roster";
  codes: boolean;
  xp: boolean;
  pay: boolean;
  effort: boolean;
  phase: boolean;
};

const DEFAULT_OPTS: WeekOpts = {
  view: "classes",
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

export function WeekBoard({
  file,
  list,
  bells,
  cycle,
  onPeriod,
}: {
  file: EconomyFile;
  list: ScoredStudent[];
  bells: { period: number; grade: number }[];
  cycle: number;
  onPeriod?: (period: number) => void;
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
      {featureOn(file, "berty") ? <BertyPeek className="absolute bottom-1 right-2" /> : null}
      <header className="rounded-xl bg-surface px-3 py-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <QuarterChip />
              <p className="text-sm text-muted">
                Cycle {cycle} · six classes
              </p>
            </div>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight">
              <span className="font-mono text-gold">{cycleXp} XP</span>
              <span className="ml-3 font-mono text-2xl text-muted">{money(cycleCash)}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {days[0] ? formatSchoolDate(days[0]) : "—"} → {days[3] ? formatSchoolDate(days[3]) : "—"} · cycle days 1–4
            </p>
          </div>
          <p className="text-sm text-subtle">
            {cyc.done}/{cyc.total} cycle days
          </p>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-subtle">
            <span>Cycle · school days</span>
            <span>
              {cyc.done}/{cyc.total}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-fg" style={{ width: `${cyc.total ? Math.round((cyc.done / cyc.total) * 100) : 0}%` }} />
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Opt on={opts.view === "classes"} label="Classes" onClick={() => set("view", "classes")} />
        <Opt on={opts.view === "roster"} label="Roster" onClick={() => set("view", "roster")} />
        <span className="text-subtle">·</span>
        <Opt on={opts.codes} label="Codes" onClick={() => set("codes", !opts.codes)} />
        <Opt on={opts.xp} label="XP" onClick={() => set("xp", !opts.xp)} />
        <Opt on={opts.pay} label="$" onClick={() => set("pay", !opts.pay)} />
        <Opt on={opts.effort} label="Effort" onClick={() => set("effort", !opts.effort)} />
        <Opt on={opts.phase} label="Phase" onClick={() => set("phase", !opts.phase)} />
        <SortBar value={sort} onChange={setSort} keys={["combo", "level", "wallet", "crew", "name"]} />
      </div>

      {opts.view === "classes" ? (
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
    </div>
  );
}
