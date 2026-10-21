import type { EconomyFile } from "@/lib/economy";
import type { TeachDay } from "@/lib/teach";
import { cloneFile } from "@/lib/clone";
import { isSchoolDay, stepSchoolDay } from "@/lib/calendar";

export type BumpResult = { file: EconomyFile; moved: number; overflow: string[] };

type Slice = {
  teach?: TeachDay;
  activity?: string;
  crewActivity?: Record<string, string>;
  goal?: string;
  crewGoals?: Record<string, string>;
};

type DayLog = NonNullable<EconomyFile["meta"]["dayLog"]>[string];

function keyOf(period: number): string {
  return String(period);
}

function prefix(period: number): string {
  return `${period}|`;
}

function pickPref(map: Record<string, string> | undefined, period: number): Record<string, string> | undefined {
  if (!map) return undefined;
  const p = prefix(period);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(p) && v) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function dropPref(map: Record<string, string> | undefined, period: number) {
  if (!map) return;
  const p = prefix(period);
  for (const k of Object.keys(map)) if (k.startsWith(p)) delete map[k];
}

function readSlice(file: EconomyFile, date: string, period: number): Slice | null {
  const raw = file.meta.config?.teachDays?.[date]?.[keyOf(period)];
  const teach = raw && Object.keys(raw).length ? { ...raw } : undefined;
  const day = file.meta.dayLog?.[date];
  const activity = day?.periodActivity?.[keyOf(period)] || undefined;
  const crewActivity = pickPref(day?.crewActivity, period);
  const goal = day?.periodGoals?.[keyOf(period)] || undefined;
  const crewGoals = pickPref(day?.crewGoals, period);
  if (!teach && !activity && !crewActivity && !goal && !crewGoals) return null;
  return { teach, activity, crewActivity, goal, crewGoals };
}

function dayMeaningful(day: DayLog): boolean {
  if (day.lunch || day.sub || day.bell) return true;
  if (day.special || day.specials?.length || day.cards?.length) return true;
  if (Object.keys(day.periodGoals ?? {}).length) return true;
  if (Object.keys(day.crewGoals ?? {}).length) return true;
  const maps = ["periodActivity", "crewActivity", "happened", "visits", "crewPhase", "goalPhase", "ppe", "schooltool", "verify", "ticket", "paintCheck", "cleanup", "agenda"] as const;
  for (const k of maps) {
    const v = day[k];
    if (v && typeof v === "object" && Object.keys(v).length) return true;
  }
  return false;
}

/** ensureDay stamps these even when empty. A day created only for a move does not. */
function hasShell(day: DayLog): boolean {
  return "paintCheck" in day || "agenda" in day || "happened" in day || "specials" in day || "cards" in day || "verify" in day;
}

function clearSlice(file: EconomyFile, date: string, period: number) {
  const key = keyOf(period);
  const days = file.meta.config?.teachDays;
  if (days?.[date]) {
    delete days[date][key];
    if (!Object.keys(days[date]).length) delete days[date];
  }
  const day = file.meta.dayLog?.[date];
  if (!day) return;
  if (day.periodActivity) delete day.periodActivity[key];
  if (day.periodGoals) delete day.periodGoals[key];
  dropPref(day.crewActivity, period);
  dropPref(day.crewGoals, period);
  if (file.meta.dayLog && !dayMeaningful(day) && !hasShell(day)) delete file.meta.dayLog[date];
}

function writeSlice(file: EconomyFile, date: string, period: number, slice: Slice) {
  const key = keyOf(period);
  if (slice.teach && Object.keys(slice.teach).length) {
    const config = { ...(file.meta.config ?? {}) };
    const days = { ...(config.teachDays ?? {}) };
    days[date] = { ...(days[date] ?? {}), [key]: { ...slice.teach } };
    config.teachDays = days;
    file.meta.config = config;
  }
  const needLog = Boolean(slice.activity || slice.goal || slice.crewActivity || slice.crewGoals);
  if (!needLog) return;
  const log = { ...(file.meta.dayLog ?? {}) };
  const prev = log[date];
  const day: DayLog = prev
    ? {
        ...prev,
        periodGoals: { ...prev.periodGoals },
        crewGoals: { ...prev.crewGoals },
        periodActivity: { ...(prev.periodActivity ?? {}) },
        crewActivity: { ...(prev.crewActivity ?? {}) },
      }
    : {
        periodGoals: {},
        crewGoals: {},
      };
  if (slice.goal) day.periodGoals[key] = slice.goal;
  if (slice.activity) day.periodActivity = { ...(day.periodActivity ?? {}), [key]: slice.activity };
  if (slice.crewActivity) day.crewActivity = { ...(day.crewActivity ?? {}), ...slice.crewActivity };
  if (slice.crewGoals) Object.assign(day.crewGoals, slice.crewGoals);
  log[date] = day;
  file.meta.dayLog = log;
}

