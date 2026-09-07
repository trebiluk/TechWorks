import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Undo2, Users } from "lucide-react";
import { PeriodRewardChip } from "@/components/reward-bar";
import type { DayCode, EconomyFile } from "@/lib/economy";
import { bellFor, dayPay, isLiveStudent, money, periodTitle, score, shopBells } from "@/lib/economy";
import { cycleDayLabel, cycleProgress, daySlot, formatSchoolDate, isSchoolDay, quarterNow, quarterProgress, scoreDate as nearestScoreDate, stepSchoolDay, todayIso, weekOn, yearProgress } from "@/lib/calendar";
import {
  abOn,
  activityFor,
  agendaStep,
  askInvest,
  approveInvest,
  cleanupOn,
  crewLeaderId,
  cycleGoalFor,
  setCrewLeader,
  investCrew,
  isSubDay,
  loadFocus,
  lunchOn,
  DEFAULT_CYCLE_GOALS,
  resetAbCycle,
  setCurrentCycle,
  setSchedule,
  setShop,
  markOn,
  onAbRoster,
  paintCheck,
  saveFocus,
  setAbDay,
  setAgendaStep,
  setCleanup,
  setCrewMark,
  setCycleGoal,
  setPaintCheck,
  setSchooltoolDone,
  setStudentCleanup,
  setStudentMark,
  setStudentNote,
  setAffect,
  setSubDay,
  setStudentAssist,
  studentAssist,
  bumpMoney,
  schooltoolDone,
  STAGES,
  studentCleanup,
  toggleInvest,
} from "@/lib/store";
import { AGENDA, attendLate, beep, bellForPeriod, bellTimes, formatBell, periodClock, periodNow, periodPast, ringBell, scheduleOf, SCHEDULES, SCHOOLTOOL_URL, workshopDay } from "@/lib/bells";
import { CHANGELOG_MD, APP_VERSION, changelogFileName } from "@/data/changelog";
import { VERSION_LABEL } from "@/lib/version";
import { downloadText } from "@/lib/live";
import { CREW_PIN } from "@/lib/pin";
import { QuarterChip } from "@/components/quarter-chip";
import { WeatherChip } from "@/components/weather-chip";
import { DayFacts } from "@/components/day-facts";
import { cn } from "@/lib/utils";
import { useShopClock } from "@/lib/use-clock";

const PERIOD_CLASS: Record<number, string> = {
  1: "bg-period-1",
  2: "bg-period-2",
  3: "bg-period-3",
  6: "bg-period-1",
  8: "bg-period-4",
  9: "bg-period-5",
  10: "bg-period-6",
};

const SCORE_CODES: { code: DayCode; hint: string }[] = [
  { code: "3", hint: "$25" },
  { code: "2", hint: "$20" },
  { code: "1", hint: "$15" },
  { code: "A", hint: "no-show" },
  { code: "E", hint: "excused" },
  { code: "P", hint: "−$25" },
];

const FACES = ["😞", "😐", "🙂", "😄", "😴"] as const;

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

import { crewDone, crewPulse, crewsOf } from "@/lib/crews";
import { agendaFor, skillName } from "@/lib/projects";
import { SKILL_MARKS, setSkillScore, skillScore, skillXp, crossedBand } from "@/lib/skills";

function Pulse({ kind }: { kind: "done" | "due" | "late" | "open" }) {
  if (kind === "done") return <span className="text-sm text-gain">done</span>;
  if (kind === "late") return <span className="text-sm font-medium text-loss">late</span>;
  if (kind === "due") return <span className="text-sm font-medium text-loss">due</span>;
  return <span className="text-sm text-subtle">open</span>;
}

const WORK_TONE: Record<string, string> = {
  "PROJ-W": "bg-work-w text-fg",
  "PROJ-PC": "bg-work-pc text-fg",
  P: "bg-work-p text-fg",
  PTO: "bg-work-pto text-accent-fg",
  "OFF TASK": "bg-loss text-accent-fg",
};

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
        {clock.cleanup ? <p className="mt-2 text-sm font-semibold uppercase tracking-widest">Cleanup</p> : null}
      </div>
      <PeriodRewardChip file={file} period={period} className="self-center" />
    </div>
  );
}

