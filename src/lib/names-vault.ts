/** Legal names live on this device + codebook. Cloud, live, and the Google book do not. */

import type { EconomyFile, RawStudent } from "@/lib/economy";
import { vaultRowOf, type NamesVaultRow } from "@/lib/live";
import { isDemoStudentId } from "@/lib/demo";

export const NAMES_KEY = "techworks-names-vault-v1";

export type NamesVaultMap = Record<string, NamesVaultRow>;

export function namesVaultOf(file: EconomyFile): NamesVaultMap {
  const out: NamesVaultMap = {};
  for (const s of file.students) {
    if (isDemoStudentId(s.id) || !s.id) continue;
    const row = vaultRowOf(s);
    if (!row.last && !row.legalFirst && !row.iep && !row.plan504 && !row.ell && !row.dhh) continue;
    out[s.id] = row;
  }
  return out;
}

export function stripStudentNames(s: RawStudent): RawStudent {
  const flags = { ...(s.flags ?? {}) };
  delete flags.iep;
  delete flags.plan504;
  delete flags.ell;
  delete flags.dhh;
  const next: RawStudent = { ...s, last: "", legalFirst: undefined, legalLast: undefined };
  next.flags = Object.keys(flags).length ? flags : undefined;
  return next;
}

export function stripNames(file: EconomyFile): EconomyFile {
  return { ...file, students: file.students.map(stripStudentNames) };
}

export function mergeNames(file: EconomyFile, vault: NamesVaultMap): EconomyFile {
  if (!vault || !Object.keys(vault).length) return file;
  return {
    ...file,
    students: file.students.map((s) => {
      const row = vault[s.id];
      if (!row) return s;
      return {
        ...s,
        last: s.last || row.last || "",
        legalLast: s.legalLast || row.last || undefined,
        legalFirst: s.legalFirst || row.legalFirst || undefined,
        flags: {
          ...(s.flags ?? {}),
          iep: Boolean(s.flags?.iep || row.iep),
          plan504: Boolean(s.flags?.plan504 || row.plan504),
          ell: Boolean(s.flags?.ell || row.ell),
          dhh: Boolean(s.flags?.dhh || row.dhh),
        },
      };
    }),
  };
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

export function persistNamesVault(file: EconomyFile) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readNamesVault(), ...namesVaultOf(file) };
    window.localStorage.setItem(NAMES_KEY, JSON.stringify(next));
  } catch {
    /* quota — codebook/USB still holds names */
  }
}

export function hasLegalName(s: Pick<RawStudent, "legalFirst" | "legalLast" | "last">): boolean {
  return Boolean(String(s.legalLast || s.last || s.legalFirst || "").trim());
}
