import {
  CLOSED_REASON,
  FIRST_STUDENT,
  HALF_DAYS,
  LAST_STUDENT,
  MARKING,
  NO_SCHOOL,
  SEMESTER_2,
  SESSION_LABELS,
  SOLVAY_YEAR,
} from "../data/solvay-2026-27.ts";

export type SchoolDay = {
  date: string;
  half: boolean;
};

export type InstructionalWeek = {
  index: number;
  start: string;
  end: string;
  days: string[];
};

export type SessionBlock = {
  n: number;
  label: string;
  start: string;
  end: string;
  weeks: InstructionalWeek[];
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function atNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

function addDays(iso: string, n: number): string {
  const d = atNoon(iso);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

function weekdayMon0(iso: string): number {
  const w = atNoon(iso).getDay();
  return w === 0 ? 6 : w - 1;
}

function mondayOf(iso: string): string {
  return addDays(iso, -weekdayMon0(iso));
}

export function isSchoolDay(iso: string): boolean {
  if (iso < FIRST_STUDENT || iso > LAST_STUDENT) return false;
  const dow = atNoon(iso).getDay();
  if (dow === 0 || dow === 6) return false;
  if (NO_SCHOOL.has(iso)) return false;
  return true;
}

export function reason(iso: string): string | null {
  if (HALF_DAYS.has(iso) && isSchoolDay(iso)) return CLOSED_REASON[iso] ?? "Half day";
  if (!isSchoolDay(iso)) {
    const dow = atNoon(iso).getDay();
    if (dow === 0 || dow === 6) return "Weekend";
    if (iso < FIRST_STUDENT) return "Before first student day";
    if (iso > LAST_STUDENT) return "After last student day";
    return CLOSED_REASON[iso] ?? "No school";
  }
  return CLOSED_REASON[iso] ?? null;
}

let schoolDayCache: SchoolDay[] | null = null;

export function schoolDays(): SchoolDay[] {
  if (schoolDayCache) return schoolDayCache;
  const out: SchoolDay[] = [];
  for (let iso = FIRST_STUDENT; iso <= LAST_STUDENT; iso = addDays(iso, 1)) {
    if (isSchoolDay(iso)) out.push({ date: iso, half: HALF_DAYS.has(iso) });
  }
  schoolDayCache = out;
  return out;
}

export function spanProgress(from: string, to: string, today: string): { done: number; total: number } {
  const days = schoolDays().filter((d) => d.date >= from && d.date <= to);
  return { done: days.filter((d) => d.date <= today).length, total: days.length };
}

function windowStart(endIndex: number): string {
  if (endIndex <= 0) return FIRST_STUDENT;
  return addDays(MARKING[endIndex - 1].end, 1);
}

export function cycleRange(n: number): { n: number; start: string; end: string } {
  const idx = Math.max(0, Math.min(MARKING.length - 1, n - 1));
  return { n: idx + 1, start: windowStart(idx), end: MARKING[idx].end };
}

export function cycleNow(today: string): number {
  const i = MARKING.findIndex((m) => today <= m.end);
  return i < 0 ? MARKING.length : i + 1;
}

export function cycleProgress(today: string): { label: string; done: number; total: number } {
  const i = MARKING.findIndex((m) => today <= m.end);
  const idx = i < 0 ? MARKING.length - 1 : i;
  const start = windowStart(idx);
  const mark = MARKING[idx];
  return { label: "Cycle", ...spanProgress(start, mark.end, today) };
}

export function quarterProgress(today: string): { label: string; done: number; total: number } {
  const grades = MARKING.filter((m) => m.grade);
  const i = grades.findIndex((m) => today <= m.end);
  const idx = i < 0 ? grades.length - 1 : i;
  const mark = grades[idx];
  const allIdx = MARKING.findIndex((m) => m.id === mark.id);
  const prevGrade = [...MARKING].slice(0, allIdx).reverse().find((m) => m.grade);
  const start = prevGrade ? addDays(prevGrade.end, 1) : FIRST_STUDENT;
  return { label: "Quarter", ...spanProgress(start, mark.end, today) };
}

export function quarterNow(today: string): { n: 1 | 2 | 3 | 4; label: "Q1" | "Q2" | "Q3" | "Q4" } {
  const grades = MARKING.filter((m) => m.grade);
  let n = 1;
  for (let i = 0; i < grades.length; i++) {
    n = i + 1;
    if (today <= grades[i].end) break;
  }
  const label = (`Q${n}` as "Q1" | "Q2" | "Q3" | "Q4");
  return { n: n as 1 | 2 | 3 | 4, label };
}

export function yearProgress(today: string): { label: string; done: number; total: number } {
  return { label: "Year", ...spanProgress(FIRST_STUDENT, LAST_STUDENT, today) };
}

export function instructionalWeeks(): InstructionalWeek[] {
  const days = schoolDays();
  const map = new Map<string, string[]>();
  for (const d of days) {
    const mon = mondayOf(d.date);
    const list = map.get(mon) ?? [];
    list.push(d.date);
    map.set(mon, list);
  }
  const keys = [...map.keys()].sort();
  return keys.map((start, i) => {
    const ds = map.get(start) ?? [];
    return { index: i + 1, start, end: ds[ds.length - 1] ?? start, days: ds };
  });
}

export function sessions(size = 8): SessionBlock[] {
  const weeks = instructionalWeeks();
  const blocks: SessionBlock[] = [];
  for (let i = 0; i < SESSION_LABELS.length; i++) {
    const slice = weeks.slice(i * size, i * size + size);
    if (!slice.length) break;
    blocks.push({
      n: i + 1,
      label: SESSION_LABELS[i],
      start: slice[0].days[0],
      end: slice[slice.length - 1].end,
      weeks: slice,
    });
  }
  return blocks;
}

export function sessionOn(iso: string): SessionBlock | null {
  return sessions().find((s) => iso >= s.start && iso <= s.end) ?? null;
}

export function weekOn(iso: string): InstructionalWeek | null {
  const mon = mondayOf(iso);
  return instructionalWeeks().find((w) => w.start === mon) ?? null;
}

/** First four school days this week are D1–D4. A fifth day (usually Friday) is pay day. */
export function daySlot(iso: string): {
  school: boolean;
  index: number;
  label: "D1" | "D2" | "D3" | "D4" | null;
  fridayPay: boolean;
  week: InstructionalWeek | null;
  session: SessionBlock | null;
  note: string | null;
} {
  const week = weekOn(iso);
  const session = sessionOn(iso);
  if (!isSchoolDay(iso)) {
    return {
      school: false,
      index: 0,
      label: null,
      fridayPay: false,
      week,
      session,
      note: reason(iso),
    };
  }
  const days = week?.days ?? [iso];
  const pos = days.indexOf(iso);
  if (pos >= 4) {
    return {
      school: true,
      index: 3,
      label: "D4",
      fridayPay: true,
      week,
      session,
      note: "Pay day — close the week after last marks",
    };
  }
  const labels = ["D1", "D2", "D3", "D4"] as const;
  return {
    school: true,
    index: Math.max(0, pos),
    label: labels[Math.max(0, pos)],
    fridayPay: false,
    week,
    session,
    note: HALF_DAYS.has(iso) ? "Half day PreK–8" : null,
  };
}

export function cycleDayLabel(label: string | null | undefined, cycle = 1): string {
  if (!label) return "";
  const day = String(label).replace(/\D/g, "") || label;
  return `Cycle ${cycle}, Day ${day}`;
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatSchoolDate(iso: string): string {
  const d = atNoon(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function nextOpenDay(iso: string, afterBell = false): string {
  if (isSchoolDay(iso) && !afterBell) return iso;
  return stepSchoolDay(iso, 1);
}

export function stepSchoolDay(iso: string, dir: number): string {
  let cur = iso;
  const step = dir < 0 ? -1 : 1;
  for (let i = 0; i < 21; i++) {
    cur = addDays(cur, step);
    if (isSchoolDay(cur)) return cur;
  }
  return iso;
}

export function scoreDate(now = todayIso()): string {
  if (isSchoolDay(now)) return now;
  let cur = now;
  for (let i = 0; i < 21; i++) {
    cur = addDays(cur, 1);
    if (isSchoolDay(cur)) return cur;
  }
  return now;
}

export const calendarMeta = {
  year: SOLVAY_YEAR,
  first: FIRST_STUDENT,
  last: LAST_STUDENT,
  semester2: SEMESTER_2,
  district: "Solvay UFSD",
};
