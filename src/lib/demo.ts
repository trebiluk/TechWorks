import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { dayPay, isLiveStudent } from "@/lib/economy";
import { schoolDays } from "@/lib/calendar";
import { writeTape } from "@/lib/tape";
import { compactStudent } from "@/lib/compact";
import { SKILL_TRACK } from "@/lib/skills";

export const DEMO_KEY = "techworks-demo-set";

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

export function paintDemo(file: EconomyFile, id: DemoId): EconomyFile {
  if (id === "off") return file;
  const spec = DEMO_SETS.find((s) => s.id === id);
  const n = spec?.days ?? 0;
  if (!n) return file;
  const messy = id === "messy";
  const days = schoolDays().slice(0, n).map((d) => d.date);
  const next = cloneFile(file);
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
    SKILL_TRACK.forEach((sk, si) => {
      const v = (hash(`${s.id}|${sk.id}`) % 5);
      if (v === 0) return;
      skills[sk.id] = messy ? Math.min(4, v) : Math.min(4, 1 + (v % 4));
      void si;
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
  return next;
}
