import type { EconomyFile, RawStudent } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { aliasAllowed, normalizeAlias } from "@/lib/alias-bank";
import { findByShop } from "@/lib/live";
import { setAlias, rerollAlias } from "@/lib/store";

const BLOCKED = new Set(["0000", "1111", "1234", "2222", "2580", "2627", "7879"]);

export function pinSet(s: Pick<RawStudent, "pinHash">): boolean {
  return Boolean(s.pinHash);
}

export function pinOk(pin: string): boolean {
  return /^\d{4}$/.test(pin) && !BLOCKED.has(pin);
}

export function pinHashOf(id: string, pin: string): string {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 0x9e3779b9;
  const s = `${id}|${pin}|tw-pin`;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ s.charCodeAt(s.length - 1 - i), 2246822519);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

export function pinsMatch(s: Pick<RawStudent, "id" | "pinHash">, pin: string): boolean {
  if (!s.pinHash || !pinOk(pin)) return false;
  return s.pinHash === pinHashOf(s.id, pin);
}

function withHash(file: EconomyFile, id: string, hash: string | undefined): EconomyFile {
  const next = cloneFile(file);
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const pinHash = hash || undefined;
    return { ...s, pinHash };
  });
  return next;
}

export function setStudentPin(file: EconomyFile, shop: string, pin: string): { file: EconomyFile; error: string } {
  const kid = findByShop(file.students, shop);
  if (!kid) return { file, error: "That code is not on the list." };
  if (pinSet(kid)) return { file, error: "Pin is already set. Ask the teacher to reset it." };
  if (!pinOk(pin)) return { file, error: "Use 4 digits. Not 1111, 1234, or a class pin." };
  return { file: withHash(file, kid.id, pinHashOf(kid.id, pin)), error: "" };
}

/** Teacher sets or replaces the pin. The student does not choose it. */
export function assignStudentPin(file: EconomyFile, id: string, pin: string): { file: EconomyFile; error: string } {
  if (!file.students.some((s) => s.id === id)) return { file, error: "That student is not on the list." };
  if (!pinOk(pin)) return { file, error: "Use 4 digits. Not 1111, 1234, or a class pin." };
  return { file: withHash(file, id, pinHashOf(id, pin)), error: "" };
}

export function resetStudentPin(file: EconomyFile, id: string): EconomyFile {
  if (!file.students.some((s) => s.id === id)) return file;
  return withHash(file, id, undefined);
}

/** Alias change after the shop code and pin. Teacher rename uses setAlias and does not need a pin. */
export function claimAlias(file: EconomyFile, shop: string, pin: string, alias: string): { file: EconomyFile; error: string } {
  const kid = findByShop(file.students, shop);
  if (!kid) return { file, error: "That code is not on the list." };
  if (!pinSet(kid)) return { file, error: "Set a pin first." };
  if (!pinsMatch(kid, pin)) return { file, error: "Pin does not match." };
  const name = normalizeAlias(alias);
  if (!aliasAllowed(name)) return { file, error: "Pick a different name." };
  const clash = file.students.some((s) => s.id !== kid.id && s.first.trim().toLowerCase() === name.toLowerCase());
  if (clash) return { file, error: "Someone already has that name." };
  return { file: setAlias({ ...file, students: file.students.map((s) => (s.id === kid.id ? { ...s, lastSeen: new Date().toISOString() } : s)) }, kid.id, name), error: "" };
}

/** New pair. The shop code is the id, so it does not change. */
export function rerollWithPin(file: EconomyFile, shop: string, pin: string): { file: EconomyFile; error: string } {
  const kid = findByShop(file.students, shop);
  if (!kid) return { file, error: "That code is not on the list." };
  if (!pinSet(kid)) return { file, error: "Set a pin first." };
  if (!pinsMatch(kid, pin)) return { file, error: "Pin does not match." };
  return { file: rerollAlias(file, kid.id), error: "" };
}
