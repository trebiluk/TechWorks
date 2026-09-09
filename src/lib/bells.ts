export type BellTime = { period: number; start: string; end: string; attendBy: string };
export type ScheduleId = "regular" | "delay1" | "delay2" | "half" | "assembly";

function t(period: number, start: string, end: string, attendBy: string): BellTime {
  return { period, start, end, attendBy };
}

export const SCHEDULES: Record<ScheduleId, { label: string; times: BellTime[] }> = {
  regular: {
    label: "Regular",
    times: [
      t(1, "07:55", "08:35", "08:15"),
      t(2, "08:38", "09:15", "08:58"),
      t(3, "09:18", "09:55", "09:38"),
      t(4, "09:58", "10:35", "10:18"),
      t(5, "10:38", "11:15", "10:58"),
      t(6, "11:18", "11:55", "11:38"),
      t(7, "11:58", "12:35", "12:18"),
      t(8, "12:38", "13:15", "12:58"),
      t(9, "13:18", "13:55", "13:38"),
      t(10, "13:58", "14:37", "14:18"),
    ],
  },
  delay1: {
    label: "1 hour delay",
    times: [
      t(1, "08:55", "09:29", "09:15"),
      t(2, "09:32", "10:03", "09:47"),
      t(3, "10:06", "10:37", "10:21"),
      t(4, "10:40", "11:11", "10:55"),
      t(5, "11:14", "11:45", "11:29"),
      t(6, "11:48", "12:19", "12:03"),
      t(7, "12:22", "12:53", "12:37"),
      t(8, "12:56", "13:27", "13:11"),
      t(9, "13:30", "14:01", "13:45"),
      t(10, "14:04", "14:37", "14:20"),
    ],
  },
  delay2: {
    label: "2 hour delay",
    times: [
      t(1, "09:55", "10:20", "10:05"),
      t(2, "10:23", "10:45", "10:33"),
      t(3, "10:48", "11:10", "10:58"),
      t(5, "11:13", "11:43", "11:28"),
      t(6, "11:46", "12:16", "12:01"),
      t(7, "12:19", "12:49", "12:34"),
      t(8, "12:52", "13:22", "13:07"),
      t(9, "13:25", "13:47", "13:35"),
      t(10, "13:50", "14:12", "14:00"),
      t(4, "14:15", "14:37", "14:25"),
    ],
  },
  half: {
    label: "Half day",
    times: [
      t(1, "07:55", "08:40", "08:15"),
      t(2, "08:43", "09:25", "09:03"),
      t(3, "09:28", "10:10", "09:48"),
      t(4, "10:13", "10:55", "10:33"),
    ],
  },
  assembly: {
    label: "Assembly",
    times: [
      t(1, "07:55", "08:35", "08:15"),
      t(2, "08:38", "09:15", "08:58"),
      t(3, "09:18", "09:55", "09:38"),
      t(4, "09:58", "10:35", "10:18"),
      t(5, "10:38", "11:15", "10:58"),
      t(6, "11:18", "11:55", "11:38"),
      t(7, "11:58", "12:35", "12:18"),
      t(8, "12:38", "13:15", "12:58"),
      t(9, "13:18", "13:55", "13:38"),
      t(10, "13:58", "14:37", "14:18"),
    ],
  },
};

export const BELL_TIMES = SCHEDULES.regular.times;

export function scheduleOf(id?: string): ScheduleId {
  if (id === "delay1" || id === "delay2" || id === "half" || id === "assembly") return id;
  return "regular";
}

export type BellPack = { id: string; label: string; times: BellTime[] };

export function builtinPacks(): BellPack[] {
  return (Object.keys(SCHEDULES) as ScheduleId[]).map((id) => ({
    id,
    label: SCHEDULES[id].label,
    times: SCHEDULES[id].times,
  }));
}

export function specialLive(start: string, end: string, now = new Date()): boolean {
  const t = nowMinutes(now);
  return t >= toMin(start) && t <= toMin(end);
}

export function windowsOverlap(a0: string, a1: string, b0: string, b1: string): boolean {
  return toMin(a0) < toMin(b1) && toMin(a1) > toMin(b0);
}

export type AgendaStep = "attend" | "input" | "cleanup" | "verify";

export const SCHOOLTOOL_URL = "https://cnyric08.schooltool.com/solvay/";

export const AGENDA: { id: AgendaStep; label: string }[] = [
  { id: "attend", label: "1 SchoolTool" },
  { id: "input", label: "2 Student input" },
  { id: "cleanup", label: "3 Cleanup" },
  { id: "verify", label: "4 Verify" },
];

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function nowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function bellTimes(schedule?: string): BellTime[] {
  return SCHEDULES[scheduleOf(schedule)].times;
}

export function bellForPeriod(period: number, schedule?: string): BellTime | undefined {
  return bellTimes(schedule).find((b) => b.period === period);
}

