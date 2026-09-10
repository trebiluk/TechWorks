import { bellFor, dayPay, isLiveStudent, score, type DayCode, type EconomyFile, type RawStudent } from "@/lib/economy";
import { generateAlias, type LegalRosterRow } from "@/lib/alias-bank";
import { aliasAfterId, newStudentId } from "@/lib/ids";
import { DEFAULT_LEVEL_BANDS, skillXp, type LevelBand } from "@/lib/skills";
import { cleanPicks } from "@/lib/tickers";
import { daySlot, schoolDays, sessions, todayIso, weekOn } from "@/lib/calendar";
import { writeTape } from "@/lib/tape";
import type { DjiaQuote } from "@/lib/djia";
import { afterAffectMaybeConfirm, afterCrewLeaderChange, roleHistoryOf } from "@/lib/roles";
import { persistPack, readLocal, writePack, packDesk, migrateDesk } from "@/lib/vault";
import { scheduleCloudPush } from "@/lib/desk-cloud";
import { builtinPacks, type BellPack, type ScheduleId } from "@/lib/bells";
import { SAVE_FAIL_EVENT, stripFakeDemo } from "@/lib/demo";

const FOCUS_KEY = "techworks-focus";
const MONEY_STEP = 5;
const MONEY_MAX = 20;
const SHOCKS = [-20, -15, -10, -5, 0, 5, 10, 15, 20] as const;

export { MONEY_STEP, MONEY_MAX, SHOCKS, stripFakeDemo };

export const DAILY_GOALS = [
  "IDEA STAGE",
  "DESIGN STAGE",
  "MODELING STAGE",
  "FINISHING STAGE",
  "PRESENTATION PREP",
  "CRITIQUE DAY",
  "PRODUCTIVITY",
  "TRAINING",
  "DEMONSTRATION",
  "DRAWING",
  "FREE DAY",
] as const;
export const STAGES = DAILY_GOALS;

export const DEFAULT_CYCLE_GOALS: Record<string, string> = {
  "5": "PRODUCTIVITY",
  "6": "IDEA STAGE",
  "7": "DESIGN STAGE",
  "8": "MODELING STAGE",
};

function clone(file: EconomyFile): EconomyFile {
  return {
    ...file,
    students: file.students.slice(),
    crews: file.crews.slice(),
    meta: {
      ...file.meta,
      config: { ...(file.meta.config ?? {}) },
      dayLog: { ...(file.meta.dayLog ?? {}) },
      ledger: (file.meta.ledger ?? []).slice(),
    },
  };
}

let saveTimer = 0;
let savePending: EconomyFile | null = null;
let persistHandle = 0;
let persistJson = "";
let persistPackObj: ReturnType<typeof packDesk> | null = null;

export function saveDesk(file: EconomyFile) {
  if (typeof window === "undefined") return;
  savePending = file;
  if (saveTimer) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = 0;
    const next = savePending;
    savePending = null;
    if (!next) return;
    flushDesk(next);
  }, 480);
}

export function saveDeskNow(file: EconomyFile) {
  if (typeof window === "undefined") return;
  savePending = null;
  if (saveTimer) {
    window.clearTimeout(saveTimer);
    saveTimer = 0;
  }
  flushDesk(file);
}

export function deskSavePending(): boolean {
  return Boolean(savePending) || saveTimer !== 0;
}

function flushDesk(file: EconomyFile) {
  const pack = packDesk(stripFakeDemo(file));
  const json = JSON.stringify(pack);
  const wrote = writePack(pack, json);
  if (!wrote.ok) {
    try {
      window.dispatchEvent(new CustomEvent(SAVE_FAIL_EVENT, { detail: "This PC could not save (storage full). Download a full backup now." }));
    } catch {
      /* */
    }
    return;
  }
  persistPackObj = pack;
  persistJson = json;
  if (persistHandle) return;
  const ric = (window as Window & { requestIdleCallback?: (fn: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
  persistHandle = ric
    ? ric(() => {
        persistHandle = 0;
        const p = persistPackObj;
        const body = persistJson;
        if (p) {
          void persistPack(p, body);
          scheduleCloudPush(p.file);
        }
      }, { timeout: 2500 })
    : window.setTimeout(() => {
        persistHandle = 0;
        const p = persistPackObj;
        const body = persistJson;
        if (p) {
          void persistPack(p, body);
          scheduleCloudPush(p.file);
        }
      }, 400);
}

function days4(days: string[] | undefined): string[] {
  const d = [...(days ?? [])];
  while (d.length < 4) d.push("");
  return d.slice(0, 4);
}

export function loadDesk(fallback: EconomyFile): EconomyFile {
  if (typeof window === "undefined") return migrateDesk(fallback);
  const local = readLocal();
  if (local) return local;
  return migrateDesk(fallback);
}

export function loadFocus(): { period: number; crewKey: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FOCUS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { period?: number; crewKey?: string };
    if (!parsed.period || !parsed.crewKey) return null;
    return { period: parsed.period, crewKey: parsed.crewKey };
  } catch {
    return null;
  }
}

export function saveFocus(period: number, crewKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FOCUS_KEY, JSON.stringify({ period, crewKey }));
  } catch {
    /* quota */
  }
}

export function abOn(file: EconomyFile, date: string): "A" | "B" {
  const days = schoolDays().map((d) => d.date);
  const anchor = file.meta.abAnchor ?? { date: days[0] ?? date, letter: "A" as const };
  const ai = days.indexOf(anchor.date);
  const bi = days.indexOf(date);
  if (bi < 0) return anchor.letter;
  const start = ai < 0 ? 0 : ai;
  const delta = bi - start;
  const flip = Math.abs(delta) % 2 === 1;
  if (!flip) return anchor.letter;
  return anchor.letter === "A" ? "B" : "A";
}

export function setAbDay(file: EconomyFile, date: string, letter: "A" | "B"): EconomyFile {
  const next = clone(file);
  next.meta.abAnchor = { date, letter };
  return next;
}

export function resetAbCycle(file: EconomyFile, date: string): EconomyFile {
  return setAbDay(file, date, "A");
}

