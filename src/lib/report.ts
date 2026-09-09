import { dayPay, score, type EconomyFile, type RawStudent, type ScoredStudent } from "@/lib/economy";
import { cycleDayLabel, daySlot } from "@/lib/calendar";
import { activityFor, crewGoal, happenedOn, markOn, periodGoal } from "@/lib/store";
import { eachTapeMark } from "@/lib/tape";
import { byCombo } from "@/lib/rank";
import { skillScore, skillXp, skillsOf, workerLevel } from "@/lib/skills";

export const ACTIVITIES = ["PROJ-W", "PROJ-PC", "P", "PTO", "OFF TASK"] as const;
export type ActivityName = (typeof ACTIVITIES)[number];

export type DayStamp = {
  date: string;
  slot: string;
  code: string;
  pay: number;
  invested: number;
  activity: string;
  goal: string;
  happened: string;
  note: string;
  factor: number;
  stock: number;
};

export type WorkerCard = ScoredStudent & {
  stamps: DayStamp[];
  counts: Record<string, number>;
  activities: Record<string, number>;
  earned: number;
  rankSchool: number;
  rankPeriod: number;
  xp: number;
  level: number;
  rankSkill: number;
  skillMarks: { id: string; name: string; score: number }[];
};

function datesFor(s: RawStudent, file: EconomyFile): string[] {
  const set = new Set<string>();
  eachTapeMark(s.markTape, (d, code) => {
    if (code) set.add(d);
  });
  for (const [d, code] of Object.entries(s.marks ?? {})) {
    if (code) set.add(d);
  }
  for (const d of Object.keys(s.investDays ?? {})) set.add(d);
  for (const d of Object.keys(s.notes ?? {})) set.add(d);
  void file;
  return [...set].sort();
}

export function stampsFor(file: EconomyFile, s: RawStudent): DayStamp[] {
  const factor = Number(file.meta.market?.factor) || 1;
  const rates = file.meta.codes;
  return datesFor(s, file).map((date) => {
    const code = markOn(s, date);
    const pay = dayPay(code, rates);
    const parked = Number(s.investDays?.[date] || 0);
    const slot = daySlot(date);
    const activity = activityFor(file, date, s.period, s.crewKey);
    const goal =
      crewGoal(file, date, s.period, s.crewKey) || periodGoal(file, date, s.period);
    const happened = happenedOn(file, date, s.period, s.crewKey);
    const note = (s.notes ?? {})[date] ?? "";
    return {
      date,
      slot: cycleDayLabel(slot.label, file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1) || "",
      code,
      pay,
      invested: parked,
      activity,
      goal,
      happened,
      note,
      factor,
      stock: parked * factor,
    };
  });
}

export function workerCards(file: EconomyFile): WorkerCard[] {
  const list = score(file);
  const catalog = skillsOf(file);
  const school = byCombo(file, list);
  const bySkill = [...list].sort((a, b) => skillXp(file, b.id) - skillXp(file, a.id) || a.first.localeCompare(b.first));
  return list.map((s) => {
    const stamps = stampsFor(file, s);
    const counts: Record<string, number> = { "3": 0, "2": 0, "1": 0, A: 0, E: 0, P: 0 };
    const activities: Record<string, number> = { "PROJ-W": 0, "PROJ-PC": 0, P: 0, PTO: 0, "OFF TASK": 0 };
    for (const st of stamps) {
      const c = st.code.toUpperCase();
      if (c in counts) counts[c] += 1;
      if (st.activity && st.activity in activities) activities[st.activity] += 1;
    }
    const rankSchool = school.findIndex((x) => x.id === s.id) + 1;
    const period = school.filter((x) => x.period === s.period);
    const rankPeriod = period.findIndex((x) => x.id === s.id) + 1;
    const xp = skillXp(file, s.id);
    const level = workerLevel(file, s.id);
    const rankSkill = bySkill.findIndex((x) => x.id === s.id) + 1;
    const skillMarks = catalog.map((sk) => ({ id: sk.id, name: sk.name, score: skillScore(s, sk.id) }));
    return {
      ...s,
      stamps,
      counts,
      activities,
      earned: stamps.reduce((n, st) => n + st.pay, 0) + Number(s.bonus || 0) - Number(s.deduct || 0) + Number(s.clutch || 0),
      rankSchool,
      rankPeriod,
      xp,
      level,
      rankSkill,
      skillMarks,
    };
  });
}

export type WeekPoint = {
  name: string;
  start: string;
  earned: number;
  wallet: number;
  stock: number;
  absent: number;
  effort: number;
  count: number;
  [key: string]: string | number;
};

function mondayOfStamp(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const off = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + off);
  return d.toISOString().slice(0, 10);
}

