import type { EconomyFile, RawStudent } from "@/lib/economy";
import { daySlot, sessionOn, todayIso } from "@/lib/calendar";
import { skillScore, stemForScore } from "@/lib/skills";
import { stemOf } from "@/lib/stems";
import { eachTapeMark } from "@/lib/tape";
import {
  activitiesOf,
  activityById,
  crewOnCycle,
  crewOwnsProject,
  currentPhaseOn,
  phaseIndex,
  prettyStage,
  projectForCycle,
  projectForGrade,
  projectsOf,
  type DaySlot,
  type ShopProject,
} from "@/lib/projects";

/** Parent-facing 100-point map. Empty is not a zero. $ and PTO stay out. */
export const GRADE_MAP = {
  exceeds: 100, // skill 4 Distinguished
  full: 100, // daily 3 / skill 3 Proficient
  steady: 85, // daily 2 / skill 2 Developing
  starting: 70, // daily 1 / skill 1 Beginning
} as const;

export const SKILL_GRADE_SLOTS: { skillId: string; title: string }[] = [
  { skillId: "safety", title: "Skill — Safety" },
  { skillId: "measure", title: "Skill — Measuring and layout" },
  { skillId: "draw", title: "Skill — Drawing and planning" },
  { skillId: "model", title: "Skill — Building" },
  { skillId: "tools", title: "Skill — Using tools" },
  { skillId: "finish", title: "Skill — Finish quality" },
  { skillId: "present", title: "Skill — Explaining the work" },
  { skillId: "team", title: "Skill — Working with a crew" },
];

export type GradeSlot = {
  id: string;
  title: string;
  kind: "activity" | "cycle" | "skill" | "project";
  cycle?: number;
  skillId?: string;
  activityId?: string;
  projectId?: string;
};

export type PostedGrade = {
  slot: GradeSlot;
  calc: number | null;
  posted: number | null;
  edited: boolean;
  evidence: string;
};

function cycleOfDate(iso: string): number | null {
  const session = sessionOn(iso);
  if (!session) return null;
  const i = session.weeks.findIndex((w) => iso >= w.start && iso <= w.end);
  return i < 0 ? null : i + 1;
}

function mean(ns: number[]): number | null {
  if (!ns.length) return null;
  return Math.round(ns.reduce((a, b) => a + b, 0) / ns.length);
}

function effortToPoints(code: string): number | null {
  const c = code.toUpperCase();
  if (c === "3") return GRADE_MAP.full;
  if (c === "2") return GRADE_MAP.steady;
  if (c === "1") return GRADE_MAP.starting;
  return null;
}

function skillToPoints(n: number): number | null {
  if (n >= 4) return GRADE_MAP.exceeds;
  if (n === 3) return 90;
  if (n === 2) return GRADE_MAP.steady;
  if (n === 1) return GRADE_MAP.starting;
  return null;
}

export function gradeSlots(file: EconomyFile, grade = 6): GradeSlot[] {
  const list = projectsOf(file).filter((p) => p.grades.includes(grade));
  const rows = (list.length ? list : [projectForGrade(file, grade)]).map((p) => ({
    id: `prj-${p.id}`,
    title: p.title,
    kind: "project" as const,
    projectId: p.id,
  }));
  return rows;
}

export function calcActivityGrade(s: RawStudent, activityId: string, file: EconomyFile, project?: ShopProject): { points: number | null; evidence: string } {
  const grade = file.meta.bell?.find((b) => b.period === s.period)?.grade ?? 6;
  const prj = project ?? projectForGrade(file, grade);
  const act = activityById(prj, activityId);
  const cells = (prj.stages ?? []).filter((st) => st.activityId === activityId || (!st.activityId && st.goal === act?.goal));
  const pts: number[] = [];
  function bump(date: string, code: string) {
    const cyc = cycleOfDate(date);
    const slot = (daySlot(date).label ?? "D1") as DaySlot;
    if (cyc == null) return;
    const crew = crewOnCycle(s, cyc);
    if (!crewOwnsProject(file, cyc, s.period, crew, prj.id)) return;
    if (!cells.some((st) => st.cycle === cyc && st.slot === slot)) return;
    const p = effortToPoints(String(code || ""));
    if (p != null) pts.push(p);
  }
  for (const [date, code] of Object.entries(s.marks ?? {})) bump(date, code);
  eachTapeMark(s.markTape, bump);
  const effort = mean(pts);
  const n = act?.skillId ? skillScore(s, act.skillId) : 0;
  const skillPts = n ? skillToPoints(n) : null;
  const stem = n && act?.skillId ? stemForScore(s, act.skillId) || stemOf(act.skillId, n) : "";
  const parts = [effort, skillPts].filter((x): x is number => x != null);
  const name = act?.name ?? "Activity";
  if (!parts.length) return { points: null, evidence: `${name} · not scored yet` };
  return {
    points: mean(parts),
    evidence: [pts.length ? `${pts.length} days` : "", stem, name].filter(Boolean).join(" · "),
  };
}