export function onAbRoster(s: EconomyFile["students"][number], letter: "A" | "B"): boolean {
  if (s.period !== 6) return true;
  const slot = s.abDay ?? "BOTH";
  if (slot === "BOTH") return true;
  return slot === letter;
}

export function cycleGoalFor(file: EconomyFile, period: number): string {
  const grade = bellFor(file).find((b) => b.period === period)?.grade ?? 6;
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
  const map = { ...DEFAULT_CYCLE_GOALS, ...(file.meta.config?.cycleGoals ?? {}) };
  return map[`${cycle}|${grade}`] || map[String(grade)] || "IDEA STAGE";
}

export function setCycleGoal(file: EconomyFile, grade: number, goal: string): EconomyFile {
  const next = clone(file);
  const cycle = next.meta.config?.currentCycle ?? next.meta.currentWeek ?? 1;
  const name = goal.trim().toUpperCase() || DEFAULT_CYCLE_GOALS[String(grade)];
  next.meta.config = {
    ...(next.meta.config ?? {}),
    cycleGoals: {
      ...DEFAULT_CYCLE_GOALS,
      ...(next.meta.config?.cycleGoals ?? {}),
      [String(grade)]: name,
      [`${cycle}|${grade}`]: name,
    },
  };
  return next;
}

export function stampLiveExport(file: EconomyFile, iso = todayIso(), period?: number): EconomyFile {
  const next = clone(file);
  const periods = { ...(next.meta.config?.liveExportPeriods ?? {}) };
  if (period) {
    const list = [...(periods[iso] ?? [])];
    if (!list.includes(period)) list.push(period);
    periods[iso] = list;
  }
  next.meta.config = {
    ...(next.meta.config ?? {}),
    lastLiveExport: iso,
    liveExportPeriods: periods,
  };
  return next;
}

export function exportedThisPeriod(file: EconomyFile, iso: string, period: number): boolean {
  return Boolean(file.meta.config?.liveExportPeriods?.[iso]?.includes(period));
}

export function setLevelConfig(file: EconomyFile, next: { colorOn?: boolean; bands?: LevelBand[] }): EconomyFile {
  const cur = clone(file);
  const prev = cur.meta.config?.levels ?? {};
  cur.meta.config = {
    ...(cur.meta.config ?? {}),
    levels: {
      colorOn: next.colorOn ?? prev.colorOn ?? false,
      bands: next.bands ?? prev.bands ?? DEFAULT_LEVEL_BANDS,
    },
  };
  return cur;
}

export function setCurrentCycle(file: EconomyFile, n: number): EconomyFile {
  const next = clone(file);
  next.meta.config = { ...(next.meta.config ?? {}), currentCycle: Math.max(1, Math.min(8, Math.round(n) || 1)) };
  return next;
}

export function setSchedule(file: EconomyFile, schedule: ScheduleId): EconomyFile {
  const next = clone(file);
  next.meta.config = { ...(next.meta.config ?? {}), schedule };
  return next;
}

export function setCleanupMins(file: EconomyFile, n: number): EconomyFile {
  const next = clone(file);
  const mins = Math.min(15, Math.max(1, Math.round(Number(n) || 5)));
  next.meta.config = { ...(next.meta.config ?? {}), cleanupMins: mins };
  return next;
}

export function setCleanupSound(file: EconomyFile, sound: string): EconomyFile {
  const next = clone(file);
  next.meta.config = { ...(next.meta.config ?? {}), cleanupSound: sound };
  return next;
}

function roleKey(cycle: number, period: number, crewKey: string) {
  return `${cycle}|${period}|${crewKey}`;
}

export function crewLeaderId(file: EconomyFile, period: number, crewKey: string): string {
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
  return file.meta.config?.crewRoles?.[roleKey(cycle, period, crewKey)] ?? "";
}

export function setCrewLeader(file: EconomyFile, period: number, crewKey: string, id: string, date?: string): EconomyFile {
  const next = clone(file);
  const cycle = next.meta.config?.currentCycle ?? next.meta.currentWeek ?? 1;
  const crewRoles = { ...(next.meta.config?.crewRoles ?? {}) };
  const key = roleKey(cycle, period, crewKey);
  if (id) crewRoles[key] = id;
  else delete crewRoles[key];
  next.meta.config = { ...(next.meta.config ?? {}), crewRoles };
  return afterCrewLeaderChange(next, period, crewKey, id, date);
}

export function isSubDay(file: EconomyFile, date: string): boolean {
  return Boolean(file.meta.dayLog?.[date]?.sub);
}

export function setSubDay(file: EconomyFile, date: string, on: boolean): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).sub = on;
  return next;
}

export function setStudentCode(file: EconomyFile, id: string, day: number, code: DayCode): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const days = days4(s.days);
    days[day] = code;
    return { ...s, days };
  });
  return next;
}

export function setCrewCode(
  file: EconomyFile,
  period: number,
  crewKey: string,
  day: number,
  code: DayCode,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.period !== period || s.crewKey !== crewKey) return s;
    const days = days4(s.days);
    days[day] = code;
    return { ...s, days };
  });
  return next;
}

export function setLunch(file: EconomyFile, date: string, lunch: string): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).lunch = lunch;
  return next;
}

export function lunchOn(file: EconomyFile, date: string): string {
  return file.meta.dayLog?.[date]?.lunch ?? "";
}

export type Meeting = { title: string; date?: string; dow?: number; time?: string };

export function meetingsOf(file: EconomyFile): Meeting[] {
  return file.meta.config?.meetings ?? [];
}

export function meetingsOn(file: EconomyFile, date: string): Meeting[] {
  const dow = new Date(`${date}T12:00:00`).getDay();
  return meetingsOf(file).filter((m) => m.date === date || (m.dow != null && m.dow === dow && !m.date));
}

export function setTodayMeeting(file: EconomyFile, date: string, title: string, time?: string): EconomyFile {
  const next = clone(file);
  const rest = meetingsOf(next).filter((m) => m.date !== date);
  const name = title.trim();
  if (name) rest.push({ title: name.slice(0, 48), date, time: time?.trim() || undefined });
  next.meta.config = { ...(next.meta.config ?? {}), meetings: rest };
  return next;
}

