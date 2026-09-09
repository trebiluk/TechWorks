/**
 * Diego: role history by cycle + crew-leader Skills XP bonus.
 * Laws: effort≠money; XP≠wallet. Lead bonus is Skills XP only — never wallet/marks.
 * Storage key techworks-lead-xp — does NOT rename desk-v10 / theme-v2.
 */
import type { EconomyFile } from "./economy";
import { todayIso } from "@/lib/calendar";

export const LEAD_XP_KEY = "techworks-lead-xp";
export const DEFAULT_LEAD_XP = 2;

export type RoleKind = "crew_leader" | "line_leader";

/** One row: worker × role × cycle (optional day / period / crew). */
export type RoleHistoryEntry = {
  studentId: string;
  role: RoleKind;
  cycle: number;
  date: string;
  period?: number;
  crewKey?: string;
  /** Leader named + feedback saved for that day. */
  confirmed?: boolean;
  /** Skills XP granted for this confirmed crew lead (0 / omitted if not awarded). */
  xp?: number;
  /** Other flags (future) — keep soft for Flo merges. */
  flags?: Record<string, boolean | string | number>;
};

export function roleHistoryOf(file: EconomyFile): RoleHistoryEntry[] {
  const list = file.meta.config?.roleHistory;
  return Array.isArray(list) ? (list as RoleHistoryEntry[]) : [];
}

function withRoleHistory(file: EconomyFile, roleHistory: RoleHistoryEntry[]): EconomyFile {
  const next = JSON.parse(JSON.stringify(file)) as EconomyFile;
  next.meta.config = { ...(next.meta.config ?? {}), roleHistory };
  return next;
}

export function currentCycleOf(file: EconomyFile): number {
  return file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
}

/** Settings + economy config. Default +2. Local key techworks-lead-xp. */
export function storedLeadXp(): number {
  if (typeof window === "undefined") return DEFAULT_LEAD_XP;
  const raw = window.localStorage.getItem(LEAD_XP_KEY);
  if (raw == null || raw === "") return DEFAULT_LEAD_XP;
  const n = Number(raw);
  return Number.isFinite(n) ? clampLeadXp(n) : DEFAULT_LEAD_XP;
}

export function clampLeadXp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LEAD_XP;
  return Math.max(0, Math.min(20, Math.round(n)));
}

export function commitLeadXp(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEAD_XP_KEY, String(clampLeadXp(n)));
  window.dispatchEvent(new Event("techworks-lead-xp"));
}

export function leadXpBonusOf(file: EconomyFile): number {
  const fromFile = file.meta.config?.leadXpBonus;
  if (typeof fromFile === "number" && Number.isFinite(fromFile)) return clampLeadXp(fromFile);
  return storedLeadXp();
}

export function setLeadXpBonus(file: EconomyFile, n: number): EconomyFile {
  const v = clampLeadXp(n);
  commitLeadXp(v);
  const next = JSON.parse(JSON.stringify(file)) as EconomyFile;
  next.meta.config = { ...(next.meta.config ?? {}), leadXpBonus: v };
  return next;
}

export function crewLeadKey(cycle: number, period: number, crewKey: string, date: string, studentId: string) {
  return `${cycle}|${period}|${crewKey}|${date}|${studentId}|crew_leader`;
}

export function lineLeadKey(cycle: number, date: string, studentId: string) {
  return `${cycle}|${date}|${studentId}|line_leader`;
}

function entryMatchKey(e: RoleHistoryEntry): string {
  if (e.role === "line_leader") return lineLeadKey(e.cycle, e.date, e.studentId);
  return crewLeadKey(e.cycle, e.period ?? 0, e.crewKey ?? "", e.date, e.studentId);
}

/** Skills XP earned from confirmed crew leads only (not formative skill marks). */
export function leadSkillsXp(file: EconomyFile, studentId: string): number {
  return roleHistoryOf(file)
    .filter((e) => e.studentId === studentId && e.role === "crew_leader" && e.confirmed)
    .reduce((n, e) => n + Number(e.xp || 0), 0);
}

/**
 * After crowning (or clearing) a crew leader — record cycle role; try confirm if feedback already saved.
 * Toggle spam without feedback never awards XP.
 */
export function afterCrewLeaderChange(
  file: EconomyFile,
  period: number,
  crewKey: string,
  studentId: string,
  date?: string,
): EconomyFile {
  if (!studentId) return file;
  const day = date || todayIso();
  const cycle = currentCycleOf(file);
  const history = [...roleHistoryOf(file)];
  const key = crewLeadKey(cycle, period, crewKey, day, studentId);
  const idx = history.findIndex((e) => entryMatchKey(e) === key);
  if (idx < 0) {
    history.push({
      studentId,
      role: "crew_leader",
      cycle,
      date: day,
      period,
      crewKey,
      confirmed: false,
    });
  }
  const next = withRoleHistory(file, history);
  return confirmCrewLead(next, period, crewKey, day);
}

/**
 * Confirm lead when leader is named AND affect (feedback) is present for date.
 * Awards leadXpBonus Skills XP once per confirmed lead key — never wallet/marks.
 */
