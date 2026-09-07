import { schoolDays } from "@/lib/calendar";

/** One char per school day. `.` empty. Codes: 3 2 1 A E P */
const EMPTY = ".";
const OK = new Set(["3", "2", "1", "A", "E", "P"]);

let datesCache: string[] | null = null;
const indexCache = new Map<string, number>();

export function yearDates(): string[] {
  if (!datesCache) {
    datesCache = schoolDays().map((d) => d.date);
    datesCache.forEach((d, i) => indexCache.set(d, i));
  }
  return datesCache;
}

export function dayPos(date: string): number {
  if (!datesCache) yearDates();
  return indexCache.get(date) ?? -1;
}

export function packMarks(marks: Record<string, string> | undefined, tape = ""): string {
  const days = yearDates();
  const chars = tape.padEnd(days.length, EMPTY).split("");
  for (const [date, code] of Object.entries(marks ?? {})) {
    const i = dayPos(date);
    if (i < 0) continue;
    const c = String(code || "").trim().toUpperCase();
    chars[i] = OK.has(c) ? c : EMPTY;
  }
  return trimTape(chars.join(""));
}

export function trimTape(tape: string): string {
  return tape.replace(/\.+$/, "");
}

export function tapeMark(tape: string | undefined, date: string): string {
  if (!tape) return "";
  const i = dayPos(date);
  if (i < 0 || i >= tape.length) return "";
  const c = tape[i] ?? EMPTY;
  return !c || c === EMPTY ? "" : c;
}

export function writeTape(tape: string | undefined, date: string, code: string): string {
  const i = dayPos(date);
  if (i < 0) return trimTape(tape ?? "");
  const c = String(code || "").trim().toUpperCase();
  const ch = OK.has(c) ? c : EMPTY;
  const base = (tape ?? "").padEnd(i + 1, EMPTY);
  return trimTape(base.slice(0, i) + ch + base.slice(i + 1));
}

export function eachTapeMark(tape: string | undefined, fn: (date: string, code: string) => void) {
  if (!tape) return;
  const days = yearDates();
  const n = Math.min(tape.length, days.length);
  for (let i = 0; i < n; i++) {
    const c = tape[i];
    if (c && c !== EMPTY) fn(days[i], c);
  }
}
