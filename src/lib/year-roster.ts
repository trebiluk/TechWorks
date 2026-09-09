import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, sessionCode } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { skillScore, skillXp, skillsOf } from "@/lib/skills";
import { calcProjectGrade } from "@/lib/grades";
import { gradeOfPeriod, projectForCycle, projectForGrade } from "@/lib/projects";
import { clubStudentId, patchMember, saveClub, type ClubFile, type ClubMember } from "@/lib/club";
import { currentCycleOf } from "@/lib/roles";
import { sessions, todayIso } from "@/lib/calendar";
import { eachTapeMark, tapeMark } from "@/lib/tape";
import { YEAR_CLASSES, YEAR_GROUPS, YEAR_COHORTS, sessionOfStudent, type YearCohort } from "@/lib/sections";
import { crewAt, openCrewFor, placeBlock, setStudentCrew } from "@/lib/crew-desk";
import { addTypedStudent } from "@/lib/store";

export { YEAR_CLASSES, YEAR_GROUPS, YEAR_COHORTS, sessionOfStudent };
export type { YearCohort };

export function inCohort(s: RawStudent, c: YearCohort, clubIds: Set<string>): boolean {
  if (c.kind === "club") return Boolean(s.groups?.club) || clubIds.has(s.id) || Boolean(s.clubDays && Object.keys(s.clubDays).length);
  if (c.kind === "hall") return s.period === 6;
  if (s.period !== c.period) return false;
  if (s.section) return s.section === c.section;
  const sem = sessionOfStudent(s);
  if (sem === "YEAR" || (sem.includes("Q1") && sem.includes("Q4"))) return true;
  return sem === c.quarter;
}

export type RosterKid = {
  id: string;
  first: string;
  period: number;
  grade: number;
  sem: string;
  section: number;
  course: string;
  crewKey: string;
  live: boolean;
  club: boolean;
  hall: boolean;
  hold: boolean;
  xp: number;
  skills: number;
  skillN: number;
  project: number | null;
  projectTitle: string;
};

export function clubIdSet(club: ClubFile, desk: EconomyFile): Set<string> {
  const ids = new Set<string>();
  for (const m of club.members) {
    const id = clubStudentId(desk, m.name, m.studentId);
    if (id) ids.add(id);
  }
  return ids;
}

export function rosterKid(file: EconomyFile, s: RawStudent, clubIds: Set<string>): RosterKid {
  const skills = skillsOf(file);
  const marked = skills.filter((sk) => skillScore(s, sk.id) > 0).length;
  const grade = s.grade ?? gradeOfPeriod(file, s.period || 1);
  const cycle = currentCycleOf(file);
  const project = s.period === 6 || s.period === 0 ? null : projectForCycle(file, grade, cycle);
  const prj = project ?? (s.period ? projectForGrade(file, grade) : null);
  const mark = prj ? calcProjectGrade(s, prj.id, file) : { points: null, evidence: "" };
  const sem = sessionOfStudent(s);
  return {
    id: s.id,
    first: s.first,
    period: s.period,
    grade,
    sem,
    section: s.section ?? (s.period === 6 ? 10 : 0),
    course: s.course ?? "",
    crewKey: s.crewKey,
    live: isLiveStudent(s, file.meta.quarterName),
    club: Boolean(s.groups?.club) || clubIds.has(s.id),
    hall: s.period === 6,
    hold: sem === "CLUB" || sem === "HOLD",
    xp: skillXp(file, s.id),
    skills: marked,
    skillN: skills.length,
    project: mark.points,
    projectTitle: prj?.title ?? "—",
  };
}

export function kidsInCohort(file: EconomyFile, c: YearCohort, club: ClubFile): RosterKid[] {
  const ids = clubIdSet(club, file);
  return file.students.filter((s) => inCohort(s, c, ids)).map((s) => rosterKid(file, s, ids)).sort((a, b) => a.first.localeCompare(b.first));
}

export function studentsInCohort(file: EconomyFile, c: YearCohort, club: ClubFile): RawStudent[] {
  const ids = clubIdSet(club, file);
  return file.students.filter((s) => inCohort(s, c, ids)).sort((a, b) => a.first.localeCompare(b.first));
}

function sessionIndex(quarter: YearCohort["quarter"]): number {
  if (quarter === "Q2") return 1;
  if (quarter === "Q3") return 2;
  if (quarter === "Q4") return 3;
  return 0;
}

export function cycleCodesOf(file: EconomyFile, s: RawStudent, c: YearCohort): string[] {
  const sess = sessions()[sessionIndex(c.quarter)];
  const cycle = Math.max(1, Math.min(8, currentCycleOf(file)));
  const week = sess?.weeks[cycle - 1] ?? sess?.weeks[0];
  if (!week) return ["", "", "", ""];
  return week.days.slice(0, 4).map((d) => tapeMark(s.markTape, d) || s.marks?.[d] || "");
}

