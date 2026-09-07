import type { EconomyFile } from "@/lib/economy";
import { bellFor, isLiveStudent } from "@/lib/economy";
import { cycleNow, cycleRange, daySlot, todayIso } from "@/lib/calendar";
import { skillForGoal, skillTrackOf, skillsOf, SKILL_TRACK } from "@/lib/skills";
import { cloneFile } from "@/lib/clone";

export const PHASES = [
  "IDEA STAGE",
  "DESIGN STAGE",
  "MODELING STAGE",
  "FINISHING STAGE",
  "PRESENTATION PREP",
  "CRITIQUE DAY",
  "PRODUCTIVITY",
  "TRAINING",
  "DEMONSTRATION",
  "DRAWING",
  "FREE DAY",
] as const;

export type DaySlot = "D1" | "D2" | "D3" | "D4";

export type ProjectActivity = {
  id: string;
  name: string;
  skillId: string;
  goal: string;
};

export type ProjectStage = {
  cycle: number;
  slot: DaySlot;
  goal: string;
  skillId: string;
  activityId?: string;
};

export type ShopProject = {
  id: string;
  title: string;
  grades: number[];
  skills: string[];
  stages: ProjectStage[];
  activities?: ProjectActivity[];
  start?: string;
  end?: string;
  constraints?: string[];
  cycleStart?: number;
  cycleLen?: number;
  pathVer?: number;
};

export const XP_TAX_PER_LAG = 2;
export const TOP_SKILLS = 4;

const SLOTS: DaySlot[] = ["D1", "D2", "D3", "D4"];

/** Shop build sequence. Cycle 1 Day 1 is always idea/design. Two cycles = full path. */
export const WISE_PATH: { goal: string; skillId: string }[] = [
  { goal: "IDEA STAGE", skillId: "draw" },
  { goal: "DESIGN STAGE", skillId: "draw" },
  { goal: "MODELING STAGE", skillId: "model" },
  { goal: "MODELING STAGE", skillId: "tools" },
  { goal: "FINISHING STAGE", skillId: "finish" },
  { goal: "FINISHING STAGE", skillId: "finish" },
  { goal: "PRESENTATION PREP", skillId: "present" },
  { goal: "CRITIQUE DAY", skillId: "present" },
];

export const WISE_SHORT: { goal: string; skillId: string }[] = [
  { goal: "IDEA STAGE", skillId: "draw" },
  { goal: "DESIGN STAGE", skillId: "draw" },
  { goal: "MODELING STAGE", skillId: "model" },
  { goal: "FINISHING STAGE", skillId: "finish" },
];

export function wiseAt(i: number, cycleLen: 1 | 2 = 2): { goal: string; skillId: string } {
  const path = cycleLen === 1 ? WISE_SHORT : WISE_PATH;
  return path[Math.min(i, path.length - 1)] ?? path[0];
}

export const DEFAULT_ACTIVITIES: ProjectActivity[] = [
  { id: "act-brain", name: "Brainstorming", skillId: "draw", goal: "IDEA STAGE" },
  { id: "act-draw", name: "Technical Drawing", skillId: "draw", goal: "DESIGN STAGE" },
  { id: "act-model", name: "Modeling", skillId: "model", goal: "MODELING STAGE" },
  { id: "act-finish", name: "Finishing", skillId: "finish", goal: "FINISHING STAGE" },
  { id: "act-present", name: "Presentation", skillId: "present", goal: "PRESENTATION PREP" },
  { id: "act-reflect", name: "Reflection", skillId: "present", goal: "CRITIQUE DAY" },
];

const WISE_ACT = ["act-brain", "act-draw", "act-model", "act-model", "act-finish", "act-finish", "act-present", "act-reflect"];
const WISE_SHORT_ACT = ["act-brain", "act-draw", "act-model", "act-finish"];

export function wiseActAt(i: number, cycleLen: 1 | 2 = 2): string {
  const path = cycleLen === 1 ? WISE_SHORT_ACT : WISE_ACT;
  return path[Math.min(i, path.length - 1)] ?? path[0];
}