export function calcProjectGrade(s: RawStudent, projectId: string, file: EconomyFile): { points: number | null; evidence: string } {
  const project = projectsOf(file).find((p) => p.id === projectId) ?? projectForGrade(file, s.grade ?? 6);
  const acts = activitiesOf(project);
  const rows = acts.map((a) => ({ name: a.name, ...calcActivityGrade(s, a.id, file, project) }));
  const parts = rows.map((r) => r.points).filter((n): n is number => n != null);
  const tag = project.stem?.length ? project.stem.join("") : "";
  const evidence = [project.prompt, tag, ...rows.map((r) => `${r.name} ${r.points ?? "—"}`)].filter(Boolean).join(" · ");
  if (!parts.length) return { points: null, evidence: evidence || `${project.title} · not scored yet` };
  return { points: mean(parts), evidence };
}

export function calcCycleGrade(s: RawStudent, cycle: number, file?: EconomyFile): { points: number | null; evidence: string } {
  const pts: number[] = [];
  let threes = 0;
  let twos = 0;
  let ones = 0;
  for (const [date, code] of Object.entries(s.marks ?? {})) {
    bump(date, code);
  }
  eachTapeMark(s.markTape, bump);
  function bump(date: string, code: string) {
    if (cycleOfDate(date) !== cycle) return;
    const p = effortToPoints(String(code || ""));
    if (p == null) return;
    pts.push(p);
    if (p === GRADE_MAP.full) threes += 1;
    else if (p === GRADE_MAP.steady) twos += 1;
    else ones += 1;
  }
  const effort = mean(pts);
  if (!file) {
    const evidence = pts.length ? `Full ${threes} · steady ${twos} · starting ${ones}` : "No scored class days yet";
    return { points: effort, evidence };
  }
  const grade = file.meta.bell?.find((b) => b.period === s.period)?.grade ?? 6;
  const project = projectForCycle(file, grade, cycle);
  const stages = (project.stages ?? []).filter((st) => st.cycle === cycle);
  const crewPhase = currentPhaseOn(file, todayIso(), s.period, s.crewKey);
  const expected = stages.length ? Math.max(...stages.map((st) => phaseIndex(st.goal))) : 0;
  const reached = phaseIndex(crewPhase);
  const phasePts = stages.length ? Math.round(Math.min(1, (reached + 1) / Math.max(1, expected + 1)) * GRADE_MAP.full) : null;
  const need = [...new Set(stages.map((st) => st.skillId).filter(Boolean))];
  const seen = need.map((id) => skillToPoints(skillScore(s, id))).filter((n): n is number => n != null);
  const skillMean = mean(seen);
  const parts = [effort, phasePts, skillMean].filter((n): n is number => n != null);
  const points = mean(parts);
  const bits = [
    pts.length ? `Days ${threes}/${twos}/${ones}` : "No days",
    stages.length ? `Phase ${prettyStage(crewPhase)}` : "",
    need.length ? `Skills ${seen.length}/${need.length}` : "",
    project.title,
  ].filter(Boolean);
  return { points, evidence: bits.join(" · ") };
}