export function setPicks(file: EconomyFile, id: string, picks: string[]): EconomyFile {
  const next = clone(file);
  const s = next.students.find((x) => x.id === id);
  if (!s) return file;
  s.picks = cleanPicks(picks);
  return next;
}

export function schooltoolDone(file: EconomyFile, date: string, period: number): boolean {
  return Boolean(file.meta.dayLog?.[date]?.schooltool?.[String(period)]);
}

export function setSchooltoolDone(file: EconomyFile, date: string, period: number, on: boolean): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).schooltool![String(period)] = on;
  return next;
}

export function periodVerified(file: EconomyFile, date: string, period: number): boolean {
  return Boolean(file.meta.dayLog?.[date]?.verify?.[String(period)]);
}

export function setPeriodVerified(file: EconomyFile, date: string, period: number, on: boolean): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).verify![String(period)] = on;
  return next;
}

export function dayCardsOn(file: EconomyFile, date: string): { title: string; body: string }[] {
  const cards = file.meta.dayLog?.[date]?.cards;
  if (cards?.some((c) => c.title.trim())) return [cards[0] ?? { title: "", body: "" }, cards[1] ?? { title: "", body: "" }];
  return boardCardsOf(file);
}

export function setDayCards(file: EconomyFile, date: string, cards: { title: string; body: string }[]): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).cards = cards.slice(0, 2).map((c) => ({ title: c.title.slice(0, 48), body: c.body.slice(0, 160) }));
  return next;
}

export function attendOn(s: EconomyFile["students"][number], date: string): string {
  return s.attend?.[date] ?? "";
}

export function setStudentAttend(file: EconomyFile, id: string, date: string, code: string): EconomyFile {
  const next = clone(file);
  const stamp = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
  const away = new Set(["nurse", "library", "teacher", "testing", "office", "excused", "absent"]);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const attend = { ...(s.attend ?? {}) };
    if (code) attend[date] = code;
    else delete attend[date];
    const gone = Boolean(code);
    let passes = [...(s.passes ?? [])];
    if (code && away.has(code)) {
      const open = passes.findIndex((p) => p.date === date && !p.in);
      if (open >= 0) passes[open] = { ...passes[open], where: code };
      else passes.push({ date, where: code, out: stamp, period: s.period });
    } else {
      passes = passes.map((p) => (p.date === date && !p.in ? { ...p, in: stamp } : p));
    }
    return {
      ...s,
      attend,
      passes,
      markTape: s.period === 6 && gone ? writeTape(s.markTape, date, "") : s.markTape,
      trackDays: s.period === 6 && gone ? { ...(s.trackDays ?? {}), [date]: "" } : s.trackDays,
    };
  });
  return next;
}

export function setCrewAttend(
  file: EconomyFile,
  period: number,
  crewKey: string,
  date: string,
  code: string,
): EconomyFile {
  let next = file;
  for (const s of file.students) {
    if (s.period === period && s.crewKey === crewKey && isLiveStudent(s, file.meta.quarterName)) {
      next = setStudentAttend(next, s.id, date, code);
    }
  }
  return next;
}

export function agendaStep(file: EconomyFile, date: string, period: number, crewKey: string): string {
  return file.meta.dayLog?.[date]?.agenda?.[`${period}|${crewKey}`] ?? "attend";
}

export function setAgendaStep(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
  step: string,
): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).agenda![`${period}|${crewKey}`] = step;
  return next;
}

export function cleanupOn(file: EconomyFile, date: string, period: number, crewKey: string): string {
  return file.meta.dayLog?.[date]?.cleanup?.[`${period}|${crewKey}`] ?? "";
}

export function setCleanup(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
  state: "done" | "miss",
): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).cleanup![`${period}|${crewKey}`] = state;
  if (state !== "miss") return next;
  const fee = Number(next.meta.config?.cleanupFee ?? 10);
  next.students = next.students.map((s) => {
    if (s.period !== period || s.crewKey !== crewKey) return s;
    if (!isLiveStudent(s, next.meta.quarterName)) return s;
    pushLedger(next, {
      id: s.id,
      type: "Cleanup",
      amount: -fee,
      date,
      note: "Workshop not cleaned",
    });
    return { ...s, deduct: Number(s.deduct || 0) + fee };
  });
  return next;
}

export function studentAssist(s: EconomyFile["students"][number], date: string): boolean {
  return Boolean(s.assistDays?.[date]);
}

export function setStudentAssist(file: EconomyFile, id: string, date: string, on: boolean): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const assistDays = { ...(s.assistDays ?? {}) };
    if (on) assistDays[date] = true;
    else delete assistDays[date];
    const marks = { ...(s.marks ?? {}) };
    if (marks[date] === "Assist") delete marks[date];
    return { ...s, assistDays, marks };
  });
  return next;
}

export function studentCleanup(s: EconomyFile["students"][number], date: string): string {
  return s.cleanupDays?.[date] ?? "";
}

export function setStudentCleanup(
  file: EconomyFile,
  id: string,
  date: string,
  state: "done" | "miss" | "",
): EconomyFile {
  const next = clone(file);
  const fee = Number(next.meta.config?.cleanupFee ?? 10);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const cleanupDays = { ...(s.cleanupDays ?? {}) };
    const prev = cleanupDays[date] ?? "";
    if (!state) delete cleanupDays[date];
    else cleanupDays[date] = state;
    let deduct = Number(s.deduct || 0);
    if (state === "miss" && prev !== "miss") {
      deduct += fee;
      pushLedger(next, { id: s.id, type: "Cleanup", amount: -fee, date, note: "Station not cleaned" });
    }
    return { ...s, cleanupDays, deduct };
  });
  return next;
}

export function markOn(s: EconomyFile["students"][number], date: string): string {
  const fromMarks = s.marks?.[date];
  if (fromMarks) return fromMarks;
  const slot = daySlot(date);
  if (slot.school) return days4(s.days)[slot.index] || "";
  return "";
}

function withDayMark(s: RawStudent, date: string, code: DayCode): RawStudent {
  const slot = daySlot(date);
  const marks = { ...(s.marks ?? {}) };
  if (code) marks[date] = code;
  else delete marks[date];
  const days = days4(s.days);
  if (slot.school) days[slot.index] = code;
  const investAsk = { ...(s.investAsk ?? {}) };
  if (code === "A" || code === "E" || code === "P" || !code) delete investAsk[date];
  return { ...s, marks, days, investAsk };
}

