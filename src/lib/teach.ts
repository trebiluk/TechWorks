import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { agendaFor, prettyStage } from "@/lib/projects";
import { bellForPeriod, cleanupMinsNow, periodNext, periodNow } from "@/lib/bells";
import { deskBellId, isSubDay } from "@/lib/store";

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
  let t = start;
  const cut = start + workSpan;
  const out: LaidSlot[] = [];
  body.forEach((s, i) => {
    const last = i === body.length - 1;
    const raw = Math.max(1, Math.round((workSpan * (s.w || 1)) / weight));
    const endMin = last ? cut : Math.min(cut - (body.length - 1 - i), t + raw);
    const mins = Math.max(1, endMin - t);
    out.push({ ...s, startMin: t, endMin: t + mins, mins });
    t += mins;
  });
  if (tail) {
    out.push({ ...tail, startMin: cut, endMin: end, mins: Math.max(1, end - cut) });
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
  return shop[0] ?? 1;
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
  return putDay(file, date, period, { objective: objective.trim().slice(0, 120) });
}

export function setTeachPin(file: EconomyFile, date: string, period: number, pin?: string): EconomyFile {
  return putDay(file, date, period, { pin: pin || undefined });
}

export function setTeachNotes(file: EconomyFile, date: string, period: number, notes: string): EconomyFile {
  return putDay(file, date, period, { notes: notes.trim().slice(0, 200) });
}

export function minClock(m: number): string {
  const h = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  const am = h >= 12;
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(mm).padStart(2, "0")} ${am ? "PM" : "AM"}`;
}
