import type { EconomyFile } from "@/lib/economy";
import {
  activitiesOf,
  createActivityPlan,
  gradeOfPeriod,
  patchActivity,
  pinnedActivityId,
  projectsOf,
  slotsOf,
  upsertProject,
} from "@/lib/projects";
import { setTeachAsk, setTeachDo, setTeachObjective, teachDay } from "@/lib/teach";

/** Teach blur → same unit/activity the Plan book shows. */
export function upsertPlanFromTeach(file: EconomyFile, date: string, period: number): EconomyFile {
  const day = teachDay(file, date, period);
  const ask = day.ask?.trim() ?? "";
  const doit = day.do?.trim() ?? "";
  const obj = day.objective?.trim() ?? "";
  if (!ask && !doit && !obj) return file;
  const parked = slotsOf(file, period, date)[0];
  const pin = pinnedActivityId(file, period, date);
  if (pin && parked) {
    let next = patchActivity(file, parked.id, pin, {
      today: doit || undefined,
      done: obj || undefined,
    });
    const p = projectsOf(next).find((x) => x.id === parked.id);
    if (p && ask && p.prompt !== ask) next = upsertProject(next, { ...p, prompt: ask });
    return next;
  }
  return createActivityPlan(file, {
    name: doit.slice(0, 42) || ask.slice(0, 42) || "This class",
    belong: "project",
    period,
    grades: [gradeOfPeriod(file, period)],
    dates: [date],
    ask: ask || undefined,
    do: doit || undefined,
    done: obj || undefined,
    projectId: parked?.id,
  }).file;
}

export function hydrateWeekFromTeach(file: EconomyFile, period: number, dates: string[]): EconomyFile {
  let next = file;
  for (const date of dates) {
    const day = teachDay(next, date, period);
    if (!day.ask && !day.do && !day.objective) continue;
    next = upsertPlanFromTeach(next, date, period);
  }
  return next;
}

export function periodUnits(file: EconomyFile, period: number) {
  return slotsOf(file, period).map((p) => ({
    id: p.id,
    title: p.title,
    prompt: p.prompt ?? "",
    acts: activitiesOf(p).map((a) => ({ id: a.id, name: a.name, today: a.today ?? "" })),
  }));
}

export function saveTeachAsk(file: EconomyFile, date: string, period: number, ask: string): EconomyFile {
  return upsertPlanFromTeach(setTeachAsk(file, date, period, ask), date, period);
}

export function saveTeachDo(file: EconomyFile, date: string, period: number, line: string): EconomyFile {
  return upsertPlanFromTeach(setTeachDo(file, date, period, line), date, period);
}

export function saveTeachObjective(file: EconomyFile, date: string, period: number, objective: string): EconomyFile {
  return upsertPlanFromTeach(setTeachObjective(file, date, period, objective), date, period);
}