function plannedDates(file: EconomyFile, fromIso: string, period: number): string[] {
  const dates = new Set<string>();
  for (const date of Object.keys(file.meta.config?.teachDays ?? {})) {
    if (date >= fromIso && readSlice(file, date, period)) dates.add(date);
  }
  for (const date of Object.keys(file.meta.dayLog ?? {})) {
    if (date >= fromIso && readSlice(file, date, period)) dates.add(date);
  }
  return [...dates].filter((d) => isSchoolDay(d)).sort();
}

function applyMoves(file: EconomyFile, moves: Map<string, Slice>, clearDates: string[], period: number): EconomyFile {
  const next = cloneFile(file);
  for (const date of clearDates) clearSlice(next, date, period);
  for (const [date, slice] of moves) writeSlice(next, date, period, slice);
  return next;
}

/** Slide every later lesson in one period forward one school day. Latest day first. */
export function bumpDay(file: EconomyFile, fromIso: string, period: number): BumpResult {
  const dates = plannedDates(file, fromIso, period);
  const slices = new Map<string, Slice>();
  for (const date of dates) {
    const slice = readSlice(file, date, period);
    if (slice) slices.set(date, slice);
  }
  const final = new Map<string, Slice>();
  const overflow: string[] = [];
  for (const date of [...slices.keys()].sort().reverse()) {
    const slice = slices.get(date)!;
    const dest = stepSchoolDay(date, 1);
    const open = dest > date && isSchoolDay(dest) && !final.has(dest);
    if (!open) {
      overflow.push(date);
      final.set(date, slice);
      continue;
    }
    final.set(dest, slice);
  }
  let moved = 0;
  for (const [dest, slice] of final) {
    const home = [...slices.entries()].find(([, s]) => s === slice)?.[0];
    if (home && home !== dest) moved += 1;
  }
  return { file: applyMoves(file, final, [...slices.keys()], period), moved, overflow };
}

function shiftBack(file: EconomyFile, fromIso: string, period: number): BumpResult {
  const dates = plannedDates(file, fromIso, period).filter((d) => d > fromIso);
  const slices = new Map<string, Slice>();
  for (const date of dates) {
    const slice = readSlice(file, date, period);
    if (slice) slices.set(date, slice);
  }
  const final = new Map<string, Slice>();
  let moved = 0;
  for (const date of [...slices.keys()].sort()) {
    const slice = slices.get(date)!;
    const prev = stepSchoolDay(date, -1);
    const open = prev < date && prev >= fromIso && isSchoolDay(prev) && stepSchoolDay(prev, 1) === date && !final.has(prev);
    if (open) {
      final.set(prev, slice);
      moved += 1;
    } else final.set(date, slice);
  }
  return { file: applyMoves(file, final, [...slices.keys()], period), moved, overflow: [] };
}

function planSnap(file: EconomyFile): unknown {
  return { teach: file.meta.config?.teachDays ?? {}, log: file.meta.dayLog ?? {} };
}

function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) out[k] = stable((v as Record<string, unknown>)[k]);
    return out;
  }
  return v ?? null;
}

function samePlan(a: EconomyFile, b: EconomyFile): boolean {
  return JSON.stringify(stable(planSnap(a))) === JSON.stringify(stable(planSnap(b)));
}

/** Exact inverse of bumpDay for the same from-date and period. */
export function unbumpDay(file: EconomyFile, fromIso: string, period: number): BumpResult {
  const back = shiftBack(file, fromIso, period);
  const again = bumpDay(back.file, fromIso, period);
  if (!samePlan(again.file, file)) return { file, moved: 0, overflow: [] };
  return back;
}