export function calcSkillGrade(s: RawStudent, skillId: string, file?: EconomyFile): { points: number | null; evidence: string } {
  const n = skillScore(s, skillId);
  if (n > 0) {
    const label =
      n >= 4
        ? "Distinguished"
        : n === 3
          ? "Proficient"
          : n === 2
            ? "Developing"
            : "Beginning";
    const stem = stemForScore(s, skillId) || stemOf(skillId, n);
    return { points: skillToPoints(n), evidence: stem ? `${label} — ${stem}` : label };
  }
  if (!file) return { points: null, evidence: "Not seen yet" };
  const grade = file.meta.bell?.find((b) => b.period === s.period)?.grade ?? 6;
  const project = projectForGrade(file, grade);
  const stages = (project.stages ?? []).filter((st) => st.skillId === skillId);
  const required = stages.length > 0 || project.skills.includes(skillId);
  if (!required) return { points: null, evidence: "Not on this project" };
  const firstNeed = stages.length ? Math.min(...stages.map((st) => phaseIndex(st.goal))) : 0;
  const crewPhase = currentPhaseOn(file, todayIso(), s.period, s.crewKey);
  if (phaseIndex(crewPhase) < firstNeed) return { points: null, evidence: "Phase not reached" };
  const cycles = stages.length ? [...new Set(stages.map((st) => st.cycle))] : [file.meta.config?.currentCycle ?? 1];
  const dayPts: number[] = [];
  for (const [date, code] of Object.entries(s.marks ?? {})) {
    const cyc = cycleOfDate(date);
    if (cyc == null || !cycles.includes(cyc)) continue;
    const p = effortToPoints(String(code || ""));
    if (p != null) dayPts.push(p);
  }
  eachTapeMark(s.markTape, (date, code) => {
    const cyc = cycleOfDate(date);
    if (cyc == null || !cycles.includes(cyc)) return;
    const p = effortToPoints(String(code || ""));
    if (p != null) dayPts.push(p);
  });
  const inferred = mean(dayPts) ?? GRADE_MAP.steady;
  return { points: inferred, evidence: `Auto from ${prettyStage(crewPhase)} · ${project.title}` };
}

export function postedFor(file: EconomyFile, s: RawStudent, slot: GradeSlot): PostedGrade {
  const raw =
    slot.kind === "project" && slot.projectId
      ? calcProjectGrade(s, slot.projectId, file)
      : slot.kind === "activity" && slot.activityId
        ? calcActivityGrade(s, slot.activityId, file)
        : slot.kind === "cycle" && slot.cycle
          ? calcCycleGrade(s, slot.cycle, file)
          : calcSkillGrade(s, slot.skillId ?? "", file);
  const override = s.gradeOverrides?.[slot.id];
  const edited = override != null && Number.isFinite(override);
  return {
    slot,
    calc: raw.points,
    posted: edited ? Math.round(Number(override)) : raw.points,
    edited,
    evidence: raw.evidence,
  };
}

export function sessionMark(rows: PostedGrade[]): number | null {
  return mean(rows.map((r) => r.posted).filter((n): n is number => n != null));
}

export function letterOf(n: number | null): string {
  if (n == null) return "—";
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 65) return "D";
  return "F";
}

export function recipeLine(): string {
  return "One mark per project. Each activity averages its own 3/2/1 days (100/85/70) plus that activity’s skill (4/3/2/1 → 100/90/85/70). Hover a cell for the evidence stem — the sentence you saw. Blank is not a zero. Wallet and PTO stay out.";
}

export function classroomCsv(file: EconomyFile, opts: { names: boolean; period?: number }): string {
  const bellsGrade = (p: number) => file.meta.bell?.find((b) => b.period === p)?.grade ?? 6;
  const kids = file.students.filter((s) => (opts.period ? s.period === opts.period : true));
  const slots = gradeSlots(file, bellsGrade(opts.period ?? kids[0]?.period ?? 6));
  const header = [
    opts.names ? "Last Name" : "Last Name",
    "First Name",
    "Period",
    ...slots.map((s) => s.title),
    "Session mark",
  ];
  const lines = [header.join(",")];
  for (const s of kids) {
    const rows = slots.map((slot) => postedFor(file, s, slot));
    const avg = sessionMark(rows);
    const first = s.first.replace(/,/g, " ");
    const last = opts.names ? (s.last || "").replace(/,/g, " ") : "";
    const cells = [
      csv(last),
      csv(first),
      String(s.period),
      ...rows.map((r) => (r.posted == null ? "" : String(r.posted))),
      avg == null ? "" : String(avg),
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

function csv(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
