import type { EconomyFile } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { createActivityPlan, gradeOfPeriod, pinDayActivity } from "@/lib/projects";
import { hourAgenda, hourKit, saveAgendaLine, type AgendaCard } from "@/lib/hour-flow";
import { planCell, planitUnitName, type PlanCell } from "@/lib/planbook";
import { saveTeachAsk, saveTeachDo, saveTeachObjective } from "@/lib/plan-sync";
import { setTeachMove } from "@/lib/teach";

/** ITEEA design process + shop-real extras. A tag on the hour — never the hour's name. */
export const PLANIT_MOVES = [
  { id: "ask", label: "Ask", hint: "Name the problem" },
  { id: "imagine", label: "Imagine", hint: "Sketch ideas" },
  { id: "plan", label: "Plan", hint: "Choose one" },
  { id: "create", label: "Create", hint: "Make it" },
  { id: "improve", label: "Improve", hint: "Test and fix" },
  { id: "share", label: "Share", hint: "Show the work" },
  { id: "safety", label: "Safety", hint: "PPE or a new tool" },
] as const;

export type PlanitMoveId = (typeof PLANIT_MOVES)[number]["id"];

export { planitUnitName };

export function planitMoveOf(id: string) {
  return PLANIT_MOVES.find((m) => m.id === id);
}

export function weekdayShort(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
}

export type PlanitStripDay = {
  date: string;
  dow: string;
  label: string;
  title: string;
  live: boolean;
  set: boolean;
};

export function planitWeekStrip(
  file: EconomyFile,
  period: number,
  dates: string[],
  today = todayIso(),
): PlanitStripDay[] {
  return dates
    .filter((d) => isSchoolDay(d))
    .map((date) => {
      const cell = planCell(file, date, period, today);
      return {
        date,
        dow: weekdayShort(date),
        label: formatSchoolDate(date).replace(/,.*/, ""),
        title: cell.do || cell.title,
        live: cell.live,
        set: cell.set,
      };
    });
}

export function planitStripHasWork(days: PlanitStripDay[]): boolean {
  return days.some((d) => d.set && d.title.trim());
}

export function planitLiveWeek(file: EconomyFile, period: number, iso = todayIso(), today = iso): PlanitStripDay[] {
  const days = weekOn(iso)?.days ?? [iso];
  return planitWeekStrip(file, period, days, today);
}

export type PlanitPreview = {
  title: string;
  question: string;
  need: string;
  cards: { n: string; kicker: string; body: string }[];
};

export function planitPreview(file: EconomyFile, date: string, period: number): PlanitPreview {
  const cell = planCell(file, date, period);
  const cards = hourAgenda(file, date, period).map((c) => ({ n: c.n, kicker: c.kicker, body: c.body }));
  return {
    title: cell.do || cell.title,
    question: cell.ask,
    need: hourKit(file, date, period),
    cards,
  };
}

export function setPlanitTitle(file: EconomyFile, date: string, period: number, title: string): EconomyFile {
  return saveTeachDo(file, date, period, title);
}

export function setPlanitJob(file: EconomyFile, date: string, period: number, job: string): EconomyFile {
  return setPlanitTitle(file, date, period, job);
}

export function setPlanitQuestion(file: EconomyFile, date: string, period: number, question: string): EconomyFile {
  return saveTeachAsk(file, date, period, question);
}

export function setPlanitProve(file: EconomyFile, date: string, period: number, prove: string): EconomyFile {
  return saveTeachObjective(file, date, period, prove);
}

export function setPlanitBeat(
  file: EconomyFile,
  date: string,
  period: number,
  id: AgendaCard["id"],
  line: string,
): EconomyFile {
  return saveAgendaLine(file, date, period, id, line);
}

export type PlanitHourWrite = {
  job?: string;
  ask?: string;
  prove?: string;
  beats?: Partial<Record<AgendaCard["id"], string>>;
};

/** One PlanIt hour write. TEACH + Deck read this same teachDays row. */
export function writePlanitHour(
  file: EconomyFile,
  date: string,
  period: number,
  hour: PlanitHourWrite,
): EconomyFile {
  let next = file;
  if (hour.job != null) next = setPlanitJob(next, date, period, hour.job);
  if (hour.ask != null) next = setPlanitQuestion(next, date, period, hour.ask);
  if (hour.prove != null) next = setPlanitProve(next, date, period, hour.prove);
  if (hour.beats) {
    for (const id of ["now", "goal", "next", "behave"] as const) {
      const line = hour.beats[id];
      if (line != null) next = setPlanitBeat(next, date, period, id, line);
    }
  }
  return next;
}

export function setPlanitMove(file: EconomyFile, date: string, period: number, move: string): EconomyFile {
  const cur = planCell(file, date, period).move;
  return setTeachMove(file, date, period, cur === move ? "" : move);
}

export function parkPlanitUnit(file: EconomyFile, date: string, period: number, activityId: string): EconomyFile {
  const cur = planCell(file, date, period).activityId;
  return pinDayActivity(file, date, period, cur === activityId ? "" : activityId);
}

export function newPlanitUnit(
  file: EconomyFile,
  opts: { date: string; period: number; name: string; question?: string; title?: string; projectId?: string },
): EconomyFile {
  const title = opts.title?.trim() || "";
  const question = opts.question?.trim() || "";
  const name = planitUnitName(opts.name || title, question);
  return createActivityPlan(file, {
    name,
    belong: "project",
    period: opts.period,
    grades: [gradeOfPeriod(file, opts.period)],
    dates: [opts.date],
    ask: question || undefined,
    do: title || undefined,
    projectId: opts.projectId,
  }).file;
}

export function planitCellMove(cell: PlanCell) {
  return planitMoveOf(cell.move);
}
