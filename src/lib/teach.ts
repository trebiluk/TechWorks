import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { agendaFor, jobCardOf, prettyStage, type ShopJob } from "@/lib/projects";
import { bellForPeriod, cleanupMinsNow, periodNext, periodNow } from "@/lib/bells";
import { deskBellId, isSubDay } from "@/lib/store";
import type { HangItem } from "@/lib/hang";
import { parseHang } from "@/lib/hang";

export type TeachSlotKind = "enter" | "listen" | "work" | "clean" | "demo" | "share";

export type TeachSlot = {
  id: string;
  title: string;
  line: string;
  kind: TeachSlotKind;
  /** Relative weight of remaining time (cleanup is fixed). */
  w?: number;
  clean?: boolean;
};

export type TeachPack = {
  id: string;
  label: string;
  hint: string;
  slots: TeachSlot[];
};

export const TEACH_PACKS: TeachPack[] = [
  {
    id: "shop",
    label: "Workshop",
    hint: "Enter · listen · crew work · clean",
    slots: [
      { id: "enter", title: "ENTER", line: "Sit with your crew.", kind: "enter", w: 2 },
      { id: "listen", title: "LISTEN", line: "Directions first. Then questions.", kind: "listen", w: 6 },
      { id: "work", title: "CREW WORK", line: "Build the day’s activity.", kind: "work", w: 24 },
      { id: "clean", title: "CLEAN UP", line: "Tools, scraps, seats.", kind: "clean", clean: true },
    ],
  },
  {
    id: "demo",
    label: "Demo",
    hint: "Long demo, then try it",
    slots: [
      { id: "enter", title: "ENTER", line: "Sit where you can see.", kind: "enter", w: 2 },
      { id: "demo", title: "DEMO", line: "Watch once. Ask after.", kind: "demo", w: 12 },
      { id: "work", title: "TRY IT", line: "You do the move.", kind: "work", w: 18 },
      { id: "clean", title: "CLEAN UP", line: "Stations reset.", kind: "clean", clean: true },
    ],
  },
  {
    id: "critique",
    label: "Critique",
    hint: "Share and talk",
    slots: [
      { id: "enter", title: "ENTER", line: "Work out. Sit ready.", kind: "enter", w: 2 },
      { id: "share", title: "SHARE", line: "Show the work. Kind and specific.", kind: "share", w: 28 },
      { id: "clean", title: "CLEAN UP", line: "Work away. Seats.", kind: "clean", clean: true },
    ],
  },
  {
    id: "train",
    label: "Training",
    hint: "New tool or safety",
    slots: [
      { id: "enter", title: "ENTER", line: "Eyes on the demo.", kind: "enter", w: 2 },
      { id: "demo", title: "SAFETY", line: "How we use this, every time.", kind: "demo", w: 10 },
      { id: "work", title: "PRACTICE", line: "Guided reps.", kind: "work", w: 20 },
      { id: "clean", title: "CLEAN UP", line: "Tools parked.", kind: "clean", clean: true },
    ],
  },
  {
    id: "short",
    label: "Short",
    hint: "Delay / half — skip the talk",
    slots: [
      { id: "enter", title: "ENTER", line: "Sit. Listen once.", kind: "enter", w: 3 },
      { id: "work", title: "CREW WORK", line: "One job. Finish or park it.", kind: "work", w: 22 },
      { id: "clean", title: "CLEAN UP", line: "Leave it better.", kind: "clean", clean: true },
    ],
  },
  {
    id: "sub",
    label: "Sub",
    hint: "No scores. Quiet work.",
    slots: [
      { id: "enter", title: "ENTER", line: "Attendance. Sit.", kind: "enter", w: 4 },
      { id: "work", title: "QUIET WORK", line: "The posted job. No workshop machines.", kind: "work", w: 28 },
      { id: "clean", title: "CLEAN UP", line: "Leave it ready.", kind: "clean", clean: true },
    ],
  },
];

export type TeachDay = {
  pack?: string;
  objective?: string;
  pin?: string;
  notes?: string;
  ask?: string;
  do?: string;
  lines?: Record<string, string>;
  media?: HangItem[];
  /** Tools, PPE, stock on the bench. */
  materials?: string;
  homework?: string;
  /** Closure / exit ticket. */
  close?: string;
  /** Differentiation. No student names. */
  mods?: string;
  /** After-class note. */
  reflect?: string;
  /** Four wall cards. Empty lines fall back to the hour pack. */
  agenda?: { now?: string; goal?: string; next?: string; behave?: string };
  /** PlanIt process tag. Never used as the hour title. */
  move?: string;
};


export type LaidSlot = TeachSlot & { startMin: number; endMin: number; mins: number };