/** Weeks that actually have marks — Data line charts. Works for live and archived years. */
export function weeklyTrend(file: EconomyFile, mixSh = false): WeekPoint[] {
  const cards = workerCards(file).filter((s) => mixSh || s.period !== 6);
  const bells = [...new Set(cards.map((s) => s.period))].sort((a, b) => a - b);
  const groups = new Map<string, string[]>();
  for (const s of cards) {
    for (const st of s.stamps) {
      const m = mondayOfStamp(st.date);
      const list = groups.get(m) ?? [];
      if (!list.includes(st.date)) list.push(st.date);
      groups.set(m, list);
    }
  }
  const weeks = [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([start, days]) => ({ start, days: days.sort() }));
  let cash = 0;
  let park = 0;
  return weeks.map((w, i) => {
    let earned = 0;
    let absent = 0;
    let effortN = 0;
    let effortSum = 0;
    let count = 0;
    const byP: Record<string, number> = {};
    for (const p of bells) byP[`p${p}`] = 0;
    for (const s of cards) {
      let kid = 0;
      for (const d of w.days) {
        const st = s.stamps.find((x) => x.date === d);
        if (!st) continue;
        count += 1;
        kid += st.pay;
        earned += st.pay;
        if (st.code === "A") absent += 1;
        if (st.code === "1" || st.code === "2" || st.code === "3") {
          effortN += 1;
          effortSum += Number(st.code);
        }
        park += st.invested;
      }
      byP[`p${s.period}`] = Number(byP[`p${s.period}`] || 0) + kid;
    }
    cash += earned;
    const avg = effortN ? 70 + (effortSum / effortN - 1) * 15 : 0;
    return {
      name: `W${i + 1}`,
      start: w.start,
      earned,
      wallet: cash,
      stock: Math.round(park * (Number(file.meta.market?.factor) || 1)),
      absent,
      effort: Math.round(avg),
      count,
      ...byP,
    };
  });
}

export const LOG_HEADER = [
  "Date",
  "Slot",
  "Period",
  "Grade",
  "Crew",
  "First",
  "ID",
  "Code",
  "Pay",
  "Invest $",
  "Factor",
  "Day stock",
  "Session",
];

export const MASTER_HEADER = [
  "ID",
  "First",
  "Last",
  "Period",
  "Grade",
  "Crew",
  "Session",
  "Cash $",
  "Invested $",
  "Invests",
  "Stock $",
  "Worth $",
  "Factor",
  "DJIA week avg",
  "Week shock %",
  "Effort avg",
  "Effort %",
  "Days 3",
  "Days 2",
  "Days 1",
  "A",
  "E",
  "P",
  "PC Free",
  "Workshop",
  "Chores",
  "Rank in period",
  "Rank school",
  "Bonus",
  "Deduct",
  "Clutch",
];

export function logRows(file: EconomyFile, mixSh = false): string[][] {
  const cards = workerCards(file).filter((s) => mixSh || s.period !== 6);
  const session = file.meta.quarterName ?? "S1";
  const rows: string[][] = [];
  for (const s of cards) {
    for (const st of s.stamps) {
      rows.push([
        st.date,
        st.slot,
        String(s.period),
        String(s.grade ?? ""),
        s.crewName,
        s.first,
        s.id,
        st.code,
        String(st.pay),
        String(st.invested || ""),
        st.factor.toFixed(4),
        String(Math.round(st.stock)),
        session,
      ]);
    }
  }
  return rows;
}

export function masterRows(file: EconomyFile, mixSh = false): string[][] {
  const m = file.meta.market;
  return workerCards(file)
    .filter((s) => mixSh || s.period !== 6)
    .map((s) => [
    s.id,
    s.first,
    s.last,
    String(s.period),
    String(s.grade ?? ""),
    s.crewName,
    file.meta.quarterName ?? "S1",
    String(Math.round(s.quarter)),
    String(Math.round(s.principal)),
    String(s.invests),
    String(Math.round(s.stock)),
    String(Math.round(s.worth)),
    (m?.factor ?? 1).toFixed(4),
    String(Math.round(m?.index ?? 0)),
    String(m?.shock ?? 0),
    s.effortAvg == null ? "" : s.effortAvg.toFixed(2),
    s.effortPct == null ? "" : String(Math.round(s.effortPct)),
    String(s.counts["3"] ?? 0),
    String(s.counts["2"] ?? 0),
    String(s.counts["1"] ?? 0),
    String(s.counts.A ?? 0),
    String(s.counts.E ?? 0),
    String(s.counts.P ?? 0),
    String(s.activities["PC Free"] ?? 0),
    String(s.activities.Workshop ?? 0),
    String(s.activities.Chores ?? 0),
    String(s.rankPeriod),
    String(s.rankSchool),
    String(s.bonus || 0),
    String(s.deduct || 0),
    String(s.clutch || 0),
  ]);
}

export function toTsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.join("\t")).join("\n");
}

export function ledgerTsv(file: EconomyFile): string {
  const header = ["Timestamp", "ID", "Type", "Amount", "Date", "Note"];
  const rows = (file.meta.ledger ?? []).map((r) => [r.ts, r.id, r.type, String(r.amount), r.date, r.note]);
  return toTsv(header, rows);
}
