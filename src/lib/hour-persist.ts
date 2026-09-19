import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import type { HangItem } from "@/lib/hang";

/** Own key so Job · Guiding Q · Prove · beats survive a desk pack wipe or cloud pull. */
export const HOURS_KEY = "techworks-hours-v1";

type HourDay = {
  pack?: string;
  objective?: string;
  pin?: string;
  notes?: string;
  ask?: string;
  do?: string;
  lines?: Record<string, string>;
  media?: HangItem[];
  materials?: string;
  homework?: string;
  close?: string;
  mods?: string;
  reflect?: string;
  move?: string;
  skills?: string[];
  agenda?: { now?: string; goal?: string; next?: string; behave?: string };
};

export type HourDays = Record<string, Record<string, HourDay>>;

export type HoursPack = {
  saved: string;
  days: HourDays;
};

export function hourPlanOf(file: EconomyFile): HourDays {
  return { ...(file.meta.config?.teachDays ?? {}) };
}

function hourFilled(day: HourDay | undefined): boolean {
  if (!day) return false;
  return Boolean(
    day.pack ||
      day.objective?.trim() ||
      day.ask?.trim() ||
      day.do?.trim() ||
      day.notes?.trim() ||
      day.materials?.trim() ||
      day.homework?.trim() ||
      day.close?.trim() ||
      day.mods?.trim() ||
      day.reflect?.trim() ||
      day.agenda?.now?.trim() ||
      day.agenda?.goal?.trim() ||
      day.agenda?.next?.trim() ||
      day.agenda?.behave?.trim() ||
      (day.media && day.media.length) ||
      (day.lines && Object.keys(day.lines).length) ||
      (day.skills && day.skills.length),
  );
}

export function hourCountMap(days: HourDays | null | undefined): number {
  if (!days) return 0;
  let n = 0;
  for (const date of Object.keys(days)) {
    const row = days[date] ?? {};
    for (const p of Object.keys(row)) {
      if (hourFilled(row[p])) n += 1;
    }
  }
  return n;
}

export function hourCount(file: EconomyFile): number {
  return hourCountMap(hourPlanOf(file));
}

function pickStr(a?: string, b?: string): string | undefined {
  const x = a?.trim();
  if (x) return a;
  const y = b?.trim();
  return y ? b : undefined;
}

function mergeAgenda(a?: HourDay["agenda"], b?: HourDay["agenda"]): HourDay["agenda"] {
  const agenda = {
    now: pickStr(a?.now, b?.now),
    goal: pickStr(a?.goal, b?.goal),
    next: pickStr(a?.next, b?.next),
    behave: pickStr(a?.behave, b?.behave),
  };
  return agenda.now || agenda.goal || agenda.next || agenda.behave ? agenda : undefined;
}

function mergeDay(keep: HourDay | undefined, fill: HourDay | undefined): HourDay {
  const a = keep ?? {};
  const b = fill ?? {};
  const lines = { ...(b.lines ?? {}), ...(a.lines ?? {}) };
  const out: HourDay = {};
  const pack = a.pack || b.pack;
  if (pack) out.pack = pack;
  const objective = pickStr(a.objective, b.objective);
  if (objective) out.objective = objective;
  const pin = a.pin || b.pin;
  if (pin) out.pin = pin;
  const notes = pickStr(a.notes, b.notes);
  if (notes) out.notes = notes;
  const ask = pickStr(a.ask, b.ask);
  if (ask) out.ask = ask;
  const doit = pickStr(a.do, b.do);
  if (doit) out.do = doit;
  const materials = pickStr(a.materials, b.materials);
  if (materials) out.materials = materials;
  const homework = pickStr(a.homework, b.homework);
  if (homework) out.homework = homework;
  const close = pickStr(a.close, b.close);
  if (close) out.close = close;
  const mods = pickStr(a.mods, b.mods);
  if (mods) out.mods = mods;
  const reflect = pickStr(a.reflect, b.reflect);
  if (reflect) out.reflect = reflect;
  const move = pickStr(a.move, b.move);
  if (move) out.move = move;
  const skills = a.skills?.length ? a.skills : b.skills;
  if (skills?.length) out.skills = skills;
  const agenda = mergeAgenda(a.agenda, b.agenda);
  if (agenda) out.agenda = agenda;
  if (Object.keys(lines).length) out.lines = lines;
  const media = a.media?.length ? a.media : b.media;
  if (media?.length) out.media = media;
  return out;
}

export function mergeHourMaps(keep: HourDays | undefined, fill: HourDays | undefined): HourDays {
  const a = keep ?? {};
  const b = fill ?? {};
  const out: HourDays = {};
  for (const date of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const rowA = a[date] ?? {};
    const rowB = b[date] ?? {};
    const row: Record<string, HourDay> = {};
    for (const p of new Set([...Object.keys(rowA), ...Object.keys(rowB)])) {
      const day = mergeDay(rowA[p], rowB[p]);
      if (hourFilled(day)) row[p] = day;
    }
    if (Object.keys(row).length) out[date] = row;
  }
  return out;
}

export function withTeachDays(file: EconomyFile, days: HourDays): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), teachDays: days };
  return next;
}

function asPack(stored: HoursPack | HourDays): HoursPack {
  if (stored && typeof stored === "object" && "days" in stored && (stored as HoursPack).days && typeof (stored as HoursPack).days === "object") {
    return stored as HoursPack;
  }
  return { saved: "", days: stored as HourDays };
}

/** Put stored hours back when this desk is missing them. Same-stamp empty means a real Clear. */
export function recoverHours(file: EconomyFile, stored: HoursPack | HourDays | null | undefined): EconomyFile {
  if (!stored) return file;
  const pack = asPack(stored);
  const storedN = hourCountMap(pack.days);
  if (storedN === 0) return file;
  const liveN = hourCount(file);
  if (liveN >= storedN) return file;
  const sameStamp = Boolean(file.meta.savedAt && pack.saved && file.meta.savedAt === pack.saved);
  if (sameStamp && liveN === 0) return file;
  return withTeachDays(file, mergeHourMaps(hourPlanOf(file), pack.days));
}

export function readHours(): HoursPack | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOURS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const rec = parsed as { saved?: unknown; days?: unknown };
    if (rec.days && typeof rec.days === "object") {
      return { saved: String(rec.saved || ""), days: rec.days as HourDays };
    }
    return { saved: "", days: parsed as HourDays };
  } catch {
    return null;
  }
}

export function writeHours(days: HourDays, saved = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HOURS_KEY, JSON.stringify({ saved, days } satisfies HoursPack));
  } catch {
    /* quota */
  }
}
