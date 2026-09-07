import { isSchoolDay, reason, todayIso } from "@/lib/calendar";

export const CLUB_KEY = "techworks-club-v1";

export const CLUB_STATIONS = [
  { id: "minecraft", label: "MINECRAFT", hint: "Build / survive. School accounts only." },
  { id: "robotics", label: "ROBOTICS", hint: "K’nex · Snap Circuits · leftover VEX." },
  { id: "workshop", label: "WORKSHOP", hint: "TechWorks. Tools need a license." },
  { id: "computer", label: "COMPUTER TIME", hint: "Canva · TinkerCAD · coding." },
] as const;

export type ClubStation = (typeof CLUB_STATIONS)[number]["id"];

export const CLUB_DISMISS = [
  { id: "latebus", label: "LATE BUS" },
  { id: "pickup", label: "PICKUP" },
  { id: "walker", label: "WALKER" },
] as const;

export type ClubDismiss = (typeof CLUB_DISMISS)[number]["id"];

export const CLUB_OVERLAY = [
  { n: 1, title: "Badge In", stamp: "S01.1 PPE" },
  { n: 2, title: "Logo / Computer", stamp: "S08 / S03" },
  { n: 3, title: "License Lite", stamp: "Station parent" },
  { n: 4, title: "Brief", stamp: "S04 Plan" },
  { n: 5, title: "Make", stamp: "Tools / Print" },
  { n: 6, title: "Coach", stamp: "Lead if teaching" },
  { n: 7, title: "Finish / label", stamp: "S10 Document" },
  { n: 8, title: "Share", stamp: "S12 Communicate" },
] as const;

export type ClubRow = {
  id: string;
  name: string;
  station: ClubStation;
  dismiss: ClubDismiss;
  in: boolean;
};

export type ClubMeeting = {
  date: string;
  overlay: number;
  notes: string;
  rows: ClubRow[];
};

export type ClubMember = {
  id: string;
  name: string;
  station: ClubStation;
  dismiss: ClubDismiss;
};

export type ClubFile = {
  v: 1;
  meetings: Record<string, ClubMeeting>;
  /** JS weekday 0=Sun … 2=Tue. Default Tuesday. */
  weekdays: number[];
  skip: string[];
  extra: string[];
  weekOverlay: Record<string, number>;
  weekNote: Record<string, string>;
  members: ClubMember[];
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const CLUB_DOW = [1, 2, 3, 4, 5].map((d) => ({ id: d, label: DOW[d] }));

function empty(): ClubFile {
  return { v: 1, meetings: {}, weekdays: [2], skip: [], extra: [], weekOverlay: {}, weekNote: {}, members: [] };
}

function migrate(p: Partial<ClubFile> | null): ClubFile {
  const base = empty();
  if (!p || p.v !== 1) return base;
  return {
    ...base,
    meetings: p.meetings ?? {},
    weekdays: Array.isArray(p.weekdays) && p.weekdays.length ? p.weekdays : [2],
    skip: p.skip ?? [],
    extra: p.extra ?? [],
    weekOverlay: p.weekOverlay ?? {},
    weekNote: p.weekNote ?? {},
    members: Array.isArray(p.members) ? p.members : [],
  };
}

export function loadClub(): ClubFile {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(CLUB_KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as ClubFile;
    return migrate(p);
  } catch {
    return empty();
  }
}

export function saveClub(file: ClubFile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLUB_KEY, JSON.stringify(file));
  } catch {
    /* quota */
  }
}

export function meetingOf(file: ClubFile, date = todayIso()): ClubMeeting {
  return file.meetings[date] ?? { date, overlay: 0, notes: "", rows: [] };
}

export function patchMeeting(file: ClubFile, date: string, patch: Partial<ClubMeeting>): ClubFile {
  const cur = meetingOf(file, date);
  return { ...file, meetings: { ...file.meetings, [date]: { ...cur, ...patch, date } } };
}

export function patchCal(file: ClubFile, patch: Partial<Pick<ClubFile, "weekdays" | "skip" | "extra" | "weekOverlay" | "weekNote">>): ClubFile {
  return { ...file, ...patch };
}

export function toggleWeekday(file: ClubFile, dow: number): ClubFile {
  const on = file.weekdays.includes(dow);
  const weekdays = on ? file.weekdays.filter((d) => d !== dow) : [...file.weekdays, dow].sort();
  return { ...file, weekdays: weekdays.length ? weekdays : [dow] };
}

export function addDaysIso(iso: string, n: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  const w = d.getDay();
  return addDaysIso(iso, w === 0 ? -6 : 1 - w);
}

export function isHalfDay(iso: string): boolean {
  return (reason(iso) ?? "").toLowerCase().includes("half");
}

