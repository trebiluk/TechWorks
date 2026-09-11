import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { dayPay, isLiveStudent, shopBells } from "@/lib/economy";
import { schoolDays } from "@/lib/calendar";
import { writeTape } from "@/lib/tape";
import { compactStudent } from "@/lib/compact";
import { SKILL_TRACK } from "@/lib/skills";

export const DEMO_KEY = "techworks-demo-set";
export const SAVE_FAIL_EVENT = "techworks-save-fail";

export const DEMO_SETS = [
  { id: "off", label: "Off · real roster", days: 0 },
  { id: "week", label: "One week", days: 4 },
  { id: "cycle", label: "One cycle", days: 16 },
  { id: "messy", label: "Messy cycle", days: 16 },
] as const;

export type DemoId = (typeof DEMO_SETS)[number]["id"];

export function storedDemo(): DemoId {
  try {
    if (typeof window === "undefined") return "off";
    const v = window.localStorage.getItem(DEMO_KEY);
    return DEMO_SETS.some((s) => s.id === v) ? (v as DemoId) : "off";
  } catch {
    return "off";
  }
}

export function commitDemo(id: DemoId) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_KEY, id);
  window.dispatchEvent(new Event("techworks-demo"));
}

export function isDemoStudentId(id: string | undefined): boolean {
  return String(id ?? "").startsWith("demo-");
}

/** Never write overlay fake workers to the desk. */
export function stripFakeDemo(file: EconomyFile): EconomyFile {
  const students = file.students.filter((s) => !isDemoStudentId(s.id));
  if (students.length === file.students.length) return file;
  const next = cloneFile(file);
  next.students = students;
  return next;
}

/**
 * Overlay is display-only. Keep the real roster, crews, marks, and project slots.
 * Module / theme / bell / today's pass edits from the painted file still apply.
 */
export function takeRealDesk(real: EconomyFile, next: EconomyFile, overlayOn: boolean): EconomyFile {
  const cleaned = stripFakeDemo(next);
  if (!overlayOn) return cleaned;
  return {
    ...cleaned,
    students: real.students,
    crews: real.crews,
    meta: {
      ...cleaned.meta,
      dayLog: mergeTeacherDayLog(real.meta.dayLog, cleaned.meta.dayLog),
      ledger: real.meta.ledger,
      config: {
        ...(cleaned.meta.config ?? {}),
        periodProjects: real.meta.config?.periodProjects,
        crewProjects: real.meta.config?.crewProjects,
        roleHistory: real.meta.config?.roleHistory,
      },
    },
  };
}

/** Teacher taps (passes, sub, lunch, cards) win. Overlay-painted crewPhase does not. */
export function mergeTeacherDayLog(
  real: EconomyFile["meta"]["dayLog"],
  next: EconomyFile["meta"]["dayLog"],
): EconomyFile["meta"]["dayLog"] {
  if (!next) return real;
  if (!real) return next;
  const out: NonNullable<EconomyFile["meta"]["dayLog"]> = { ...real };
  for (const date of Object.keys(next)) {
    const r = real[date];
    const n = next[date];
    if (!n) continue;
    out[date] = {
      ...(r ?? n),
      ...n,
      crewPhase: r?.crewPhase ?? n.crewPhase,
      goalPhase: r?.goalPhase ?? n.goalPhase,
    };
  }
  return out;
}

