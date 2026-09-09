import type { EconomyFile, RawStudent } from "./economy";
import { dayPay, isLiveStudent, periodTitle, shopBells } from "./economy";
import { formatSchoolDate, isSchoolDay, stepSchoolDay, todayIso, weekOn } from "./calendar";
import { tapeMark } from "./tape";
import { crewAt, BENCH } from "./crew-desk";
import { agendaFor, crewPace, prettyStage } from "./projects";

export type PaceSlice = {
  earned: number;
  possible: number;
  pay: number;
  payMax: number;
  n3: number;
  n2: number;
  n1: number;
  nKids: number;
  pct: number;
};

export type TodayJob = {
  period: number;
  title: string;
  project: string;
  activity: string;
  assignment: string;
  goal: string;
  cycle: number;
  expect: number;
};

export type ClassRace = PaceSlice & {
  period: number;
  grade: number;
  name: string;
  project: string;
  activity: string;
  assignment: string;
  goal: string;
  expect: number;
  rank: number;
  hold: boolean;
  gapPct: number;
};

export type CrewRace = PaceSlice & {
  period: number;
  key: string;
  name: string;
  project: string;
  activity: string;
  assignment: string;
  phase: string;
  lag: number;
  rank: number;
  hold: boolean;
  gapPct: number;
};

export type WeekRace = {
  today: string;
  asOf: string | null;
  asOfLabel: string;
  days: string[];
  shop: PaceSlice;
  classes: ClassRace[];
  crews: CrewRace[];
  jobs: TodayJob[];
};

function emptySlice(): PaceSlice {
  return { earned: 0, possible: 0, pay: 0, payMax: 0, n3: 0, n2: 0, n1: 0, nKids: 0, pct: 0 };
}

function pctOf(earned: number, possible: number) {
  if (possible <= 0) return 0;
  return Math.round((earned / possible) * 1000) / 10;
}

/** Classroom assignment name — project + cycle. */
export function assignmentOf(title: string, cycle: number) {
  const name = String(title || "").trim() || "Project";
  return cycle ? `${name} · Cycle ${cycle}` : name;
}

export function yesterdaySchool(today = todayIso()): string | null {
  const prev = stepSchoolDay(today, -1);
  if (!prev || prev >= today || !isSchoolDay(prev)) return null;
  return prev;
}

/** This week's completed school days (before today). Monday uses last week's lock. */
export function raceDays(today = todayIso()): string[] {
  const week = weekOn(today);
  const done = (week?.days ?? []).filter((d) => d < today && isSchoolDay(d));
  if (done.length) return done;
  const y = yesterdaySchool(today);
  if (!y) return [];
  return (weekOn(y)?.days ?? []).filter((d) => d < today && isSchoolDay(d));
}

export function codeOn(s: RawStudent, date: string): string {
  const t = tapeMark(s.markTape, date);
  if (t) return t;
  const m = String(s.marks?.[date] ?? "").trim().toUpperCase();
  return m;
}

function effortOf(code: string): { earned: number; possible: number } | null {
  const c = String(code || "").trim().toUpperCase();
  if (c === "A" || c === "E") return null;
  if (c === "3") return { earned: 3, possible: 3 };
  if (c === "2") return { earned: 2, possible: 3 };
  if (c === "1") return { earned: 1, possible: 3 };
  if (c === "P") return { earned: 0, possible: 3 };
  return { earned: 0, possible: 3 };
}

function addCode(slice: PaceSlice, code: string, rates: Record<string, number>) {
  const hit = effortOf(code);
  if (!hit) return;
  slice.earned += hit.earned;
  slice.possible += hit.possible;
  slice.pay += dayPay(code, rates);
  slice.payMax += dayPay("3", rates);
  if (code === "3") slice.n3 += 1;
  else if (code === "2") slice.n2 += 1;
  else if (code === "1") slice.n1 += 1;
}

function finish(slice: PaceSlice): PaceSlice {
  return { ...slice, pct: pctOf(slice.earned, slice.possible) };
}

function subOn(file: EconomyFile, date: string) {
  return Boolean(file.meta.dayLog?.[date]?.sub);
}

function liveShop(file: EconomyFile): RawStudent[] {
  const shop = new Set(shopBells(file).map((b) => b.period));
  return file.students.filter((s) => shop.has(s.period) && isLiveStudent(s, file.meta.quarterName));
}

