/** Locked worker ids. Alias is minted AFTER the id exists — never the other way. */

import { generateAlias } from "./alias-bank.ts";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function token(len: number): string {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint8Array(len);
    crypto.getRandomValues(buf);
    let out = "";
    for (let i = 0; i < len; i++) out += ALPHA[buf[i]! % ALPHA.length];
    return out;
  }
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHA[Math.floor(Math.random() * ALPHA.length)]!;
  return out;
}

/** New unique id. Never includes legal names or period. Stable for the life of the row. */
export function newStudentId(used: Iterable<string>): string {
  const taken = new Set([...used].map((id) => String(id || "").trim()).filter(Boolean));
  for (let n = 0; n < 48; n++) {
    const id = `TW-${token(10)}`;
    if (!taken.has(id)) return id;
  }
  return `TW-${Date.now().toString(36).toUpperCase()}${token(4)}`;
}

/** Alias from the locked id, unique against `used`. Call only after the id is assigned. */
export function aliasAfterId(id: string, used: Iterable<string>): string {
  return generateAlias(id, used);
}

export function auditStudentIds(students: { id?: string }[]): {
  ok: boolean;
  missing: number;
  dups: string[];
  unique: number;
} {
  const seen = new Map<string, number>();
  let missing = 0;
  for (const s of students) {
    const id = String(s.id ?? "").trim();
    if (!id) {
      missing += 1;
      continue;
    }
    seen.set(id, (seen.get(id) ?? 0) + 1);
  }
  const dups = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  return { ok: missing === 0 && dups.length === 0, missing, dups, unique: seen.size };
}

/** Fill blank ids and split collisions. Existing unique ids stay put. */
export function ensureStudentIds<T extends { id?: string }>(students: T[]): T[] {
  const seen = new Set<string>();
  return students.map((s) => {
    let id = String(s.id ?? "").trim();
    if (!id || seen.has(id)) id = newStudentId(seen);
    seen.add(id);
    return id === s.id ? s : { ...s, id };
  });
}
