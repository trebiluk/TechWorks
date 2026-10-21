import type { EconomyFile } from "./economy.ts";
import { activitiesOf, projectsOf, type ProjectActivity, type ShopProject } from "./projects.ts";
import { skillTrackOf } from "./skills.ts";

/** One class period when the activity does not say how many minutes. */
const CLASS_MIN = 45;

export type ActivityQuery = {
  grade?: number;
  maxMin?: number;
  kit?: string;
  skill?: string;
};

export type LibraryActivity = {
  id: string;
  name: string;
  projectId: string;
  projectTitle: string;
  grades: number[];
  minutes: number;
  kit: string;
  skill: string;
  skillId: string;
};

function minutesOf(activity: ProjectActivity): number {
  const raw = (activity as ProjectActivity & { minutes?: unknown }).minutes;
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  return CLASS_MIN;
}

function kitOf(activity: ProjectActivity): string {
  const raw = (activity as ProjectActivity & { kit?: unknown }).kit;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return "shop";
}

function skillOf(activity: ProjectActivity): string {
  const named = skillTrackOf(activity.skillId)?.name;
  return (named || activity.skillId || "skill").trim().toLowerCase();
}

function wanted(value: string | undefined): string {
  const text = value?.trim().toLowerCase() ?? "";
  return text === "any" ? "" : text;
}

/** Every activity on every project, name order. Filters are optional. */
export function listActivities(file: EconomyFile, query: ActivityQuery = {}): LibraryActivity[] {
  const rows: LibraryActivity[] = [];
  for (const project of projectsOf(file)) rows.push(...rowsOf(project));
  const grade = query.grade;
  const maxMin = query.maxMin;
  const kit = wanted(query.kit);
  const skill = wanted(query.skill);
  return rows
    .filter((row) => {
      if (grade != null && !row.grades.includes(grade)) return false;
      if (maxMin != null && row.minutes > maxMin) return false;
      if (kit && row.kit.toLowerCase() !== kit) return false;
      if (skill && row.skill !== skill && row.skillId.toLowerCase() !== skill) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.projectTitle.localeCompare(b.projectTitle) || a.id.localeCompare(b.id));
}

function rowsOf(project: ShopProject): LibraryActivity[] {
  const out: LibraryActivity[] = [];
  for (const activity of activitiesOf(project)) {
    if (!activity.id || !activity.name?.trim()) continue;
    out.push({
      id: activity.id,
      name: activity.name.trim(),
      projectId: project.id,
      projectTitle: project.title,
      grades: project.grades,
      minutes: minutesOf(activity),
      kit: kitOf(activity),
      skill: skillOf(activity),
      skillId: activity.skillId,
    });
  }
  return out;
}