export function setStudentMark(file: EconomyFile, id: string, date: string, code: DayCode): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => (s.id === id ? withDayMark(s, date, code) : s));
  return next;
}

export function setCrewMark(
  file: EconomyFile,
  period: number,
  crewKey: string,
  date: string,
  code: DayCode,
): EconomyFile {
  const next = clone(file);
  const q = file.meta.quarterName;
  next.students = next.students.map((s) =>
    s.period === period && s.crewKey === crewKey && isLiveStudent(s, q) ? withDayMark(s, date, code) : s,
  );
  return next;
}

function ensureDay(file: EconomyFile, date: string) {
  const prev = file.meta.dayLog?.[date];
  const day = {
    ...(prev ?? {
      periodGoals: {},
      crewGoals: {},
      periodActivity: {},
      crewActivity: {},
    }),
    periodGoals: { ...(prev?.periodGoals ?? {}) },
    crewGoals: { ...(prev?.crewGoals ?? {}) },
    periodActivity: { ...(prev?.periodActivity ?? {}) },
    crewActivity: { ...(prev?.crewActivity ?? {}) },
    paintCheck: { ...(prev?.paintCheck ?? {}) },
    agenda: { ...(prev?.agenda ?? {}) },
    cleanup: { ...(prev?.cleanup ?? {}) },
    schooltool: { ...(prev?.schooltool ?? {}) },
    happened: { ...(prev?.happened ?? {}) },
    visits: { ...(prev?.visits ?? {}) },
    crewPhase: { ...(prev?.crewPhase ?? {}) },
    goalPhase: { ...(prev?.goalPhase ?? {}) },
    specials: [...(prev?.specials ?? [])],
    cards: [...(prev?.cards ?? [])],
    verify: { ...(prev?.verify ?? {}) },
  };
  file.meta.dayLog = { ...(file.meta.dayLog ?? {}), [date]: day };
  return day;
}

export function setPeriodGoal(file: EconomyFile, date: string, period: number, title: string): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).periodGoals[String(period)] = title;
  return next;
}

export function setCrewGoal(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
  title: string,
): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).crewGoals[`${period}|${crewKey}`] = title;
  return next;
}

export function periodGoal(file: EconomyFile, date: string, period: number): string {
  return file.meta.dayLog?.[date]?.periodGoals[String(period)] ?? "";
}

export function crewGoal(file: EconomyFile, date: string, period: number, crewKey: string): string {
  return file.meta.dayLog?.[date]?.crewGoals[`${period}|${crewKey}`] ?? "";
}

export function setPeriodActivity(file: EconomyFile, date: string, period: number, activity: string): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).periodActivity![String(period)] = activity;
  return next;
}

export function setCrewActivity(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
  activity: string,
): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).crewActivity![`${period}|${crewKey}`] = activity;
  return next;
}

export function activityFor(file: EconomyFile, date: string, period: number, crewKey?: string): string {
  const day = file.meta.dayLog?.[date];
  if (!day) return "";
  if (crewKey) {
    const crew = day.crewActivity?.[`${period}|${crewKey}`];
    if (crew) return crew;
  }
  return day.periodActivity?.[String(period)] ?? "";
}

export function happenedOn(file: EconomyFile, date: string, period: number, crewKey?: string): string {
  const day = file.meta.dayLog?.[date];
  if (!day?.happened) return "";
  if (crewKey) {
    const crew = day.happened[`${period}|${crewKey}`];
    if (crew) return crew;
  }
  return day.happened[String(period)] ?? "";
}

export function setHappened(
  file: EconomyFile,
  date: string,
  period: number,
  text: string,
  crewKey?: string,
): EconomyFile {
  const next = clone(file);
  const day = ensureDay(next, date);
  const key = crewKey ? `${period}|${crewKey}` : String(period);
  const t = text.slice(0, 400);
  if (t.trim()) day.happened![key] = t;
  else delete day.happened![key];
  return next;
}

export function addClassGoal(file: EconomyFile, title: string): EconomyFile {
  const name = title.trim();
  if (!name) return file;
  const next = clone(file);
  const list = [...(next.meta.config?.classGoals ?? [])];
  if (!list.includes(name)) list.push(name);
  next.meta.config = { ...(next.meta.config ?? {}), classGoals: list };
  return next;
}

export function setPaintCheck(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
  current: string,
): EconomyFile {
  const next = clone(file);
  const day = ensureDay(next, date);
  const key = `${period}|${crewKey}`;
  const prev = day.paintCheck?.[key];
  const path = [...(prev?.path ?? [])];
  if (!path.includes(current)) path.push(current);
  day.paintCheck![key] = { current, path };
  return next;
}

export function paintCheck(
  file: EconomyFile,
  date: string,
  period: number,
  crewKey: string,
): { current: string; path: string[] } | null {
  return file.meta.dayLog?.[date]?.paintCheck?.[`${period}|${crewKey}`] ?? null;
}

function pushLedger(
  file: EconomyFile,
  row: { id: string; type: string; amount: number; date: string; note: string },
) {
  file.meta.ledger = [...(file.meta.ledger ?? []), { ts: new Date().toISOString(), ...row }];
}

export function toggleInvest(file: EconomyFile, id: string, date: string): EconomyFile {
  const next = clone(file);
  const rates = next.meta.codes;
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const investDays = { ...(s.investDays ?? {}) };
    const parked = Number(investDays[date] || 0);
    if (parked > 0) {
      delete investDays[date];
      pushLedger(next, { id, type: "Uninvest", amount: -parked, date, note: "Back to wallet" });
      return { ...s, investDays };
    }
    const pay = dayPay(markOn(s, date), rates);
    if (pay <= 0) return s;
    investDays[date] = pay;
    pushLedger(next, { id, type: "Invest", amount: pay, date, note: `${markOn(s, date)} pay to market` });
    return { ...s, investDays };
  });
  return next;
}

