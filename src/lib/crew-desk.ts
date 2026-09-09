import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { todayIso } from "@/lib/calendar";

export const CREW_MIN = 3;
export const CREW_MAX = 4;
export const CREWS_MAX = 5;
export const BENCH = "Bench";
export const CREW_COLORS = ["#22D3EE", "#3B82F6", "#A855F7", "#E85820", "#22c55e", "#f59e0b", "#f43f5e", "#94a3b8"];

export type CrewBan = {
  a: string;
  b: string;
  note?: string;
  by?: string;
  since?: string;
};

export type CrewException = {
  a: string;
  b: string;
  date: string;
  note: string;
};

function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function crewAt(s: RawStudent, date: string): string {
  const log = s.crewDays ?? {};
  let hit = s.crewKey || BENCH;
  for (const d of Object.keys(log).sort()) {
    if (d <= date) hit = log[d] || BENCH;
  }
  return hit || BENCH;
}

export function crewHistory(s: RawStudent): { date: string; crew: string }[] {
  const log = s.crewDays ?? {};
  const rows = Object.keys(log)
    .sort()
    .map((date) => ({ date, crew: log[date] || BENCH }));
  if (!rows.length) return [{ date: "start", crew: s.crewKey || BENCH }];
  return rows;
}

export function bansOf(file: EconomyFile): CrewBan[] {
  return [...(file.meta.config?.crewBans ?? [])];
}

export function banBetween(file: EconomyFile, a: string, b: string): CrewBan | undefined {
  const k = pairKey(a, b);
  return bansOf(file).find((x) => pairKey(x.a, x.b) === k);
}

export function excepted(file: EconomyFile, a: string, b: string, date: string): boolean {
  return (file.meta.config?.crewExceptions ?? []).some((x) => x.date === date && pairKey(x.a, x.b) === pairKey(a, b));
}

export function crewConflicts(file: EconomyFile, period: number, date: string) {
  const kids = file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName));
  const byCrew = new Map<string, RawStudent[]>();
  for (const s of kids) {
    const k = crewAt(s, date);
    const list = byCrew.get(k) ?? [];
    list.push(s);
    byCrew.set(k, list);
  }
  const hits: { crew: string; a: RawStudent; b: RawStudent; ban: CrewBan }[] = [];
  for (const [crew, list] of byCrew) {
    if (crew === BENCH) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const ban = banBetween(file, list[i].id, list[j].id);
        if (ban && !excepted(file, list[i].id, list[j].id, date)) {
          hits.push({ crew, a: list[i], b: list[j], ban });
        }
      }
    }
  }
  return hits;
}

export function placeBlock(
  file: EconomyFile,
  student: RawStudent,
  dest: string,
  date: string,
): string | null {
  if (dest !== BENCH) {
    const there = file.students.filter(
      (s) => s.period === student.period && s.id !== student.id && isLiveStudent(s, file.meta.quarterName) && crewAt(s, date) === dest,
    );
    if (there.length >= CREW_MAX) return `${dest} already has ${CREW_MAX}`;
    for (const other of there) {
      const ban = banBetween(file, student.id, other.id);
      if (ban && !excepted(file, student.id, other.id, date)) {
        const who = other.first;
        return `Principal: not with ${who}${ban.note ? ` · ${ban.note}` : ""}`;
      }
    }
  }
  return null;
}

export function setStudentCrew(file: EconomyFile, id: string, crewKey: string, date = todayIso()): EconomyFile {
  const next = cloneFile(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const key = crewKey || BENCH;
    return {
      ...s,
      crewKey: date >= todayIso() ? key : s.crewKey,
      crewDays: { ...(s.crewDays ?? {}), [date]: key },
    };
  });
  return next;
}

export function addCrewBan(file: EconomyFile, a: string, b: string, note?: string, by = "principal"): EconomyFile {
  if (!a || !b || a === b) return file;
  if (banBetween(file, a, b)) return file;
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    crewBans: [...bansOf(next), { a, b, note: note?.trim().slice(0, 80) || undefined, by, since: todayIso() }],
  };
  return next;
}

export function dropCrewBan(file: EconomyFile, a: string, b: string): EconomyFile {
  const k = pairKey(a, b);
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    crewBans: bansOf(next).filter((x) => pairKey(x.a, x.b) !== k),
  };
  return next;
}

export function addCrewException(file: EconomyFile, a: string, b: string, date: string, note: string): EconomyFile {
  const next = cloneFile(file);
  const list = [...(next.meta.config?.crewExceptions ?? [])];
  list.push({ a, b, date, note: note.trim().slice(0, 80) || "override" });
  next.meta.config = { ...(next.meta.config ?? {}), crewExceptions: list };
  return next;
}

export function addPeriodCrew(file: EconomyFile, period: number): EconomyFile {
  const next = cloneFile(file);
  const have = next.crews.filter((c) => c.period === period);
  if (have.length >= CREWS_MAX) return file;
  const letters = ["A", "B", "C", "D", "E"];
  const used = new Set(have.map((c) => c.key));
  const letter = letters.find((l) => !used.has(`Crew ${l}`)) ?? String(have.length + 1);
  const key = `Crew ${letter}`;
  next.crews = [...next.crews, { period, key, name: key }];
  return next;
}

export function renameCrew(file: EconomyFile, period: number, key: string, name: string): EconomyFile {
  return setCrewProfile(file, period, key, { name });
}

export function setCrewProfile(
  file: EconomyFile,
  period: number,
  key: string,
  patch: { name?: string; motto?: string; icon?: string; color?: string; logo?: string },
): EconomyFile {
  const next = cloneFile(file);
  const name = patch.name != null ? patch.name.trim().slice(0, 28) || key : undefined;
  const motto = patch.motto != null ? patch.motto.trim().slice(0, 72) || undefined : undefined;
  const icon = patch.icon != null ? patch.icon || undefined : undefined;
  const color = patch.color != null ? patch.color || undefined : undefined;
  const logo = patch.logo != null ? patch.logo || undefined : undefined;
  const i = next.crews.findIndex((c) => c.period === period && c.key === key);
  if (i < 0) {
    next.crews = [...next.crews, { period, key, name: name ?? key, motto, icon, color, logo }];
    return next;
  }
  const cur = next.crews[i];
  next.crews[i] = {
    ...cur,
    name: name ?? cur.name,
    motto: patch.motto != null ? motto : cur.motto,
    icon: patch.icon != null ? icon : cur.icon,
    color: patch.color != null ? color : cur.color,
    logo: patch.logo != null ? logo : cur.logo,
  };
  return next;
}

export function whoOf(s: RawStudent, legal: boolean) {
  if (legal && (s.legalFirst || s.legalLast)) {
    return `${s.first} · ${(s.legalFirst ?? s.first) + " " + (s.legalLast ?? "")}`.trim();
  }
  return s.first;
}

export function readCrewLogo(list: FileList | null, done: (dataUrl: string) => void) {
  const f = list?.[0];
  if (!f || !f.type.startsWith("image/")) return;
  const img = new Image();
  const url = URL.createObjectURL(f);
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const side = 256;
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    const scale = Math.max(side / img.width, side / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (side - w) / 2, (side - h) / 2, w, h);
    done(canvas.toDataURL("image/jpeg", 0.72));
    URL.revokeObjectURL(url);
  };
  img.src = url;
}