export function wiseStages(cycleStart: number, cycleLen: 1 | 2 = 2): ProjectStage[] {
  const rows = projectCycleRows({ id: "", title: "", grades: [], skills: [], stages: [], cycleStart, cycleLen });
  const out: ProjectStage[] = [];
  let i = 0;
  for (const cycle of rows) {
    for (const slot of SLOTS) {
      const w = wiseAt(i, cycleLen);
      const actId = wiseActAt(i, cycleLen);
      const act = DEFAULT_ACTIVITIES.find((a) => a.id === actId);
      out.push({
        cycle,
        slot,
        goal: act?.goal ?? w.goal,
        skillId: act?.skillId ?? w.skillId,
        activityId: actId,
      });
      i += 1;
    }
  }
  return out;
}

export const DEFAULT_STAGES: ProjectStage[] = wiseStages(1, 2);

export function activitiesOf(p: ShopProject): ProjectActivity[] {
  return p.activities?.length ? p.activities : DEFAULT_ACTIVITIES;
}

export function activityById(p: ShopProject, id?: string): ProjectActivity | undefined {
  if (!id) return undefined;
  return activitiesOf(p).find((a) => a.id === id);
}

export function planActivity(p: ShopProject, cycle: number, slot: DaySlot): ProjectActivity | undefined {
  const st = p.stages.find((s) => s.cycle === cycle && s.slot === slot);
  return activityById(p, st?.activityId) ?? activitiesOf(p).find((a) => a.goal === st?.goal);
}

export function activityLabel(p: ShopProject, stage?: ProjectStage): string {
  const act = activityById(p, stage?.activityId) ?? activitiesOf(p).find((a) => a.goal === stage?.goal);
  return act?.name ?? prettyStage(stage?.goal ?? "IDEA STAGE");
}

export function ensureActivities(p: ShopProject): ShopProject {
  const start = p.cycleStart ?? 1;
  const len = (p.cycleLen === 1 ? 1 : 2) as 1 | 2;
  const activities = activitiesOf(p);
  const base = p.stages?.length ? p.stages : wiseStages(start, len);
  let i = 0;
  const stages = base.map((s) => {
    const id = s.activityId || wiseActAt(i, len);
    i += 1;
    const act = activities.find((a) => a.id === id);
    return {
      ...s,
      activityId: id,
      goal: s.goal || act?.goal || "IDEA STAGE",
      skillId: s.skillId || act?.skillId || "draw",
    };
  });
  return { ...p, activities, stages, pathVer: Math.max(p.pathVer ?? 0, 3) };
}

export const DEFAULT_PROJECTS: ShopProject[] = [
  {
    id: "prj6",
    title: "Simple machines",
    grades: [6],
    skills: ["safety", "draw", "model", "tools"],
    stages: DEFAULT_STAGES,
    activities: DEFAULT_ACTIVITIES,
    start: "2026-09-08",
    end: "2026-11-13",
    constraints: ["One tool at a time", "Goggles on"],
    cycleStart: 1,
    cycleLen: 2,
    pathVer: 3,
  },
  {
    id: "prj7",
    title: "CO2 dragster",
    grades: [7],
    skills: ["safety", "measure", "draw", "model"],
    stages: DEFAULT_STAGES,
    activities: DEFAULT_ACTIVITIES,
    start: "2026-09-08",
    end: "2026-11-13",
    constraints: ["No extra mass after weigh-in"],
    cycleStart: 1,
    cycleLen: 2,
    pathVer: 3,
  },
  {
    id: "prj8",
    title: "Product design",
    grades: [8],
    skills: ["safety", "draw", "digital", "present"],
    stages: DEFAULT_STAGES,
    activities: DEFAULT_ACTIVITIES,
    start: "2026-09-08",
    end: "2026-11-13",
    constraints: ["Prototype must stand on its own"],
    cycleStart: 1,
    cycleLen: 2,
    pathVer: 3,
  },
  {
    id: "prj-figure",
    title: "Action Figure",
    grades: [6],
    skills: ["safety", "draw", "model", "finish"],
    stages: DEFAULT_STAGES,
    activities: DEFAULT_ACTIVITIES,
    start: "2026-09-08",
    end: "2026-11-13",
    constraints: ["Parts stay on the figure"],
    cycleStart: 1,
    cycleLen: 2,
    pathVer: 3,
  },
];

