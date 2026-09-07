import type { EconomyFile, RawStudent } from "@/lib/economy";
import { todayIso } from "@/lib/calendar";

export type MstSkillId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";
export type MstLevelId = "elementary" | "intermediate" | "commencement";

export const MST_STANDARD = "NY MST Standard 5 Technology";
export const MST_VERSION = "1.0.0";

export const MST_SKILLS: { id: MstSkillId; title: string; short: string; bench: string }[] = [
  { id: "S1", title: "Engineering design", short: "Design", bench: "Plan, test, revise. Sketch before a cut." },
  { id: "S2", title: "Tools & processes", short: "Tools", bench: "Measure, cut, assemble, sand, paint, stain." },
  { id: "S3", title: "Computer technology", short: "Computer", bench: "CAD / digital plan that the crew can follow." },
  { id: "S4", title: "Technological systems", short: "Systems", bench: "How parts, people, and steps fit together." },
  { id: "S5", title: "History & evolution", short: "History", bench: "How this tool or idea got here." },
  { id: "S6", title: "Impacts of technology", short: "Impacts", bench: "Waste, safety, and who the work affects." },
  { id: "S7", title: "Project management", short: "Manage", bench: "Crew jobs, time, and a finished handoff." },
];

export const MST_LEVELS: { id: MstLevelId; title: string }[] = [
  { id: "elementary", title: "Elementary" },
  { id: "intermediate", title: "Intermediate" },
  { id: "commencement", title: "Commencement" },
];

export const MST_SCORES: { value: 1 | 2 | 3 | 4; title: string; color: string; className: string }[] = [
  { value: 1, title: "Beginning", color: "red", className: "bg-loss text-accent-fg" },
  { value: 2, title: "Developing", color: "yellow", className: "bg-work-pto text-accent-fg" },
  { value: 3, title: "Proficient", color: "green", className: "bg-gain text-bg" },
  { value: 4, title: "Advanced", color: "green-dark", className: "bg-crew-hi text-bg" },
];

export type MstRecord = {
  id: string;
  student_id: string;
  project_id: string;
  date: string;
  skill_id: MstSkillId;
  level: MstLevelId;
  score: 1 | 2 | 3 | 4;
  evidence?: string;
  next_action?: string;
  scored_by?: string;
  updated_at?: string;
};

export type MstProject = {
  id: string;
  title: string;
  started: string;
  skills_in_scope?: MstSkillId[];
};

export const XP_PER_LEVEL = 10;
export const LEVEL_MAX = 10;
export const LEVEL_WEIGHT = 1.5;
export const WALLET_WEIGHT = 1;

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export function ensureMst(file: EconomyFile): EconomyFile {
  const next = clone(file);
  next.meta.mst = {
    standard: MST_STANDARD,
    version: MST_VERSION,
    class_default_level: next.meta.mst?.class_default_level ?? "intermediate",
    lock_level_to_class: next.meta.mst?.lock_level_to_class ?? true,
    current_project_id: next.meta.mst?.current_project_id ?? "prj_cycle1",
    projects: next.meta.mst?.projects?.length
      ? next.meta.mst.projects
      : [
          {
            id: "prj_cycle1",
            title: "Cycle 1",
            started: "2026-09-08",
            skills_in_scope: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
          },
        ],
    records: next.meta.mst?.records?.length ? next.meta.mst.records : demoRecords(next.students),
    records_history: next.meta.mst?.records_history ?? [],
  };
  return next;
}

