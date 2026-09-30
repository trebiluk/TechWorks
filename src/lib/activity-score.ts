import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { isLiveStudent } from "@/lib/economy";
import { publicHandle } from "@/lib/live";
import { activitiesOf, activityById, gradeOfPeriod, patchActivity, projectsOf, slotsOf, type ProjectActivity } from "@/lib/projects";
import { setSkillScore, skillLogOf, skillsOf, skillTrackOf } from "@/lib/skills";

export const SCORE_SKILL_MAX = 5;

export type ScoreMode = "rubric" | "points" | "done";

export type ActivityCell = { scores?: Record<string, number>; note?: string; absent?: boolean };

export type ActivityBook = {
  mode?: ScoreMode;
  skills?: string[];
  cells?: Record<string, ActivityCell>;
};

export function activityBooks(file: EconomyFile): Record<string, ActivityBook> {
  return file.meta.config?.activityMarks ?? {};
}

export function bookOf(file: EconomyFile, activityId: string): ActivityBook {
  return activityBooks(file)[activityId] ?? {};
}

export function findActivity(file: EconomyFile, activityId: string): { projectId: string; activity: ProjectActivity } | null {
  for (const p of projectsOf(file)) {
    const activity = activityById(p, activityId) ?? activitiesOf(p).find((a) => a.id === activityId);
    if (activity) return { projectId: p.id, activity };
  }
  return null;
}

export function periodActivities(file: EconomyFile, period: number): { projectId: string; activity: ProjectActivity }[] {
  const rows: { projectId: string; activity: ProjectActivity }[] = [];
  const slotted = slotsOf(file, period);
  const grade = gradeOfPeriod(file, period);
  const list = slotted.length ? slotted : projectsOf(file).filter((p) => !p.grades.length || p.grades.includes(grade));
  for (const p of list) {
    for (const activity of activitiesOf(p)) rows.push({ projectId: p.id, activity });
  }
  return rows;
}

export function trackedSkills(activity: ProjectActivity | undefined, book?: ActivityBook): string[] {
  const fromAct = activity?.skillIds?.filter(Boolean) ?? [];
  const fromBook = book?.skills?.filter(Boolean) ?? [];
  const one = activity?.skillId ? [activity.skillId] : [];
  const ids = (fromAct.length ? fromAct : fromBook.length ? fromBook : one).slice(0, SCORE_SKILL_MAX);
  return [...new Set(ids)];
}

export function modeOf(activity: ProjectActivity | undefined, book?: ActivityBook): ScoreMode {
  const mode = book?.mode || activity?.scoreMode;
  return mode === "points" || mode === "done" ? mode : "rubric";
}

export function skillLabel(file: EconomyFile, id: string): string {
  return skillTrackOf(id)?.name || skillsOf(file).find((s) => s.id === id)?.name || id;
}

function writeBook(file: EconomyFile, activityId: string, book: ActivityBook): EconomyFile {
  const next = cloneFile(file);
  const marks = { ...(next.meta.config?.activityMarks ?? {}) };
  marks[activityId] = book;
  next.meta.config = { ...(next.meta.config ?? {}), activityMarks: marks };
  return next;
}

export function setTrackedSkills(file: EconomyFile, projectId: string, activityId: string, ids: string[]): EconomyFile {
  const skills = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, SCORE_SKILL_MAX);
  let next = file;
  if (projectId && findActivity(next, activityId)) {
    next = patchActivity(next, projectId, activityId, { skillIds: skills, skillId: skills[0] || "draw" });
  }
  const book = bookOf(next, activityId);
  return writeBook(next, activityId, { ...book, skills });
}

export function setScoreMode(file: EconomyFile, projectId: string, activityId: string, mode: ScoreMode): EconomyFile {
  let next = file;
  if (projectId && findActivity(next, activityId)) next = patchActivity(next, projectId, activityId, { scoreMode: mode });
  return writeBook(next, activityId, { ...bookOf(next, activityId), mode });
}

export function addCustomSkill(file: EconomyFile, name: string): { file: EconomyFile; id: string } {
  const label = name.trim().replace(/\s+/g, " ").slice(0, 24);
  const id = (label.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || `sk${Date.now().toString(36)}`).slice(0, 16);
  const list = skillsOf(file);
  if (list.some((s) => s.id === id || s.name.toLowerCase() === label.toLowerCase())) return { file, id: list.find((s) => s.id === id || s.name.toLowerCase() === label.toLowerCase())?.id || id };
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), skills: [...list, { id, name: label || id }] };
  return { file: next, id };
}

