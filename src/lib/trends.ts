import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { bellFor, dayPay, isLiveStudent } from "@/lib/economy";
import { cycleRange, daySlot, schoolDays } from "@/lib/calendar";
import { eachTapeMark } from "@/lib/tape";
import { agendaFor } from "@/lib/projects";
import { skillXp } from "@/lib/skills";
import { rewardProgress } from "@/lib/reward";
import { periodPulses } from "@/lib/live";

export type DayPulse = {
  date: string;
  threes: number;
  scored: number;
  present: number;
  pay: number;
};

function daysIn(start: string, end: string): string[] {
  return schoolDays()
    .map((d) => d.date)
    .filter((d) => d >= start && d <= end);
}

function shopLive(file: EconomyFile) {
  return file.students.filter((s) => s.period !== 6 && isLiveStudent(s, file.meta.quarterName));
}

function markMap(file: EconomyFile): Map<string, string> {
  const live = shopLive(file);
  const out = new Map<string, string>();
  for (const s of live) {
    eachTapeMark(s.markTape, (d, c) => out.set(`${s.id}|${d}`, c));
    for (const [d, c] of Object.entries(s.marks ?? {})) {
      if (c) out.set(`${s.id}|${d}`, String(c));
    }
  }
  return out;
}

function pulseRange(file: EconomyFile, dates: string[], marks: Map<string, string>): DayPulse[] {
  const rates = file.meta.codes;
  const live = shopLive(file);
  return dates.map((date) => {
    let threes = 0;
    let scored = 0;
    let present = 0;
    let pay = 0;
    for (const s of live) {
      const c = marks.get(`${s.id}|${date}`) || "";
      if (!c) continue;
      scored += 1;
      pay += dayPay(c, rates);
      if (c === "3" || c === "2" || c === "1") present += 1;
      if (c === "3") threes += 1;
    }
    return { date, threes, scored, present, pay };
  });
}

function rate(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

function sum(rows: DayPulse[], key: keyof DayPulse): number {
  return rows.reduce((n, r) => n + Number(r[key] || 0), 0);
}

export function dashPulse(file: EconomyFile, list: ScoredStudent[]) {
  const shopList = list.filter((s) => s.period !== 6);
  const cycleN = file.meta.config?.currentCycle ?? 1;
  const cur = cycleRange(cycleN);
  const prev = cycleN > 1 ? cycleRange(cycleN - 1) : null;
  const marks = markMap(file);
  const curDays = daysIn(cur.start, cur.end);
  const series = pulseRange(file, curDays, marks);
  const prevSeries = prev ? pulseRange(file, daysIn(prev.start, prev.end), marks) : [];
  const scored = sum(series, "scored");
  const prevScored = sum(prevSeries, "scored");
  const threes = sum(series, "threes");
  const present = sum(series, "present");
  const pay = sum(series, "pay");
  const prevThrees = sum(prevSeries, "threes");
  const prevPresent = sum(prevSeries, "present");
  const prevPay = sum(prevSeries, "pay");
  const effort = rate(threes, scored);
  const show = rate(present, scored);
  const prevEffort = rate(prevThrees, prevScored);
  const prevShow = rate(prevPresent, prevScored);
  const xpMean = shopList.length ? Math.round(shopList.reduce((n, s) => n + skillXp(file, s.id), 0) / shopList.length) : 0;
  const payMean = shopList.length ? Math.round(shopList.reduce((n, s) => n + s.quarter, 0)) : 0;
  const reward = rewardProgress(file);
  const bells = bellFor(file);
  const pulses = periodPulses(file);
  const byPeriod = bells
    .map((b) => b.period)
    .filter((p) => p !== 6)
    .map((p) => {
      const kids = list.filter((s) => s.period === p);
      let th = 0;
      let sc = 0;
      for (const s of kids) {
        const raw = file.students.find((x) => x.id === s.id);
        if (!raw) continue;
        eachTapeMark(raw.markTape, (d, c) => {
          if (d < cur.start || d > cur.end) return;
          if (!c) return;
          sc += 1;
          if (c === "3") th += 1;
        });
      }
      const effortPct = rate(th, sc);
      return {
        period: p,
        grade: bells.find((b) => b.period === p)?.grade ?? 0,
        goal: agendaFor(file, p).goal,
        xp: kids.reduce((n, s) => n + skillXp(file, s.id), 0),
        pay: kids.reduce((n, s) => n + s.quarter, 0),
        n: kids.length,
        effort: effortPct,
        due: pulses[p]?.due ?? 0,
        overdue: pulses[p]?.overdue ?? 0,
      };
    });
  const goals = [6, 7, 8].map((g) => {
    const period = bells.find((b) => b.grade === g && b.period !== 6)?.period ?? 1;
    const a = agendaFor(file, period);
    return { grade: g, label: `Gr ${g}`, goal: a.goal, project: a.title, skillId: a.skillId };
  });
  const slots = ["D1", "D2", "D3", "D4"] as const;
  const bySlot = slots.map((slot) => {
    const rows = series.filter((r) => daySlot(r.date).label === slot);
    return { slot, threes: sum(rows, "threes"), scored: sum(rows, "scored") };
  });
  const lastHit = [...series].reverse().find((x) => x.scored > 0)?.date;
  const today = new Date().toISOString().slice(0, 10);
  const asOf = lastHit && lastHit > today ? lastHit : today;
  return {
    cycleN,
    empty: scored === 0,
    effort,
    prevEffort,
    show,
    prevShow,
    pay,
    prevPay,
    xpMean,
    payTotal: payMean,
    series: series.filter((r) => r.date <= asOf),
    reward,
    byPeriod,
    bySlot,
    goals,
    scored,
  };
}

export function delta(now: number, was: number): { pct: number; up: boolean | null } {
  if (!was && !now) return { pct: 0, up: null };
  if (!was) return { pct: 100, up: true };
  const pct = Math.round(((now - was) / was) * 100);
  return { pct: Math.abs(pct), up: pct === 0 ? null : pct > 0 };
}
