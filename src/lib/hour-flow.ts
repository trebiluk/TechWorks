import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { isSchoolDay, todayIso } from "@/lib/calendar";
import { periodClock, periodNext, periodNow } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { CLASS_JOBS, HALL_JOBS, WORKSHOP_JOBS } from "@/lib/cleanup";
import { hourIsSet } from "@/lib/planbook";
import { saveTeachDo } from "@/lib/plan-sync";
import { needsPpe } from "@/lib/ppe";
import {
  laySlots,
  setTeachAgenda,
  setTeachClose,
  setTeachLine,
  setTeachNotes,
  slotNow,
  teachDay,
  teachJob,
} from "@/lib/teach";

export type WallMode = "enter" | "agenda" | "cleanup" | "idle";

export type AgendaCard = {
  id: "now" | "goal" | "next" | "behave";
  n: string;
  kicker: string;
  body: string;
};

/** Projector beat. Passing / sit = enter. Listen+work = agenda. Last minutes = cleanup. After the last bell on a school day the Agenda stays up so you can verify. */
export function wallMode(file: EconomyFile, date = todayIso(), now = new Date()): WallMode {
  if (!isSchoolDay(date)) return "idle";
  const bellsId = deskBellId(file, date);
  const live = periodNow(bellsId, now);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  if (clock?.cleanup) return "cleanup";
  if (clock?.live && live != null) {
    const slot = slotNow(file, date, live, now);
    if (!slot || slot.kind === "enter") return "enter";
    if (slot.clean) return "cleanup";
    return "agenda";
  }
  if (periodNext(bellsId, now)) return "enter";
  return "agenda";
}

const BEHAVE = "Take care of yourself, your crew, and the shop. Choose → work → focus → cleanup.";
const KICK: Record<AgendaCard["id"], { n: string; kicker: string }> = {
  now: { n: "01", kicker: "Now" },
  goal: { n: "02", kicker: "Do this" },
  next: { n: "03", kicker: "Then" },
  behave: { n: "04", kicker: "How we work" },
};

/** All four agenda lines, empty included — Teach / Deck write. */
export function hourAgendaDraft(file: EconomyFile, date: string, period: number): AgendaCard[] {
  const day = teachDay(file, date, period);
  const job = teachJob(file, period, date);
  const slots = laySlots(file, date, period);
  const enter = slots.find((s) => s.kind === "enter")?.line || "Sit with your crew.";
  const now = day.agenda?.now?.trim() || enter;
  const goal = day.agenda?.goal?.trim() || job.today || day.do?.trim() || "";
  const next = day.agenda?.next?.trim() || day.close?.trim() || "";
  const behave = day.agenda?.behave?.trim() || day.notes?.trim() || BEHAVE;
  const body: Record<AgendaCard["id"], string> = { now, goal, next, behave };
  return (Object.keys(KICK) as AgendaCard["id"][]).map((id) => ({
    id,
    n: KICK[id].n,
    kicker: KICK[id].kicker,
    body: body[id],
  }));
}

/** Projector / student view. Empty Then (and empty Do this) drop so lists stay short. The wall does not use this — it always paints four cells. */
export function hourAgenda(file: EconomyFile, date: string, period: number): AgendaCard[] {
  return hourAgendaDraft(file, date, period).filter((r) => r.body || r.id === "now" || r.id === "behave");
}

const WALL_FALLBACK: Record<AgendaCard["id"], string> = {
  now: "Sit with your crew.",
  goal: "Directions first. Then questions.",
  next: "Build the day’s activity.",
  behave: BEHAVE,
};

/** Projector wall. Always four cells. Empty lines keep a procedure fallback so the 2×2 never collapses. */
export function hourAgendaWall(file: EconomyFile, date: string, period: number): AgendaCard[] {
  const job = teachJob(file, period, date);
  return hourAgendaDraft(file, date, period).map((c) => {
    const body =
      c.body.trim() ||
      (c.id === "goal" && job.today.trim() ? job.today : "") ||
      WALL_FALLBACK[c.id];
    return { ...c, body };
  });
}

/** Wall hour plate. Same PlanIt → teachDays row Deck already reads — not idle-only leftovers. */
export type HourWallSpine = {
  job: string;
  ask: string;
  prove: string;
  cards: AgendaCard[];
};

export function hourWallSpine(file: EconomyFile, date: string, period: number): HourWallSpine {
  const day = teachDay(file, date, period);
  const job = teachJob(file, period, date);
  return {
    job: (job.today || day.do || "").trim(),
    ask: (job.question || day.ask || "").trim(),
    prove: (day.objective || job.done || "").trim(),
    cards: hourAgendaWall(file, date, period),
  };
}

/** Goggles + the Need line. Kids see this on Enter and Agenda. */
export function hourKit(file: EconomyFile, date: string, period: number): string {
  const day = teachDay(file, date, period);
  const job = teachJob(file, period, date);
  const bits: string[] = [];
  if (needsPpe(job.rules)) bits.push("Goggles");
  const mat = day.materials?.trim();
  if (mat) bits.push(mat);
  return bits.join(" · ");
}

export function saveAgendaLine(
  file: EconomyFile,
  date: string,
  period: number,
  id: AgendaCard["id"],
  value: string,
): EconomyFile {
  let next = setTeachAgenda(file, date, period, { [id]: value });
  if (id === "now") next = setTeachLine(next, date, period, "enter", value);
  if (id === "goal") next = saveTeachDo(next, date, period, value);
  if (id === "next") next = setTeachClose(next, date, period, value);
  if (id === "behave") next = setTeachNotes(next, date, period, value);
  return next;
}

export function dayHourStatus(file: EconomyFile, date: string, periods: number[]) {
  return periods.map((period) => {
    const cards = hourAgendaDraft(file, date, period);
    const goal = cards.find((c) => c.id === "goal")?.body ?? "";
    return {
      period,
      set: hourIsSet(file, date, period) || Boolean(goal),
      title: goal || cards.find((c) => c.id === "now")?.body || "",
    };
  });
}

export type CleanupJobs = { shop: string[]; room: string[]; hall: string[]; extra: string };

function linesOf(raw: unknown, fallback: string[]): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  const out = raw.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 8);
  return out.length ? out : [...fallback];
}

export function cleanupJobsOf(file: EconomyFile): CleanupJobs {
  const raw = file.meta.config?.cleanupJobs;
  return {
    shop: linesOf(raw?.shop, WORKSHOP_JOBS),
    room: linesOf(raw?.room, CLASS_JOBS),
    hall: linesOf(raw?.hall, HALL_JOBS),
    extra: String(raw?.extra ?? "").trim() || "Go extra. Teacher pays cash when they catch you cleaning.",
  };
}

export function setCleanupJobs(file: EconomyFile, patch: Partial<CleanupJobs>): EconomyFile {
  const cur = cleanupJobsOf(file);
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    cleanupJobs: {
      shop: patch.shop?.length ? patch.shop.map((s) => s.trim()).filter(Boolean).slice(0, 8) : cur.shop,
      room: patch.room?.length ? patch.room.map((s) => s.trim()).filter(Boolean).slice(0, 8) : cur.room,
      hall: patch.hall?.length ? patch.hall.map((s) => s.trim()).filter(Boolean).slice(0, 8) : cur.hall,
      extra: patch.extra != null ? patch.extra.trim().slice(0, 200) : cur.extra,
    },
  };
  return next;
}
