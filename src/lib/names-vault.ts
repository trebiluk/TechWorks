/** Real names are not stored. Import seeds aliases, then the names are dropped. */

import type { EconomyFile, RawStudent } from "@/lib/economy";
import type { NamesVaultRow } from "@/lib/live";

export const NAMES_KEY = "techworks-names-vault-v1";

export type NamesVaultMap = Record<string, NamesVaultRow>;

export function namesVaultOf(_file: EconomyFile): NamesVaultMap {
  return {};
}

export function stripStudentNames(s: RawStudent): RawStudent {
  const flags = { ...(s.flags ?? {}) };
  delete flags.iep;
  delete flags.plan504;
  delete flags.ell;
  delete flags.dhh;
  delete flags.preferSeating;
  delete flags.extendedTime;
  const next: RawStudent = { ...s, last: "", legalFirst: undefined, legalLast: undefined, quietNotes: undefined };
  next.flags = Object.keys(flags).length ? flags : undefined;
  return next;
}

export function stripNames(file: EconomyFile): EconomyFile {
  return { ...file, students: file.students.map(stripStudentNames) };
}

export function mergeNames(file: EconomyFile, _vault?: NamesVaultMap): EconomyFile {
  return stripNames(file);
}

export function readNamesVault(): NamesVaultMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(NAMES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as NamesVaultMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function persistNamesVault(_file?: EconomyFile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(NAMES_KEY);
  } catch {
    /* */
  }
}

export function hasLegalName(s: Pick<RawStudent, "legalFirst" | "legalLast" | "last">): boolean {
  return Boolean(String(s.legalLast || s.last || s.legalFirst || "").trim());
}