export function isClubDay(file: ClubFile, date: string): boolean {
  if (file.skip.includes(date)) return false;
  if (file.extra.includes(date)) return true;
  if (!isSchoolDay(date) || isHalfDay(date)) return false;
  return file.weekdays.includes(new Date(`${date}T12:00:00`).getDay());
}

export function nextClubDay(file: ClubFile, from = todayIso(), inclusive = true): string | null {
  for (let i = inclusive ? 0 : 1; i <= 40; i++) {
    const d = addDaysIso(from, i);
    if (isClubDay(file, d)) return d;
  }
  return null;
}

export function weekGrid(file: ClubFile, monday: string) {
  return [0, 1, 2, 3, 4].map((i) => {
    const date = addDaysIso(monday, i);
    const dow = new Date(`${date}T12:00:00`).getDay();
    return {
      date,
      dow,
      label: DOW[dow],
      school: isSchoolDay(date),
      half: isHalfDay(date),
      skip: file.skip.includes(date),
      extra: file.extra.includes(date),
      club: isClubDay(file, date),
      overlay: file.weekOverlay[date] ?? meetingOf(file, date).overlay ?? 0,
      note: reason(date),
    };
  });
}

export function setDayClub(file: ClubFile, date: string, on: boolean): ClubFile {
  const skip = file.skip.filter((d) => d !== date);
  const extra = file.extra.filter((d) => d !== date);
  const defaultOn = file.weekdays.includes(new Date(`${date}T12:00:00`).getDay()) && isSchoolDay(date) && !isHalfDay(date);
  if (on && !defaultOn) extra.push(date);
  if (!on && defaultOn) skip.push(date);
  return { ...file, skip, extra };
}

export function setWeekOverlay(file: ClubFile, date: string, n: number): ClubFile {
  const weekOverlay = { ...file.weekOverlay, [date]: n };
  if (!n) delete weekOverlay[date];
  const meet = meetingOf(file, date);
  return patchMeeting({ ...file, weekOverlay }, date, { overlay: n || meet.overlay });
}

export function overlayOn(file: ClubFile, date: string): number {
  const m = meetingOf(file, date).overlay;
  if (m) return m;
  return file.weekOverlay[date] ?? 0;
}

export type ClubPulse = {
  kind: "today" | "live" | "cleanup" | "cancelled" | "next";
  title: string;
  sub: string;
  date: string;
  overlay: number;
};

export function clubPulse(file: ClubFile, date = todayIso(), now = new Date()): ClubPulse | null {
  const clock = clubClock(now);
  const overlay = overlayOn(file, date);
  const o = CLUB_OVERLAY.find((x) => x.n === overlay);
  const oLine = o ? `Workshop ${o.n} · ${o.title}` : "Choice stations";
  const cancelledToday =
    file.skip.includes(date) && file.weekdays.includes(new Date(`${date}T12:00:00`).getDay());
  if (cancelledToday) {
    const nxt = nextClubDay(file, date, false);
    return {
      kind: "cancelled",
      title: "Club cancelled today",
      sub: nxt ? `Next ${formatClubDay(nxt)} · 2:40` : "No club on the calendar",
      date: nxt ?? date,
      overlay: 0,
    };
  }
  if (isClubDay(file, date)) {
    if (clock.phase === "warn" || clock.phase === "clean" || clock.phase === "door") {
      return { kind: "cleanup", title: "Tech Club · cleanup", sub: `${clock.headline} · ${oLine}`, date, overlay };
    }
    if (clock.phase === "arrive" || clock.phase === "sign" || clock.phase === "work") {
      return { kind: "live", title: "Tech Club now", sub: `${clock.headline} · ${oLine}`, date, overlay };
    }
    if (clock.phase === "after") {
      const nxt = nextClubDay(file, date, false);
      return {
        kind: "next",
        title: nxt ? `Next club · ${formatClubDay(nxt)}` : "Club done today",
        sub: nxt ? "2:40–3:05 · late bus list" : oLine,
        date: nxt ?? date,
        overlay: nxt ? overlayOn(file, nxt) : overlay,
      };
    }
    return { kind: "today", title: "Tech Club today", sub: `2:40–3:05 · ${oLine} · late bus`, date, overlay };
  }
  const nxt = nextClubDay(file, date, false);
  if (!nxt) return null;
  return {
    kind: "next",
    title: `Next club · ${formatClubDay(nxt)}`,
    sub: `2:40–3:05 · ${overlayOn(file, nxt) ? `Workshop ${overlayOn(file, nxt)}` : "choice stations"}`,
    date: nxt,
    overlay: overlayOn(file, nxt),
  };
}

