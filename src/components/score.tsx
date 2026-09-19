import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, Minus, Pencil, Star, Undo2, Users } from "lucide-react";
import type { DayCode, EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay, scoreDate as nearestScoreDate, stepSchoolDay, todayIso } from "@/lib/calendar";
import { deskBellId, isSubDay, loadFocus, markOn, setCrewMark } from "@/lib/store";
import { periodNow } from "@/lib/bells";
import { cn } from "@/lib/utils";
import { crewDone, crewsOf, type CrewRow } from "@/lib/crews";
import { crewEffortMark, isEffortMark, type EffortMark } from "@/lib/score-pad";

function FatMark({
  code,
  on,
  fat,
  onClick,
}: {
  code: EffortMark;
  on: boolean;
  fat?: boolean;
  onClick: () => void;
}) {
  const Icon = code === "3" ? Star : code === "2" ? Check : Minus;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Crew mark ${code}`}
      data-score-mark={code}
      data-score-on={on ? "1" : "0"}
      onClick={onClick}
      className={cn(
        "tw-tap tw-chamfer relative flex min-h-11 items-center justify-center gap-1 font-display font-semibold",
        fat ? "min-h-[9rem] flex-1 text-6xl sm:text-7xl" : "h-full min-h-11 text-2xl sm:text-3xl",
        on ? "bg-accent text-accent-fg tw-live" : "bg-elevated text-fg",
      )}
    >
      <Icon className={cn("shrink-0", fat ? "size-8 sm:size-10" : "size-4 sm:size-5")} strokeWidth={on ? 2.6 : 2} aria-hidden />
      <span className="font-mono tabular-nums">{code}</span>
    </button>
  );
}

function CrewGlyph({ crew }: { crew: CrewRow }) {
  return (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-xl bg-elevated font-display text-lg font-semibold"
      style={crew.color ? { color: crew.color, boxShadow: `inset 0 0 0 1px ${crew.color}` } : undefined}
      aria-hidden
    >
      {crew.icon || crew.name.slice(0, 1)}
    </span>
  );
}

export function ScoreDesk({
  file,
  onChange,
  unlocked: _unlocked,
  onNeedPin: _onNeedPin,
  onOpenId: _onOpenId,
  jumpPeriod,
  jumpCrew,
  jumpDate,
  onOpenSettings,
  mode = "teacher",
  panel = "score",
  startPad: _startPad = "effort",
  onRankUp: _onRankUp,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  unlocked: boolean;
  onNeedPin: () => void;
  onOpenId: (id: string) => void;
  jumpPeriod?: number | null;
  jumpCrew?: string | null;
  jumpDate?: string | null;
  onOpenSettings: () => void;
  mode?: "teacher" | "crew";
  panel?: "score" | "schedule" | "config";
  startPad?: "effort" | "skill";
  onRankUp?: (alias: string, band: string) => void;
}) {
  const bells = shopBells(file);
  const crewMode = mode === "crew";
  const [date, setDate] = useState(() => nearestScoreDate());
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const periodCrews = crewsOf(file, period, date);
  const [crewKey, setCrewKey] = useState(jumpCrew || periodCrews[0]?.key || "Crew A");
  const undoRef = useRef<EconomyFile | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const bellsId = deskBellId(file, date);
  const livePeriod = periodNow(bellsId);
  const sub = isSubDay(file, date);

  useEffect(() => {
    if (panel === "config") onOpenSettings();
  }, [panel]);

  useEffect(() => {
    if (jumpPeriod && bells.some((b) => b.period === jumpPeriod)) {
      setPeriod(jumpPeriod);
      if (jumpDate) setDate(jumpDate);
      const crews = crewsOf(file, jumpPeriod, jumpDate || date);
      const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, jumpDate || date)) || crews[0];
      if (next) setCrewKey(next.key);
      return;
    }
    const live = periodNow(bellsId);
    if (live && bells.some((b) => b.period === live)) {
      setPeriod(live);
      const crews = crewsOf(file, live, date);
      const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, date)) || crews[0];
      setCrewKey(next?.key ?? "Crew A");
      return;
    }
    const focus = loadFocus();
    if (!focus) return;
    if (bells.some((b) => b.period === focus.period)) {
      setPeriod(focus.period);
      setCrewKey(jumpCrew || focus.crewKey);
    }
  }, [jumpPeriod, jumpCrew, jumpDate]);

  useEffect(() => {
    if (crewMode) setDate(todayIso());
  }, [crewMode]);

  useEffect(() => {
    if (!crewMode) return;
    if (livePeriod && livePeriod !== 6) {
      setPeriod(livePeriod);
    }
  }, [crewMode, livePeriod]);

  useEffect(() => {
    if (jumpCrew) setCrewKey(jumpCrew);
  }, [jumpCrew]);

  const visibleCrews = crewMode ? periodCrews.filter((c) => c.key === (jumpCrew || crewKey)) : periodCrews;
  const liveTech = livePeriod != null && livePeriod !== 6 && period === livePeriod;

  function pickPeriod(p: number) {
    if (crewMode && p !== livePeriod) return;
    setPeriod(p);
    const crews = crewsOf(file, p, date);
    const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews.find((c) => !crewDone(c.kids, date)) || crews[0];
    setCrewKey(next?.key ?? "Crew A");
  }

  function commit(next: EconomyFile) {
    undoRef.current = file;
    setCanUndo(true);
    onChange(next);
  }

  function undoLast() {
    if (!undoRef.current) return;
    onChange(undoRef.current);
    undoRef.current = null;
    setCanUndo(false);
  }

  function tapCrew(row: CrewRow, code: EffortMark) {
    if (sub) return;
    const cur = crewEffortMark(row.kids.map((s) => markOn(s, date)));
    const next = cur === code ? ("" as DayCode) : code;
    commit(setCrewMark(file, period, row.key, date, next));
  }

  const n = visibleCrews.length;
  const twoCol = !crewMode && n > 6;

  const pad = (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-hidden", crewMode ? "bg-bg p-2" : "")}
      data-score-pad={crewMode ? "crew" : "teacher"}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          Score <span className="text-muted">·</span> 40s
        </h1>
        {crewMode ? (
          <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Lock className="size-3.5" aria-hidden />
            crew lead · PIN locked · period P{period}
          </p>
        ) : (
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous school day" className="inline-flex size-9 items-center justify-center rounded-lg bg-surface text-fg" onClick={() => setDate(stepSchoolDay(date, -1))}>
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold">{formatSchoolDate(date)}</span>
            <button type="button" aria-label="Next school day" className="inline-flex size-9 items-center justify-center rounded-lg bg-surface text-fg" onClick={() => setDate(stepSchoolDay(date, 1))}>
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      <div data-periods className="flex shrink-0 flex-wrap gap-1">
        {(crewMode ? bells.filter((b) => b.period === period) : bells).map((b) => {
          const crews = crewsOf(file, b.period, date);
          const done = crews.filter((c) => crewDone(c.kids, date)).length;
          const live = livePeriod === b.period;
          const on = period === b.period;
          return (
            <button
              key={b.period}
              type="button"
              onClick={() => pickPeriod(b.period)}
              aria-pressed={on}
              className={cn(
                "tw-tap inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold",
                on ? "bg-accent text-accent-fg" : live ? "bg-surface text-fg ring-1 ring-gain/60" : "bg-surface text-muted",
              )}
              title={`${done}/${crews.length} crews scored`}
            >
              {on ? <Check className="size-4" strokeWidth={2.4} aria-hidden /> : null}
              P{b.period}
            </button>
          );
        })}
      </div>

      {sub ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-surface p-8 text-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-work-pto">Sub day</p>
            <p className="mt-2 font-display text-3xl font-semibold">No scores today</p>
          </div>
        </div>
      ) : crewMode && !liveTech ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-surface p-6 text-center">
          <p className="text-xl font-semibold">
            {livePeriod === 6 ? "Study hall · Tech crews after." : livePeriod ? `P${livePeriod} only. Wait for your class.` : "Between classes. Lock when done."}
          </p>
        </div>
      ) : !visibleCrews.length ? (
        <p className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted">No crews this period.</p>
      ) : crewMode ? (
        <LeadPad crew={visibleCrews[0]!} date={date} onTap={(code) => tapCrew(visibleCrews[0]!, code)} />
      ) : (
        <div
          data-score-crews
          className={cn("grid min-h-0 flex-1 gap-1.5 overflow-hidden", twoCol ? "grid-cols-2" : "grid-cols-1")}
          style={{ gridTemplateRows: `repeat(${twoCol ? Math.ceil(n / 2) : n}, minmax(2.75rem, 1fr))` }}
        >
          {visibleCrews.map((c) => {
            const mark = crewEffortMark(c.kids.map((s) => markOn(s, date)));
            return (
              <div key={c.key} data-score-crew={c.key} className="tw-gadget grid min-h-11 grid-cols-[minmax(7rem,0.85fr)_repeat(3,minmax(2.75rem,1fr))] items-stretch gap-1 overflow-hidden p-1">
                <div className="flex min-w-0 items-center gap-2 px-1">
                  <CrewGlyph crew={c} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold leading-tight sm:text-xl">{c.name}</p>
                    {isEffortMark(mark) ? <p className="font-mono text-[11px] text-muted">{mark}</p> : null}
                  </div>
                </div>
                {(["3", "2", "1"] as const).map((code) => (
                  <FatMark key={code} code={code} on={mark === code} onClick={() => tapCrew(c, code)} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 pb-[env(safe-area-inset-bottom)] text-[11px] font-semibold uppercase tracking-wide text-muted">
        {crewMode ? (
          <>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden /> Your crew only
            </span>
            <span className="inline-flex items-center gap-1">
              <Pencil className="size-3.5" aria-hidden /> mark = score
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3.5" aria-hidden /> behind PIN
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <Pencil className="size-3.5" aria-hidden /> Mark = crew score
            </span>
            <span>mark ≠ wallet</span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden /> Present only
            </span>
            <span>≥44px Chromebook</span>
            {n >= 6 ? <span className="ml-auto">6 crews one screen</span> : null}
            <button type="button" disabled={!canUndo} onClick={undoLast} className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg bg-elevated px-3 text-xs font-semibold text-fg disabled:opacity-40">
              <Undo2 className="size-3.5" />
              Undo
            </button>
          </>
        )}
      </div>
    </div>
  );

  return pad;
}

function LeadPad({
  crew,
  date,
  onTap,
}: {
  crew: CrewRow;
  date: string;
  onTap: (code: EffortMark) => void;
}) {
  const mark = crewEffortMark(crew.kids.map((s) => markOn(s, date)));
  const school = isSchoolDay(date);
  return (
    <section data-score-crews data-score-crew={crew.key} className="tw-gadget flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex items-center gap-3">
        <CrewGlyph crew={crew} />
        <div className="min-w-0">
          <p className="font-display text-3xl font-semibold tracking-tight">{crew.name}</p>
          <p className="text-sm text-muted">Crew · TechWorks{school ? "" : " · not a school day"}</p>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
        {(["3", "2", "1"] as const).map((code) => (
          <FatMark key={code} code={code} fat on={mark === code} onClick={() => onTap(code)} />
        ))}
      </div>
    </section>
  );
}
