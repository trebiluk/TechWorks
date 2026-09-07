import type { EconomyFile, RawStudent } from "@/lib/economy";
import { roleHistoryOf } from "@/lib/roles";
import { cloneFile } from "@/lib/clone";
import type { MstSkillId } from "@/lib/mst";

export const SKILL_MAX = 4;

export const SKILL_MARKS = [
  { n: 1, short: "1", name: "Beginning", why: "Needs a demo. Not independent yet." },
  { n: 2, short: "2", name: "Developing", why: "Can do it with a check-in." },
  { n: 3, short: "3", name: "Proficient", why: "Independent. Meets the standard." },
  { n: 4, short: "4", name: "Distinguished", why: "Can teach a crewmate. Exceeds." },
] as const;

export const PORTRAIT = [
  { id: "prepared", label: "Academically Prepared" },
  { id: "innovator", label: "Creative Innovator" },
  { id: "thinker", label: "Critical Thinker" },
  { id: "communicator", label: "Effective Communicator" },
  { id: "citizen", label: "Global Citizen" },
  { id: "reflective", label: "Reflective and Future Focused" },
] as const;

export const LEVEL_MAX = 8;
export const XP_PER_LEVEL = 6;

export type LevelBand = { minXp: number; label: string; swatch: string };

export const DEFAULT_LEVEL_BANDS: LevelBand[] = [
  { minXp: 0, label: "Cub", swatch: "muted" },
  { minXp: 6, label: "Rookie", swatch: "subtle" },
  { minXp: 12, label: "Scout", swatch: "gain" },
  { minXp: 18, label: "Builder", swatch: "gain" },
  { minXp: 24, label: "Crafter", swatch: "accent" },
  { minXp: 30, label: "Lead", swatch: "accent" },
  { minXp: 36, label: "Ace", swatch: "accent" },
  { minXp: 42, label: "Legend", swatch: "accent" },
];

export function levelBandsOf(file: EconomyFile): LevelBand[] {
  const saved = file.meta.config?.levels?.bands;
  if (saved?.length) return saved;
  return DEFAULT_LEVEL_BANDS;
}

export function levelsColorOn(file: EconomyFile): boolean {
  return Boolean(file.meta.config?.levels?.colorOn);
}

export function bandAt(file: EconomyFile, xp: number): string {
  const bands = levelBandsOf(file);
  return bands.filter((b) => xp >= b.minXp).at(-1)?.label || "Cub";
}

export function crossedBand(file: EconomyFile, beforeXp: number, afterXp: number): string | null {
  const a = bandAt(file, beforeXp);
  const b = bandAt(file, afterXp);
  if (!b || a === b) return null;
  return b;
}

export const DEFAULT_SKILLS = [
  { id: "safety", name: "SAFETY" },
  { id: "measure", name: "MEASURE" },
  { id: "draw", name: "DRAW" },
  { id: "model", name: "MODEL" },
  { id: "material", name: "MATERIAL" },
  { id: "tools", name: "TOOLS" },
  { id: "finish", name: "FINISH" },
  { id: "present", name: "PRESENT" },
  { id: "digital", name: "DIGITAL" },
  { id: "team", name: "TEAM" },
  { id: "listen", name: "LISTEN" },
  { id: "share", name: "SHARE" },
  { id: "grit", name: "GRIT" },
  { id: "care", name: "CARE" },
  { id: "time", name: "TIME" },
  { id: "leadsoft", name: "LEAD" },
];

export type SkillFamily = "shop" | "soft";
export type SkillSub = { id: string; name: string; does: string };
export type SkillDef = {
  id: string;
  name: string;
  family: SkillFamily;
  does: string;
  why: string;
  bench: string;
  pog: (typeof PORTRAIT)[number]["id"];
  mst: MstSkillId[];
  subs: SkillSub[];
};

export const SKILL_WHY: Record<string, string> = {
  safety: "No work until this is solid.",
  measure: "Cuts start with a true mark.",
  draw: "They think before they cut.",
  model: "The idea becomes a part.",
  material: "Right stock, less waste.",
  tools: "The machine does not think for them.",
  finish: "Sand, paint, stain — the last 10%.",
  present: "They can explain the work.",
  digital: "Plan on a screen, build in the workshop.",
  team: "A crew is not four solo jobs.",
  listen: "They hear the demo the first time.",
  share: "Tools and airtime both get passed.",
  grit: "Stuck, then try a second way.",
  care: "The bench is left better than they found it.",
  time: "They finish the step before the bell.",
  leadsoft: "They can run a 2×2 without you.",
};

