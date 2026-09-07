import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { compactStudent } from "@/lib/compact";
import { dayPay, isLiveStudent } from "@/lib/economy";
import { schoolDays } from "@/lib/calendar";
import { writeTape } from "@/lib/tape";
import { SKILL_TRACK } from "@/lib/skills";
import { TICKERS } from "@/lib/tickers";

export const SEED_TAG = "17d";
export const SEED_DAYS = 17;

const AFFECT = ["😀", "🙂", "😐", "😴", "🔥", "😅"];
const NOTES = ["asked a strong question", "needed a reset", "helped a crewmate", "rushed the cut", "cleaned without being asked"];
const SH_OUT = ["nurse", "library", "teacher", "testing", "excused"];
const WORK = ["PROJ-W", "PROJ-PC", "PAINTING", "TRAINING"];

function hash(s: string): number {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function pick<T>(id: string, salt: string, arr: readonly T[]): T {
  return arr[hash(`${id}|${salt}`) % arr.length];
}

function codeFor(id: string, date: string, i: number, streak: boolean): string {
  if (streak && i >= 3 && i <= 5) return "A";
  const h = hash(`${id}|${date}`) % 40;
  if (h === 0) return "A";
  if (h === 1) return "E";
  if (h === 2) return "P";
  if (h < 6) return "1";
  if (h < 14) return "2";
  return "3";
}

export function seedSeventeen(file: EconomyFile): EconomyFile {
  const days = schoolDays().slice(0, SEED_DAYS).map((d) => d.date);
  const next = cloneFile(file);
  const rates = next.meta.codes;
  const shop = next.meta.shop ?? [];
  const tickers = TICKERS.slice(0, 12).map((t) => t.id);

  const streakIds = new Set<string>();
  const byPeriod = new Map<number, RawStudent[]>();
  for (const s of next.students) {
    if (!isLiveStudent(s, next.meta.quarterName) || s.period === 6) continue;
    const list = byPeriod.get(s.period) ?? [];
    list.push(s);
    byPeriod.set(s.period, list);
  }
  for (const [, list] of byPeriod) {
    if (list[0]) streakIds.add(list[0].id);
  }

  next.students = next.students.map((s, idx) => {
    if (!isLiveStudent(s, next.meta.quarterName)) return s;
    const hall = s.period === 6;
    let tape = "";
    let earned = 0;
    const affect: Record<string, string> = {};
    const notes: Record<string, string> = {};
    const cleanupDays: Record<string, "done" | "miss"> = {};
    const assistDays: Record<string, boolean> = {};
    const investDays: Record<string, number> = {};
    const attend: Record<string, string> = {};
    const trackDays: Record<string, string> = {};
    const readyDays: Record<string, string> = {};
    const purchases: { ts: string; item: string; category: string; price: number }[] = [];

    days.forEach((d, i) => {
      if (hall) {
        const h = hash(`${s.id}|${d}|sh`) % 11;
        if (h === 0) attend[d] = pick(s.id, d, SH_OUT);
        trackDays[d] = h === 1 ? "off task" : h < 6 ? "productive" : "peaceful";
        return;
      }
      const c = codeFor(s.id, d, i, streakIds.has(s.id));
      tape = writeTape(tape, d, c);
      earned += dayPay(c, rates);
      if (c === "3" || c === "2" || c === "1") {
        affect[d] = pick(s.id, `${d}|a`, AFFECT);
        if (hash(`${s.id}|${d}|n`) % 9 === 0) notes[d] = pick(s.id, `${d}|n`, NOTES);
        cleanupDays[d] = hash(`${s.id}|${d}|c`) % 12 === 0 ? "miss" : "done";
        if (hash(`${s.id}|${d}|as`) % 18 === 0) assistDays[d] = true;
        if (c === "3" && hash(`${s.id}|${d}|inv`) % 7 === 0) investDays[d] = 25;
        readyDays[d] = pick(s.id, `${d}|w`, WORK);
      }
      if (shop.length && hash(`${s.id}|${d}|buy`) % 28 === 0) {
        const item = shop[hash(`${s.id}|buy`) % shop.length];
        purchases.push({ ts: `${d}T15:00:00`, item: item.name, category: item.category, price: item.price });
        earned -= item.price;
      }
    });

    const skills: Record<string, number> = {};
    SKILL_TRACK.forEach((sk) => {
      const v = hash(`${s.id}|${sk.id}`) % 6;
      if (v === 0) return;
      skills[sk.id] = Math.min(4, hall ? 1 + (v % 3) : 1 + (v % 4));
    });

    const picks = hall ? [] : [0, 1, 2].map((i) => tickers[(hash(s.id) + i * 3) % tickers.length]);
    const last4 = days.slice(-4);
    const codesLast = last4.map((d) => {
      if (hall) return "";
      const i = days.indexOf(d);
      return codeFor(s.id, d, i, streakIds.has(s.id));
    });

    return compactStudent({
      ...s,
      markTape: hall ? undefined : tape,
      days: hall ? ["", "", "", ""] : codesLast.concat(["", "", "", ""]).slice(0, 4),
      skills,
      affect: hall ? undefined : affect,
      notes: Object.keys(notes).length ? notes : undefined,
      cleanupDays: hall ? undefined : cleanupDays,
      assistDays: Object.keys(assistDays).length ? assistDays : undefined,
      investDays: Object.keys(investDays).length ? investDays : undefined,
      attend: Object.keys(attend).length ? attend : undefined,
      trackDays: hall ? trackDays : undefined,
      readyDays: hall ? undefined : readyDays,
      purchases: purchases.length ? purchases : undefined,
      picks: picks.length ? picks : undefined,
      bonus: idx % 9 === 0 ? 10 : idx % 5 === 0 ? 5 : 0,
      deduct: idx % 13 === 0 ? 10 : idx % 8 === 0 ? 5 : 0,
      clutch: idx % 17 === 0 ? -5 : 0,
      bonusXp: hall ? 0 : (hash(s.id) % 5) * 2,
      opening: Math.max(0, earned),
    });
  });

  const dayLog: NonNullable<EconomyFile["meta"]["dayLog"]> = { ...(next.meta.dayLog ?? {}) };
  days.forEach((d, i) => {
    dayLog[d] = {
      periodGoals: {},
      crewGoals: {},
      lunch: i % 3 === 0 ? "pizza" : i % 3 === 1 ? "chicken" : "tacos",
      schooltool: { "1": true },
      visits: { "1": "OPEN", "2": "OPEN", "3": "OPEN", "6": "OPEN", "8": i === 6 ? "MEETING" : "OPEN", "9": "OPEN", "10": "CLOSED" },
      happened: { "1": WORK[i % WORK.length], "8": WORK[(i + 1) % WORK.length] },
    };
  });

  next.meta.dayLog = dayLog;
  next.meta.currentWeek = 5;
  next.meta.quarterName = "Q1";
  next.meta.config = {
    ...(next.meta.config ?? {}),
    currentCycle: 5,
    seed: SEED_TAG,
    roleHistory: next.students
      .filter((s) => s.period !== 6 && hash(s.id) % 11 === 0)
      .slice(0, 8)
      .map((s) => ({
        studentId: s.id,
        role: "crew_leader" as const,
        cycle: 4,
        date: days[12] ?? days[0],
        period: s.period,
        crewKey: s.crewKey,
        confirmed: true,
        xp: 4,
      })),
  };
  next.meta.ledger = days.slice(0, 8).map((d, i) => ({
    ts: `${d}T14:00:00`,
    id: next.students[i % next.students.length]?.id ?? "",
    type: i % 2 ? "Bonus" : "Deduction",
    amount: i % 2 ? 5 : -5,
    date: d,
    note: i % 2 ? "helped cleanup" : "class snack",
  }));
  return next;
}