export function ensureProjects(file: EconomyFile): EconomyFile {
  const next = cloneFile(file);
  const raw = next.meta.config?.projects?.length ? next.meta.config.projects : DEFAULT_PROJECTS;
  const list = raw
    .filter((p) => p.id !== "prjsh" && !p.grades.includes(5))
    .map((p) => ensureActivities(p.pathVer === 2 || p.pathVer === 3 ? p : { ...p, stages: wiseStages(p.cycleStart ?? 1, p.cycleLen === 1 ? 1 : 2), pathVer: 3 }));
  const haveFigure = list.some((p) => p.id === "prj-figure");
  const withFigure = haveFigure ? list : [...list, ensureActivities(DEFAULT_PROJECTS.find((p) => p.id === "prj-figure")!)];
  const by = { ...(next.meta.config?.projectByGrade ?? {}) };
  delete by["5"];
  next.meta.config = {
    ...(next.meta.config ?? {}),
    projects: withFigure.length ? withFigure : DEFAULT_PROJECTS,
    projectByGrade: { "6": "prj6", "7": "prj7", "8": "prj8", ...by },
  };
  return next;
}

export function projectsOf(file: EconomyFile): ShopProject[] {
  const raw = file.meta.config?.projects?.length ? file.meta.config.projects : DEFAULT_PROJECTS;
  return raw
    .filter((p) => p.id !== "prjsh" && !p.grades.includes(5))
    .map((p) => ensureActivities(p));
}

export function projectForGrade(file: EconomyFile, grade: number): ShopProject {
  const list = projectsOf(file);
  const id = file.meta.config?.projectByGrade?.[String(grade)];
  return list.find((p) => p.id === id) ?? list.find((p) => p.grades.includes(grade)) ?? list[0];
}

export function projectForCycle(file: EconomyFile, grade: number, cycle: number): ShopProject {
  const list = projectsOf(file).filter((p) => p.grades.includes(grade));
  const hit = list.find((p) => {
    const start = p.cycleStart ?? 1;
    const len = p.cycleLen === 1 ? 1 : 2;
    return cycle >= start && cycle <= start + len - 1;
  });
  return hit ?? projectForGrade(file, grade);
}

export function gradeOfPeriod(file: EconomyFile, period: number): number {
  if (period === 6) return 5;
  return bellFor(file).find((b) => b.period === period)?.grade ?? 6;
}

export function crewOnCycle(s: { crewKey: string; crewByCycle?: Record<string, string> }, cycle: number): string {
  return s.crewByCycle?.[String(cycle)] || s.crewKey;
}

export function crewProjectRows(file: EconomyFile) {
  return file.meta.config?.crewProjects ?? [];
}

export function crewProjectId(file: EconomyFile, cycle: number, period: number, crewKey: string): string {
  const hit = crewProjectRows(file).find((r) => r.cycle === cycle && r.period === period && r.crewKey === crewKey);
  if (hit?.projectId) return hit.projectId;
  const grade = gradeOfPeriod(file, period);
  return projectForCycle(file, grade, cycle).id;
}

export function projectForCrew(file: EconomyFile, cycle: number, period: number, crewKey: string): ShopProject {
  const id = crewProjectId(file, cycle, period, crewKey);
  return projectsOf(file).find((p) => p.id === id) ?? projectForCycle(file, gradeOfPeriod(file, period), cycle);
}

export function crewOwnsProject(file: EconomyFile, cycle: number, period: number, crewKey: string, projectId: string): boolean {
  return crewProjectId(file, cycle, period, crewKey) === projectId;
}

export function assignCrewProject(file: EconomyFile, cycle: number, period: number, crewKey: string, projectId: string): EconomyFile {
  const next = cloneFile(file);
  const rest = crewProjectRows(next).filter((r) => !(r.cycle === cycle && r.period === period && r.crewKey === crewKey));
  rest.push({ cycle, period, crewKey, projectId });
  next.meta.config = { ...(next.meta.config ?? {}), crewProjects: rest };
  return next;
}

