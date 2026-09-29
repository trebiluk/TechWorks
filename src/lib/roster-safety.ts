import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";

const KEEP_POINTS = 10;
const KEEP_LOG = 40;
const REMOVED_MS = 30 * 24 * 60 * 60 * 1000;

export function inHall(s: RawStudent, period = 6): boolean {
  if (s.removedAt || s.archivedAt) return false;
  if ((s.hallOf ?? []).includes(period)) return true;
  return s.period === period && !s.hallLeft;
}

export function activeStudents(file: EconomyFile): RawStudent[] {
  return file.students.filter((s) => !s.removedAt && !s.archivedAt);
}

export function recentlyRemoved(file: EconomyFile, now = Date.now()): RawStudent[] {
  return file.students.filter((s) => {
    if (!s.removedAt) return false;
    const t = Date.parse(s.removedAt);
    return Number.isFinite(t) && now - t <= REMOVED_MS;
  });
}

function log(file: EconomyFile, action: string, count: number, detail: string): EconomyFile {
  const next = cloneFile(file);
  const row = { at: new Date().toISOString(), action, count, detail };
  const prev = next.meta.config?.rosterLog ?? [];
  next.meta.config = { ...next.meta.config, rosterLog: [row, ...prev].slice(0, KEEP_LOG) };
  return next;
}

export function saveRestorePoint(file: EconomyFile, label: string): EconomyFile {
  const next = cloneFile(file);
  const point = {
    at: new Date().toISOString(),
    label,
    students: next.students.map((s) => ({ ...s })),
  };
  const prev = next.meta.config?.restorePoints ?? [];
  next.meta.config = { ...next.meta.config, restorePoints: [point, ...prev].slice(0, KEEP_POINTS) };
  return next;
}

export function restorePoint(file: EconomyFile, at: string): EconomyFile {
  const hit = (file.meta.config?.restorePoints ?? []).find((p) => p.at === at);
  if (!hit) return file;
  const next = cloneFile(file);
  next.students = hit.students.map((s) => ({ ...s }));
  return log(next, "restore", next.students.length, hit.label);
}

export function softRemove(file: EconomyFile, ids: string[], detail: string): EconomyFile {
  const want = new Set(ids);
  const targets = file.students.filter((s) => want.has(s.id) && !s.removedAt);
  if (!targets.length) return file;
  const now = new Date().toISOString();
  const snapped = saveRestorePoint(file, detail);
  const next = cloneFile(snapped);
  next.students = next.students.map((s) => (want.has(s.id) && !s.removedAt ? { ...s, removedAt: now } : s));
  return log(next, "remove", targets.length, detail);
}

export function undoRemove(file: EconomyFile, ids: string[]): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  next.students = next.students.map((s) => (want.has(s.id) ? { ...s, removedAt: undefined } : s));
  return log(next, "undo", ids.length, "Undo remove");
}

export function purgeForever(file: EconomyFile, ids: string[]): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  const before = next.students.length;
  next.students = next.students.filter((s) => !want.has(s.id));
  return log(next, "purge", before - next.students.length, "Delete forever");
}

export function archiveStudents(file: EconomyFile, ids: string[]): EconomyFile {
  const want = new Set(ids);
  const now = new Date().toISOString();
  const next = cloneFile(file);
  let n = 0;
  next.students = next.students.map((s) => {
    if (!want.has(s.id)) return s;
    n += 1;
    return { ...s, archivedAt: now };
  });
  return log(next, "archive", n, "Archive");
}

export function unarchiveStudents(file: EconomyFile, ids: string[]): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  next.students = next.students.map((s) => (want.has(s.id) ? { ...s, archivedAt: undefined } : s));
  return log(next, "unarchive", ids.length, "Back on the list");
}

/** Home class changes. The id, marks, and shop code stay. */
export function moveToClass(file: EconomyFile, ids: string[], period: number, section?: number, course?: string): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  let n = 0;
  next.students = next.students.map((s) => {
    if (!want.has(s.id)) return s;
    n += 1;
    return {
      ...s,
      period,
      section: section ?? s.section,
      course: course ?? s.course,
    };
  });
  return log(next, "move", n, `Period ${period}`);
}

export function seatInHall(file: EconomyFile, ids: string[], period = 6): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  let n = 0;
  next.students = next.students.map((s) => {
    if (!want.has(s.id) || s.removedAt) return s;
    const hallOf = [...new Set([...(s.hallOf ?? []), period])];
    n += 1;
    return { ...s, hallOf, hallLeft: false, groups: { ...s.groups, hall: true } };
  });
  return log(next, "hall-add", n, `Hall P${period}`);
}

/** Drops the hall seat only. Home period, marks, and the id stay. */
export function leaveHall(file: EconomyFile, ids: string[], period = 6): EconomyFile {
  const want = new Set(ids);
  const next = cloneFile(file);
  let n = 0;
  next.students = next.students.map((s) => {
    if (!want.has(s.id)) return s;
    n += 1;
    const hallOf = (s.hallOf ?? []).filter((p) => p !== period);
    const native = s.period === period;
    return { ...s, hallOf, hallLeft: native ? true : s.hallLeft };
  });
  return log(next, "hall-leave", n, `Off hall P${period}`);
}

export function hallList(file: EconomyFile, period = 6): RawStudent[] {
  return file.students
    .filter((s) => inHall(s, period))
    .sort((a, b) => a.first.localeCompare(b.first));
}

export function confirmMatches(typed: string, expected: string): boolean {
  return typed.trim() === expected.trim() && expected.trim().length > 0;
}
