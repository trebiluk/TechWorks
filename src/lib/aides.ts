import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";

export type Aide = { id: string; period: number; name: string };

export function aidesOf(file: EconomyFile, period?: number | null): Aide[] {
  const rows = file.meta.config?.aides ?? [];
  if (period == null) return rows;
  return rows.filter((a) => a.period === period);
}

export function addAide(file: EconomyFile, period: number, name: string): EconomyFile {
  const clean = name.trim().slice(0, 24);
  if (!clean || period < 0) return file;
  const next = cloneFile(file);
  const rows = [...(next.meta.config?.aides ?? [])];
  if (rows.some((a) => a.period === period && a.name.toLowerCase() === clean.toLowerCase())) return file;
  rows.push({ id: `aide-${period}-${rows.length}-${clean.toLowerCase().replace(/\s+/g, "-")}`, period, name: clean });
  next.meta.config = { ...(next.meta.config ?? {}), aides: rows };
  return next;
}

export function dropAide(file: EconomyFile, id: string): EconomyFile {
  const next = cloneFile(file);
  const rows = (next.meta.config?.aides ?? []).filter((a) => a.id !== id);
  next.meta.config = { ...(next.meta.config ?? {}), aides: rows };
  return next;
}
