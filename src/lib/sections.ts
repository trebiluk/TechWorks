import type { EconomyFile, RawStudent } from "@/lib/economy";
import { SCHOOLTOOL_SECTIONS, type SchoolSection } from "@/data/schooltool-sections";
import { cloneFile } from "@/lib/clone";

export type CohortKind = "tech" | "hall" | "club";

export type YearCohort = {
  id: string;
  course: string;
  period: number;
  grade: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | "YEAR";
  section: number;
  days: "A,B";
  room: string;
  kind: CohortKind;
};

export function gradeForCourse(course: string): number {
  if (course.includes("6")) return 6;
  if (course.includes("7")) return 7;
  if (course.includes("8")) return 8;
  return 5;
}

function techId(row: SchoolSection): string {
  return `st-p${row.period}-s${row.section}`;
}

export const YEAR_CLASSES: YearCohort[] = SCHOOLTOOL_SECTIONS.filter((r) => r.course.startsWith("TECH")).map((r) => ({
  id: techId(r),
  course: r.course,
  period: r.period,
  grade: gradeForCourse(r.course),
  quarter: (r.sem.split(",")[0].trim() as YearCohort["quarter"]) || "Q1",
  section: r.section,
  days: r.days,
  room: r.room,
  kind: "tech" as const,
}));

const hallRow = SCHOOLTOOL_SECTIONS.find((r) => r.period === 6)!;

export const YEAR_GROUPS: YearCohort[] = [
  {
    id: "hall",
    course: hallRow.course,
    period: 6,
    grade: 5,
    quarter: "YEAR",
    section: hallRow.section,
    days: hallRow.days,
    room: hallRow.room,
    kind: "hall",
  },
  {
    id: "club",
    course: "TECH CLUB",
    period: 0,
    grade: 0,
    quarter: "YEAR",
    section: 0,
    days: "A,B",
    room: "13",
    kind: "club",
  },
];

export const YEAR_COHORTS: YearCohort[] = [...YEAR_CLASSES, ...YEAR_GROUPS];

export function sessionOfStudent(s: Pick<RawStudent, "sem">): string {
  return String(s.sem ?? "Q1").toUpperCase();
}

export function cohortForStudent(s: Pick<RawStudent, "period" | "sem" | "section">): YearCohort | undefined {
  if (s.period === 6) return YEAR_GROUPS[0];
  if (s.section) {
    const hit = YEAR_CLASSES.find((c) => c.period === s.period && c.section === s.section);
    if (hit) return hit;
  }
  const sem = sessionOfStudent(s);
  return YEAR_CLASSES.find((c) => c.period === s.period && c.quarter === sem);
}

export function ensureSections(file: EconomyFile): EconomyFile {
  const next = cloneFile(file);
  next.meta.sections = SCHOOLTOOL_SECTIONS.map((r) => ({ ...r }));
  next.students = next.students.map((s) => {
    const c = cohortForStudent(s);
    if (!c || c.kind === "club") return s;
    const patched = { ...s };
    if (!patched.section) patched.section = c.section;
    if (!patched.course) patched.course = c.course;
    if (!patched.grade) patched.grade = c.grade;
    return patched;
  });
  return next;
}