export function agendaFor(file: EconomyFile, period: number, date = todayIso(), crewKey?: string) {
  const grade = gradeOfPeriod(file, period);
  const cycle = cycleNow(date);
  const slot = (daySlot(date).label ?? "D1") as DaySlot;
  if (period === 6) {
    return {
      grade: 5,
      project: {
        id: "sh",
        title: "Study hall",
        grades: [5],
        skills: [],
        stages: [],
      } satisfies ShopProject,
      stage: { cycle, slot, goal: "PRODUCTIVITY", skillId: "team" },
      activity: { id: "act-sh", name: "Productivity", skillId: "team", goal: "PRODUCTIVITY" },
      cycle,
      slot,
      goal: "PRODUCTIVITY",
      skillId: "team",
      title: "Study hall",
      activityName: "Productivity",
    };
  }
  const project = crewKey ? projectForCrew(file, cycle, period, crewKey) : projectForCycle(file, grade, cycle);
  const stage =
    project.stages.find((s) => s.cycle === cycle && s.slot === slot) ??
    project.stages.find((s) => s.cycle === cycle) ??
    project.stages[0];
  const activity = planActivity(project, cycle, slot) ?? activityById(project, stage?.activityId);
  return {
    grade,
    project,
    stage,
    activity,
    cycle,
    slot,
    goal: activity?.goal ?? stage?.goal ?? "IDEA STAGE",
    skillId: activity?.skillId ?? stage?.skillId ?? "safety",
    title: project.title,
    activityName: activity?.name ?? prettyStage(stage?.goal ?? "IDEA STAGE"),
  };
}

export function prettyStage(goal: string): string {
  return goal
    .toLowerCase()
    .replace(/\bstage\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function skillName(id: string): string {
  return skillTrackOf(id)?.name ?? id;
}

export function setActiveProject(file: EconomyFile, grade: number, projectId: string): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    projectByGrade: { ...(next.meta.config?.projectByGrade ?? {}), [String(grade)]: projectId },
  };
  return next;
}

export function upsertProject(file: EconomyFile, project: ShopProject): EconomyFile {
  const next = cloneFile(file);
  const list = [...projectsOf(next)];
  const i = list.findIndex((p) => p.id === project.id);
  if (i >= 0) list[i] = project;
  else list.push(project);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function addProject(file: EconomyFile, title: string, grades: number[]): EconomyFile {
  const id = `prj_${Date.now().toString(36)}`;
  const cycleStart = cycleNow(todayIso());
  const dates = datesFromCycles(cycleStart, 2);
  return upsertProject(file, {
    id,
    title: title.trim() || "New project",
    grades,
    skills: ["safety", "draw", "model", "tools"].slice(0, TOP_SKILLS),
    stages: wiseStages(cycleStart, 2),
    activities: DEFAULT_ACTIVITIES,
    start: dates.start,
    end: dates.end,
    constraints: [],
    cycleStart,
    cycleLen: 2,
    pathVer: 2,
  });
}

export function pushStageToday(file: EconomyFile, grade: number, stage: ProjectStage): EconomyFile {
  const next = cloneFile(file);
  const cycle = next.meta.config?.currentCycle ?? 1;
  const map = { ...(next.meta.config?.cycleGoals ?? {}) };
  map[String(grade)] = stage.goal;
  map[`${cycle}|${grade}`] = stage.goal;
  const list = projectsOf(next).map((p) => {
    if (!p.grades.includes(grade) && p.id !== next.meta.config?.projectByGrade?.[String(grade)]) return p;
    if (p.id !== projectForGrade(next, grade).id) return p;
    return {
      ...p,
      stages: p.stages.map((s) => (s.cycle === cycle && s.slot === stage.slot ? { ...s, goal: stage.goal, skillId: stage.skillId } : s)),
    };
  });
  next.meta.config = { ...(next.meta.config ?? {}), cycleGoals: map, projects: list };
  return next;
}

export function setStageAt(file: EconomyFile, projectId: string, cycle: number, slot: DaySlot, patch: Partial<ProjectStage>): EconomyFile {
  const list = projectsOf(file).map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      pathVer: 3,
      stages: p.stages.map((s) => (s.cycle === cycle && s.slot === slot ? { ...s, ...patch } : s)),
    };
  });
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function setPlanActivity(file: EconomyFile, projectId: string, cycle: number, slot: DaySlot, activityId: string): EconomyFile {
  const p = projectsOf(file).find((x) => x.id === projectId);
  const act = p ? activityById(p, activityId) : undefined;
  return setStageAt(file, projectId, cycle, slot, {
    activityId,
    goal: act?.goal,
    skillId: act?.skillId,
  });
}

