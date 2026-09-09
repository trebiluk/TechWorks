import type { EconomyFile, RawStudent } from "@/lib/economy";
import { weekOn, todayIso } from "@/lib/calendar";
import { packMarks, trimTape } from "@/lib/tape";
import { compactPolls } from "@/lib/polls";

function emptyMap(v: unknown): boolean {
  if (!v || typeof v !== "object") return true;
  return Object.keys(v as object).length === 0;
}

function slimMap<T extends Record<string, unknown>>(v: T | undefined): T | undefined {
  if (!v || emptyMap(v)) return undefined;
  const out = {} as T;
  for (const [k, val] of Object.entries(v)) {
    if (val == null || val === "" || val === false) continue;
    if (typeof val === "object" && emptyMap(val)) continue;
    (out as Record<string, unknown>)[k] = val;
  }
  return emptyMap(out) ? undefined : out;
}

export function compactStudent(s: RawStudent): RawStudent {
  const tape = trimTape(s.markTape || packMarks(s.marks, s.markTape));
  const next: RawStudent = {
    id: s.id,
    first: s.first,
    last: s.last,
    period: s.period,
    crewKey: s.crewKey,
    days: s.days?.length ? s.days : ["", "", "", ""],
    bonus: Number(s.bonus || 0) || 0,
    deduct: Number(s.deduct || 0) || 0,
    clutch: Number(s.clutch || 0) || 0,
    opening: Number(s.opening || 0) || 0,
  };
  if (s.crewByCycle && Object.keys(s.crewByCycle).length) next.crewByCycle = s.crewByCycle;
  const crewDays = slimMap(s.crewDays as Record<string, unknown> | undefined);
  if (crewDays) next.crewDays = crewDays as RawStudent["crewDays"];
  if (s.legalFirst) next.legalFirst = s.legalFirst;
  if (s.legalLast) next.legalLast = s.legalLast;
  if (s.grade) next.grade = s.grade;
  if (s.section) next.section = s.section;
  if (s.course) next.course = s.course;
  if (s.sem) next.sem = s.sem;
  if (s.abDay && s.abDay !== "BOTH") next.abDay = s.abDay;
  if (tape) next.markTape = tape;
  const flags = slimMap(s.flags as Record<string, unknown> | undefined);
  if (flags) next.flags = flags as RawStudent["flags"];
  const invest = slimMap(s.investDays as Record<string, unknown> | undefined);
  if (invest) next.investDays = invest as RawStudent["investDays"];
  const ask = slimMap(s.investAsk as Record<string, unknown> | undefined);
  if (ask) next.investAsk = ask as RawStudent["investAsk"];
  const skills = slimMap(s.skills as Record<string, unknown> | undefined);
  if (skills) next.skills = skills as RawStudent["skills"];
  if (s.skillLog?.length) next.skillLog = s.skillLog.slice(-120);
  const notes = slimMap(s.notes as Record<string, unknown> | undefined);
  if (notes) next.notes = notes as RawStudent["notes"];
  const affect = slimMap(s.affect as Record<string, unknown> | undefined);
  if (affect) next.affect = affect as RawStudent["affect"];
  const cleanup = slimMap(s.cleanupDays as Record<string, unknown> | undefined);
  if (cleanup) next.cleanupDays = cleanup as RawStudent["cleanupDays"];
  const catchDays = slimMap(s.cleanupCatchDays as Record<string, unknown> | undefined);
  if (catchDays) next.cleanupCatchDays = catchDays as RawStudent["cleanupCatchDays"];
  const assist = slimMap(s.assistDays as Record<string, unknown> | undefined);
  if (assist) next.assistDays = assist as RawStudent["assistDays"];
  const ready = slimMap(s.readyDays as Record<string, unknown> | undefined);
  if (ready) next.readyDays = ready as RawStudent["readyDays"];
  const track = slimMap(s.trackDays as Record<string, unknown> | undefined);
  if (track) next.trackDays = track as RawStudent["trackDays"];
  const attend = slimMap(s.attend as Record<string, unknown> | undefined);
  if (attend) next.attend = attend as RawStudent["attend"];
  if (s.passes?.length) next.passes = s.passes;
  if (s.lucky?.length) next.lucky = s.lucky;
  const grades = slimMap(s.gradeOverrides as Record<string, unknown> | undefined);
  if (grades) next.gradeOverrides = grades as RawStudent["gradeOverrides"];
  if (s.picks?.length) next.picks = s.picks;
  if (s.icon) next.icon = s.icon;
  if (s.purchases?.length) next.purchases = s.purchases;
  const prints = slimMap(s.prints as Record<string, unknown> | undefined);
  if (prints) next.prints = prints as RawStudent["prints"];
  if (s.quietNotes) next.quietNotes = s.quietNotes;
  if (s.bonusXp) next.bonusXp = s.bonusXp;
  const clubDays = slimMap(s.clubDays as Record<string, unknown> | undefined);
  if (clubDays) next.clubDays = clubDays as RawStudent["clubDays"];
  const groups = slimMap(s.groups as Record<string, unknown> | undefined);
  if (groups) next.groups = groups as RawStudent["groups"];
  return next;
}

/** Keep this week + last 10 school days of dayLog in the hot file. */
export function hotDayLog(file: EconomyFile): EconomyFile["meta"]["dayLog"] {
  const log = file.meta.dayLog ?? {};
  const keep = new Set<string>();
  const week = weekOn(todayIso())?.days ?? [];
  for (const d of week) keep.add(d);
  const dates = Object.keys(log).sort();
  for (const d of dates.slice(-10)) keep.add(d);
  const out: NonNullable<EconomyFile["meta"]["dayLog"]> = {};
  for (const d of keep) {
    if (log[d]) out[d] = log[d];
  }
  return out;
}

export function compactFile(file: EconomyFile): EconomyFile {
  return {
    ...file,
    students: file.students.map(compactStudent),
    meta: {
      ...file.meta,
      dayLog: hotDayLog(file),
      ledger: (file.meta.ledger ?? []).slice(-400),
      polls: compactPolls(file),
    },
  };
}

export function bytesOf(file: EconomyFile): number {
  return JSON.stringify(file).length;
}
