import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { P6_STUDY_HALL_ID, SOLVAY_MS_TECH_PROFILE, type P6StudyHallClass } from "@/data/solvay-ms-tech.profile";
import { addTypedStudent, onAbRoster, patchStudent } from "@/lib/store";

export const HALL_PERIOD = 6;
export const HALL_EMPTY_COPY = "No class loaded";
export const HALL_ALL_HERE_COPY = "Everyone is in the room. Nice.";

export type HallAbLetter = "A" | "B";

type HallAliasRow = { alias: string; abDay: "A" | "B" | "BOTH" };

function cleanAlias(raw: string | undefined): string | null {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  if (/^[\(\[]/.test(t)) return null;
  if (t.includes(",")) return null;
  return t.slice(0, 24);
}

function aliasesOf(list: string[] | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list ?? []) {
    const alias = cleanAlias(raw);
    if (!alias) continue;
    const key = alias.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(alias);
  }
  return out;
}

export function p6StudyHallClass(file: EconomyFile): P6StudyHallClass {
  const fromFile = file.meta.config?.classes?.[P6_STUDY_HALL_ID] ?? file.meta.config?.classes?.hall;
  const bundled = SOLVAY_MS_TECH_PROFILE.classes[P6_STUDY_HALL_ID]!;
  if (!fromFile) return bundled;
  const roster = {
    A: [...(fromFile.roster?.A ?? [])],
    B: [...(fromFile.roster?.B ?? [])],
    BOTH: fromFile.roster?.BOTH ? [...fromFile.roster.BOTH] : undefined,
  };
  const loaded =
    fromFile.rosterStatus === "loaded" ||
    aliasesOf(roster.A).length + aliasesOf(roster.B).length + aliasesOf(roster.BOTH).length > 0;
  return {
    id: P6_STUDY_HALL_ID,
    period: 6,
    course: "STUDY HALL",
    section: fromFile.section ?? bundled.section,
    room: fromFile.room ?? bundled.room,
    rosterStatus: loaded ? "loaded" : fromFile.rosterStatus ?? bundled.rosterStatus,
    roster,
  };
}

export function profileHallAliases(file: EconomyFile): HallAliasRow[] {
  const cls = p6StudyHallClass(file);
  if (cls.rosterStatus !== "loaded") return [];
  const A = new Set(aliasesOf(cls.roster.A).map((a) => a.toLowerCase()));
  const B = new Set(aliasesOf(cls.roster.B).map((a) => a.toLowerCase()));
  const BOTH = new Set(aliasesOf(cls.roster.BOTH).map((a) => a.toLowerCase()));
  const byKey = new Map<string, HallAliasRow>();
  function put(alias: string, abDay: HallAliasRow["abDay"]) {
    const key = alias.toLowerCase();
    const hit = byKey.get(key);
    if (!hit) {
      byKey.set(key, { alias, abDay });
      return;
    }
    if (hit.abDay !== abDay) hit.abDay = "BOTH";
  }
  for (const alias of aliasesOf(cls.roster.A)) put(alias, BOTH.has(alias.toLowerCase()) || B.has(alias.toLowerCase()) ? "BOTH" : "A");
  for (const alias of aliasesOf(cls.roster.B)) {
    if (A.has(alias.toLowerCase()) || BOTH.has(alias.toLowerCase())) continue;
    put(alias, "B");
  }
  for (const alias of aliasesOf(cls.roster.BOTH)) {
    if (A.has(alias.toLowerCase()) || B.has(alias.toLowerCase())) continue;
    put(alias, "BOTH");
  }
  return [...byKey.values()];
}

/** Pull loaded Solvay / desk class aliases onto P6. No-op when the paste sheet is still empty. */
export function ensureP6StudyHall(file: EconomyFile): EconomyFile {
  const rows = profileHallAliases(file);
  if (!rows.length) return file;
  const have = new Set(
    file.students.filter((s) => s.period === HALL_PERIOD).map((s) => s.first.trim().toLowerCase()),
  );
  const missing = rows.filter((row) => !have.has(row.alias.toLowerCase()));
  if (!missing.length) return file;
  let next = file;
  for (const row of missing) {
    const before = next.students.length;
    next = addTypedStudent(next, {
      alias: row.alias,
      period: HALL_PERIOD,
      grade: 5,
      crewKey: "Hall",
      section: 10,
      course: "STUDY HALL",
      sem: "YEAR",
    });
    const kid = next.students[next.students.length - 1];
    if (!kid || next.students.length === before) continue;
    next = patchStudent(next, kid.id, { abDay: row.abDay });
  }
  return next;
}

export function p6HallKids(file: EconomyFile, letter: HallAbLetter): RawStudent[] {
  return file.students
    .filter((s) => s.period === HALL_PERIOD && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter))
    .sort((a, b) => a.first.localeCompare(b.first));
}

export function hallAwayLine(kids: RawStudent[], awayCount: number): string {
  if (!kids.length) return HALL_EMPTY_COPY;
  if (!awayCount) return HALL_ALL_HERE_COPY;
  return "";
}