export function confirmCrewLead(
  file: EconomyFile,
  period: number,
  crewKey: string,
  date: string,
): EconomyFile {
  const cycle = currentCycleOf(file);
  const leaderId =
    file.meta.config?.crewRoles?.[`${cycle}|${period}|${crewKey}`] ?? "";
  if (!leaderId) return file;
  const lead = file.students.find((s) => s.id === leaderId);
  if (!lead) return file;
  const mood = (lead.affect ?? {})[date];
  if (!mood) return file;

  const key = crewLeadKey(cycle, period, crewKey, date, leaderId);
  const history = [...roleHistoryOf(file)];
  const idx = history.findIndex((e) => entryMatchKey(e) === key);
  const existing = idx >= 0 ? history[idx] : null;

  // Already confirmed → idempotent (no toggle / re-tap spam).
  if (existing?.confirmed) return file;

  const bonus = leadXpBonusOf(file);
  const entry: RoleHistoryEntry = {
    studentId: leaderId,
    role: "crew_leader",
    cycle,
    date,
    period,
    crewKey,
    confirmed: true,
    xp: bonus,
    flags: { ...(existing?.flags ?? {}), affect: mood },
  };

  if (idx >= 0) history[idx] = entry;
  else history.push(entry);
  return withRoleHistory(file, history);
}

/** After any affect tap — if that worker is a crowned leader, try confirm + XP. */
export function afterAffectMaybeConfirm(file: EconomyFile, studentId: string, date: string): EconomyFile {
  const cycle = currentCycleOf(file);
  const roles = file.meta.config?.crewRoles ?? {};
  let next = file;
  for (const [rk, id] of Object.entries(roles)) {
    if (id !== studentId) continue;
    const parts = rk.split("|");
    if (parts.length < 3) continue;
    const c = Number(parts[0]);
    const period = Number(parts[1]);
    const crewKey = parts.slice(2).join("|");
    if (c !== cycle || !Number.isFinite(period)) continue;
    // Affect cleared → do not strip prior XP; just skip confirm.
    if (!(file.students.find((s) => s.id === studentId)?.affect ?? {})[date]) continue;
    next = confirmCrewLead(next, period, crewKey, date);
  }
  return next;
}

/** Persist Study Hall line-leader day into role history (no Skills XP). */
export function recordLineLeaderDay(file: EconomyFile, date: string, studentId: string): EconomyFile {
  if (!studentId || !date) return file;
  const cycle = currentCycleOf(file);
  const key = lineLeadKey(cycle, date, studentId);
  const history = [...roleHistoryOf(file)];
  if (history.some((e) => entryMatchKey(e) === key)) return file;
  history.push({
    studentId,
    role: "line_leader",
    cycle,
    date,
    confirmed: true,
    xp: 0,
  });
  return withRoleHistory(file, history);
}

/** Alias-safe public dump rows (Shop ID / code — never legal names). */
export function roleHistoryPublic(
  file: EconomyFile,
  codeOf: (id: string) => string,
): {
  code: string;
  alias: string;
  role: RoleKind;
  cycle: number;
  date: string;
  period: string;
  crewKey: string;
  confirmed: string;
  xp: string;
}[] {
  return roleHistoryOf(file).map((e) => {
    const s = file.students.find((x) => x.id === e.studentId);
    return {
      code: codeOf(e.studentId),
      alias: s?.first ?? "",
      role: e.role,
      cycle: e.cycle,
      date: e.date,
      period: e.period != null ? String(e.period) : "",
      crewKey: e.crewKey ?? "",
      confirmed: e.confirmed ? "1" : "0",
      xp: String(Number(e.xp || 0)),
    };
  });
}


/** Teacher dump — student ids ok (vault / Data board). */
export function roleHistoryTeacher(file: EconomyFile): RoleHistoryEntry[] {
  return roleHistoryOf(file);
}

export const ROLE_HISTORY_PUBLIC_HEADER = [
  "Alias",
  "Class ID",
  "Role",
  "Cycle",
  "Date",
  "Period",
  "Crew",
  "Confirmed",
  "Lead XP",
];

export const ROLE_HISTORY_TEACHER_HEADER = [
  "StudentId",
  "Alias",
  "Role",
  "Cycle",
  "Date",
  "Period",
  "Crew",
  "Confirmed",
  "Lead XP",
];

function csvEscape(cell: string | number): string {
  const s = String(cell ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  return [header.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
}

/** Public / Sites export — aliases + Shop ID only. */
export function buildRoleHistoryPublicCsv(file: EconomyFile, codeOf: (id: string) => string): string {
  const rows = roleHistoryPublic(file, codeOf).map((r) => [
    r.alias,
    r.code,
    r.role,
    r.cycle,
    r.date,
    r.period,
    r.crewKey,
    r.confirmed,
    r.xp,
  ]);
  return toCsv(ROLE_HISTORY_PUBLIC_HEADER, rows);
}

/** Teacher Data dump — ids included. */
export function buildRoleHistoryTeacherCsv(file: EconomyFile): string {
  const rows = roleHistoryOf(file).map((e) => {
    const s = file.students.find((x) => x.id === e.studentId);
    return [
      e.studentId,
      s?.first ?? "",
      e.role,
      e.cycle,
      e.date,
      e.period ?? "",
      e.crewKey ?? "",
      e.confirmed ? "1" : "0",
      Number(e.xp || 0),
    ];
  });
  return toCsv(ROLE_HISTORY_TEACHER_HEADER, rows);
}

/** Sheets paste TSV (teacher). */
export function roleHistoryTeacherTsv(file: EconomyFile): string {
  const rows = roleHistoryOf(file).map((e) => {
    const s = file.students.find((x) => x.id === e.studentId);
    return [
      e.studentId,
      s?.first ?? "",
      e.role,
      String(e.cycle),
      e.date,
      e.period != null ? String(e.period) : "",
      e.crewKey ?? "",
      e.confirmed ? "1" : "0",
      String(Number(e.xp || 0)),
    ].join("\t");
  });
  return [ROLE_HISTORY_TEACHER_HEADER.join("\t"), ...rows].join("\n");
}
