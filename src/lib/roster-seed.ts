import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { SCHOOLTOOL_SECTIONS } from "@/data/schooltool-sections";
import { addTypedStudent } from "@/lib/store";
import { dealCrews } from "@/lib/crew-desk";
import { isPairAlias, generateAlias } from "@/lib/alias-bank";

export const SHOP_SEATS = 18;
export const HALL_SEATS = 22;

const Q1_SHOP = SCHOOLTOOL_SECTIONS.filter((s) => s.sem === "Q1" && s.course.startsWith("TECH"));

function liveIn(file: EconomyFile, period: number): number {
  return file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName)).length;
}

/** Empty Quarter 1 shop sections get 18 seats. Empty study hall gets 22, here on A and B. A section that already has students is left alone. */
export function fillQuarterOne(file: EconomyFile): EconomyFile {
  let next = file;
  for (const section of Q1_SHOP) {
    if (liveIn(next, section.period) > 0) continue;
    const grade = Number(section.course.replace(/\D/g, "")) || 6;
    for (let i = 0; i < SHOP_SEATS; i++) {
      next = addTypedStudent(next, {
        period: section.period,
        grade,
        section: section.section,
        course: section.course,
        sem: "Q1",
      });
    }
    next = dealCrews(next, section.period);
  }
  if (liveIn(next, 6) === 0) {
    for (let i = 0; i < HALL_SEATS; i++) {
      next = addTypedStudent(next, {
        period: 6,
        section: 10,
        course: "STUDY HALL",
        sem: "YEAR",
        crewKey: "Hall",
      });
    }
  }
  return next;
}

/** One pass. Unclaimed one-word names become a pair. A pin means they already chose, so that name stays. The id, and so the code, stays. */
export function neutralizeOpenNames(file: EconomyFile): EconomyFile {
  if (file.meta.config?.aliasStyle === "pair-v1") return file;
  const used: string[] = [];
  const students = file.students.map((s) => {
    if (s.pinHash || isPairAlias(s.first)) {
      used.push(s.first);
      return s;
    }
    const alias = generateAlias(`${s.id}|pair`, used);
    used.push(alias);
    return { ...s, first: alias };
  });
  return {
    ...file,
    students,
    meta: {
      ...file.meta,
      config: { ...file.meta.config, aliasStyle: "pair-v1" },
    },
  };
}