function dayMap(file: EconomyFile, date: string): Record<string, TeachDay> {
  return { ...(file.meta.config?.teachDays?.[date] ?? {}) };
}

export function teachDay(file: EconomyFile, date: string, period: number): TeachDay {
  return dayMap(file, date)[String(period)] ?? {};
}

export function packOf(file: EconomyFile, date: string, period: number): TeachPack {
  if (isSubDay(file, date)) return TEACH_PACKS.find((p) => p.id === "sub") ?? TEACH_PACKS[0];
  const id = teachDay(file, date, period).pack || file.meta.config?.teachPack || "shop";
  return TEACH_PACKS.find((p) => p.id === id) ?? TEACH_PACKS[0];
}

export function teachObjective(file: EconomyFile, date: string, period: number): string {
  const saved = teachDay(file, date, period).objective?.trim();
  if (saved) return saved;
  const a = agendaFor(file, period, date);
  const stage = prettyStage(a.goal);
  return [a.activityName, stage, a.title].filter(Boolean).filter((x, i, arr) => arr.indexOf(x) === i).join(" · ");
}

export function teachJob(file: EconomyFile, period: number, date: string) {
  const job = jobCardOf(file, period, date);
  const day = teachDay(file, date, period);
  return {
    ...job,
    question: day.ask?.trim() || job.question,
    today: day.do?.trim() || job.today,
  };
}

/** Enter / listen / work copy from the parked job when the teacher has not overwritten a plate. */
export function defaultHourLine(slot: TeachSlot, job: ShopJob): string {
  if (slot.kind === "listen" || slot.id === "listen") return job.question.trim() || slot.line;
  if (slot.kind === "work") return job.today.trim() || slot.line;
  if (slot.kind === "share") return job.done.trim() || slot.line;
  if (slot.kind === "demo") return job.lookFor.replace(/^\d\s*=\s*/, "").trim() || slot.line;
  if (slot.kind === "enter") {
    if (job.rules.some((r) => /goggle/i.test(r))) return "Goggles on. Sit with your crew.";
    return slot.line;
  }
  return slot.line;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function laySlots(file: EconomyFile, date: string, period: number): LaidSlot[] {
  const b = bellForPeriod(period, deskBellId(file, date));
  if (!b) return [];
  const start = toMin(b.start);
  const end = toMin(b.end);
  const span = Math.max(8, end - start);
  const pack = packOf(file, date, period);
  const body = pack.slots.filter((s) => !s.clean);
  const tail = pack.slots.find((s) => s.clean);
  const cleanWant = Math.min(cleanupMinsNow(), Math.max(3, Math.round(span * 0.18)));
  const clean = tail ? Math.min(cleanWant, Math.max(3, span - Math.max(1, body.length))) : 0;
  const workSpan = Math.max(body.length, span - clean);
  const weight = body.reduce((n, s) => n + (s.w || 1), 0) || 1;
  const job = teachJob(file, period, date);
  const custom = teachDay(file, date, period).lines ?? {};
  let t = start;
  const cut = start + workSpan;
  const out: LaidSlot[] = [];
  body.forEach((s, i) => {
    const last = i === body.length - 1;
    const raw = Math.max(1, Math.round((workSpan * (s.w || 1)) / weight));
    const endMin = last ? cut : Math.min(cut - (body.length - 1 - i), t + raw);
    const mins = Math.max(1, endMin - t);
    const line = custom[s.id] ?? defaultHourLine(s, job);
    out.push({ ...s, line, startMin: t, endMin: t + mins, mins });
    t += mins;
  });
  if (tail) {
    out.push({ ...tail, line: custom[tail.id] ?? defaultHourLine(tail, job), startMin: cut, endMin: end, mins: Math.max(1, end - cut) });
  } else if (out.length) {
    out[out.length - 1].endMin = end;
    out[out.length - 1].mins = Math.max(1, end - out[out.length - 1].startMin);
  }
  return out;
}

/** Live shop period, else the next shop class, else first period tomorrow. */
export function teachFocusPeriod(file: EconomyFile, date: string, now = new Date(), pick?: number | null): number {
  const shop = shopBells(file).map((b) => b.period);
  if (pick && shop.includes(pick)) return pick;
  const bellsId = deskBellId(file, date);
  const live = periodNow(bellsId, now);
  if (live != null && shop.includes(live)) return live;
  const nxt = periodNext(bellsId, now);
  if (nxt && shop.includes(nxt.period)) return nxt.period;
  if (live != null) {
    const after = shop.find((p) => p > live);
    if (after) return after;
  }
  if (nxt) {
    const after = shop.find((p) => {
      const b = bellForPeriod(p, bellsId);
      return b && toMin(b.start) >= toMin(nxt.start);
    });
    if (after) return after;
  }
  return shop[shop.length - 1] ?? shop[0] ?? 1;
}

export function slotNow(file: EconomyFile, date: string, period: number, now = new Date()): LaidSlot | null {
  const rows = laySlots(file, date, period);
  if (!rows.length) return null;
  const pin = teachDay(file, date, period).pin;
  const t = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const last = rows[rows.length - 1];
  if (t > last.endMin) return null;
  const clean = rows.find((s) => s.clean);
  if (clean && t >= clean.startMin && t <= clean.endMin) return clean;
  if (pin) {
    const hit = rows.find((s) => s.id === pin);
    if (hit && !hit.clean) return hit;
  }
  for (const s of rows) {
    if (t >= s.startMin && t < s.endMin) return s;
  }
  if (t < rows[0].startMin) return rows[0];
  return last;
}

function putDay(file: EconomyFile, date: string, period: number, patch: TeachDay): EconomyFile {
  const next = cloneFile(file);
  const days = { ...(next.meta.config?.teachDays ?? {}) };
  const row = { ...(days[date] ?? {}) };
  row[String(period)] = { ...teachDay(file, date, period), ...patch };
  days[date] = row;
  next.meta.config = { ...(next.meta.config ?? {}), teachDays: days };
  return next;
}

export function dropTeachDay(file: EconomyFile, date: string, period: number): EconomyFile {
  const next = cloneFile(file);
  const days = { ...(next.meta.config?.teachDays ?? {}) };
  const row = { ...(days[date] ?? {}) };
  delete row[String(period)];
  if (Object.keys(row).length) days[date] = row;
  else delete days[date];
  next.meta.config = { ...(next.meta.config ?? {}), teachDays: days };
  return next;
}

export function setDefaultTeachPack(file: EconomyFile, pack: string): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), teachPack: pack };
  return next;
}