function putCell(file: EconomyFile, activityId: string, studentId: string, cell: ActivityCell): EconomyFile {
  const book = bookOf(file, activityId);
  const cells = { ...(book.cells ?? {}) };
  const empty = !cell.absent && !cell.note && !Object.keys(cell.scores ?? {}).length;
  if (empty) delete cells[studentId];
  else cells[studentId] = cell;
  return writeBook(file, activityId, { ...book, cells });
}

/** Rubric 1–4 updates the standing skill (and XP). Points and Done stay on this activity only. */
export function setActivityScore(
  file: EconomyFile,
  activityId: string,
  studentId: string,
  skillId: string,
  n: number,
  opts?: { mode?: ScoreMode; projectId?: string },
): EconomyFile {
  const book = bookOf(file, activityId);
  const mode = opts?.mode || book.mode || "rubric";
  const prev = { ...(book.cells?.[studentId] ?? {}) };
  if (prev.absent) return file;
  const scores = { ...(prev.scores ?? {}) };
  if (mode === "done") {
    if (n > 0) scores[skillId] = 1;
    else delete scores[skillId];
  } else if (mode === "points") {
    const v = Math.max(0, Math.min(100, Math.round(n)));
    if (!v) delete scores[skillId];
    else scores[skillId] = v;
  } else {
    const v = n <= 0 ? 0 : Math.min(4, Math.round(n));
    if (!v) delete scores[skillId];
    else scores[skillId] = v;
  }
  let next = putCell(file, activityId, studentId, { ...prev, scores });
  if (mode === "rubric" && n >= 1 && n <= 4) {
    next = setSkillScore(next, studentId, skillId, Math.round(n), { source: activityId, projectId: opts?.projectId });
  }
  return next;
}

export function setActivityNote(file: EconomyFile, activityId: string, studentId: string, note: string): EconomyFile {
  const prev = { ...(bookOf(file, activityId).cells?.[studentId] ?? {}) };
  const text = note.trim().slice(0, 80);
  return putCell(file, activityId, studentId, { ...prev, note: text || undefined });
}

export function setActivityAbsent(file: EconomyFile, activityId: string, studentIds: string[], on: boolean): EconomyFile {
  let next = file;
  for (const id of studentIds) {
    const prev = { ...(bookOf(next, activityId).cells?.[id] ?? {}) };
    next = putCell(next, activityId, id, { ...prev, absent: on || undefined, scores: on ? {} : prev.scores });
  }
  return next;
}

export function setActivityAll(
  file: EconomyFile,
  activityId: string,
  studentIds: string[],
  skillId: string,
  n: number,
  opts?: { mode?: ScoreMode; projectId?: string },
): EconomyFile {
  let next = file;
  for (const id of studentIds) next = setActivityScore(next, activityId, id, skillId, n, opts);
  return next;
}

export function livePeriodRoster(file: EconomyFile, period: number): RawStudent[] {
  return file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && !s.removedAt && !s.archivedAt);
}

export function activityCsv(file: EconomyFile, activityId: string, students: RawStudent[], skillIds: string[]): string {
  const book = bookOf(file, activityId);
  const header = ["Alias", "Code", ...skillIds.map((id) => skillLabel(file, id)), "Note", "Absent"];
  const lines = [header.map(csv).join(",")];
  for (const s of students) {
    const cell = book.cells?.[s.id];
    const marks = skillIds.map((id) => {
      if (cell?.absent) return "";
      const n = cell?.scores?.[id];
      if (n == null) return "";
      if (modeOf(undefined, book) === "done") return n ? "Done" : "";
      return String(n);
    });
    lines.push([csv(s.first), csv(publicHandle(s.id)), ...marks, csv(cell?.note ?? ""), cell?.absent ? "A" : ""].join(","));
  }
  return lines.join("\n");
}

export function skillTrend(s: RawStudent, skillId: string): number[] {
  return skillLogOf(s)
    .filter((row) => row.skillId === skillId && row.n > 0)
    .slice(-4)
    .map((row) => row.n);
}

function csv(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
