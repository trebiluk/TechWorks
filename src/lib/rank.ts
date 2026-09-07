import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { LEVEL_MAX, skillXp, workerLevel } from "@/lib/skills";
import { crewPace } from "@/lib/projects";

/** Skill (level) is 1.5× wallet in public ranks. Stock is a separate game. */
export const SKILL_WEIGHT = 1.5;

export const SORT_KEYS = [
  { id: "combo", label: "Combo" },
  { id: "wallet", label: "Wallet" },
  { id: "level", label: "XP" },
  { id: "stock", label: "Stock" },
  { id: "name", label: "Name" },
  { id: "crew", label: "Crew" },
] as const;

export type SortKey = (typeof SORT_KEYS)[number]["id"];

export type RankedStudent = ScoredStudent & { level: number; xp: number; combo: number };

export function decorateRank<T extends ScoredStudent>(file: EconomyFile, list: T[]): (T & { level: number; xp: number; combo: number })[] {
  const maxWallet = Math.max(1, ...list.map((s) => Math.max(0, s.quarter)));
  const tax = new Map<string, number>();
  function taxOf(period: number, crew: string) {
    const k = `${period}|${crew}`;
    if (!tax.has(k)) {
      for (const r of crewPace(file, period)) tax.set(`${period}|${r.key}`, r.xpTax);
      if (!tax.has(k)) tax.set(k, 0);
    }
    return tax.get(k) ?? 0;
  }
  return list.map((s) => {
    const raw = skillXp(file, s.id);
    const xp = Math.max(0, raw - taxOf(s.period, s.crewKey));
    const level = workerLevel(file, s.id);
    const skill = level / LEVEL_MAX;
    const wallet = Math.max(0, s.quarter) / maxWallet;
    return { ...s, level, xp, combo: SKILL_WEIGHT * skill + wallet };
  });
}

export function applySort<T extends RankedStudent>(list: T[], key: SortKey): T[] {
  const rows = [...list];
  const byName = (a: T, b: T) => a.first.localeCompare(b.first);
  rows.sort((a, b) => {
    if (key === "combo") return b.combo - a.combo || byName(a, b);
    if (key === "wallet") return b.quarter - a.quarter || byName(a, b);
    if (key === "level") return b.xp - a.xp || b.level - a.level || byName(a, b);
    if (key === "stock") return b.stock - a.stock || byName(a, b);
    if (key === "crew") return a.crewName.localeCompare(b.crewName) || byName(a, b);
    return byName(a, b);
  });
  return rows;
}

export function sortCombo<T extends RankedStudent>(list: T[]): T[] {
  return applySort(list, "combo");
}

export function byCombo(file: EconomyFile, list: ScoredStudent[]): RankedStudent[] {
  return applySort(decorateRank(file, list), "combo");
}