export function askInvest(file: EconomyFile, id: string, date: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    if (Number(s.investDays?.[date] || 0) > 0) return s;
    const code = markOn(s, date);
    if (code !== "3" && code !== "2" && code !== "1") return s;
    const investAsk = { ...(s.investAsk ?? {}) };
    if (investAsk[date]) delete investAsk[date];
    else investAsk[date] = true;
    return { ...s, investAsk };
  });
  return next;
}

export function approveInvest(file: EconomyFile, id: string, date: string): EconomyFile {
  let next = toggleInvest(file, id, date);
  next = clone(next);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const investAsk = { ...(s.investAsk ?? {}) };
    delete investAsk[date];
    return { ...s, investAsk };
  });
  return next;
}

export function investCrew(file: EconomyFile, period: number, crewKey: string, date: string): EconomyFile {
  let next = file;
  for (const s of file.students) {
    if (s.period !== period || s.crewKey !== crewKey) continue;
    if (!isLiveStudent(s, file.meta.quarterName)) continue;
    const pay = dayPay(markOn(s, date), file.meta.codes);
    if (pay > 0 && !Number(s.investDays?.[date] || 0)) next = toggleInvest(next, s.id, date);
  }
  return next;
}

function clampMoney(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function bumpMoney(
  file: EconomyFile,
  id: string,
  field: "bonus" | "deduct" | "clutch",
  delta: number,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const min = field === "clutch" ? -MONEY_MAX : 0;
    const value = clampMoney(Number(s[field] || 0) + delta, min, MONEY_MAX);
    const type = field === "bonus" ? "Bonus" : field === "deduct" ? "Deduction" : "Clutch";
    if (delta !== 0) {
      pushLedger(next, {
        id,
        type,
        amount: field === "deduct" ? -Math.abs(delta) : delta,
        date: todayIso(),
        note: `${field} ${delta > 0 ? "+" : ""}${delta}`,
      });
    }
    return { ...s, [field]: value };
  });
  return next;
}

export type ShopItem = { category: string; name: string; price: number };

export const DEFAULT_HALL_SHOP: ShopItem[] = [
  { category: "SNACKS", name: "Goldfish", price: 5 },
  { category: "SNACKS", name: "Water", price: 3 },
  { category: "SUPPLIES", name: "Pencil", price: 2 },
  { category: "SUPPLIES", name: "Eraser", price: 2 },
  { category: "QUIET", name: "Puzzle time", price: 8 },
  { category: "QUIET", name: "Book pick", price: 5 },
  { category: "PERKS", name: "Helper pick", price: 10 },
  { category: "PERKS", name: "Seat choice", price: 15 },
];

export function hallShopOf(file: EconomyFile): ShopItem[] {
  const list = file.meta.config?.studyHall?.shop;
  return list?.length ? list : DEFAULT_HALL_SHOP;
}

export function catalogOf(file: EconomyFile, period: number): ShopItem[] {
  return period === 6 ? hallShopOf(file) : (file.meta.shop ?? []);
}

export function setShop(
  file: EconomyFile,
  shop: ShopItem[],
): EconomyFile {
  const next = clone(file);
  next.meta.shop = shop;
  return next;
}

export function setHallShop(file: EconomyFile, shop: ShopItem[]): EconomyFile {
  return putHall(file, { shop: shop.filter((x) => x.name.trim()) });
}

export function buyShop(file: EconomyFile, id: string, item: ShopItem): EconomyFile {
  const row = score(file).find((s) => s.id === id);
  if (!row || item.price <= 0 || row.quarter < item.price) return file;
  const hall = row.period === 6;
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const purchases = [
      ...(s.purchases ?? []),
      { ts: new Date().toISOString(), item: item.name, category: `${hall ? "HALL" : "SHOP"}/${item.category}`, price: item.price },
    ];
    pushLedger(next, {
      id,
      type: hall ? "Hall Purchase" : "Store Purchase",
      amount: -item.price,
      date: todayIso(),
      note: `${item.category}: ${item.name}`,
    });
    return { ...s, deduct: Number(s.deduct || 0) + item.price, purchases };
  });
  return next;
}

export function setFlags(
  file: EconomyFile,
  id: string,
  flags: NonNullable<EconomyFile["students"][number]["flags"]>,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => (s.id === id ? { ...s, flags } : s));
  return next;
}

export function setAffect(file: EconomyFile, id: string, date: string, emoji: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const affect = { ...(s.affect ?? {}) };
    if (emoji && affect[date] === emoji) delete affect[date];
    else affect[date] = emoji;
    return { ...s, affect };
  });
  return afterAffectMaybeConfirm(next, id, date);
}

export function setStudentReady(file: EconomyFile, id: string, date: string, code: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const readyDays = { ...(s.readyDays ?? {}) };
    if (!code || readyDays[date] === code) delete readyDays[date];
    else readyDays[date] = code;
    return { ...s, readyDays };
  });
  return next;
}

export function setStudentNote(file: EconomyFile, id: string, date: string, note: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const notes = { ...(s.notes ?? {}) };
    const t = note.slice(0, 280);
    if (t.trim()) notes[date] = t;
    else delete notes[date];
    return { ...s, notes };
  });
  return next;
}

export function setGradeOverride(
  file: EconomyFile,
  id: string,
  slotId: string,
  value: number | null,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const gradeOverrides = { ...(s.gradeOverrides ?? {}) };
    if (value == null || Number.isNaN(value)) delete gradeOverrides[slotId];
    else gradeOverrides[slotId] = Math.max(0, Math.min(100, Math.round(value)));
    return { ...s, gradeOverrides };
  });
  return next;
}

export function setAlias(file: EconomyFile, id: string, first: string): EconomyFile {
  const next = clone(file);
  const name = first.trim().slice(0, 24);
  if (!name) return file;
  const taken = next.students.filter((s) => s.id !== id).map((s) => s.first);
  const clash = taken.some((n) => n.trim().toLowerCase() === name.toLowerCase());
  const alias = clash ? aliasAfterId(id, taken) : name;
  next.students = next.students.map((s) => (s.id === id ? { ...s, first: alias } : s));
  return next;
}

