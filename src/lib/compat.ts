/** Additive desk JSON. New fields ride through migrate, compact, and unpack. Never strip what this build does not know. */

export function keepUnknown(raw: object | null | undefined, known: Iterable<string>): Record<string, unknown> {
  if (!raw) return {};
  const skip = known instanceof Set ? known : new Set(known);
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (skip.has(k)) continue;
    if (v == null || v === "") continue;
    extra[k] = v;
  }
  return extra;
}

export function withUnknown<T extends object>(slim: T, raw: object | null | undefined, known: Iterable<string>): T {
  return { ...keepUnknown(raw, known), ...slim };
}

/** localStorage keys this build can still read, newest first. */
export function deskStorageKeys(schema: number): string[] {
  const n = Number.isFinite(schema) && schema >= 11 ? Math.floor(schema) : 12;
  const keys: string[] = [];
  for (let v = n; v >= 11; v--) keys.push(`techworks-desk-v${v}`);
  return keys;
}

/** Never downgrade a newer pack’s schema stamp. */
export function openSchema(got: unknown, current: number): number {
  const n = Number(got);
  if (!Number.isFinite(n) || n < 1) return current;
  return Math.max(current, Math.floor(n));
}

export function cloudPackOpen(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as { kind?: string; vault?: unknown; v?: unknown };
  if (o.kind !== "techworks-cloud" || !o.vault) return false;
  if (o.v == null) return true;
  const v = Number(o.v);
  return Number.isFinite(v) && v >= 1;
}

export const STUDENT_KNOWN = [
  "id",
  "first",
  "last",
  "legalFirst",
  "legalLast",
  "period",
  "grade",
  "crewKey",
  "crewByCycle",
  "crewDays",
  "section",
  "course",
  "sem",
  "days",
  "markTape",
  "marks",
  "investDays",
  "investAsk",
  "bonus",
  "deduct",
  "clutch",
  "opening",
  "flags",
  "quietNotes",
  "purchases",
  "prints",
  "abDay",
  "attend",
  "passes",
  "affect",
  "notes",
  "readyDays",
  "trackDays",
  "cleanupDays",
  "assistDays",
  "clubDays",
  "cleanupCatchDays",
  "skills",
  "skillLog",
  "groups",
  "bonusXp",
  "picks",
  "icon",
  "gradeOverrides",
  "lucky",
] as const;
