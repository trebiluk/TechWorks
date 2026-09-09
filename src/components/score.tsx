import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Undo2, Users } from "lucide-react";
import { PeriodRewardChip } from "@/components/reward-bar";
import { BertyCueBot } from "@/components/berty";
import type { DayCode, EconomyFile } from "@/lib/economy";
import { dayPay, money, shopBells } from "@/lib/economy";
import { cycleDayLabel, cycleProgress, daySlot, formatSchoolDate, isSchoolDay, quarterNow, quarterProgress, scoreDate as nearestScoreDate, stepSchoolDay, todayIso, yearProgress } from "@/lib/calendar";
import {
  abOn,
  approveInvest,
  crewLeaderId,
  setCrewLeader,
  isSubDay,
  loadFocus,
  lunchOn,
  deskBellId,
  deskPacks,
  setDayBell,
  markOn,
  setAbDay,
  setCrewMark,
  setSchooltoolDone,
  setStudentCleanup,
  setStudentMark,
  setSubDay,
  setStudentAssist,
  studentAssist,
  attendOn,
  setStudentAttend,
  passOpen,
  bumpMoney,
  schooltoolDone,
  studentCleanup,
} from "@/lib/store";
import { attendLate, beep, bellForPeriod, formatBell, periodClock, periodNow, periodPast, ringBell, SCHOOLTOOL_URL } from "@/lib/bells";
import { WeatherChip } from "@/components/weather-chip";
import { DayFacts } from "@/components/day-facts";
import { cn } from "@/lib/utils";
import { useShopClock } from "@/lib/use-clock";
import { PollPad } from "@/components/polls";
import { crewDone, crewPulse, crewsOf } from "@/lib/crews";

const PERIOD_CLASS: Record<number, string> = {
  1: "bg-period-1",
  2: "bg-period-2",
  3: "bg-period-3",
  6: "bg-period-1",
  8: "bg-period-4",
  9: "bg-period-5",
  10: "bg-period-6",
};

function tone(code: string) {
  const c = String(code).toUpperCase();
  if (c === "H") return "bg-elevated text-gain";
  if (c === "L") return "bg-elevated text-fg";
  if (c === "3") return "bg-elevated text-gain";
  if (c === "2") return "bg-elevated text-fg";
  if (c === "1") return "bg-elevated text-muted";
  if (c === "A") return "bg-elevated text-subtle";
  if (c === "E") return "bg-elevated text-muted";
  if (c === "P") return "bg-elevated text-loss";
  if (c === "ASSIST") return "bg-work-pto text-accent-fg";
  return "bg-elevated text-subtle";
}