export function setLegalNames(
  file: EconomyFile,
  id: string,
  legal: { legalFirst?: string; legalLast?: string },
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const legalFirst = legal.legalFirst !== undefined ? legal.legalFirst.trim().slice(0, 40) : s.legalFirst;
    const legalLast = legal.legalLast !== undefined ? legal.legalLast.trim().slice(0, 40) : s.legalLast;
    return {
      ...s,
      legalFirst: legalFirst || undefined,
      legalLast: legalLast || undefined,
      last: (legalLast || s.last || "").trim(),
    };
  });
  return next;
}

export function setStudentFlags(
  file: EconomyFile,
  id: string,
  patch: NonNullable<RawStudent["flags"]>,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((st) =>
    st.id === id ? { ...st, flags: { ...(st.flags ?? {}), ...patch } } : st,
  );
  return next;
}

export function setQuietNotes(file: EconomyFile, id: string, quietNotes: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((st) => (st.id === id ? { ...st, quietNotes } : st));
  return next;
}

export function rerollAlias(file: EconomyFile, id: string): EconomyFile {
  const next = clone(file);
  const target = next.students.find((s) => s.id === id);
  if (!target) return file;
  const used = next.students.filter((s) => s.id !== id).map((s) => s.first);
  const alias = generateAlias(`${id}|${Date.now()}`, used);
  next.students = next.students.map((s) => (s.id === id ? { ...s, first: alias } : s));
  return next;
}

function blankWorker(partial: {
  id: string;
  first: string;
  legalFirst?: string;
  legalLast?: string;
  period: number;
  grade?: number;
  crewKey: string;
  section?: number;
  course?: string;
  sem?: string;
}): RawStudent {
  const legalLast = (partial.legalLast ?? "").trim().slice(0, 40);
  const legalFirst = (partial.legalFirst ?? "").trim().slice(0, 40);
  const period = partial.period;
  return {
    id: partial.id,
    first: partial.first,
    last: legalLast,
    legalFirst: legalFirst || undefined,
    legalLast: legalLast || undefined,
    period,
    grade: partial.grade,
    crewKey: partial.crewKey,
    section: partial.section,
    course: partial.course,
    sem: partial.sem,
    days: ["", "", "", ""],
    marks: {},
    investDays: {},
    investAsk: {},
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    flags: {},
    purchases: [],
    prints: {},
    abDay: "BOTH",
    attend: {},
    affect: {},
    notes: {},
    cleanupDays: {},
    assistDays: {},
    skills: {},
    skillLog: [],
    picks: [],
    gradeOverrides: {},
    groups: period === 6 ? { hall: true } : period === 0 ? { club: true } : undefined,
  };
}

export type TypedStudent = {
  legalFirst?: string;
  legalLast?: string;
  period: number;
  crewKey?: string;
  section?: number;
  grade?: number;
  course?: string;
  sem?: string;
};

function defaultCrewKey(file: EconomyFile, period: number, idx: number): string {
  if (period === 6) return "Hall";
  if (period === 0) return "CLUB";
  const crews = file.crews.filter((c) => c.period === period);
  if (!crews.length) return "Crew A";
  return crews[idx % crews.length]?.key ?? crews[0].key;
}

/** Mint a locked id, then an alias. Legal names never become the wall name. */
export function addTypedStudent(file: EconomyFile, row: TypedStudent): EconomyFile {
  const legalLast = (row.legalLast ?? "").trim();
  const legalFirst = (row.legalFirst ?? "").trim();
  if (!legalLast && !legalFirst) return file;
  const next = clone(file);
  const id = newStudentId(next.students.map((s) => s.id));
  const used = next.students.map((s) => s.first);
  const alias = aliasAfterId(id, used);
  const bells = bellFor(next);
  const period = row.period;
  const grade = row.grade ?? bells.find((b) => b.period === period)?.grade ?? 6;
  const crewKey = row.crewKey?.trim() || defaultCrewKey(next, period, next.students.filter((s) => s.period === period).length);
  const quarter = next.meta.quarterName || "Q1";
  const kid = blankWorker({
    id,
    first: alias,
    legalFirst,
    legalLast,
    period,
    grade,
    crewKey,
    section: row.section ?? (period === 6 ? 10 : 1),
    course: row.course ?? (period === 6 ? "STUDY HALL" : period === 0 ? "TECH CLUB" : `TECH ${grade}`),
    sem: row.sem ?? (period === 0 ? "CLUB" : period === 6 ? "YEAR" : quarter),
  });
  next.students = [...next.students, kid];
  return next;
}

export function patchStudent(
  file: EconomyFile,
  id: string,
  patch: Partial<Pick<RawStudent, "crewKey" | "period" | "section" | "grade" | "sem" | "course" | "abDay">>,
): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    return { ...s, ...patch, id: s.id };
  });
  return next;
}

export function legalNameKey(last: string, first: string): string {
  return `${last.trim().toLowerCase()}|${first.trim().toLowerCase()}`;
}

export function importLegalRoster(file: EconomyFile, rows: LegalRosterRow[]): EconomyFile {
  if (!rows.length) return file;
  const next = clone(file);
  const used = next.students.map((s) => s.first);
  const quarter = next.meta.quarterName || "Q1";
  const bells = bellFor(next);
  const ids = next.students.map((s) => s.id);
  const byName = new Map<string, number>();
  next.students.forEach((s, i) => {
    const key = legalNameKey(s.legalLast || s.last || "", s.legalFirst || "");
    if (key !== "|") byName.set(key, i);
  });

  for (const row of rows) {
    const legalLast = row.legalLast.trim().slice(0, 40);
    const legalFirst = row.legalFirst.trim().slice(0, 40);
    const key = legalNameKey(legalLast, legalFirst);
    const hit = key !== "|" ? byName.get(key) : undefined;
    if (hit != null) {
      const cur = next.students[hit]!;
      next.students[hit] = {
        ...cur,
        period: row.period || cur.period,
        legalFirst: legalFirst || cur.legalFirst,
        legalLast: legalLast || cur.legalLast,
        last: legalLast || cur.last,
        flags: {
          ...(cur.flags ?? {}),
          iep: Boolean(row.iep) || Boolean(cur.flags?.iep),
          plan504: Boolean(row.plan504) || Boolean(cur.flags?.plan504),
        },
      };
      continue;
    }
    const id = newStudentId(ids);
    ids.push(id);
    const alias = aliasAfterId(id, used);
    used.push(alias);
    const grade = bells.find((b) => b.period === row.period)?.grade ?? 6;
    const crewKey = row.crewKey?.trim() || defaultCrewKey(next, row.period, next.students.filter((s) => s.period === row.period).length);
    const kid = {
      ...blankWorker({
        id,
        first: alias,
        legalFirst,
        legalLast,
        period: row.period,
        grade,
        crewKey,
        section: 1,
        course: grade === 5 ? "STUDY HALL" : `TECH ${grade}`,
        sem: quarter,
      }),
      flags: {
        iep: Boolean(row.iep),
        plan504: Boolean(row.plan504),
      },
      abDay: row.period === 6 ? (next.students.filter((s) => s.period === 6).length % 2 === 0 ? "A" : "B") : "BOTH",
    } as RawStudent;
    byName.set(key, next.students.length);
    next.students.push(kid);
  }

  return next;
}

