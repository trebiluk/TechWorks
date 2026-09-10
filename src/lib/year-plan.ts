import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { quarterNow, schoolDays, stepSchoolDay } from "@/lib/calendar";
import { meetingsOf, type DaySpecial } from "@/lib/store";
import { projectsOf, type ShopProject } from "@/lib/projects";
import { cloneDeck, copyDeckToQuarter, loadDeck, saveQuarterDeck, type DeckPack } from "@/lib/deck-store";

export function cyclesOfQuarter(n: 1 | 2 | 3 | 4): [number, number] {
  return [n * 2 - 1, n * 2];
}

export function schoolDaysInQuarter(n: 1 | 2 | 3 | 4): string[] {
  return schoolDays().filter((d) => quarterNow(d.date).n === n).map((d) => d.date);
}

function planned(day: NonNullable<EconomyFile["meta"]["dayLog"]>[string] | undefined): boolean {
  if (!day) return false;
  if (day.lunch || day.sub || day.bell) return true;
  if (day.specials?.length || day.special) return true;
  if (Object.keys(day.periodGoals ?? {}).some((k) => day.periodGoals[k])) return true;
  if (day.cards?.some((c) => c.title?.trim())) return true;
  return false;
}

export function isPlannedDay(file: EconomyFile, date: string): boolean {
  if (planned(file.meta.dayLog?.[date])) return true;
  if (meetingsOf(file).some((m) => m.date === date && m.title.trim())) return true;
  if (file.meta.config?.teachDays?.[date]) return true;
  return false;
}

export function copyDayPlan(file: EconomyFile, from: string, to: string): EconomyFile {
  if (from === to) return file;
  const next = cloneFile(file);
  const src = next.meta.dayLog?.[from];
  const log = { ...(next.meta.dayLog ?? {}) };
  const destPrev = log[to];
  log[to] = {
    ...(destPrev ?? { periodGoals: {}, crewGoals: {} }),
    periodGoals: { ...(src?.periodGoals ?? {}) },
    crewGoals: { ...(destPrev?.crewGoals ?? {}) },
    periodActivity: { ...(src?.periodActivity ?? {}) },
    lunch: src?.lunch ?? "",
    sub: Boolean(src?.sub),
    bell: src?.bell,
    special: src?.special,
    specials: [...(src?.specials ?? (src?.special ? [src.special] : []))],
    cards: (src?.cards ?? []).map((c) => ({ title: c.title, body: c.body })),
  };
  next.meta.dayLog = log;

  const meets = meetingsOf(next).filter((m) => m.date !== to);
  for (const m of meetingsOf(file).filter((m) => m.date === from)) {
    meets.push({ title: m.title, date: to, time: m.time });
  }
  const teach = { ...(next.meta.config?.teachDays ?? {}) };
  if (teach[from]) teach[to] = { ...teach[from] };
  next.meta.config = { ...(next.meta.config ?? {}), meetings: meets, teachDays: teach };
  return next;
}

export function copyDayToRange(file: EconomyFile, from: string, start: string, end: string): EconomyFile {
  let next = file;
  for (const d of schoolDays()) {
    if (d.date < start || d.date > end) continue;
    if (d.date === from) continue;
    next = copyDayPlan(next, from, d.date);
  }
  return next;
}

export function copyDayToRestOfYear(file: EconomyFile, from: string): EconomyFile {
  const last = schoolDays().at(-1)?.date;
  if (!last) return file;
  const nxt = stepSchoolDay(from, 1);
  if (!nxt || nxt > last) return file;
  return copyDayToRange(file, from, nxt, last);
}

export function copyDayToRestOfQuarter(file: EconomyFile, from: string): EconomyFile {
  const q = quarterNow(from).n;
  const days = schoolDaysInQuarter(q).filter((d) => d > from);
  let next = file;
  for (const d of days) next = copyDayPlan(next, from, d);
  return next;
}

function remapId(id: string, tag: string): string {
  return `${id}-${tag}`.replace(/[^a-z0-9-]/gi, "").slice(0, 40);
}

function remapProject(p: ShopProject, delta: number, tag: string, range: { start: string; end: string }): ShopProject {
  const start = (p.cycleStart ?? 1) + delta;
  const qn = tag.replace(/\D/g, "") || tag;
  return {
    ...p,
    id: remapId(p.id, tag),
    title: p.title.replace(/\s*\(Q\d\)\s*$/i, "") + ` (Q${qn})`,
    cycleStart: start,
    start: range.start,
    end: range.end,
    stages: p.stages.map((s) => ({ ...s, cycle: s.cycle + delta })),
  };
}

export function copyQuarterCurriculum(file: EconomyFile, from: 1 | 2 | 3 | 4, to: 1 | 2 | 3 | 4): EconomyFile {
  if (from === to) return file;
  const next = cloneFile(file);
  const [a0, a1] = cyclesOfQuarter(from);
  const [b0] = cyclesOfQuarter(to);
  const delta = b0 - a0;
  const tag = `q${to}`;
  const fromDays = schoolDaysInQuarter(from);
  const toDays = schoolDaysInQuarter(to);
  const range = { start: toDays[0] ?? "", end: toDays.at(-1) ?? "" };
  const list = [...projectsOf(next)];
  const copies: ShopProject[] = [];
  for (const p of list) {
    const start = p.cycleStart ?? 1;
    const len = p.cycleLen === 1 ? 1 : 2;
    const end = start + len - 1;
    if (end < a0 || start > a1) continue;
    if (p.grades.length === 0) continue;
    const dupe = remapProject(p, delta, tag, range);
    if (list.some((x) => x.id === dupe.id) || copies.some((x) => x.id === dupe.id)) continue;
    copies.push(dupe);
  }
  const crew = [...(next.meta.config?.crewProjects ?? [])];
  for (const r of next.meta.config?.crewProjects ?? []) {
    if (r.cycle < a0 || r.cycle > a1) continue;
    const projectId = copies.find((c) => c.id === remapId(r.projectId, tag))?.id ?? r.projectId;
    if (crew.some((x) => x.cycle === r.cycle + delta && x.period === r.period && x.crewKey === r.crewKey)) continue;
    crew.push({ ...r, cycle: r.cycle + delta, projectId });
  }

  let planned = next;
  planned.meta.config = {
    ...(planned.meta.config ?? {}),
    projects: [...list, ...copies],
    crewProjects: crew,
  };
  const n = Math.min(fromDays.length, toDays.length);
  for (let i = 0; i < n; i++) {
    if (isPlannedDay(planned, fromDays[i]!)) planned = copyDayPlan(planned, fromDays[i]!, toDays[i]!);
  }

  copyDeckToQuarter(`Q${from}`, `Q${to}`);
  return planned;
}

export function snapshotLiveDeck(q: "Q1" | "Q2" | "Q3" | "Q4", pack?: DeckPack) {
  const live = pack ?? loadDeck();
  saveQuarterDeck(q, { title: live.title, slides: cloneDeck(live.slides) });
}

export type DayCard = { title: string; body: string };
export type { DaySpecial };