export const SKILL_TRACK: SkillDef[] = [
  { id: "safety", name: "Safety", family: "shop", does: "Goggles, stance, ask before a tool.", why: SKILL_WHY.safety, bench: "Works without a safety reminder.", pog: "citizen", mst: ["S2", "S6"], subs: [] },
  { id: "measure", name: "Measure", family: "shop", does: "Rule, square, mark once.", why: SKILL_WHY.measure, bench: "Mark is true within a blade width.", pog: "prepared", mst: ["S2"], subs: [] },
  { id: "draw", name: "Draw", family: "shop", does: "Sketch the part before a cut.", why: SKILL_WHY.draw, bench: "A drawing someone else can follow.", pog: "innovator", mst: ["S1"], subs: [] },
  { id: "model", name: "Model", family: "shop", does: "Build the idea to size.", why: SKILL_WHY.model, bench: "Prototype stands and matches the plan.", pog: "thinker", mst: ["S1", "S4"], subs: [] },
  { id: "material", name: "Material", family: "shop", does: "Pick stock, grain, waste.", why: SKILL_WHY.material, bench: "Chooses stock without extra offcuts.", pog: "thinker", mst: ["S4", "S6"], subs: [] },
  { id: "tools", name: "Tools", family: "shop", does: "The right tool, set, used, put back.", why: SKILL_WHY.tools, bench: "Sets a tool and names the risk.", pog: "prepared", mst: ["S2"], subs: [] },
  {
    id: "finish",
    name: "Finish",
    family: "shop",
    does: "Sand, paint, stain — not skip the last 10%.",
    why: SKILL_WHY.finish,
    bench: "Surface is even. No runs.",
    pog: "reflective",
    mst: ["S2"],
    subs: [
      { id: "sand", name: "Sand", does: "Grit order, flat, edges." },
      { id: "paint", name: "Paint", does: "Coat, dry, no runs." },
      { id: "stain", name: "Stain", does: "Wipe even, no lap marks." },
    ],
  },
  { id: "present", name: "Present", family: "shop", does: "Say what they built and why.", why: SKILL_WHY.present, bench: "A 30-second crew share.", pog: "communicator", mst: ["S7"], subs: [] },
  { id: "digital", name: "Digital", family: "shop", does: "CAD / photo plan the crew can follow.", why: SKILL_WHY.digital, bench: "A file that matches the part.", pog: "innovator", mst: ["S3"], subs: [] },
  { id: "team", name: "Team", family: "shop", does: "Jobs split, no one idle.", why: SKILL_WHY.team, bench: "Crew finishes a step together.", pog: "citizen", mst: ["S7"], subs: [] },
];

export const SOFT_TRACK: SkillDef[] = [
  { id: "listen", name: "Listen", family: "soft", does: "Demo first, then hands.", why: SKILL_WHY.listen, bench: "Starts after the demo, not during.", pog: "communicator", mst: ["S7"], subs: [{ id: "demo", name: "Demo", does: "Eyes on the teacher." }] },
  { id: "share", name: "Share", family: "soft", does: "Pass the tool. Pass the talk.", why: SKILL_WHY.share, bench: "Does not hoard a station.", pog: "citizen", mst: ["S7"], subs: [] },
  { id: "grit", name: "Grit", family: "soft", does: "Stuck, then a second try.", why: SKILL_WHY.grit, bench: "Asks after one honest attempt.", pog: "reflective", mst: ["S1"], subs: [] },
  { id: "care", name: "Care", family: "soft", does: "Bench, floor, bits away.", why: SKILL_WHY.care, bench: "Cleanup without a second ask.", pog: "citizen", mst: ["S6"], subs: [] },
  { id: "time", name: "Time", family: "soft", does: "The step ends before the bell.", why: SKILL_WHY.time, bench: "Leaves time for cleanup.", pog: "prepared", mst: ["S7"], subs: [] },
  { id: "leadsoft", name: "Lead", family: "soft", does: "Runs a 2×2. Names the next step.", why: SKILL_WHY.leadsoft, bench: "Crew moves without you.", pog: "communicator", mst: ["S7"], subs: [] },
];