export function applyDjia(file: EconomyFile, quote: DjiaQuote): EconomyFile {
  const next = clone(file);
  next.meta.market = {
    source: "DOW",
    index: quote.weekAvg,
    baseline: quote.baseline,
    shock: Math.round(quote.wowPct * 10) / 10,
    factor: quote.factor,
  };
  return next;
}

export function sheetTsv(file: EconomyFile): string {
  const header = ["First", "Period", "Crew", "D1", "D2", "D3", "D4", "Bonus", "Deduct", "Clutch"].join("\t");
  const rows = file.students
    .filter((s) => isLiveStudent(s, file.meta.quarterName))
    .map((s) => {
      const d = days4(s.days);
      return [s.first, s.period, s.crewKey, d[0], d[1], d[2], d[3], s.bonus || 0, s.deduct || 0, s.clutch || 0].join(
        "\t",
      );
    });
  return [header, ...rows].join("\n");
}

export function closeWeek(file: EconomyFile): EconomyFile {
  const next = clone(file);
  const rates = next.meta.codes;
  const weekDates = weekOn(todayIso())?.days ?? [];
  next.students = next.students.map((s) => {
    const weekPay = days4(s.days).reduce((sum, d) => sum + dayPay(d, rates), 0);
    const live = weekPay + Number(s.bonus || 0) - Number(s.deduct || 0) + Number(s.clutch || 0);
    const weekInv = weekDates.reduce((n, d) => n + Number(s.investDays?.[d] || 0), 0);
    return {
      ...s,
      opening: Number(s.opening || 0) + live - weekInv,
      days: ["", "", "", ""],
      bonus: 0,
      deduct: 0,
      clutch: 0,
    };
  });
  const w = Number(next.meta.currentWeek || 1);
  next.meta.currentWeek = w >= 8 ? 8 : w + 1;
  return next;
}

export function endSession(file: EconomyFile): EconomyFile {
  const next = closeWeek(file);
  const scored = score(next);
  const cash = scored.reduce((s, x) => s + x.quarter, 0);
  const xp = scored.reduce((s, x) => s + skillXp(next, x.id), 0);
  const blocks = sessions();
  const label = next.meta.quarterName || "S1";
  const block = blocks.find((b) => b.label === label) ?? blocks[0];
  const archive = [...(next.meta.sessions ?? [])];
  archive.push({
    n: archive.length + 1,
    label,
    start: block?.start ?? "",
    end: block?.end ?? "",
    cash,
    xp,
    headcount: scored.length,
  });
  next.meta.sessions = archive;
  const i = blocks.findIndex((b) => b.label === label);
  next.meta.quarterName = blocks[i + 1]?.label ?? label;
  next.meta.currentWeek = 1;
  return next;
}

export function boardCardsOf(file: EconomyFile): { title: string; body: string }[] {
  const cards = file.meta.config?.boardCards ?? [{ title: "", body: "" }, { title: "", body: "" }];
  return [cards[0] ?? { title: "", body: "" }, cards[1] ?? { title: "", body: "" }];
}

export function setBoardCard(file: EconomyFile, index: 0 | 1, card: { title: string; body: string }): EconomyFile {
  const next = clone(file);
  const cards = boardCardsOf(next);
  cards[index] = { title: card.title.slice(0, 48), body: card.body.slice(0, 240) };
  next.meta.config = { ...(next.meta.config ?? {}), boardCards: cards };
  return next;
}

export type HallOwe = { id: string; item: string };

export function hallOf(file: EconomyFile) {
  const h = file.meta.config?.studyHall ?? {};
  return {
    showNotes: Boolean(h.showNotes),
    showOwes: Boolean(h.showOwes),
    notes: [...(h.notes ?? [])].map((n) => n.trim()).filter(Boolean),
    owes: [...(h.owes ?? [])].filter((o) => o.id && o.item.trim()),
    shop: (h.shop?.length ? h.shop : DEFAULT_HALL_SHOP).map((x) => ({
      category: x.category,
      name: x.name,
      price: Number(x.price) || 0,
    })),
  };
}

function putHall(
  file: EconomyFile,
  patch: { showNotes?: boolean; showOwes?: boolean; notes?: string[]; owes?: HallOwe[]; shop?: ShopItem[] },
): EconomyFile {
  const next = clone(file);
  const cur = hallOf(next);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    studyHall: {
      showNotes: patch.showNotes ?? cur.showNotes,
      showOwes: patch.showOwes ?? cur.showOwes,
      notes: patch.notes ?? cur.notes,
      owes: patch.owes ?? cur.owes,
      shop: patch.shop ?? cur.shop,
    },
  };
  return next;
}

export function setHallShow(file: EconomyFile, key: "notes" | "owes", on: boolean): EconomyFile {
  return putHall(file, key === "notes" ? { showNotes: on } : { showOwes: on });
}

export function setHallNotes(file: EconomyFile, notes: string[]): EconomyFile {
  return putHall(file, { notes: notes.map((n) => n.trim()).filter(Boolean).slice(0, 12) });
}

