import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { SCHOOLTOOL_SECTIONS } from "@/data/schooltool-sections";
import { addTypedStudent } from "@/lib/store";
import { dealCrews } from "@/lib/crew-desk";
import { publicHandle } from "@/lib/live";
import { newStudentId } from "@/lib/ids";

export const SHOP_SEATS = 18;
export const HALL_SEATS = 22;

const Q1_SHOP = SCHOOLTOOL_SECTIONS.filter((s) => s.sem === "Q1" && s.course.startsWith("TECH"));

function liveIn(file: EconomyFile, period: number): number {
  return file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName)).length;
}

function uniqueHandle(file: EconomyFile, id: string): string {
  const taken = new Set(file.students.filter((s) => s.id !== id).map((s) => publicHandle(s.id)));
  let next = id;
  const used = new Set(file.students.map((s) => s.id));
  used.delete(id);
  let guard = 0;
  while (taken.has(publicHandle(next)) && guard < 12) {
    used.add(next);
    next = newStudentId(used);
    guard += 1;
  }
  return next;
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
      const kid = next.students[next.students.length - 1];
      if (!kid) continue;
      const id = uniqueHandle(next, kid.id);
      if (id !== kid.id) {
        next = {
          ...next,
          students: next.students.map((s) => (s.id === kid.id ? { ...s, id } : s)),
        };
      }
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