export function setTeachPack(file: EconomyFile, date: string, period: number, pack: string): EconomyFile {
  return putDay(file, date, period, { pack, pin: undefined });
}

export function setTeachObjective(file: EconomyFile, date: string, period: number, objective: string): EconomyFile {
  return putDay(file, date, period, { objective: objective.trim().slice(0, 160) });
}

export function setTeachAsk(file: EconomyFile, date: string, period: number, ask: string): EconomyFile {
  return putDay(file, date, period, { ask: ask.trim().slice(0, 200) || undefined });
}

export function setTeachDo(file: EconomyFile, date: string, period: number, line: string): EconomyFile {
  return putDay(file, date, period, { do: line.trim().slice(0, 200) || undefined });
}

export function setTeachLine(file: EconomyFile, date: string, period: number, slotId: string, line: string): EconomyFile {
  const day = teachDay(file, date, period);
  const lines = { ...(day.lines ?? {}) };
  const next = line.trim().slice(0, 200);
  if (next) lines[slotId] = next;
  else delete lines[slotId];
  return putDay(file, date, period, { lines });
}

export function setTeachPin(file: EconomyFile, date: string, period: number, pin?: string): EconomyFile {
  return putDay(file, date, period, { pin: pin || undefined });
}

export function setTeachNotes(file: EconomyFile, date: string, period: number, notes: string): EconomyFile {
  return putDay(file, date, period, { notes: notes.trim().slice(0, 400) || undefined });
}

export function setTeachMaterials(file: EconomyFile, date: string, period: number, materials: string): EconomyFile {
  return putDay(file, date, period, { materials: materials.trim().slice(0, 200) || undefined });
}

export function setTeachHomework(file: EconomyFile, date: string, period: number, homework: string): EconomyFile {
  return putDay(file, date, period, { homework: homework.trim().slice(0, 160) || undefined });
}

export function setTeachClose(file: EconomyFile, date: string, period: number, close: string): EconomyFile {
  return putDay(file, date, period, { close: close.trim().slice(0, 200) || undefined });
}

export function setTeachMods(file: EconomyFile, date: string, period: number, mods: string): EconomyFile {
  return putDay(file, date, period, { mods: mods.trim().slice(0, 200) || undefined });
}

export function setTeachReflect(file: EconomyFile, date: string, period: number, reflect: string): EconomyFile {
  return putDay(file, date, period, { reflect: reflect.trim().slice(0, 400) || undefined });
}

export function setTeachMove(file: EconomyFile, date: string, period: number, move: string): EconomyFile {
  return putDay(file, date, period, { move: move.trim().slice(0, 24) || undefined });
}