function ShopLists({
  file,
  onChange,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
}) {
  const shop = file.meta.shop ?? [];
  const cats = [...new Set(["SNACKS", "LEISURE", "CHORES", "TOOLS", ...shop.map((x) => x.category)])];
  const [open, setOpen] = useState<Record<string, boolean>>({ SNACKS: true });
  const [newCat, setNewCat] = useState("");

  function patch(next: typeof shop) {
    onChange(setShop(file, next));
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Store lists · type to edit</p>
      {cats.map((cat) => {
        const rows = shop.map((item, i) => ({ item, i })).filter((x) => x.item.category === cat);
        return (
          <div key={cat} className="mt-2 rounded-md bg-elevated">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [cat]: !o[cat] }))}
              className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-semibold uppercase tracking-wide"
            >
              <span>
                {cat} · {rows.length}
              </span>
              <span className="text-subtle">{open[cat] ? "hide" : "show"}</span>
            </button>
            {open[cat] ? (
              <div className="space-y-1 px-3 pb-3">
                {rows.map(({ item, i }) => (
                  <div key={i} className="flex gap-1">
                    <input
                      value={item.name}
                      onChange={(e) => {
                        const next = shop.map((x, j) => (j === i ? { ...x, name: e.target.value } : x));
                        patch(next);
                      }}
                      placeholder="item"
                      className="min-h-10 min-w-0 flex-1 rounded-md bg-surface px-2 text-sm outline-none"
                    />
                    <input
                      inputMode="numeric"
                      value={item.price}
                      onChange={(e) => {
                        const price = Math.max(0, Number(e.target.value.replace(/[^\d.]/g, "")) || 0);
                        patch(shop.map((x, j) => (j === i ? { ...x, price } : x)));
                      }}
                      className="min-h-10 w-16 rounded-md bg-surface px-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => patch(shop.filter((_, j) => j !== i))}
                      className="min-h-10 rounded-md px-2 text-sm text-loss"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => patch([...shop, { category: cat, name: "", price: 5 }])}
                  className="min-h-10 w-full rounded-md bg-surface text-sm text-muted"
                >
                  + add {cat.toLowerCase()}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
      <div className="mt-2 flex gap-2">
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value.toUpperCase())}
          placeholder="NEW LIST NAME"
          className="min-h-10 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const c = newCat.trim();
            if (!c) return;
            patch([...shop, { category: c, name: "", price: 5 }]);
            setOpen((o) => ({ ...o, [c]: true }));
            setNewCat("");
          }}
          className="min-h-10 rounded-md bg-elevated px-3 text-sm"
        >
          Add list
        </button>
      </div>
    </div>
  );
}

function SkillLists({
  file,
  onChange,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
}) {
  const list = file.meta.config?.skills?.length
    ? file.meta.config.skills
    : [
        { id: "safety", name: "SAFETY" },
        { id: "measure", name: "MEASURE" },
        { id: "draw", name: "DRAW" },
        { id: "model", name: "MODEL" },
        { id: "material", name: "MATERIAL" },
        { id: "tools", name: "TOOLS" },
        { id: "finish", name: "FINISH" },
        { id: "present", name: "PRESENT" },
        { id: "digital", name: "DIGITAL" },
        { id: "team", name: "TEAM" },
      ];
  return (
    <div className="mt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Skills list</p>
      <p className="mt-1 text-sm text-muted">E/P/A on the Skills tab. Not pay. Add or rename here.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {list.map((sk, i) => (
          <input
            key={sk.id}
            value={sk.name}
            onChange={(e) => {
              const next = structuredClone(file);
              const skills = [...(next.meta.config?.skills ?? list)];
              skills[i] = { ...skills[i], name: e.target.value.toUpperCase() };
              next.meta.config = { ...(next.meta.config ?? {}), skills };
              onChange(next);
            }}
            className="min-h-11 rounded-md bg-elevated px-2 text-sm uppercase outline-none"
          />
        ))}
      </div>
    </div>
  );
}

function ChangelogCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4 rounded-md bg-elevated p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
      >
        Changelog · {VERSION_LABEL}
        <span className="text-subtle">{open ? "hide" : "export"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <textarea readOnly value={CHANGELOG_MD} className="min-h-40 w-full rounded-md bg-surface p-2 font-mono text-xs text-fg outline-none" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(CHANGELOG_MD);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                } catch {
                  window.prompt("Copy changelog", CHANGELOG_MD);
                }
              }}
              className="min-h-11 flex-1 rounded-md bg-surface text-sm font-semibold"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => downloadText(changelogFileName(), CHANGELOG_MD, "text/markdown")}
              className="min-h-11 flex-1 rounded-md bg-fg text-sm font-semibold text-bg"
            >
              Download .md
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmbedCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window === "undefined" ? "https://your-techworks-host" : window.location.origin;
  const src = `${origin}/?embed=1`;
  const html = `<iframe src="${src}" title="TechWorks Board" width="100%" height="720" style="border:0;background:#0a0a0b" allow="fullscreen" loading="lazy"></iframe>`;
  return (
    <div className="mt-4 rounded-md bg-elevated p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold uppercase tracking-wide"
      >
        Show embed
        <span className="text-subtle">{open ? "hide" : "Google Site"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted">
            Google Site → Insert → Embed → Embed code. This loads Overview only (no Crew, no Desk, no names vault).
          </p>
          <textarea readOnly value={html} className="min-h-24 w-full rounded-md bg-surface p-2 font-mono text-xs text-fg outline-none" />
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(html);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                window.prompt("Copy iframe", html);
              }
            }}
            className="min-h-11 w-full rounded-md bg-fg text-sm font-semibold text-bg"
          >
            {copied ? "Copied" : "Copy iframe HTML"}
          </button>
        </div>
      ) : null}
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
  startPad = "effort",
  onRankUp,
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
  const list = useMemo(() => score(file), [file]);
  const [date, setDate] = useState(() => nearestScoreDate());
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const periodCrews = crewsOf(file, period, date);
  const [crewKey, setCrewKey] = useState(periodCrews[0]?.key ?? "Crew A");
  const skipAdvance = useRef(false);
  const undoRef = useRef<EconomyFile | null>(null);
  const warnKey = useRef("");
  const [canUndo, setCanUndo] = useState(false);
  const now = useShopClock(file.meta.config?.schedule, "beat");
  const livePeriod = periodNow(file.meta.config?.schedule, now);
  const [crewOverride, setCrewOverride] = useState(false);
  const [crewPin, setCrewPin] = useState(false);
  const [crewPinCode, setCrewPinCode] = useState("");
  const [crewPinErr, setCrewPinErr] = useState("");
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [moreId, setMoreId] = useState<string | null>(null);
  const [daily, setDaily] = useState(() => {
    try {
      return window.localStorage.getItem("techworks-desk-daily") === "1";
    } catch {
      return false;
    }
  });
  const deskMode = "score";
  const pendingPeriod = useRef<number | null>(null);

  useEffect(() => {
    if (panel === "config") onOpenSettings();
  }, [panel]);

  useEffect(() => {
    if (jumpPeriod && bells.some((b) => b.period === jumpPeriod)) {
      setPeriod(jumpPeriod);
      if (jumpDate) setDate(jumpDate);
      const crews = crewsOf(file, jumpPeriod, jumpDate || date);
      const next = (jumpCrew && crews.find((c) => c.key === jumpCrew)) || crews[0];
      if (next) setCrewKey(next.key);
      return;
    }
    const live = periodNow(file.meta.config?.schedule);
    if (live && bells.some((b) => b.period === live)) {
      setPeriod(live);
      const next = crewsOf(file, live, date)[0];
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
  const sched = file.meta.config?.schedule;
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
  const week = weekOn(date);
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;

  const crew = periodCrews.find((c) => c.key === crewKey) ?? periodCrews[0] ?? null;
  const classGoal = cycleGoalFor(file, period);
  const classAct = activityFor(file, date, period);
  const painting = /paint/i.test(classGoal);
  const sub = isSubDay(file, date);
  const letter = abOn(file, date);
  const nextDay = stepSchoolDay(date, 1);
  const nextLetter = letter === "A" ? "B" : "A";
  const bell = bellForPeriod(period, file.meta.config?.schedule);
  const clock = periodClock(period, file.meta.config?.schedule, now);

  useEffect(() => {
    if (!clock?.cleanup) return;
    const key = `${period}-${clock.end}`;
    if (warnKey.current === key) return;
    warnKey.current = key;
    ringBell();
  }, [clock?.cleanup, clock?.end, period]);
  const shop = workshopDay(classAct, classGoal);
  const step = crew ? agendaStep(file, date, period, crew.key) : "attend";
  const cleaned = crew ? cleanupOn(file, date, period, crew.key) : "";
  const leadId = crew ? crewLeaderId(file, period, crew.key) : "";
  const lead = crew?.kids.find((s) => s.id === leadId);
  const stDone = schooltoolDone(file, date, period);
  const p1Alarm =
    school &&
    !sub &&
    date === today &&
    period === 1 &&
    attendLate(1, file.meta.config?.schedule) &&
    !schooltoolDone(file, date, 1);
  const weekProg = (() => {
    const days = (week?.days ?? []).filter((d) => d <= date && !isSubDay(file, d));
    let done = 0;
    let total = 0;
    for (const d of days) {
      for (const c of bells.flatMap((b) => crewsOf(file, b.period, d))) {
        total += 1;
        if (crewDone(c.kids, d)) done += 1;
      }
    }
    return { done, total };
  })();

  function pickPeriod(p: number) {
    if (crewMode && !crewOverride && p !== livePeriod) {
      pendingPeriod.current = p;
      setCrewPinCode("");
      setCrewPinErr("");
      setCrewPin(true);
      return;
    }
    setPeriod(p);
    const next = crewsOf(file, p, date)[0];
    setCrewKey(next?.key ?? "Crew A");
  }

  function goNextCrew() {
    const mine = crewsOf(file, period, date);
    const i = mine.findIndex((c) => c.key === (crew?.key ?? crewKey));
    if (i >= 0 && i < mine.length - 1) {
      setCrewKey(mine[i + 1].key);
      return;
    }
    if (crewMode && !crewOverride) return;
    const pi = bells.findIndex((b) => b.period === period);
    for (let j = pi + 1; j < bells.length; j++) {
      const more = crewsOf(file, bells[j].period, date);
      if (more.length) {
        setPeriod(bells[j].period);
        setCrewKey(more[0].key);
        return;
      }
    }
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

  const agenda = agendaFor(file, period, date, crew?.key);
  const watchId = agenda.skillId || "build";
  const watchLabel = skillName(watchId) || "Skill";

  function tapSkill(id: string, n: number) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    const row = file.students.find((s) => s.id === id);
    if (!row) return;
    const cur = skillScore(row, watchId);
    const before = skillXp(file, id);
    const next = setSkillScore(file, id, watchId, cur === n ? 0 : n);
    commit(next);
    const band = crossedBand(file, before, skillXp(next, id));
    if (band) onRankUp?.(row.first, band);
  }

  function tapSkillCrew(n: number) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    if (!crew) return;
    let next = file;
    for (const s of crew.kids) {
      if (skillScore(s, watchId) === 0) next = setSkillScore(next, s.id, watchId, n);
    }
    commit(next);
    if (!skipAdvance.current) window.setTimeout(() => goNextCrew(), 280);
  }

  if (crewMode) {
    const kids = crew?.kids ?? [];
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden text-fg">
        <p className="shrink-0 flex flex-wrap items-center gap-2 font-display text-2xl font-semibold tracking-tight">
          Hi, Team Leader {lead?.first ?? "friend"}, <span className="text-crew-hi">please score your team below.</span>
          <QuarterChip date={date} />
        </p>
        {clock ? <div className="shrink-0"><PeriodMeter clock={clock} period={period} file={file} /></div> : null}
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {bells.map((b) => {
            const open = crewOverride || b.period === livePeriod;
            const gone = periodPast(b.period, file.meta.config?.schedule, now);
            return (
            <button
              key={b.period}
              type="button"
              onClick={() => pickPeriod(b.period)}
              className={cn(
                "min-h-10 rounded-full px-3 text-sm font-semibold",
                period === b.period ? "bg-crew-hi text-bg" : gone ? "bg-crew-card/30 text-subtle" : open ? "bg-crew-card text-fg" : "bg-crew-card/40 text-subtle",
              )}
            >
              {`P${b.period}`}
            </button>
            );
          })}
          {crewOverride ? (
            <button type="button" onClick={() => setCrewOverride(false)} className="min-h-10 rounded-full bg-work-pto px-3 text-sm font-semibold text-accent-fg">
              Override
            </button>
          ) : (
            <button type="button" onClick={() => setCrewPin(true)} className="min-h-10 rounded-full bg-crew-card px-3 text-sm text-muted">
              Override
            </button>
          )}
        </div>
        {!crewOverride && livePeriod !== period ? (
          <p className="shrink-0 rounded-xl bg-crew-card p-3 text-sm">
            {livePeriod ? `Period ${livePeriod} only until the bell.` : "Between periods. Override PIN to open a class."}
          </p>
        ) : null}
        {sub ? (
          <p className="flex min-h-0 flex-1 items-center justify-center rounded-2xl bg-crew-card p-6 text-center text-xl font-semibold">
            SUB day · no scores. Next class is the next cycle day.
          </p>
        ) : crewOverride || period === livePeriod ? (
        <>
        <div className="flex shrink-0 flex-wrap gap-1">
          {periodCrews.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCrewKey(c.key)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-semibold",
                crew?.key === c.key ? "bg-fg text-bg" : "bg-crew-card text-muted",
              )}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => tapCrew("3")}
            className="min-h-10 rounded-full bg-crew-hi px-4 text-sm font-semibold text-bg"
          >
            Crew 3
          </button>
        </div>
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
                        "flex min-h-0 items-center justify-center rounded-xl font-display text-2xl font-semibold",
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
                        "min-h-10 rounded-xl px-1 text-center text-[11px] font-semibold uppercase leading-tight tracking-wide sm:text-sm",
                        markOn(s, date) === code ? "bg-crew-hi text-bg" : "bg-crew text-fg",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setNoteOpen(noteOpen === s.id ? null : s.id)}
                  className="min-h-8 self-start rounded-xl px-2 text-[10px] font-semibold uppercase tracking-wide text-subtle"
                >
                  More
                </button>
                {noteOpen === s.id ? (
                  <>
                <button
                  type="button"
                  disabled={!["3", "2", "1"].includes(markOn(s, date))}
                  onClick={() => commit(askInvest(file, s.id, date))}
                  className={cn(
                    "min-h-8 rounded-xl text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-30",
                    Number(s.investDays?.[date] || 0) > 0
                      ? "bg-gain text-bg"
                      : s.investAsk?.[date]
                        ? "bg-work-pto text-accent-fg"
                        : "bg-crew text-muted",
                  )}
                >
                  {Number(s.investDays?.[date] || 0) > 0 ? "INVESTED" : s.investAsk?.[date] ? "WANTS TO INVEST" : "INVEST?"}
                </button>
                <div className="flex items-center gap-0.5">
                  {FACES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-label={`Mood ${f}`}
                      onClick={() => commit(setAffect(file, s.id, date, f))}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md text-sm",
                        (s.affect ?? {})[date] === f ? "bg-crew ring-1 ring-fg" : "opacity-50",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                  </>
                ) : null}
              </div>
            ) : (
              <div key={`empty-${i}`} className="rounded-2xl bg-crew-card/40" />
            ),
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={!crew}
            onClick={() => tapCrew("3")}
            className="min-h-12 flex-1 rounded-full bg-crew-card text-sm font-semibold"
          >
            Whole crew earned a 3
          </button>
          <button
            type="button"
            onClick={() => goNextCrew()}
            className="min-h-12 flex-1 rounded-full bg-crew-hi text-sm font-semibold text-bg"
          >
            Next crew
          </button>
        </div>
        </>
        ) : null}
        {crewPin ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-crew/80 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-crew-card p-6">
              <p className="text-sm font-semibold uppercase tracking-widest text-crew-hi">Crew override</p>
              <p className="mt-2 text-sm text-muted">PIN 2222 unlocks other periods for this session.</p>
              <input
                inputMode="numeric"
                autoFocus
                value={crewPinCode}
                onChange={(e) => {
                  setCrewPinCode(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setCrewPinErr("");
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (crewPinCode === CREW_PIN) {
                    setCrewOverride(true);
                    setCrewPin(false);
                    const p = pendingPeriod.current;
                    pendingPeriod.current = null;
                    if (p) {
                      setPeriod(p);
                      const next = crewsOf(file, p, date)[0];
                      setCrewKey(next?.key ?? "Crew A");
                    }
                  } else {
                    setCrewPinErr("Wrong PIN");
                    setCrewPinCode("");
                  }
                }}
                className="mt-4 min-h-12 w-full rounded-2xl bg-crew px-4 font-mono text-xl tracking-[0.4em] outline-none"
                placeholder="••••"
              />
              {crewPinErr ? <p className="mt-2 text-sm text-loss">{crewPinErr}</p> : null}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (crewPinCode === CREW_PIN) {
                      setCrewOverride(true);
                      setCrewPin(false);
                      const p = pendingPeriod.current;
                      pendingPeriod.current = null;
                      if (p) {
                        setPeriod(p);
                        const next = crewsOf(file, p, date)[0];
                        setCrewKey(next?.key ?? "Crew A");
                      }
                    } else {
                      setCrewPinErr("Wrong PIN");
                      setCrewPinCode("");
                    }
                  }}
                  className="min-h-12 flex-1 rounded-full bg-crew-hi text-sm font-semibold text-accent-fg"
                >
                  Unlock periods
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCrewPin(false);
                    pendingPeriod.current = null;
                  }}
                  className="tw-btn-2 min-h-12 flex-1 rounded-full text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const goals = { ...DEFAULT_CYCLE_GOALS, ...(file.meta.config?.cycleGoals ?? {}) };

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
            {(Object.keys(SCHEDULES) as (keyof typeof SCHEDULES)[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange(setSchedule(file, id))}
                className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", scheduleOf(file.meta.config?.schedule) === id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {SCHEDULES[id].label}
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
          P1 SchoolTool · past {formatBell(bellForPeriod(1, file.meta.config?.schedule)?.attendBy ?? "08:15")}
        </div>
      ) : null}

      {deskMode === "score" ? (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div data-periods className="flex shrink-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(typeof document !== "undefined" && document.documentElement.dataset.layout === "mobile" && livePeriod && !crewOverride
            ? bells.filter((b) => b.period === livePeriod || b.period === period)
            : bells
          ).map((b) => {
            const crews = crewsOf(file, b.period, date);
            const done = crews.filter((c) => crewDone(c.kids, date)).length;
            const late = crews.filter((c) => crewPulse(c.kids, date, today, date, sub) === "late").length;
            const due = crews.filter((c) => crewPulse(c.kids, date, today, date, sub) === "due").length;
            const live = livePeriod === b.period;
            const gone = date === today && periodPast(b.period, file.meta.config?.schedule, now);
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
                  onClick={() => setCrewKey(c.key)}
                  className={cn("inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold", crew?.key === c.key ? "bg-gold text-bg" : "bg-surface text-muted")}
                >
                  {c.name}
                  <span className="font-mono text-[11px] opacity-80">{marked}/{c.kids.length}</span>
                  {kind === "due" || kind === "late" ? <span className="size-2 rounded-full bg-loss" /> : null}
                </button>
              );
            })}
          </div>

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
                  <div className="grid shrink-0 grid-cols-3 gap-1">
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
