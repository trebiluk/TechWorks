import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { TEACH_PACKS, dropTeachDay, setTeachNotes, setTeachObjective, setTeachPack } from "@/lib/teach";

export type LessonUse = { date: string; period: number; q?: string };

export type LessonPlan = {
  id: string;
  title: string;
  cat: string;
  grade?: number;
  pack?: string;
  objective?: string;
  notes?: string;
  used?: LessonUse[];
};

export const LESSON_CATS = ["Shop", "Demo", "Critique", "Training", "Drawing", "Free", "Present", "Sub"] as const;

const SEED: LessonPlan[] = [
  { id: "lsn-shop", title: "Crew work day", cat: "Shop", pack: "shop", objective: "Build the day’s activity.", notes: "Enter · listen · crew work · clean" },
  { id: "lsn-demo", title: "Tool demo then try", cat: "Demo", pack: "demo", objective: "Watch once. Then you do the move." },
  { id: "lsn-crit", title: "Share and talk", cat: "Critique", pack: "critique", objective: "Kind and specific. Show the work." },
  { id: "lsn-train", title: "New tool / safety", cat: "Training", pack: "train", objective: "How we use this, every time." },
  { id: "lsn-draw", title: "Drawing / planning", cat: "Drawing", pack: "shop", objective: "Name · nickname · allergies · other. Doodle when finished." },
  { id: "lsn-free", title: "Free day", cat: "Free", pack: "short", objective: "One job. Finish or park it." },
  { id: "lsn-present", title: "Presentation day", cat: "Present", pack: "critique", objective: "Share. Listen. One question." },
  { id: "lsn-sub", title: "Sub / quiet work", cat: "Sub", pack: "sub", objective: "The posted job. No machines." },
];

export function lessonsOf(file: EconomyFile): LessonPlan[] {
  const rows = file.meta.config?.lessons;
  return Array.isArray(rows) && rows.length ? rows : SEED;
}

export function ensureLessons(file: EconomyFile): EconomyFile {
  if (file.meta.config?.lessons?.length) return file;
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), lessons: SEED.map((x) => ({ ...x })) };
  return next;
}

export function upsertLesson(file: EconomyFile, plan: LessonPlan): EconomyFile {
  const next = cloneFile(ensureLessons(file));
  const rows = [...(next.meta.config?.lessons ?? [])];
  const i = rows.findIndex((x) => x.id === plan.id);
  const row: LessonPlan = {
    ...plan,
    title: plan.title.trim() || "Untitled",
    cat: LESSON_CATS.includes(plan.cat as (typeof LESSON_CATS)[number]) ? plan.cat : "Shop",
  };
  if (i >= 0) rows[i] = { ...rows[i], ...row };
  else rows.unshift(row);
  next.meta.config = { ...(next.meta.config ?? {}), lessons: rows.slice(0, 80) };
  return next;
}

export function dropLesson(file: EconomyFile, id: string): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), lessons: (next.meta.config?.lessons ?? []).filter((x) => x.id !== id) };
  return next;
}

function unstamp(file: EconomyFile, date: string, period: number): EconomyFile {
  const next = cloneFile(ensureLessons(file));
  const rows = lessonsOf(next).map((l) => ({
    ...l,
    used: (l.used ?? []).filter((u) => !(u.date === date && u.period === period)),
  }));
  next.meta.config = { ...(next.meta.config ?? {}), lessons: rows };
  return next;
}

/** Stamp this period/day with the plan. Same plan can be reused next quarter — roster is not on the card. */
export function applyLesson(file: EconomyFile, id: string, date: string, period: number, quarter?: string): EconomyFile {
  const plan = lessonsOf(file).find((x) => x.id === id);
  if (!plan) return file;
  let next = unstamp(file, date, period);
  if (plan.pack && TEACH_PACKS.some((p) => p.id === plan.pack)) next = setTeachPack(next, date, period, plan.pack);
  if (plan.objective) next = setTeachObjective(next, date, period, plan.objective);
  if (plan.notes) next = setTeachNotes(next, date, period, plan.notes);
  const rows = [...lessonsOf(next)];
  const i = rows.findIndex((x) => x.id === id);
  if (i >= 0) {
    const used = [...(rows[i].used ?? []), { date, period, q: quarter }].slice(-40);
    rows[i] = { ...rows[i], used };
    next = cloneFile(next);
    next.meta.config = { ...(next.meta.config ?? {}), lessons: rows };
  }
  return next;
}

export function clearLesson(file: EconomyFile, date: string, period: number): EconomyFile {
  return dropTeachDay(unstamp(file, date, period), date, period);
}

export function lessonOn(file: EconomyFile, date: string, period: number): LessonPlan | null {
  const hits = lessonsOf(file).filter((l) => (l.used ?? []).some((u) => u.date === date && u.period === period));
  return hits.length ? hits[hits.length - 1] : null;
}

export function lessonForPeriod(file: EconomyFile, date: string, period: number, packId?: string, objective?: string): LessonPlan | null {
  const stamped = lessonOn(file, date, period);
  if (stamped) return stamped;
  const obj = objective?.trim();
  const rows = lessonsOf(file);
  if (obj) {
    const hit = rows.find((l) => l.objective?.trim() === obj);
    if (hit) return hit;
  }
  if (packId) return rows.find((l) => l.pack === packId) ?? null;
  return null;
}

export function newLessonId(): string {
  return `lsn-${Date.now().toString(36)}`;
}