function hash(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function codeFor(id: string, date: string, messy: boolean, i: number): string {
  const h = hash(`${id}|${date}`) % 22;
  if (messy && i < 3 && hash(id) % 7 === 0) return "A";
  if (h === 0) return "A";
  if (h === 1) return messy ? "E" : "2";
  if (h === 2) return messy ? "1" : "2";
  if (h < 7) return "2";
  return "3";
}

const FAKE_ALIASES = ["Spark", "Kerf", "Bit", "Rivet", "Flux", "Chuck", "Nib", "Jig", "Bevel", "Shim", "Boss", "Gage"];
const FAKE_CREW = [
  { key: "Forge", name: "Forge", color: "#E8C547", motto: "Heat and hammer." },
  { key: "Volt", name: "Volt", color: "#22D3EE", motto: "We don't leave a mess." },
];

function fakeKid(id: string, first: string, period: number, grade: number, crewKey: string, quarter: string): RawStudent {
  return {
    id,
    first,
    last: "",
    period,
    grade,
    crewKey,
    section: 1,
    course: `TECH ${grade}`,
    sem: quarter,
    days: ["", "", "", ""],
    marks: {},
    investDays: {},
    investAsk: {},
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    flags: {},
    skills: {},
  };
}

function unitForGrade(grade: number): string {
  if (grade === 6) return "prj6";
  if (grade === 7) return "prj7";
  return "prj8";
}

/** Overlay-only shop so Dash / Week / Crews / Year have something to show on an empty desk. */
export function seedFakeShop(file: EconomyFile): EconomyFile {
  const live = file.students.filter((s) => isLiveStudent(s, file.meta.quarterName));
  if (live.length) return file;
  const next = cloneFile(file);
  const quarter = next.meta.quarterName || "Q1";
  const bells = shopBells(next);
  const students: RawStudent[] = [];
  const crews = [...next.crews];
  let n = 0;
  for (const b of bells) {
    if (b.period === 6) continue;
    for (const c of FAKE_CREW) {
      if (!crews.some((x) => x.period === b.period && x.key === c.key)) {
        crews.push({ period: b.period, key: c.key, name: c.name, color: c.color, motto: c.motto });
      }
    }
    for (let i = 0; i < 6; i++) {
      const crew = FAKE_CREW[i % FAKE_CREW.length]!;
      const first = FAKE_ALIASES[n % FAKE_ALIASES.length]!;
      students.push(fakeKid(`demo-${b.period}-${i}`, `${first}${b.period}`, b.period, b.grade, crew.key, quarter));
      n += 1;
    }
  }
  next.students = students;
  next.crews = crews;
  return next;
}

function dressCrews(file: EconomyFile, messy: boolean): EconomyFile {
  const keys = new Set(file.students.map((s) => `${s.period}|${s.crewKey}`));
  const crews = [...file.crews];
  for (const token of keys) {
    const [ps, key] = token.split("|");
    const period = Number(ps);
    if (!key || !period) continue;
    if (crews.some((c) => c.period === period && c.key === key)) continue;
    const look = FAKE_CREW.find((c) => c.key === key);
    crews.push({
      period,
      key,
      name: look?.name ?? key,
      color: look?.color,
      motto: messy ? "Still sanding." : look?.motto ?? "We finish.",
    });
  }
  file.crews = crews;
  return file;
}

/** Floor slots + crew assignment so Learn / Crews are not an empty options wall. */
function dressProjects(file: EconomyFile): EconomyFile {
  if (!file.students.some((s) => isDemoStudentId(s.id))) return file;
  const periodProjects: Record<string, string[]> = { ...(file.meta.config?.periodProjects ?? {}) };
  const crewProjects = [...(file.meta.config?.crewProjects ?? [])];
  const cycle = file.meta.config?.currentCycle ?? 1;
  for (const b of shopBells(file)) {
    if (b.period === 6) continue;
    const pid = unitForGrade(b.grade);
    if (!periodProjects[String(b.period)]?.length) periodProjects[String(b.period)] = [pid];
    for (const c of FAKE_CREW) {
      if (!crewProjects.some((r) => r.cycle === cycle && r.period === b.period && r.crewKey === c.key)) {
        crewProjects.push({ cycle, period: b.period, crewKey: c.key, projectId: pid });
      }
    }
  }
  file.meta.config = { ...(file.meta.config ?? {}), periodProjects, crewProjects };
  return file;
}

export function paintDemo(file: EconomyFile, id: DemoId): EconomyFile {
  if (id === "off") return file;
  const spec = DEMO_SETS.find((s) => s.id === id);
  const n = spec?.days ?? 0;
  if (!n) return file;
  const messy = id === "messy";
  const days = schoolDays().slice(0, n).map((d) => d.date);
  let next = seedFakeShop(cloneFile(file));
  next = dressCrews(next, messy);
  next = dressProjects(next);
  const rates = next.meta.codes;
  next.students = next.students.map((s, idx) => {
    if (!isLiveStudent(s, next.meta.quarterName)) return s;
    let tape = "";
    let earned = 0;
    days.forEach((d, i) => {
      const c = codeFor(s.id, d, messy, i);
      tape = writeTape(tape, d, c);
      earned += dayPay(c, rates);
    });
    const skills: Record<string, number> = {};
    SKILL_TRACK.forEach((sk) => {
      const v = hash(`${s.id}|${sk.id}`) % 5;
      if (v === 0) return;
      skills[sk.id] = messy ? Math.min(4, v) : Math.min(4, 1 + (v % 4));
    });
    const investDays: Record<string, number> = {};
    if (hash(s.id) % 4 === 0 && days[2]) investDays[days[2]] = 25;
    return compactStudent({
      ...s,
      markTape: tape,
      marks: undefined,
      skills,
      investDays,
      opening: Math.max(0, earned - (investDays[days[2] ?? ""] ?? 0)),
      bonus: idx % 11 === 0 ? 5 : 0,
    });
  });
  if (messy && days.length) {
    const last = days[days.length - 1]!;
    const log = { ...(next.meta.dayLog ?? {}) };
    const row = { ...(log[last] ?? {}) };
    const phase: Record<string, string> = { ...(row.crewPhase ?? {}) };
    for (const c of next.crews) {
      const token = `${c.period}|${c.key}`;
      phase[token] = hash(token) % 3 === 0 ? "IDEA STAGE" : "MODELING STAGE";
    }
    row.crewPhase = phase;
    log[last] = row;
    next.meta.dayLog = log;
  }
  return next;
}