function PeriodMeter({
  clock,
  period,
  file,
}: {
  clock: NonNullable<ReturnType<typeof periodClock>>;
  period: number;
  file: EconomyFile;
}) {
  return (
    <div className={cn("grid gap-3 rounded-xl p-3 sm:grid-cols-2", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface")}>
      <div>
        <div className="mb-1 flex justify-between text-sm font-medium">
          <span>
            P{period} {formatBell(clock.start)}–{formatBell(clock.end)}
          </span>
          <span className="font-mono tabular-nums">
            {clock.live ? `${Math.max(0, Math.ceil(clock.left))} min left` : clock.pct >= 100 ? "ended" : "not yet"}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className={cn("h-full rounded-full", clock.cleanup ? "bg-accent-fg" : clock.pct >= 100 ? "bg-muted" : "bg-gain")}
            style={{ width: `${clock.live || clock.pct >= 100 ? clock.pct : 0}%` }}
          />
        </div>
        {clock.cleanup ? (
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
            <BertyCueBot on={false} cue={{ cleanup: true }} size="icon" />
            Cleanup
          </p>
        ) : null}
      </div>
      <PeriodRewardChip file={file} period={period} className="self-center" />
    </div>
  );
}


function MiniBar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total <= 0 ? 0 : Math.min(100, Math.round((done / total) * 100));
  return (
    <div className="min-w-28 flex-1">
      <div className="mb-1 flex justify-between text-sm text-muted">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-gain" : "bg-work-w")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ScoreDesk({
  file,
  onChange,
  unlocked,
  onNeedPin,
  onOpenId,
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
  const [crewKey, setCrewKey] = useState(periodCrews[0]?.key ?? "Crew A");
  const skipAdvance = useRef(false);
  const undoRef = useRef<EconomyFile | null>(null);
  const warnKey = useRef("");
  const [canUndo, setCanUndo] = useState(false);
  const bellsId = deskBellId(file, date);
  const now = useShopClock(bellsId, "beat");
  const livePeriod = periodNow(bellsId, now);
  const crewOverride = false;
  const [allCrewsDone, setAllCrewsDone] = useState(false);
  const [moreId, setMoreId] = useState<string | null>(null);
  const [daily, setDaily] = useState(() => {
    try {
      return window.localStorage.getItem("techworks-desk-daily") === "1";
    } catch {
      return false;
    }
  });
  const deskMode = "score";

  useEffect(() => {
    if (panel === "config") onOpenSettings();
  }, [panel]);

  useEffect(() => {
    if (jumpPeriod && bells.some((b) => b.period === jumpPeriod)) {
      setPeriod(jumpPeriod);
      if (jumpDate) setDate(jumpDate);
      const crews = crewsOf(file, jumpPeriod, jumpDate || date);
      const next =
        (jumpCrew && crews.find((c) => c.key === jumpCrew)) ||
        crews.find((c) => !crewDone(c.kids, jumpDate || date)) ||
        crews[0];
      if (next) setCrewKey(next.key);
      return;
    }
    const live = periodNow(bellsId);
    if (live && bells.some((b) => b.period === live)) {
      setPeriod(live);
      const next = crewsOf(file, live, date).find((c) => !crewDone(c.kids, date)) ?? crewsOf(file, live, date)[0];
      setCrewKey(next?.key ?? "Crew A");
      return;
    }
    const focus = loadFocus();
    if (!focus) return;
    if (bells.some((b) => b.period === focus.period)) {
      setPeriod(focus.period);
      setCrewKey(focus.crewKey);
    }
  }, [jumpPeriod, jumpCrew, jumpDate]);

  useEffect(() => {
    if (mode === "crew") setDate(todayIso());
  }, [mode]);

  useEffect(() => {
    if (!crewMode || crewOverride) return;
    if (livePeriod && livePeriod !== 6) {
      setPeriod(livePeriod);
      const next = crewsOf(file, livePeriod, date)[0];
      if (next) setCrewKey(next.key);
    }
  }, [crewMode, crewOverride, livePeriod]);

  const p1In = schooltoolDone(file, date, 1);
  const subDay = isSubDay(file, date);
  const sched = bellsId;
  useEffect(() => {
    const tick = () => {
      if (date !== todayIso() || subDay || !isSchoolDay(date)) return;
      if (!attendLate(1, sched)) return;
      if (!p1In) beep(true);
    };
    tick();
    const id = window.setInterval(tick, 12000);
    return () => window.clearInterval(id);
  }, [date, sched, p1In, subDay]);
  const slot = daySlot(date);
  const school = isSchoolDay(date);
  const today = todayIso();
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;

  const crew = periodCrews.find((c) => c.key === crewKey) ?? periodCrews[0] ?? null;
  const sub = isSubDay(file, date);
  const letter = abOn(file, date);
  const bell = bellForPeriod(period, bellsId);
  const clock = periodClock(period, bellsId, now);

  useEffect(() => {
    if (!clock?.cleanup) return;
    const key = `${period}-${clock.end}`;
    if (warnKey.current === key) return;
    warnKey.current = key;
    ringBell();
  }, [clock?.cleanup, clock?.end, period]);
  const leadId = crew ? crewLeaderId(file, period, crew.key) : "";
  const lead = crew?.kids.find((s) => s.id === leadId);
  const stDone = schooltoolDone(file, date, period);
  const p1Alarm =
    school &&
    !sub &&
    date === today &&
    period === 1 &&
    attendLate(1, bellsId) &&
    !schooltoolDone(file, date, 1);

  function pickPeriod(p: number) {
    if (crewMode && !crewOverride && p !== livePeriod) return;
    setPeriod(p);
    const crews = crewsOf(file, p, date);
    const next = crews.find((c) => !crewDone(c.kids, date)) ?? crews[0];
    setCrewKey(next?.key ?? "Crew A");
  }

  function goNextCrew() {
    const mine = crewsOf(file, period, date);
    const i = mine.findIndex((c) => c.key === (crew?.key ?? crewKey));
    const later = mine.slice(i + 1).find((c) => !crewDone(c.kids, date));
    if (later) {
      setCrewKey(later.key);
      setAllCrewsDone(false);
      return;
    }
    const earlier = mine.find((c) => !crewDone(c.kids, date));
    if (earlier) {
      setCrewKey(earlier.key);
      setAllCrewsDone(false);
      return;
    }
    setAllCrewsDone(true);
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

  function tap(id: string, code: DayCode) {
    if (sub) return;
    if (crewMode && code === "Assist") return;
    if (code === "Assist") return;
    const kid = file.students.find((s) => s.id === id);
    const cur = kid ? markOn(kid, date) : "";
    const nextCode = cur === code ? "" : code;
    const before = crew ? crewDone(crew.kids, date) : false;
    const next = setStudentMark(file, id, date, nextCode as DayCode);
    commit(next);
    const kids = next.students.filter((s) => s.period === period && s.crewKey === (crew?.key ?? crewKey));
    if (!before && crewDone(kids, date) && !skipAdvance.current) {
      window.setTimeout(() => goNextCrew(), 280);
    }
  }

  function tapCrew(code: DayCode) {
    if (sub) return;
    if (!crew) return;
    if (crewMode && code === "Assist") return;
    if (code === "Assist" && !unlocked) {
      onNeedPin();
      return;
    }
    commit(setCrewMark(file, period, crew.key, date, code));
    if (!skipAdvance.current) window.setTimeout(() => goNextCrew(), 280);
  }

  if (crewMode) {
    const kids = crew?.kids ?? [];
    const liveTech = livePeriod != null && livePeriod !== 6 && period === livePeriod;
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-crew p-1 text-fg">
        <p className="flex shrink-0 flex-wrap items-center gap-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          <BertyCueBot on cue={{ greeting: true, passing: !liveTech, cleanup: Boolean(clock?.cleanup) }} size="sm" />
          Hi, Team Leader {lead?.first ?? "friend"}
          <span className="ml-2 text-crew-hi">score your crew.</span>
        </p>
        {crew?.motto ? <p className="shrink-0 text-sm text-muted">{crew.icon ? `${crew.icon} ` : ""}{crew.motto}</p> : null}
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">3 · 2 · 1 or Absent / Excused / Personal → next crew. No wallet.</p>
        {clock && liveTech ? (
          <div className="shrink-0">
            <PeriodMeter clock={clock} period={period} file={file} />
          </div>
        ) : null}
        {sub ? (
          <p className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-crew-card p-6 text-center text-xl font-semibold">
            SUB day · no scores.
          </p>
        ) : !liveTech ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-crew-card p-6 text-center">
            <p className="text-xl font-semibold">
              {livePeriod === 6 ? "Study hall · Tech crews after." : livePeriod ? `P${livePeriod} only. Wait for your class.` : "Between classes. Lock when done."}
            </p>
            <button type="button" onClick={onOpenSettings} className="tw-tap min-h-11 rounded-full bg-crew px-4 text-sm font-semibold">
              Edit our crew
            </button>
          </div>
        ) : allCrewsDone ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-crew-card p-6 text-center">
            <p className="font-display text-2xl font-semibold">All crews scored</p>
            <p className="text-sm text-muted">Lock this pad. Your teacher verifies.</p>
            <div className="flex flex-wrap justify-center gap-1">
              {periodCrews.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setAllCrewsDone(false);
                    setCrewKey(c.key);
                  }}
                  className="tw-tap min-h-11 rounded-full bg-crew px-4 text-sm font-semibold"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap gap-1">
              {periodCrews.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setAllCrewsDone(false);
                    setCrewKey(c.key);
                  }}
                  className={cn(
                    "tw-tap min-h-11 rounded-full px-4 text-sm font-semibold",
                    crew?.key === c.key ? "bg-fg text-bg" : "bg-crew-card text-muted",
                  )}
                >
                  {c.icon ? <span className="mr-1">{c.icon}</span> : null}
                  {c.name}
                </button>
              ))}
            </div>
            <PollPad file={file} kids={kids} onChange={commit} />
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 overflow-hidden">
              {Array.from({ length: 4 }, (_, i) => kids[i] ?? null).map((s, i) =>
                s ? (
                  <div key={s.id} className="flex min-h-0 flex-col gap-1 overflow-hidden rounded-2xl bg-crew-card p-2">
                    <p className="truncate font-display text-xl font-semibold">{s.first}</p>
                    <div className="grid min-h-0 flex-1 grid-cols-3 gap-1">
                      {(["3", "2", "1"] as const).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => tap(s.id, code)}
                          className={cn(
                            "tw-tap flex min-h-0 items-center justify-center rounded-xl font-display text-2xl font-semibold",
                            markOn(s, date) === code ? "bg-crew-hi text-bg" : "bg-crew text-fg",
                          )}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          ["A", "ABSENT"],
                          ["E", "EXCUSED"],
                          ["P", "PERSONAL"],
                        ] as const
                      ).map(([code, label]) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => tap(s.id, code)}
                          className={cn(
                            "tw-tap min-h-11 rounded-xl px-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide sm:text-sm",
                            markOn(s, date) === code ? "bg-crew-hi text-bg" : "bg-crew text-fg",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={`empty-${i}`} className="rounded-2xl bg-crew-card/40" />
                ),
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" disabled={!crew} onClick={() => tapCrew("3")} className="tw-tap min-h-12 flex-1 rounded-full bg-crew-card text-sm font-semibold">
                Whole crew 3
              </button>
              <button type="button" onClick={() => goNextCrew()} className="tw-tap min-h-12 flex-1 rounded-full bg-crew-hi text-sm font-semibold text-bg">
                Next crew
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="desk-edit flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label="Previous school day"
          className="inline-flex size-9 items-center justify-center rounded-lg bg-surface text-fg"
          onClick={() => setDate(stepSchoolDay(date, -1))}
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold">{formatSchoolDate(date)}</span>
        <button
          type="button"
          aria-label="Next school day"
          className="inline-flex size-9 items-center justify-center rounded-lg bg-surface text-fg"
          onClick={() => setDate(stepSchoolDay(date, 1))}
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Day ${letter}. Tap to switch A or B.`}
          onClick={() => {
            if (!unlocked) {
              onNeedPin();
              return;
            }
            onChange(setAbDay(file, date, letter === "A" ? "B" : "A"));
          }}
          className="min-h-9 rounded-lg bg-elevated px-3 text-xs font-semibold uppercase tracking-widest ring-1 ring-fg"
        >
          {letter}
        </button>
        {clock?.live ? (
          <span className={cn("rounded-lg px-2 py-1 font-mono text-sm tabular-nums", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface text-muted")}>
            P{period} {clock.cleanup ? "NOW" : `${Math.max(0, Math.ceil(clock.left))}m`}
          </span>
        ) : bell ? (
          <span className="font-mono text-xs text-muted">
            P{period} {formatBell(bell.start)}–{formatBell(bell.end)}
          </span>
        ) : null}
        <a href={SCHOOLTOOL_URL} target="_blank" rel="noreferrer" className={cn("min-h-9 rounded-lg px-2 py-1 text-xs font-semibold", stDone ? "bg-gain text-bg" : p1Alarm ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}>
          {stDone ? "ST in" : p1Alarm ? "ST due" : "ST"}
        </a>
        <button
          type="button"
          onClick={() => {
            const next = !daily;
            setDaily(next);
            try {
              window.localStorage.setItem("techworks-desk-daily", next ? "1" : "0");
            } catch {
              /* */
            }
          }}
          className={cn("ml-auto min-h-9 rounded-full px-3 text-xs font-semibold", daily ? "bg-gold text-bg" : "bg-surface text-muted")}
        >
          Daily {daily ? "−" : "+"}
        </button>
        <div className="flex rounded-full bg-elevated p-0.5">
          <span className="tw-tap min-h-9 rounded-full bg-accent px-3 text-xs font-semibold text-accent-fg">Effort · pay</span>
        </div>
      </div>

      {daily ? (
        <div className="shrink-0 space-y-2 rounded-xl bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-h-9 items-center gap-2 rounded-lg bg-elevated px-2">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value || date)} className="bg-transparent text-sm outline-none" />
            </label>
            {slot.label ? <span className="text-sm text-muted">{cycleDayLabel(slot.label, cycle)}</span> : null}
            <WeatherChip compact />
            <p className="flex min-h-9 min-w-32 flex-1 items-center gap-2 rounded-lg bg-elevated px-2 text-sm">
              <span className="text-xs text-subtle">Lunch</span>
              <span className="min-w-0 truncate">{lunchOn(file, date) || "Admin → Lunch"}</span>
            </p>
            {deskPacks(file).map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => onChange(setDayBell(file, date, pack.id))}
                className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", bellsId === pack.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {pack.label}
              </button>
            ))}
            <a href={SCHOOLTOOL_URL} target="_blank" rel="noreferrer" className="min-h-9 rounded-lg bg-elevated px-2 py-1 text-xs text-muted">
              SchoolTool
            </a>
            <button
              type="button"
              onClick={() => commit(setSchooltoolDone(file, date, period, !stDone))}
              className={cn("min-h-9 rounded-lg px-2 text-xs font-semibold", stDone ? "bg-gain text-bg" : p1Alarm ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}
            >
              {stDone ? "ST in" : p1Alarm ? "ST DUE" : "ST"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!unlocked) {
                  onNeedPin();
                  return;
                }
                onChange(setSubDay(file, date, !sub));
              }}
              className={cn("min-h-9 rounded-lg px-2 text-xs font-semibold", sub ? "bg-work-pto text-accent-fg" : "bg-elevated text-subtle")}
            >
              SUB
            </button>
          </div>
          <div className="flex gap-3">
            <MiniBar label="Cycle" done={cycleProgress(date).done} total={cycleProgress(date).total} />
            <MiniBar label={quarterNow(date).label} done={quarterProgress(date).done} total={quarterProgress(date).total} />
            <MiniBar label="Year" done={yearProgress(date).done} total={yearProgress(date).total} />
          </div>
          {clock ? <PeriodMeter clock={clock} period={period} file={file} /> : null}
          <DayFacts file={file} date={date} period={period} edit unlocked={unlocked} onNeedPin={onNeedPin} onChange={commit} />
          {crew ? (
            <label className="flex items-center gap-2 text-sm">
              <span className="text-subtle">Leader</span>
              <select
                value={leadId}
                onChange={(e) => commit(setCrewLeader(file, period, crew.key, e.target.value))}
                className="min-h-9 rounded-md bg-elevated px-2 text-sm outline-none"
              >
                <option value="">Leader</option>
                {crew.kids.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {p1Alarm && !daily ? (
        <div className="flex shrink-0 items-center gap-2 rounded-lg bg-loss px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-fg">
          P1 SchoolTool · past {formatBell(bellForPeriod(1, bellsId)?.attendBy ?? "08:15")}
        </div>
      ) : null}

      {deskMode === "score" ? (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div data-periods className="flex shrink-0 flex-wrap gap-1">
          {bells.map((b) => {
            const crews = crewsOf(file, b.period, date);
            const done = crews.filter((c) => crewDone(c.kids, date)).length;
            const late = crews.filter((c) => crewPulse(c.kids, date, today, date, sub) === "late").length;
            const due = crews.filter((c) => crewPulse(c.kids, date, today, date, sub) === "due").length;
            const live = livePeriod === b.period;
            const gone = date === today && periodPast(b.period, bellsId, now);
            return (
              <button
                key={b.period}
                type="button"
                onClick={() => pickPeriod(b.period)}
                className={cn(
                  "flex min-h-10 min-w-12 shrink-0 flex-col items-center justify-center rounded-lg px-2 text-sm font-semibold",
                  period === b.period ? "bg-elevated text-fg ring-1 ring-fg" : gone ? "bg-elevated/50 text-subtle" : "bg-surface text-muted",
                  live && period !== b.period ? "ring-1 ring-gain/60" : "",
                )}
              >
                <span className="flex items-center gap-1">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      late || due ? "bg-loss" : done === crews.length && crews.length ? "bg-gain" : PERIOD_CLASS[b.period] ?? "bg-muted",
                    )}
                  />
                  <span className="truncate">{`P${b.period}`}</span>
                </span>
                <span className="font-mono text-[11px] tabular-nums text-subtle">
                  {done}/{crews.length}
                </span>
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
        ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center gap-1">
            {periodCrews.map((c) => {
              const kind = crewPulse(c.kids, date, today, date, sub);
              const marked = c.kids.filter((s) => markOn(s, date)).length;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setCrewKey(c.key);
                    setAllCrewsDone(false);
                  }}
                  className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold", crew?.key === c.key ? "bg-gold text-bg" : "bg-surface text-muted")}
                >
                  {c.name}
                  <span className="font-mono text-[11px] opacity-80">{marked}/{c.kids.length}</span>
                  {kind === "due" || kind === "late" ? <span className="size-2 rounded-full bg-loss" /> : null}
                </button>
              );
            })}
          </div>
          {allCrewsDone ? (
            <p className="shrink-0 rounded-lg bg-gain/20 px-3 py-2 text-sm font-semibold">
              P{period} done · {periodCrews.length} crews. Stay here or tap the next-job chip to save.
            </p>
          ) : periodCrews.length ? (
            <p className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">
              {periodCrews.filter((c) => crewDone(c.kids, date)).length}/{periodCrews.length} crews · last score on a crew jumps to the next open one
            </p>
          ) : null}

          <PollPad file={file} kids={crew?.kids ?? []} onChange={commit} />

          <div data-score-grid className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-auto sm:grid-cols-2">
            {(crew?.kids ?? []).map((s) => (
                <article key={s.id} className="flex min-h-0 flex-col gap-1 overflow-hidden rounded-xl bg-surface p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <button type="button" onClick={() => onOpenId(s.id)} className="truncate text-left font-display text-lg font-semibold sm:text-xl">
                      {s.first}
                    </button>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-muted">
                      {money(dayPay(markOn(s, date) === "Assist" ? "" : markOn(s, date), file.meta.codes) + (studentAssist(s, date) ? Number(file.meta.codes.Assist ?? 10) : 0))}
                    </span>
                  </div>
                  <>
                  <div className="grid h-16 shrink-0 grid-cols-3 gap-1 sm:h-20">
                    {(["3", "2", "1"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => tap(s.id, code)}
                        className={cn("tw-tap flex items-center justify-center rounded-lg font-display text-4xl font-semibold", tone(code), markOn(s, date) === code ? "ring-2 ring-fg" : "")}
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                  <div className="grid shrink-0 grid-cols-4 gap-1">
                    {(["A", "E", "P"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => tap(s.id, code)}
                        className={cn("tw-tap min-h-9 rounded-md text-[11px] font-semibold uppercase", tone(code), markOn(s, date) === code ? "ring-2 ring-fg" : "")}
                      >
                        {code === "A" ? "Abs" : code === "E" ? "Exc" : "PTO"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const here = attendOn(s, date) === "nurse";
                        commit(setStudentAttend(file, s.id, date, here ? "" : "nurse"));
                      }}
                      className={cn(
                        "tw-tap min-h-9 rounded-md text-[10px] font-semibold uppercase leading-tight",
                        attendOn(s, date) === "nurse" ? "bg-loss text-accent-fg" : "bg-elevated text-muted",
                      )}
                    >
                      {attendOn(s, date) === "nurse" ? `Back ${passOpen(s, date)?.out ?? ""}` : "Nurse"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMoreId((id) => (id === s.id ? null : s.id))}
                    className="tw-tap self-start text-[10px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {moreId === s.id ? "Less" : "More"}
                  </button>
                  {moreId === s.id ? (
                    <div className="grid shrink-0 grid-cols-4 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          commit(setStudentAssist(file, s.id, date, !studentAssist(s, date)));
                        }}
                        className={cn("min-h-9 rounded-md text-[10px] font-semibold", studentAssist(s, date) ? "bg-work-pto text-accent-fg" : "bg-elevated text-muted")}
                      >
                        Assist
                      </button>
                      <button
                        type="button"
                        onClick={() => commit(setStudentCleanup(file, s.id, date, studentCleanup(s, date) === "done" ? "" : "done"))}
                        className={cn("min-h-9 rounded-md text-[10px] font-semibold", studentCleanup(s, date) === "done" ? "bg-gain text-bg" : "bg-elevated text-muted")}
                      >
                        Clean
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (studentCleanup(s, date) === "miss") {
                            commit(setStudentCleanup(file, s.id, date, ""));
                            return;
                          }
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          commit(setStudentCleanup(file, s.id, date, "miss"));
                        }}
                        className={cn("min-h-9 rounded-md text-[10px] font-semibold", studentCleanup(s, date) === "miss" ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}
                      >
                        Miss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          commit(approveInvest(file, s.id, date));
                        }}
                        className={cn("min-h-9 rounded-md text-[10px] font-semibold", Number(s.investDays?.[date] || 0) > 0 ? "bg-gain/20 text-gain" : s.investAsk?.[date] ? "bg-work-pto text-accent-fg" : "bg-elevated text-muted")}
                      >
                        {Number(s.investDays?.[date] || 0) > 0 ? `$${s.investDays?.[date]}` : s.investAsk?.[date] ? "ASK" : "Inv"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          commit(bumpMoney(file, s.id, "bonus", 5));
                        }}
                        className="min-h-9 rounded-md bg-elevated text-[10px] font-semibold text-gain"
                      >
                        +$5
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            onNeedPin();
                            return;
                          }
                          commit(bumpMoney(file, s.id, "deduct", 5));
                        }}
                        className="min-h-9 rounded-md bg-elevated text-[10px] font-semibold text-loss"
                      >
                        −$5
                      </button>
                    </div>
                  ) : null}
                  </>
                </article>
            ))}
          </div>
          <div className="flex shrink-0 gap-1.5 pb-[env(safe-area-inset-bottom)]">
            <button type="button" disabled={!canUndo} onClick={undoLast} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-elevated px-3 text-sm font-medium disabled:opacity-40">
              <Undo2 className="size-4" />
              Undo
            </button>
            <button type="button" disabled={!crew} onClick={() => tapCrew("3")} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-elevated text-sm font-medium disabled:opacity-40">
              <Users className="size-4" />
              All 3s
            </button>
            <button
              type="button"
              disabled={!crew}
              onClick={() => {
                skipAdvance.current = false;
                goNextCrew();
              }}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-medium text-accent-fg disabled:opacity-40"
            >
              Next crew
            </button>
          </div>
        </div>
        )}
      </div>
      ) : null}
    </div>
  );
}
