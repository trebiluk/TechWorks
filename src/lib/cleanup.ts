import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";

/** Inverse of a small perk, not the $10 miss fee. Extra tidy is cash. */
export const CLEANUP_CASH = 5;
export const CLEANUP_CATCH_MAX = 2;

export const WORKSHOP_JOBS = [
  "Tools back on the shadow board",
  "Bits and scrap in the bin",
  "Sweep your station",
  "Goggles hung",
  "Project on the shelf — not the bench",
];

export const CLASS_JOBS = [
  "Chairs in",
  "Desks clear",
  "Bags out of the aisle",
  "Sit with your crew",
  "Ready for the bell",
];

export const HALL_JOBS = [
  "Chromebooks closed",
  "Chairs in · floor clear",
  "Voices off",
  "Line ready",
];

export function cleanupCatchOn(s: { cleanupCatchDays?: Record<string, number> }, date: string): number {
  return Number(s.cleanupCatchDays?.[date] || 0);
}

export function grantCleanupCatch(file: EconomyFile, studentId: string, date: string): EconomyFile {
  const next = cloneFile(file);
  let hit = false;
  next.students = next.students.map((s) => {
    if (s.id !== studentId) return s;
    const n = cleanupCatchOn(s, date);
    if (n >= CLEANUP_CATCH_MAX) return s;
    hit = true;
    next.meta.ledger = [
      ...(next.meta.ledger ?? []),
      { ts: new Date().toISOString(), id: s.id, type: "Bonus", amount: CLEANUP_CASH, date, note: "Caught cleaning extra" },
    ];
    return {
      ...s,
      bonus: Number(s.bonus || 0) + CLEANUP_CASH,
      cleanupCatchDays: { ...(s.cleanupCatchDays ?? {}), [date]: n + 1 },
    };
  });
  return hit ? next : file;
}

export function liveCleanupCrew(file: EconomyFile, period: number) {
  return file.students
    .filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName))
    .sort((a, b) => a.first.localeCompare(b.first) || a.id.localeCompare(b.id));
}