export function setHallOwes(file: EconomyFile, owes: HallOwe[]): EconomyFile {
  return putHall(file, { owes: owes.filter((o) => o.id && o.item.trim()).slice(0, 24) });
}

export type LinePick = "fair" | "xp" | "draw";

export function lineLeaderOn(file: EconomyFile, date: string): string {
  return file.meta.config?.lineLeaders?.[date] ?? "";
}

export function setLineLeader(file: EconomyFile, date: string, id: string): EconomyFile {
  const next = clone(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    lineLeaders: { ...(next.meta.config?.lineLeaders ?? {}), [date]: id },
  };
  return next;
}

export function pickLineLeader(file: EconomyFile, date: string, kids: RawStudent[], mode: LinePick): EconomyFile {
  if (!kids.length) return file;
  const prev = lineLeaderOn(file, date);
  let pick = kids[0];
  if (mode === "xp") {
    pick = [...kids].sort((a, b) => skillXp(file, b.id) - skillXp(file, a.id) || a.first.localeCompare(b.first))[0];
  } else if (mode === "draw") {
    const pool = kids.filter((s) => s.id !== prev);
    const use = pool.length ? pool : kids;
    pick = use[Math.floor(Math.random() * use.length)];
  } else {
    const days = (id: string) => roleHistoryOf(file).filter((e) => e.role === "line_leader" && e.studentId === id).length;
    pick = [...kids].sort((a, b) => days(a.id) - days(b.id) || skillXp(file, a.id) - skillXp(file, b.id) || a.first.localeCompare(b.first))[0];
  }
  return setLineLeader(file, date, pick.id);
}

export function setTrack(file: EconomyFile, id: string, date: string, code: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const trackDays = { ...(s.trackDays ?? {}) };
    if (code) trackDays[date] = code;
    else delete trackDays[date];
    const paid = s.period === 6 && (code === "on" || code === "productive" || code === "peaceful");
    return {
      ...s,
      trackDays,
      markTape: s.period === 6 ? writeTape(s.markTape, date, paid ? "2" : "") : s.markTape,
    };
  });
  return next;
}

export function setAvatar(file: EconomyFile, id: string, icon: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => (s.id === id ? { ...s, icon } : s));
  return next;
}

export function fillBlankPicks(file: EconomyFile, period: number, house: string[]): EconomyFile {
  const next = clone(file);
  const picks = cleanPicks(house).slice(0, 3);
  next.students = next.students.map((s) => {
    if (s.period !== period) return s;
    if ((s.picks ?? []).filter(Boolean).length >= 3) return s;
    return { ...s, picks };
  });
  return next;
}

export function setCrewPicks(file: EconomyFile, period: number, crewKey: string, picks: string[]): EconomyFile {
  const next = clone(file);
  const p = cleanPicks(picks).slice(0, 3);
  next.students = next.students.map((s) => (s.period === period && s.crewKey === crewKey ? { ...s, picks: p } : s));
  return next;
}

export const VISIT_STATES = ["OPEN", "MEETING", "CLOSED", "SUB"] as const;
export type VisitState = (typeof VISIT_STATES)[number];

export function visitOn(file: EconomyFile, date: string, period: number): VisitState {
  const raw = String(file.meta.dayLog?.[date]?.visits?.[String(period)] ?? "").toUpperCase();
  if ((VISIT_STATES as readonly string[]).includes(raw)) return raw as VisitState;
  if (isSubDay(file, date)) return "SUB";
  return "OPEN";
}

export function setVisit(file: EconomyFile, date: string, period: number, state: VisitState): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).visits![String(period)] = state;
  return next;
}

export function setVisitAll(file: EconomyFile, date: string, state: VisitState): EconomyFile {
  const next = clone(file);
  const day = ensureDay(next, date);
  day.visits = day.visits ?? {};
  const periods = [...new Set((next.meta.bell ?? []).map((b) => b.period))];
  if (!periods.length) periods.push(1, 2, 3, 6, 8, 9, 10);
  for (const p of periods) day.visits[String(p)] = state;
  if (state === "SUB") day.sub = true;
  return next;
}

export function cycleVisit(file: EconomyFile, date: string, period: number): EconomyFile {
  const cur = visitOn(file, date, period);
  const i = VISIT_STATES.indexOf(cur);
  return setVisit(file, date, period, VISIT_STATES[(i + 1) % VISIT_STATES.length]);
}

export function deskPacks(file: EconomyFile): BellPack[] {
  const extra = file.meta.config?.bellPacks;
  return extra?.length ? extra : builtinPacks();
}

export function deskBellId(file: EconomyFile, date = todayIso()): string {
  return file.meta.dayLog?.[date]?.bell || file.meta.config?.schedule || "regular";
}

export function setDayBell(file: EconomyFile, date: string, id: string): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).bell = id;
  return next;
}

export type DaySpecial = { title: string; who?: string; place?: string; start?: string; end?: string; period?: number };

export function specialsOn(file: EconomyFile, date: string): DaySpecial[] {
  const d = file.meta.dayLog?.[date];
  if (d?.specials?.length) return d.specials;
  if (d?.special) return [d.special];
  return [];
}

export function setSpecials(file: EconomyFile, date: string, list: DaySpecial[]): EconomyFile {
  const next = clone(file);
  ensureDay(next, date).specials = list;
  return next;
}

export function passOpen(s: EconomyFile["students"][number], date: string) {
  return (s.passes ?? []).find((p) => p.date === date && !p.in);
}

export function outNow(file: EconomyFile, date: string) {
  const away = new Set(["nurse", "library", "teacher", "testing", "office"]);
  return file.students.flatMap((s) => {
    const where = attendOn(s, date);
    const pass = passOpen(s, date);
    if (!pass && !away.has(where)) return [];
    return [{ student: s, where: where || pass?.where || "", pass }];
  });
}

export function grantClubEarn(file: EconomyFile, id: string, date: string): EconomyFile {
  const next = clone(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    if (s.clubDays?.[date]) return s;
    return {
      ...s,
      clubDays: { ...(s.clubDays ?? {}), [date]: true },
      bonus: Number(s.bonus || 0) + 10,
      bonusXp: Number(s.bonusXp || 0) + 2,
    };
  });
  return next;
}