export function quarterEffort(s: RawStudent, c: YearCohort): { n3: number; n2: number; n1: number; other: number } {
  const sess = sessions()[sessionIndex(c.quarter)];
  let n3 = 0;
  let n2 = 0;
  let n1 = 0;
  let other = 0;
  function bump(date: string, code: string) {
    if (!sess) return;
    if (date < sess.start || date > sess.end) return;
    const k = String(code || "").toUpperCase();
    if (k === "3") n3 += 1;
    else if (k === "2") n2 += 1;
    else if (k === "1") n1 += 1;
    else if (k === "A" || k === "E" || k === "P") other += 1;
  }
  for (const [date, code] of Object.entries(s.marks ?? {})) bump(date, code);
  eachTapeMark(s.markTape, bump);
  return { n3, n2, n1, other };
}

export function allYearKids(file: EconomyFile, club: ClubFile): RosterKid[] {
  const ids = clubIdSet(club, file);
  return file.students.map((s) => rosterKid(file, s, ids)).sort((a, b) => a.first.localeCompare(b.first) || a.period - b.period);
}

export function unlinkedClub(club: ClubFile, desk: EconomyFile): ClubMember[] {
  return club.members.filter((m) => !clubStudentId(desk, m.name, m.studentId));
}

export function holdClubKid(desk: EconomyFile, club: ClubFile, memberId: string): { desk: EconomyFile; club: ClubFile } {
  const m = club.members.find((x) => x.id === memberId);
  if (!m) return { desk, club };
  const hit = clubStudentId(desk, m.name, m.studentId);
  if (hit) {
    const next = cloneFile(desk);
    next.students = next.students.map((s) => (s.id === hit ? { ...s, groups: { ...s.groups, club: true } } : s));
    const clubNext = patchMember(club, m.id, { studentId: hit });
    saveClub(clubNext);
    return { desk: next, club: clubNext };
  }
  const firstLegal = m.name.trim().split(/\s+/)[0] || m.name;
  if (!firstLegal) return { desk, club };
  const before = desk.students.length;
  const next = addTypedStudent(desk, {
    legalFirst: firstLegal,
    period: 0,
    crewKey: "CLUB",
    sem: "CLUB",
    course: "TECH CLUB",
  });
  if (next.students.length === before) return { desk, club };
  const kid = next.students[next.students.length - 1]!;
  const clubNext = patchMember(club, m.id, { studentId: kid.id });
  saveClub(clubNext);
  return { desk: next, club: clubNext };
}

export function holdAllClub(desk: EconomyFile, club: ClubFile): { desk: EconomyFile; club: ClubFile } {
  let d = desk;
  let c = club;
  for (const m of unlinkedClub(c, d)) {
    const out = holdClubKid(d, c, m.id);
    d = out.desk;
    c = out.club;
  }
  return { desk: d, club: c };
}

export function placeStudent(file: EconomyFile, id: string, c: YearCohort): EconomyFile {
  const next = cloneFile(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    if (c.kind === "club") return { ...s, groups: { ...s.groups, club: true }, sem: s.sem === "CLUB" ? "CLUB" : s.sem };
    if (c.kind === "hall") return { ...s, period: 6, grade: 5, course: "STUDY HALL", sem: "YEAR", groups: { ...s.groups, hall: true } };
    return {
      ...s,
      period: c.period,
      grade: c.grade,
      course: c.course,
      section: c.section,
      sem: c.quarter,
      crewKey: s.crewKey === "CLUB" || !s.crewKey ? "Crew A" : s.crewKey,
      groups: { ...s.groups, club: s.groups?.club, hall: s.period === 6 ? true : s.groups?.hall },
    };
  });
  const kid = next.students.find((s) => s.id === id);
  if (!kid || c.kind === "club" || c.kind === "hall") return next;
  const date = todayIso();
  const dest = crewAt(kid, date);
  const blocked = dest && dest !== "Bench" ? placeBlock(next, kid, dest, date) : "empty";
  if (blocked) return setStudentCrew(next, id, openCrewFor(next, kid, date), date);
  return next;
}

export function yearCounts(file: EconomyFile, club: ClubFile) {
  const ids = clubIdSet(club, file);
  return {
    year: file.students.length,
    live: file.students.filter((s) => isLiveStudent(s, file.meta.quarterName)).length,
    club: file.students.filter((s) => s.groups?.club || ids.has(s.id)).length,
    hall: file.students.filter((s) => s.period === 6).length,
    hold: file.students.filter((s) => sessionOfStudent(s) === "CLUB" || sessionOfStudent(s) === "HOLD").length,
    unlinked: unlinkedClub(club, file).length,
    liveQ: sessionCode(file.meta.quarterName),
  };
}
