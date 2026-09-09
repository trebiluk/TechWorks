import type { EconomyFile } from "./economy.ts";
import { cloneFile } from "./clone.ts";

/** Workers off. Crews, bells, theme, projects stay. */
export function emptyRoster(file: EconomyFile): EconomyFile {
  const next = cloneFile(file);
  next.students = [];
  next.meta.ledger = [];
  next.meta.sessions = [];
  next.meta.clearedAt = new Date().toISOString();
  return next;
}

/** Newer savedAt wins. Never revive a bigger roster over a newer empty Day 0. */
export function pickDesk(local: EconomyFile, idb: EconomyFile | null): EconomyFile {
  if (!idb) return local;
  const lsT = Date.parse(local.meta.savedAt || local.meta.clearedAt || "") || 0;
  const idbT = Date.parse(idb.meta.savedAt || idb.meta.clearedAt || "") || 0;
  if (!lsT) {
    if (idbT || idb.students.length > local.students.length) return idb;
    return local;
  }
  if (idbT > lsT) return idb;
  return local;
}