export function periodNow(schedule?: string, now = new Date()): number | null {
  const t = nowMinutes(now);
  return bellTimes(schedule).find((b) => t >= toMin(b.start) && t <= toMin(b.end))?.period ?? null;
}

export function periodPast(period: number, schedule?: string, now = new Date()): boolean {
  const b = bellForPeriod(period, schedule);
  if (!b) return false;
  return nowMinutes(now) > toMin(b.end);
}

export function periodNext(schedule?: string, now = new Date()): BellTime | null {
  const t = nowMinutes(now);
  return bellTimes(schedule).find((b) => toMin(b.start) > t) ?? null;
}

/** P1–P6 morning / lunch. P8–P10 afternoon. */
export function isAmPeriod(period: number): boolean {
  return period <= 6;
}

export function attendLate(period: number, schedule?: string, now = new Date()): boolean {
  const b = bellForPeriod(period, schedule);
  if (!b) return false;
  const t = nowMinutes(now);
  return t >= toMin(b.attendBy) && t <= toMin(b.end) + 5;
}

export function periodClock(
  period: number,
  schedule?: string,
  now = new Date(),
): { start: string; end: string; live: boolean; pct: number; left: number; cleanup: boolean } | null {
  const b = bellForPeriod(period, schedule);
  if (!b) return null;
  const t = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const start = toMin(b.start);
  const end = toMin(b.end);
  const live = t >= start && t <= end;
  const span = Math.max(1, end - start);
  const pct = Math.min(100, Math.max(0, ((t - start) / span) * 100));
  const left = end - t;
  const lead = cleanupMinsNow();
  return { start: b.start, end: b.end, live, pct, left, cleanup: live && left <= lead && left > 0 };
}

export function leftClock(leftMin: number): { mm: number; ss: number; label: string; secs: number } {
  const secs = Math.max(0, Math.round(leftMin * 60));
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  return { mm, ss, secs, label: `${mm}:${String(ss).padStart(2, "0")}` };
}

export const CLEANUP_SOUNDS = [
  { id: "bell", label: "BELL" },
  { id: "chime", label: "CHIME" },
  { id: "buzz", label: "BUZZ" },
  { id: "wood", label: "WOOD" },
  { id: "tone", label: "TONE" },
] as const;

export type CleanupSound = (typeof CLEANUP_SOUNDS)[number]["id"];

let cleanupLead = 5;
let cleanupSound: CleanupSound = "bell";

export function clampCleanupMins(n: number): number {
  return Math.min(15, Math.max(1, Math.round(Number(n) || 5)));
}

export function cleanupSoundOf(id?: string): CleanupSound {
  return CLEANUP_SOUNDS.some((s) => s.id === id) ? (id as CleanupSound) : "bell";
}

export function paintCleanup(mins?: number, sound?: string) {
  cleanupLead = clampCleanupMins(mins ?? 5);
  cleanupSound = cleanupSoundOf(sound);
}

export function cleanupMinsNow(): number {
  return cleanupLead;
}

export function cleanupSoundNow(): CleanupSound {
  return cleanupSound;
}

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  return new AC();
}

function playCleanupSound(id: CleanupSound) {
  const ac = ctx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const tone = (freq: number, start: number, dur: number, type: OscillatorType, vol = 0.06) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t0 + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0 + start);
    osc.stop(t0 + start + dur);
  };
  if (id === "chime") {
    tone(523, 0, 0.45, "sine", 0.08);
    tone(784, 0.12, 0.55, "sine", 0.07);
    tone(1046, 0.28, 0.7, "sine", 0.05);
  } else if (id === "buzz") {
    tone(140, 0, 0.55, "sawtooth", 0.05);
    tone(148, 0.08, 0.5, "sawtooth", 0.04);
  } else if (id === "wood") {
    tone(880, 0, 0.06, "triangle", 0.09);
    tone(220, 0.02, 0.08, "square", 0.04);
  } else if (id === "tone") {
    tone(880, 0, 0.35, "square", 0.05);
  } else {
    tone(784, 0, 0.18, "square", 0.05);
    tone(659, 0.2, 0.18, "square", 0.05);
    tone(523, 0.4, 0.22, "square", 0.05);
    tone(392, 0.64, 0.28, "square", 0.05);
  }
  window.setTimeout(() => ac.close(), 1400);
}

export function previewCleanupSound(id?: string) {
  playCleanupSound(cleanupSoundOf(id ?? cleanupSound));
}

export function ringBell() {
  playCleanupSound(cleanupSound);
}

export function formatBell(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "p" : "a";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")}${ap}`;
}

export function workshopDay(activity: string, goal: string): boolean {
  return /PROJ-W|WORKSHOP|MODEL|FINISH|PAINT/i.test(`${activity} ${goal}`);
}

export function beep(urgent = false) {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const ctx = new AC();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = urgent ? 880 : 520;
  gain.gain.value = 0.05;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + (urgent ? 0.35 : 0.18));
  window.setTimeout(() => ctx.close(), 600);
}