export function addActivity(file: EconomyFile, projectId: string, name: string, skillId = "draw"): EconomyFile {
  const list = projectsOf(file).map((p) => {
    if (p.id !== projectId) return p;
    const acts = activitiesOf(p);
    const id = `act_${Date.now().toString(36)}`;
    return ensureActivities({
      ...p,
      activities: [...acts, { id, name: name.trim() || "Activity", skillId, goal: "IDEA STAGE" }].slice(0, 8),
    });
  });
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function patchActivity(file: EconomyFile, projectId: string, activityId: string, patch: Partial<ProjectActivity>): EconomyFile {
  const list = projectsOf(file).map((p) => {
    if (p.id !== projectId) return p;
    return ensureActivities({
      ...p,
      activities: activitiesOf(p).map((a) => (a.id === activityId ? { ...a, ...patch } : a)),
    });
  });
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function dropActivity(file: EconomyFile, projectId: string, activityId: string): EconomyFile {
  const list = projectsOf(file).map((p) => {
    if (p.id !== projectId) return p;
    const acts = activitiesOf(p).filter((a) => a.id !== activityId);
    if (acts.length < 1) return p;
    const fallback = acts[0].id;
    return ensureActivities({
      ...p,
      activities: acts,
      stages: p.stages.map((s) => (s.activityId === activityId ? { ...s, activityId: fallback, goal: acts[0].goal, skillId: acts[0].skillId } : s)),
    });
  });
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function phaseIndex(goal: string): number {
  const i = (PHASES as readonly string[]).indexOf(goal);
  if (i >= 0) return i;
  return Math.max(0, DEFAULT_STAGES.findIndex((s) => s.goal === goal));
}

export function uniqueGoals(project: ShopProject): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of project.stages ?? []) {
    if (s.goal && !seen.has(s.goal)) {
      seen.add(s.goal);
      out.push(s.goal);
    }
  }
  return out.length ? out : [...PHASES];
}

export function expectedPhase(project: ShopProject, date = todayIso()): string {
  const goals = uniqueGoals(project);
  const start = project.start || "";
  const end = project.end || "";
  if (!start || !end || end <= start) return goals[0] ?? "IDEA STAGE";
  if (date <= start) return goals[0] ?? "IDEA STAGE";
  if (date >= end) return goals[goals.length - 1] ?? "CRITIQUE DAY";
  const span = Date.parse(`${end}T12:00:00`) - Date.parse(`${start}T12:00:00`);
  const t = Date.parse(`${date}T12:00:00`) - Date.parse(`${start}T12:00:00`);
  const i = Math.min(goals.length - 1, Math.max(0, Math.floor((t / Math.max(1, span)) * goals.length)));
  return goals[i] ?? goals[0];
}

function dayOf(file: EconomyFile, date: string) {
  file.meta.dayLog = file.meta.dayLog ?? {};
  file.meta.dayLog[date] = file.meta.dayLog[date] ?? { periodGoals: {}, crewGoals: {} };
  const d = file.meta.dayLog[date];
  d.crewPhase = d.crewPhase ?? {};
  d.goalPhase = d.goalPhase ?? {};
  return d;
}

export function goalPhaseOn(file: EconomyFile, period: number, date = todayIso()): string {
  const logged = file.meta.dayLog?.[date]?.goalPhase?.[String(period)];
  if (logged) return logged;
  const agenda = agendaFor(file, period, date);
  return agenda.goal || expectedPhase(agenda.project, date);
}

export function setGoalPhase(file: EconomyFile, date: string, period: number, phase: string): EconomyFile {
  const next = cloneFile(file);
  dayOf(next, date).goalPhase![String(period)] = phase;
  const grade = gradeOfPeriod(next, period);
  const cycle = next.meta.config?.currentCycle ?? 1;
  const map = { ...(next.meta.config?.cycleGoals ?? {}) };
  map[String(grade)] = phase;
  map[`${cycle}|${grade}`] = phase;
  next.meta.config = { ...(next.meta.config ?? {}), cycleGoals: map };
  return next;
}

export function currentPhaseOn(file: EconomyFile, date: string, period: number, crewKey: string): string {
  return file.meta.dayLog?.[date]?.crewPhase?.[`${period}|${crewKey}`] ?? goalPhaseOn(file, period, date);
}

export function setCurrentPhase(file: EconomyFile, date: string, period: number, crewKey: string, phase: string): EconomyFile {
  const next = cloneFile(file);
  dayOf(next, date).crewPhase![`${period}|${crewKey}`] = phase;
  return next;
}

export function crewsForPeriod(file: EconomyFile, period: number) {
  const q = file.meta.quarterName;
  const keys = [...new Set(file.students.filter((s) => s.period === period && isLiveStudent(s, q)).map((s) => s.crewKey))];
  return keys.map((key) => ({
    key,
    name: file.crews.find((c) => c.period === period && c.key === key)?.name ?? key,
  }));
}

export type CrewPace = {
  key: string;
  name: string;
  current: string;
  goal: string;
  lag: number;
  behindPeers: boolean;
  xpTax: number;
};

export function crewPace(file: EconomyFile, period: number, date = todayIso()): CrewPace[] {
  const goal = goalPhaseOn(file, period, date);
  const gIdx = phaseIndex(goal);
  const rows = crewsForPeriod(file, period).map((c) => {
    const current = currentPhaseOn(file, date, period, c.key);
    const lag = Math.max(0, gIdx - phaseIndex(current));
    return { ...c, current, goal, lag, behindPeers: false, xpTax: lag * XP_TAX_PER_LAG };
  });
  const best = Math.max(0, ...rows.map((r) => phaseIndex(r.current)));
  return rows.map((r) => ({ ...r, behindPeers: phaseIndex(r.current) < best }));
}

export function xpTaxFor(file: EconomyFile, period: number, crewKey: string, date = todayIso()): number {
  return crewPace(file, period, date).find((c) => c.key === crewKey)?.xpTax ?? 0;
}

export function periodPaceLine(file: EconomyFile, period: number, date = todayIso()) {
  const rows = crewPace(file, period, date);
  const behind = rows.filter((r) => r.lag > 0);
  const peers = rows.filter((r) => r.behindPeers);
  const goal = rows[0]?.goal ?? goalPhaseOn(file, period, date);
  return { goal, behind, peers, tax: Math.max(0, ...rows.map((r) => r.xpTax)), rows };
}

export function datesFromCycles(cycleStart: number, cycleLen: number) {
  const len = cycleLen === 1 ? 1 : 2;
  const a = Math.max(1, Math.min(8, cycleStart));
  const b = Math.min(8, a + len - 1);
  return { start: cycleRange(a).start, end: cycleRange(b).end };
}

export function projectCycleRows(p: ShopProject): number[] {
  const start = Math.max(1, Math.min(8, p.cycleStart ?? 1));
  const len = p.cycleLen === 1 ? 1 : 2;
  return Array.from({ length: len }, (_, i) => Math.min(8, start + i));
}

export function remapStages(p: ShopProject, cycleStart: number, cycleLen: 1 | 2): ProjectStage[] {
  const fresh = wiseStages(cycleStart, cycleLen);
  return fresh.map((cell, i) => {
    const old = p.stages.find((s) => s.cycle === cell.cycle && s.slot === cell.slot);
    if (old && p.pathVer === 2 && old.goal && old.goal !== wiseAt(i, cycleLen).goal) {
      return { ...cell, goal: old.goal, skillId: old.skillId || skillForGoal(old.goal) };
    }
    return cell;
  });
}

export function assignProjectCycles(file: EconomyFile, projectId: string, cycleStart: number, cycleLen: 1 | 2): EconomyFile {
  const dates = datesFromCycles(cycleStart, cycleLen);
  const list = projectsOf(file).map((p) => {
    if (p.id !== projectId) return p;
    return {
      ...p,
      cycleStart,
      cycleLen,
      pathVer: 3,
      start: dates.start,
      end: dates.end,
      stages: wiseStages(cycleStart, cycleLen),
      activities: activitiesOf(p),
    };
  });
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), projects: list };
  return next;
}

export function calendarFocus(date = todayIso()) {
  return { cycle: cycleNow(date), slot: (daySlot(date).label ?? "D1") as DaySlot };
}

export function pedagogySkills(file: EconomyFile) {
  return skillsOf(file)
    .filter((c) => (skillTrackOf(c.id)?.family ?? "shop") === "shop")
    .map((c) => {
      const p = skillTrackOf(c.id);
      return { id: c.id, name: (p?.name ?? c.name).toUpperCase(), does: p?.does ?? "", why: p?.why ?? "" };
    });
}
