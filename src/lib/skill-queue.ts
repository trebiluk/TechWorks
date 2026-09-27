import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { skillScore } from "@/lib/skills";
import { hourSkillsOf } from "@/lib/teach";

export type WatchWhy = "today" | "overdue";

export type WatchSkill = {
  id: string;
  why: WatchWhy;
  /** Last day this period planned the skill. */
  date: string;
};

/** This hour first, then skills this period planned earlier that someone still has no mark on. */
export function watchQueue(file: EconomyFile, period: number, date: string, kids: Pick<RawStudent, "skills">[]): WatchSkill[] {
  const today = hourSkillsOf(file, date, period);
  const out: WatchSkill[] = today.map((id) => ({ id, why: "today" as const, date }));
  const seen = new Set(today);
  const days = Object.keys(file.meta.config?.teachDays ?? {})
    .filter((d) => d < date)
    .sort()
    .reverse();
  for (const d of days) {
    const ids = hourSkillsOf(file, d, period);
    for (const id of ids) {
      if (seen.has(id)) continue;
      const open = kids.some((s) => skillScore(s as RawStudent, id) === 0);
      if (!open) continue;
      seen.add(id);
      out.push({ id, why: "overdue", date: d });
      if (out.length >= 8) return out;
    }
  }
  return out;
}

export function livePeriodKids(file: EconomyFile, period: number): RawStudent[] {
  return file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName));
}