export const ALL_TRACK: SkillDef[] = [...SKILL_TRACK, ...SOFT_TRACK];

const TRACK_BY = new Map(ALL_TRACK.map((s) => [s.id, s]));

export function skillTrackOf(id: string): SkillDef | undefined {
  const root = id.split(":")[0] ?? id;
  return TRACK_BY.get(root);
}

export function skillFamilyOf(id: string): SkillFamily {
  return skillTrackOf(id)?.family ?? "shop";
}

const GOAL_SKILL: Record<string, string> = {
  "IDEA STAGE": "draw",
  "DESIGN STAGE": "draw",
  DRAWING: "draw",
  "MODELING STAGE": "model",
  "FINISHING STAGE": "finish",
  "PRESENTATION PREP": "present",
  "CRITIQUE DAY": "present",
  TRAINING: "safety",
  DEMONSTRATION: "tools",
  PRODUCTIVITY: "team",
  "FREE DAY": "team",
};

export function skillForGoal(goal: string | undefined): string {
  const key = (goal ?? "").toUpperCase();
  return GOAL_SKILL[key] ?? "safety";
}

export function skillsOf(file: EconomyFile) {
  const list = file.meta.config?.skills;
  const base = list?.length ? list : DEFAULT_SKILLS;
  const have = new Set(base.map((s) => s.id));
  const extra = DEFAULT_SKILLS.filter((s) => !have.has(s.id));
  return extra.length ? [...base, ...extra] : base;
}

export function skillsOfFamily(file: EconomyFile, family: SkillFamily) {
  return skillsOf(file).filter((s) => skillFamilyOf(s.id) === family);
}

export function skillScore(s: RawStudent, id: string): number {
  return Number(s.skills?.[id] || 0);
}

const xpMemo = new WeakMap<EconomyFile, Map<string, number>>();

function xpTable(file: EconomyFile): Map<string, number> {
  let table = xpMemo.get(file);
  if (table) return table;
  const lead = new Map<string, number>();
  for (const e of roleHistoryOf(file)) {
    if (e.role !== "crew_leader" || !e.confirmed) continue;
    lead.set(e.studentId, (lead.get(e.studentId) ?? 0) + Number(e.xp || 0));
  }
  table = new Map();
  for (const s of file.students) {
    let formative = 0;
    if (s.skills) for (const v of Object.values(s.skills)) formative += Number(v || 0);
    table.set(s.id, formative + Number(s.bonusXp || 0) + (lead.get(s.id) ?? 0));
  }
  xpMemo.set(file, table);
  return table;
}

export function skillXp(file: EconomyFile, id: string): number {
  return xpTable(file).get(id) ?? 0;
}

export function workerLevel(file: EconomyFile, id: string): number {
  return Math.min(LEVEL_MAX, 1 + Math.floor(skillXp(file, id) / XP_PER_LEVEL));
}

export function xpIntoLevel(file: EconomyFile, id: string) {
  const xp = skillXp(file, id);
  const level = workerLevel(file, id);
  const into = xp % XP_PER_LEVEL;
  return { xp, level, into, need: XP_PER_LEVEL };
}

export function setSkillScore(file: EconomyFile, studentId: string, skillId: string, n: number): EconomyFile {
  const v = n <= 0 ? 0 : Math.min(SKILL_MAX, Math.round(n));
  let hit = false;
  const parent = skillId.includes(":") ? skillId.split(":")[0] : null;
  const next = cloneFile(file);
  next.students = next.students.map((s) => {
    if (s.id !== studentId) return s;
    hit = true;
    const skills = { ...(s.skills ?? {}) };
    if (!v) delete skills[skillId];
    else skills[skillId] = v;
    if (parent) {
      const subs = skillTrackOf(parent)?.subs ?? [];
      const marks = subs.map((sub) => Number(skills[`${parent}:${sub.id}`] || 0)).filter((x) => x > 0);
      if (marks.length) skills[parent] = Math.max(Number(skills[parent] || 0), Math.round(marks.reduce((a, b) => a + b, 0) / marks.length));
    }
    return { ...s, skills };
  });
  return hit ? next : file;
}