export function formatClubDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function wallName(raw: string) {
  const parts = raw.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last.charAt(0).toUpperCase()}.`;
}

export function newRow(name: string, station: ClubStation, dismiss: ClubDismiss, id?: string): ClubRow {
  return {
    id: id || `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: wallName(name),
    station,
    dismiss,
    in: true,
  };
}

export function addMember(file: ClubFile, name: string, station: ClubStation, dismiss: ClubDismiss): ClubFile {
  const n = wallName(name);
  if (!n) return file;
  const hit = file.members.find((m) => m.name.toLowerCase() === n.toLowerCase());
  if (hit) return { ...file, members: file.members.map((m) => (m.id === hit.id ? { ...m, station, dismiss } : m)) };
  return {
    ...file,
    members: [...file.members, { id: `m-${Date.now().toString(36)}`, name: n, station, dismiss }],
  };
}

export function dropMember(file: ClubFile, id: string): ClubFile {
  return { ...file, members: file.members.filter((m) => m.id !== id) };
}

export function patchMember(file: ClubFile, id: string, patch: Partial<ClubMember>): ClubFile {
  return { ...file, members: file.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) };
}

export function checkinMember(file: ClubFile, date: string, member: ClubMember, on = true): ClubFile {
  const meet = meetingOf(file, date);
  const i = meet.rows.findIndex((r) => r.id === member.id);
  let rows = meet.rows;
  if (i < 0) rows = [...meet.rows, { id: member.id, name: member.name, station: member.station, dismiss: member.dismiss, in: on }];
  else rows = meet.rows.map((r) => (r.id === member.id ? { ...r, in: on, station: r.station || member.station, dismiss: r.dismiss || member.dismiss } : r));
  return patchMeeting(file, date, { rows });
}

export function rowOf(meet: ClubMeeting, memberId: string): ClubRow | undefined {
  return meet.rows.find((r) => r.id === memberId);
}

/** Club clock. Independent of class bells. 2:37 arrive · 2:40 sign-in · 2:45 work · 3:00 clean · 3:05 door. */
export function clubClock(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const arrive = 14 * 60 + 37;
  const sign = 14 * 60 + 40;
  const work = 14 * 60 + 45;
  const clean = 15 * 60;
  const door = 15 * 60 + 5;
  const warn = clean - 2;
  let phase: "before" | "arrive" | "sign" | "work" | "warn" | "clean" | "door" | "after" = "before";
  if (mins >= door) phase = mins < door + 30 ? "door" : "after";
  else if (mins >= clean) phase = "clean";
  else if (mins >= warn) phase = "warn";
  else if (mins >= work) phase = "work";
  else if (mins >= sign) phase = "sign";
  else if (mins >= arrive) phase = "arrive";
  const target = phase === "clean" || phase === "door" || phase === "after" ? door : clean;
  const left = Math.max(0, target - mins);
  const m = Math.floor(left);
  const s = Math.floor((left - m) * 60);
  return {
    phase,
    cleanup: phase === "warn" || phase === "clean",
    leftMin: m,
    label: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
    headline:
      phase === "before"
        ? "Club after 10th · 2:40"
        : phase === "arrive"
          ? "Arrive · glasses on the hook"
          : phase === "sign"
            ? "Sign in · pick a station"
            : phase === "work"
              ? "Choice work"
              : phase === "warn"
                ? "Cleanup in 2 minutes"
                : phase === "clean"
                  ? "CLEANUP · bins · floor · chromebooks"
                  : phase === "door"
                    ? "Meeting ended · late bus names"
                    : "Club closed",
  };
}

export function minutesText(meet: ClubMeeting) {
  const by = Object.fromEntries(CLUB_STATIONS.map((s) => [s.id, meet.rows.filter((r) => r.in && r.station === s.id)])) as Record<ClubStation, ClubRow[]>;
  const bus = meet.rows.filter((r) => r.in && r.dismiss === "latebus");
  const overlay = CLUB_OVERLAY.find((o) => o.n === meet.overlay);
  return `Solvay Middle School Technology Club
Meeting Date: ${meet.date}
All members sign in, then choose: Minecraft · Workshop · Robotics · Computer Time
Clean up at 3:00pm · Meeting ended at 3:05pm
Workshop overlay: ${overlay ? `${overlay.n} ${overlay.title}` : "choice only"}

Signed in (${meet.rows.filter((r) => r.in).length})
${CLUB_STATIONS.map((s) => `  ${s.label}: ${by[s.id].map((r) => r.name).join(", ") || "—"}`).join("\n")}

Late bus (${bus.length}): ${bus.map((r) => r.name).join(", ") || "—"}

Notes:
${meet.notes || "—"}
`;
}
