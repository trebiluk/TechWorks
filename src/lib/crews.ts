import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, shopBells } from "@/lib/economy";
import { abOn, isSubDay, markOn, onAbRoster } from "@/lib/store";
import { isSchoolDay, todayIso, weekOn } from "@/lib/calendar";

export type CrewRow = {
  key: string;
  name: string;
  kids: RawStudent[];
};

export type PulseKind = "done" | "due" | "late" | "open";

export function crewsOf(file: EconomyFile, period: number, date: string): CrewRow[] {
  const letter = abOn(file, date);
  const kids = file.students.filter(
    (s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter),
  );
  const keys = [...new Set(kids.map((s) => s.crewKey))];
  keys.sort();
  return keys.map((key) => ({
    key,
    name: file.crews.find((c) => c.period === period && c.key === key)?.name ?? key,
    kids: kids.filter((s) => s.crewKey === key),
  }));
}

export function crewDone(kids: RawStudent[], date: string) {
  return kids.length > 0 && kids.every((s) => Boolean(markOn(s, date)));
}

export function crewPulse(
  kids: RawStudent[],
  date: string,
  today: string,
  selected: string,
  skipped = false,
): PulseKind {
  if (skipped) return "done";
  if (!kids.length || !isSchoolDay(date)) return "open";
  if (crewDone(kids, date)) return "done";
  if (date < today) return "late";
  if (date === selected || date === today) return "due";
  return "open";
}

export type DueCrew = CrewRow & { date: string; period: number; kind: "due" | "late"; marked: number };

export function dueCrews(file: EconomyFile, through = todayIso()): DueCrew[] {
  const today = todayIso();
  const days = (weekOn(through)?.days ?? []).filter((d) => d <= through && isSchoolDay(d));
  const out: DueCrew[] = [];
  for (const date of days) {
    if (isSubDay(file, date)) continue;
    for (const b of shopBells(file)) {
      for (const c of crewsOf(file, b.period, date)) {
        const kind = crewPulse(c.kids, date, today, through, false);
        if (kind !== "due" && kind !== "late") continue;
        out.push({
          ...c,
          date,
          period: b.period,
          kind,
          marked: c.kids.filter((s) => markOn(s, date)).length,
        });
      }
    }
  }
  out.sort((a, b) => (a.kind === "late" && b.kind !== "late" ? -1 : a.kind !== "late" && b.kind === "late" ? 1 : a.period - b.period || a.name.localeCompare(b.name)));
  return out;
}

export function scoredToday(file: EconomyFile, date = todayIso()) {
  const kids = file.students.filter((s) => s.period !== 6 && isLiveStudent(s, file.meta.quarterName));
  const n = kids.length;
  const hit = kids.filter((s) => markOn(s, date)).length;
  return { n, hit };
}