export function setTeachAgenda(
  file: EconomyFile,
  date: string,
  period: number,
  patch: NonNullable<TeachDay["agenda"]>,
): EconomyFile {
  const cur = teachDay(file, date, period).agenda ?? {};
  const agenda = {
    now: (patch.now !== undefined ? patch.now : cur.now)?.trim().slice(0, 220) || undefined,
    goal: (patch.goal !== undefined ? patch.goal : cur.goal)?.trim().slice(0, 280) || undefined,
    next: (patch.next !== undefined ? patch.next : cur.next)?.trim().slice(0, 280) || undefined,
    behave: (patch.behave !== undefined ? patch.behave : cur.behave)?.trim().slice(0, 220) || undefined,
  };
  const slim = agenda.now || agenda.goal || agenda.next || agenda.behave ? agenda : undefined;
  return putDay(file, date, period, { agenda: slim });
}

function slimTeach(day: TeachDay): TeachDay {
  const out: TeachDay = {};
  if (day.pack) out.pack = day.pack;
  if (day.objective?.trim()) out.objective = day.objective.trim().slice(0, 160);
  if (day.notes?.trim()) out.notes = day.notes.trim().slice(0, 400);
  if (day.ask?.trim()) out.ask = day.ask.trim().slice(0, 200);
  if (day.do?.trim()) out.do = day.do.trim().slice(0, 200);
  if (day.materials?.trim()) out.materials = day.materials.trim().slice(0, 200);
  if (day.homework?.trim()) out.homework = day.homework.trim().slice(0, 160);
  if (day.close?.trim()) out.close = day.close.trim().slice(0, 200);
  if (day.mods?.trim()) out.mods = day.mods.trim().slice(0, 200);
  if (day.reflect?.trim()) out.reflect = day.reflect.trim().slice(0, 400);
  if (day.move?.trim()) out.move = day.move.trim().slice(0, 24);
  if (day.agenda) {
    const agenda = {
      now: day.agenda.now?.trim().slice(0, 220) || undefined,
      goal: day.agenda.goal?.trim().slice(0, 280) || undefined,
      next: day.agenda.next?.trim().slice(0, 280) || undefined,
      behave: day.agenda.behave?.trim().slice(0, 220) || undefined,
    };
    if (agenda.now || agenda.goal || agenda.next || agenda.behave) out.agenda = agenda;
  }
  if (day.lines && Object.keys(day.lines).length) out.lines = day.lines;
  if (day.media?.length) out.media = day.media;
  return out;
}

/** Replace the hour. Live pin (which beat is on) stays off the copy. */
export function replaceTeachDay(file: EconomyFile, date: string, period: number, day: TeachDay): EconomyFile {
  const next = cloneFile(file);
  const days = { ...(next.meta.config?.teachDays ?? {}) };
  const row = { ...(days[date] ?? {}) };
  const slim = slimTeach(day);
  if (Object.keys(slim).length) row[String(period)] = slim;
  else delete row[String(period)];
  if (Object.keys(row).length) days[date] = row;
  else delete days[date];
  next.meta.config = { ...(next.meta.config ?? {}), teachDays: days };
  return next;
}

export function teachHourFilled(day: TeachDay): boolean {
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
      (day.lines && Object.keys(day.lines).length),
  );
}

/** One class hour onto another date/period. Skips empty sources. Does not copy the live beat pin. */
export function copyTeachHour(
  file: EconomyFile,
  fromDate: string,
  fromPeriod: number,
  toDate: string,
  toPeriod: number,
): EconomyFile {
  if (fromDate === toDate && fromPeriod === toPeriod) return file;
  const src = teachDay(file, fromDate, fromPeriod);
  if (!teachHourFilled(src)) return file;
  const { pin: _pin, ...rest } = src;
  return replaceTeachDay(file, toDate, toPeriod, rest);
}

export function hangOf(file: EconomyFile, date: string, period: number): HangItem[] {
  return teachDay(file, date, period).media ?? [];
}

export function addTeachHang(file: EconomyFile, date: string, period: number, raw: string): EconomyFile {
  const item = parseHang(raw);
  if (!item) return file;
  const cur = hangOf(file, date, period);
  if (cur.some((h) => h.id === item.id || h.url === item.url)) return file;
  return putDay(file, date, period, { media: [...cur, item].slice(0, 6) });
}

export function dropTeachHang(file: EconomyFile, date: string, period: number, id: string): EconomyFile {
  const next = hangOf(file, date, period).filter((h) => h.id !== id);
  return putDay(file, date, period, { media: next.length ? next : undefined });
}

export function minClock(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  const am = h >= 12;
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(mm).padStart(2, "0")} ${am ? "PM" : "AM"}`;
}

const HOUR_KEY = "techworks-hour-pick";

/** Teach and Deck share the period chip for this tab. */
export function loadHourPick(): number | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const n = Number(sessionStorage.getItem(HOUR_KEY));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function saveHourPick(period: number) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(HOUR_KEY, String(period));
  } catch {
    /* private mode */
  }
}