function demoRecords(students: { id: string }[]): MstRecord[] {
  const skills = MST_SKILLS.map((s) => s.id);
  const out: MstRecord[] = [];
  for (const s of students) {
    let h = 2166136261;
    for (const c of s.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    const count = 3 + (h % 5);
    for (let i = 0; i < count; i++) {
      const skill = skills[i];
      const score = ((1 + ((h >>> (i * 3)) % 4)) as 1 | 2 | 3 | 4);
      out.push({
        id: `rec_demo_${s.id}_${skill}`,
        student_id: s.id,
        project_id: "prj_cycle1",
        date: "2026-09-12",
        skill_id: skill,
        level: "intermediate",
        score,
        evidence: "",
        next_action: "",
        scored_by: "seed",
        updated_at: "2026-09-12T15:04:00-04:00",
      });
    }
  }
  return out;
}

export function mstOf(file: EconomyFile) {
  return ensureMst(file).meta.mst!;
}

export function skillTitle(id: string): string {
  return MST_SKILLS.find((s) => s.id === id)?.title ?? id;
}

export function scoreMeta(n: number) {
  return MST_SCORES.find((s) => s.value === n);
}

export function currentProject(file: EconomyFile): MstProject {
  const m = mstOf(file);
  return m.projects.find((p) => p.id === m.current_project_id) ?? m.projects[0];
}

export function inScope(project: MstProject | undefined): MstSkillId[] {
  const ids = project?.skills_in_scope;
  return ids?.length ? ids : MST_SKILLS.map((s) => s.id);
}

export function recordOn(file: EconomyFile, studentId: string, projectId: string, skillId: string): MstRecord | undefined {
  return mstOf(file).records.find((r) => r.student_id === studentId && r.project_id === projectId && r.skill_id === skillId);
}

export function recordsFor(file: EconomyFile, studentId: string): MstRecord[] {
  return mstOf(file).records.filter((r) => r.student_id === studentId);
}

/** XP = sum of every saved MST score (1–4). Not money. */
export function mstXp(file: EconomyFile, studentId: string): number {
  return recordsFor(file, studentId).reduce((n, r) => n + Number(r.score || 0), 0);
}

export function mstLevel(file: EconomyFile, studentId: string): number {
  return Math.min(LEVEL_MAX, 1 + Math.floor(mstXp(file, studentId) / XP_PER_LEVEL));
}

export function mstBand(file: EconomyFile, studentId: string): { xp: number; level: number; into: number; need: number } {
  const xp = mstXp(file, studentId);
  const level = mstLevel(file, studentId);
  if (level >= LEVEL_MAX) return { xp, level, into: XP_PER_LEVEL, need: XP_PER_LEVEL };
  return { xp, level, into: xp % XP_PER_LEVEL, need: XP_PER_LEVEL };
}

export function comboScore(level: number, wallet: number, maxWallet: number): number {
  const w = Math.max(1, maxWallet);
  return LEVEL_WEIGHT * (level / LEVEL_MAX) + WALLET_WEIGHT * (Math.max(0, wallet) / w);
}

export function setMstScore(
  file: EconomyFile,
  args: {
    studentId: string;
    projectId: string;
    skillId: MstSkillId;
    score: number;
    date?: string;
    evidence?: string;
    next_action?: string;
    scored_by?: string;
  },
): EconomyFile {
  if (!MST_SKILLS.some((s) => s.id === args.skillId)) return file;
  const n = Math.round(args.score);
  if (n < 1 || n > 4) return file;
  const next = ensureMst(file);
  const m = next.meta.mst!;
  const project = m.projects.find((p) => p.id === args.projectId) ?? m.projects[0];
  if (!project) return file;
  const scope = inScope(project);
  if (!scope.includes(args.skillId)) return file;
  const level = m.lock_level_to_class ? m.class_default_level : m.class_default_level;
  const key = (r: MstRecord) => r.student_id === args.studentId && r.project_id === project.id && r.skill_id === args.skillId;
  const prev = m.records.find(key);
  if (prev) m.records_history = [...(m.records_history ?? []), prev];
  const rec: MstRecord = {
    id: prev?.id ?? `rec_${Date.now()}_${args.studentId}_${args.skillId}`,
    student_id: args.studentId,
    project_id: project.id,
    date: args.date ?? todayIso(),
    skill_id: args.skillId,
    level,
    score: n as 1 | 2 | 3 | 4,
    evidence: (args.evidence ?? prev?.evidence ?? "").slice(0, 400),
    next_action: (args.next_action ?? prev?.next_action ?? "").slice(0, 200),
    scored_by: args.scored_by ?? "teacher",
    updated_at: new Date().toISOString(),
  };
  m.records = [...m.records.filter((r) => !key(r)), rec];
  return next;
}

export function setCurrentProject(file: EconomyFile, id: string): EconomyFile {
  const next = ensureMst(file);
  if (!next.meta.mst!.projects.some((p) => p.id === id)) return file;
  next.meta.mst!.current_project_id = id;
  return next;
}

export function addProject(file: EconomyFile, title: string): EconomyFile {
  const next = ensureMst(file);
  const id = `prj_${Date.now()}`;
  next.meta.mst!.projects.push({
    id,
    title: title.trim() || "New project",
    started: todayIso(),
    skills_in_scope: ["S1", "S2", "S3", "S4", "S5", "S6", "S7"],
  });
  next.meta.mst!.current_project_id = id;
  return next;
}

export function setClassLevel(file: EconomyFile, level: MstLevelId): EconomyFile {
  const next = ensureMst(file);
  next.meta.mst!.class_default_level = level;
  return next;
}

export function bulkScore(file: EconomyFile, studentId: string, projectId: string, skillIds: MstSkillId[], score: number): EconomyFile {
  let next = file;
  for (const id of skillIds) next = setMstScore(next, { studentId, projectId, skillId: id, score });
  return next;
}

export function exportMstCsv(file: EconomyFile, names: Pick<RawStudent, "id" | "first">[]): string {
  const header = "student_id,student_name,project_id,project_title,date,skill_id,skill_title,level,score,score_title,evidence,next_action,scored_by";
  const m = mstOf(file);
  const nameOf = (id: string) => names.find((s) => s.id === id)?.first ?? id;
  const titleOf = (id: string) => m.projects.find((p) => p.id === id)?.title ?? id;
  const rows = m.records.map((r) => {
    const cells = [
      r.student_id,
      nameOf(r.student_id),
      r.project_id,
      titleOf(r.project_id),
      r.date,
      r.skill_id,
      skillTitle(r.skill_id),
      r.level,
      String(r.score),
      scoreMeta(r.score)?.title ?? "",
      r.evidence ?? "",
      r.next_action ?? "",
      r.scored_by ?? "",
    ];
    return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
  });
  return [header, ...rows].join("\n");
}
