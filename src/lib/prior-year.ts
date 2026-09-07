import type { EconomyFile, RawStudent } from "@/lib/economy";
import { dayPay } from "@/lib/economy";
import { generateAlias } from "@/lib/alias-bank";
import { compactStudent } from "@/lib/compact";
import { writeTape } from "@/lib/tape";
import { SKILL_TRACK } from "@/lib/skills";
import { archiveGet, archivePut } from "@/lib/archive";

export const PRIOR_YEAR = "2025-26";
export const PRIOR_YEAR_KEY = "year:2025-26";

const CODES: Record<string, number> = { "3": 25, "2": 20, "1": 15, A: 0, E: 20, P: -25, Assist: 10 };
const SHOP = [
  { period: 1, grade: 6 },
  { period: 2, grade: 8 },
  { period: 3, grade: 7 },
  { period: 8, grade: 7 },
  { period: 9, grade: 8 },
  { period: 10, grade: 6 },
] as const;

function hash(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function inRange(iso: string, a: string, b: string): boolean {
  return iso >= a && iso <= b;
}

/** Weekdays 2025-09-02 → 2026-06-25 minus a Solvay-shaped holiday set. */
export function priorSchoolDays(): string[] {
  const out: string[] = [];
  const start = new Date("2025-09-02T12:00:00");
  const end = new Date("2026-06-25T12:00:00");
  for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
    const d = new Date(t);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;
    if (inRange(iso, "2025-12-24", "2026-01-02")) continue;
    if (inRange(iso, "2026-02-16", "2026-02-20")) continue;
    if (inRange(iso, "2026-04-06", "2026-04-10")) continue;
    if (
      [
        "2025-09-01",
        "2025-10-13",
        "2025-11-11",
        "2025-11-26",
        "2025-11-27",
        "2025-11-28",
        "2026-01-19",
        "2026-03-13",
        "2026-05-25",
        "2026-06-19",
      ].includes(iso)
    ) {
      continue;
    }
    out.push(iso);
  }
  return out;
}

function codeFor(id: string, date: string, i: number): string {
  const h = hash(`${id}|${date}`) % 24;
  if (i > 8 && i < 12 && hash(id) % 11 === 0) return "A";
  if (h === 0) return "A";
  if (h === 1) return "E";
  if (h === 2) return "P";
  if (h < 6) return "2";
  if (h === 6) return "1";
  return "3";
}

function sessionSlices(days: string[]) {
  const n = Math.ceil(days.length / 4);
  return [0, 1, 2, 3].map((i) => {
    const slice = days.slice(i * n, i === 3 ? days.length : (i + 1) * n);
    return { n: i + 1, label: `S${i + 1}`, start: slice[0] ?? days[0], end: slice[slice.length - 1] ?? days[days.length - 1], days: slice };
  });
}

export function buildPriorYear(): EconomyFile {
  const days = priorSchoolDays();
  const blocks = sessionSlices(days);
  const used: string[] = [];
  const students: RawStudent[] = [];

  for (const bell of SHOP) {
    for (let i = 0; i < 12; i++) {
      const id = `py-${bell.period}-${String(i).padStart(2, "0")}`;
      const first = generateAlias(id, used);
      used.push(first);
      const crew = `${bell.period}${String.fromCharCode(65 + Math.floor(i / 3))}`;
      let tape = "";
      let earned = 0;
      days.forEach((d, di) => {
        const c = codeFor(id, d, di);
        tape = writeTape(tape, d, c);
        earned += dayPay(c, CODES);
      });
      const skills: Record<string, number> = {};
      SKILL_TRACK.forEach((sk) => {
        const v = 1 + (hash(`${id}|${sk.id}`) % 4);
        skills[sk.id] = v;
      });
      const investDays: Record<string, number> = {};
      if (hash(id) % 5 === 0 && days[12]) investDays[days[12]] = 25;
      students.push(
        compactStudent({
          id,
          first,
          last: "",
          period: bell.period,
          grade: bell.grade,
          crewKey: crew,
          days: ["", "", "", ""],
          markTape: tape,
          skills,
          investDays,
          bonus: hash(id) % 9 === 0 ? 10 : 0,
          deduct: hash(id) % 13 === 0 ? 5 : 0,
          clutch: 0,
          opening: Math.max(40, Math.round(earned * 0.15)),
        }),
      );
    }
  }

  for (let i = 0; i < 14; i++) {
    const id = `py-6-${String(i).padStart(2, "0")}`;
    const first = generateAlias(id, used);
    used.push(first);
    students.push(
      compactStudent({
        id,
        first,
        last: "",
        period: 6,
        grade: 5,
        crewKey: "6A",
        abDay: i % 2 === 0 ? "A" : "B",
        days: ["", "", "", ""],
        bonus: 0,
        deduct: 0,
        clutch: 0,
        opening: 0,
        attend: Object.fromEntries(days.filter((_, di) => hash(`${id}|out|${di}`) % 17 === 0).map((d) => [d, ["nurse", "library", "teacher"][hash(id + d) % 3]])),
      }),
    );
  }

  const shopKids = students.filter((s) => s.period !== 6);
  const crews = [...new Map(students.map((s) => [`${s.period}|${s.crewKey}`, { period: s.period, key: s.crewKey, name: s.crewKey }])).values()];
  const sessions = blocks.map((b) => {
    let cash = 0;
    for (const s of shopKids) {
      for (const d of b.days) {
        const h = hash(`${s.id}|${d}`) % 24;
        const c = h === 0 ? "A" : h < 7 ? "2" : "3";
        cash += dayPay(c, CODES);
      }
    }
    return { n: b.n, label: b.label, start: b.start, end: b.end, cash, xp: 80 + b.n * 12, headcount: shopKids.length };
  });

  return {
    meta: {
      title: "TechWorks 2025-26 · archive",
      quarterName: PRIOR_YEAR,
      currentWeek: 32,
      schoolYear: PRIOR_YEAR,
      codes: CODES,
      bell: [
        ...SHOP.map((b) => ({ period: b.period, grade: b.grade })),
        { period: 6, grade: 5 },
      ],
      market: { source: "DOW", index: 42000, baseline: 40000, shock: 0, factor: 1.05 },
      sessions,
    },
    students,
    crews,
  };
}

export async function ensurePriorYear(): Promise<EconomyFile> {
  const hit = await archiveGet<EconomyFile>(PRIOR_YEAR_KEY);
  if (hit?.students?.length && hit.meta?.schoolYear === PRIOR_YEAR) return hit;
  const built = buildPriorYear();
  await archivePut(PRIOR_YEAR_KEY, built);
  return built;
}