export function todayJobs(file: EconomyFile, today = todayIso()): TodayJob[] {
  const bells = shopBells(file);
  return bells.map((b) => {
    const a = agendaFor(file, b.period, today);
    return {
      period: b.period,
      title: periodTitle(b.period, bells),
      project: a.title,
      activity: a.activityName,
      assignment: assignmentOf(a.title, a.cycle),
      goal: prettyStage(a.goal),
      cycle: a.cycle,
      expect: a.activity?.expect ?? 3,
    };
  });
}

export function weekRace(file: EconomyFile, today = todayIso()): WeekRace {
  const days = raceDays(today).filter((d) => !subOn(file, d));
  const asOf = days.length ? days[days.length - 1]! : yesterdaySchool(today);
  const rates = file.meta.codes;
  const kids = liveShop(file);
  const bells = shopBells(file);
  const shop = emptySlice();
  shop.nKids = kids.length;

  const byClass = new Map<number, PaceSlice>();
  const byCrew = new Map<string, PaceSlice & { period: number; key: string }>();
  for (const b of bells) byClass.set(b.period, emptySlice());

  for (const s of kids) {
    const cls = byClass.get(s.period) ?? emptySlice();
    cls.nKids += 1;
    byClass.set(s.period, cls);
    for (const date of days) {
      const code = codeOn(s, date);
      addCode(shop, code, rates);
      addCode(cls, code, rates);
      const crewKey = crewAt(s, date);
      if (!crewKey || crewKey === BENCH) continue;
      const id = `${s.period}|${crewKey}`;
      const row = byCrew.get(id) ?? { ...emptySlice(), period: s.period, key: crewKey };
      addCode(row, code, rates);
      byCrew.set(id, row);
    }
  }

  for (const s of kids) {
    const crewKey = crewAt(s, asOf || today);
    if (!crewKey || crewKey === BENCH) continue;
    const id = `${s.period}|${crewKey}`;
    const row = byCrew.get(id);
    if (row) row.nKids += 1;
  }

  const jobs = todayJobs(file, today);
  const jobOf = (period: number) => jobs.find((j) => j.period === period);

  const paceBy = new Map<string, number>();
  const lockDay = asOf || today;
  for (const b of bells) {
    for (const p of crewPace(file, b.period, lockDay)) {
      paceBy.set(`${b.period}|${p.key}`, p.lag);
    }
  }

  const classRows: ClassRace[] = bells.map((b) => {
    const slice = finish(byClass.get(b.period) ?? emptySlice());
    const job = jobOf(b.period);
    return {
      ...slice,
      period: b.period,
      grade: b.grade,
      name: periodTitle(b.period, bells),
      project: job?.project ?? "—",
      activity: job?.activity ?? "—",
      assignment: job?.assignment ?? "—",
      goal: job?.goal ?? "—",
      expect: job?.expect ?? 3,
      rank: 0,
      hold: false,
      gapPct: 0,
    };
  });
  rankRows(classRows);
  if (classRows.every((c) => c.possible === 0)) classRows.sort((a, b) => a.period - b.period);

  const crewRows: CrewRace[] = [...byCrew.values()].map((row) => {
    const slice = finish(row);
    const job = jobOf(row.period);
    const rec = file.crews.find((c) => c.period === row.period && c.key === row.key);
    const pace = agendaFor(file, row.period, lockDay, row.key);
    return {
      ...slice,
      period: row.period,
      key: row.key,
      name: rec?.name ?? row.key,
      project: job?.project ?? pace.title,
      activity: job?.activity ?? pace.activityName,
      assignment: assignmentOf(job?.project ?? pace.title, job?.cycle ?? pace.cycle),
      phase: prettyStage(pace.goal),
      lag: paceBy.get(`${row.period}|${row.key}`) ?? 0,
      rank: 0,
      hold: false,
      gapPct: 0,
    };
  });
  rankRows(crewRows);

  return {
    today,
    asOf,
    asOfLabel: asOf ? formatSchoolDate(asOf) : "—",
    days,
    shop: finish(shop),
    classes: classRows,
    crews: crewRows,
    jobs,
  };
}

function rankRows<
  T extends { pct: number; earned: number; possible: number; name: string; rank: number; hold: boolean; gapPct: number },
>(rows: T[]) {
  rows.sort((a, b) => b.pct - a.pct || b.earned - a.earned || a.name.localeCompare(b.name));
  const lead = rows[0];
  const racing = Boolean(lead && lead.possible > 0);
  rows.forEach((r, i) => {
    r.rank = i + 1;
    r.hold = racing && r.pct === lead!.pct;
    r.gapPct = racing ? Math.max(0, Math.round((lead!.pct - r.pct) * 10) / 10) : 0;
  });
}
