import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import { formatSchoolDate, instructionalWeeks, isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { activitiesOf, gradeOfPeriod, pinDayActivity, pinnedActivityId, slotsOf } from "@/lib/projects";
import { copyTeachHour, packOf, teachDay, teachHourFilled, type TeachDay } from "@/lib/teach";

export type PlanCell = {
  date: string;
  period: number;
  grade: number;
  course: string;
  label: string;
  activityId: string;
  activityName: string;
  title: string;
  pack: string;
  packLabel: string;
  ask: string;
  do: string;
  objective: string;
  close: string;
  materials: string;
  homework: string;
  mods: string;
  notes: string;
  reflect: string;
  move: string;
  set: boolean;
  live: boolean;
  school: boolean;
};

const STEP_NAMES = new Set(["Ask", "Imagine", "Plan", "Create", "Improve", "Share", "Safety", "Sketch", "Build", "Test", "New activity", "This class"]);

/** Unit names come from the job, never from a process-step chip. */
export function planitUnitName(title: string, question = ""): string {
  const t = title.trim().slice(0, 42);
  if (t && !STEP_NAMES.has(t)) return t;
  const q = question.trim().slice(0, 42);
  if (q && !STEP_NAMES.has(q)) return q;
  return "This class";
}

function dow(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay();
}

export function alignWeekDays(from: string[], to: string[]): { from: string; to: string }[] {
  const map = new Map<number, string>();
  for (const d of from) map.set(dow(d), d);
  const out: { from: string; to: string }[] = [];
  for (const d of to) {
    const src = map.get(dow(d));
    if (src) out.push({ from: src, to: d });
  }
  return out;
}

export function prevWeekDays(iso: string): string[] {
  const weeks = instructionalWeeks();
  const cur = weekOn(iso);
  const i = weeks.findIndex((w) => w.start === cur?.start);
  return i > 0 ? weeks[i - 1]!.days : [];
}

export function nextWeekDays(iso: string): string[] {
  const weeks = instructionalWeeks();
  const cur = weekOn(iso);
  const i = weeks.findIndex((w) => w.start === cur?.start);
  return i >= 0 && i < weeks.length - 1 ? weeks[i + 1]!.days : [];
}

export function sameGradePeriods(file: EconomyFile, period: number): number[] {
  const g = gradeOfPeriod(file, period);
  return shopBells(file)
    .filter((b) => b.period !== period && gradeOfPeriod(file, b.period) === g)
    .map((b) => b.period);
}

export function hourIsSet(file: EconomyFile, date: string, period: number): boolean {
  if (pinnedActivityId(file, period, date)) return true;
  return teachHourFilled(teachDay(file, date, period));
}

export function copyHour(
  file: EconomyFile,
  fromDate: string,
  fromPeriod: number,
  toDate: string,
  toPeriod: number,
): EconomyFile {
  if (fromDate === toDate && fromPeriod === toPeriod) return file;
  if (!hourIsSet(file, fromDate, fromPeriod)) return file;
  let next = copyTeachHour(file, fromDate, fromPeriod, toDate, toPeriod);
  const pin = pinnedActivityId(file, fromPeriod, fromDate);
  next = pinDayActivity(next, toDate, toPeriod, pin || "");
  return next;
}

export function copyHourToSameGrade(file: EconomyFile, date: string, period: number): EconomyFile {
  let next = file;
  for (const p of sameGradePeriods(file, period)) next = copyHour(next, date, period, date, p);
  return next;
}

/** Same grade, empty hours only — never wipe a period that already has a plan. */
export function copyHourToEmptySameGrade(file: EconomyFile, date: string, period: number): EconomyFile {
  let next = file;
  for (const p of sameGradePeriods(file, period)) {
    if (hourIsSet(next, date, p)) continue;
    next = copyHour(next, date, period, date, p);
  }
  return next;
}

export function copyHourToAllPeriods(file: EconomyFile, date: string, period: number): EconomyFile {
  let next = file;
  for (const b of shopBells(file)) {
    if (b.period === period) continue;
    next = copyHour(next, date, period, date, b.period);
  }
  return next;
}

export function copyHourThroughWeek(file: EconomyFile, date: string, period: number): EconomyFile {
  const days = weekOn(date)?.days ?? [date];
  let next = file;
  for (const d of days) {
    if (d === date || !isSchoolDay(d)) continue;
    next = copyHour(next, date, period, d, period);
  }
  return next;
}

export function copyPrevWeek(file: EconomyFile, iso: string): EconomyFile {
  const cur = weekOn(iso)?.days ?? [];
  const prev = prevWeekDays(iso);
  if (!cur.length || !prev.length) return file;
  let next = file;
  for (const pair of alignWeekDays(prev, cur)) {
    for (const b of shopBells(file)) next = copyHour(next, pair.from, b.period, pair.to, b.period);
  }
  return next;
}

export function copyWeekForward(file: EconomyFile, iso: string): EconomyFile {
  const cur = weekOn(iso)?.days ?? [];
  const nxt = nextWeekDays(iso);
  if (!cur.length || !nxt.length) return file;
  let next = file;
  for (const pair of alignWeekDays(cur, nxt)) {
    for (const b of shopBells(file)) next = copyHour(next, pair.from, b.period, pair.to, b.period);
  }
  return next;
}

export function copyYesterday(file: EconomyFile, date: string, period: number): EconomyFile {
  const week = weekOn(date)?.days ?? [];
  const i = week.indexOf(date);
  const from = i > 0 ? week[i - 1] : prevWeekDays(date).at(-1);
  if (!from) return file;
  return copyHour(file, from, period, date, period);
}

function cellTitle(day: TeachDay, activityName: string): string {
  return activityName || day.do?.trim() || day.ask?.trim() || day.objective?.trim() || "";
}

export function planCell(file: EconomyFile, date: string, period: number, today = todayIso()): PlanCell {
  const bells = shopBells(file);
  const day = teachDay(file, date, period);
  const pin = pinnedActivityId(file, period, date);
  const project = slotsOf(file, period, date)[0];
  const act = pin && project ? activitiesOf(project).find((a) => a.id === pin) : undefined;
  const pack = packOf(file, date, period);
  const activityName = act?.name ?? "";
  return {
    date,
    period,
    grade: gradeOfPeriod(file, period),
    course: periodTitle(period, bells),
    label: formatSchoolDate(date),
    activityId: pin || "",
    activityName,
    title: cellTitle(day, activityName),
    pack: pack.id,
    packLabel: pack.label,
    ask: day.ask?.trim() ?? "",
    do: day.do?.trim() ?? "",
    objective: day.objective?.trim() ?? "",
    close: day.close?.trim() ?? "",
    materials: day.materials?.trim() ?? "",
    homework: day.homework?.trim() ?? "",
    mods: day.mods?.trim() ?? "",
    notes: day.notes?.trim() ?? "",
    reflect: day.reflect?.trim() ?? "",
    move: day.move?.trim() ?? "",
    set: hourIsSet(file, date, period),
    live: date === today,
    school: isSchoolDay(date),
  };
}

export function planWeek(file: EconomyFile, dates: string[], today = todayIso()): PlanCell[][] {
  const periods = shopBells(file).map((b) => b.period);
  return periods.map((period) => dates.map((date) => planCell(file, date, period, today)));
}

export function weekFillCount(file: EconomyFile, dates: string[]): { set: number; total: number } {
  const periods = shopBells(file);
  const school = dates.filter((d) => isSchoolDay(d));
  const total = periods.length * school.length;
  let set = 0;
  for (const b of periods) {
    for (const d of school) if (hourIsSet(file, d, b.period)) set += 1;
  }
  return { set, total };
}
