import type { EconomyFile } from "@/lib/economy";
import { bellFor, periodTitle, shopBells } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay } from "@/lib/calendar";
import {
  activitiesOf,
  gradeOfPeriod,
  pinnedActivityId,
  proveOf,
  slotsOf,
  type ProjectActivity,
} from "@/lib/projects";
import { packOf, teachJob, teachObjective } from "@/lib/teach";
import { skillTrackOf } from "@/lib/skills";
import { MST_SKILLS, MST_STANDARD } from "@/lib/mst";

export type LessonDay = {
  date: string;
  label: string;
  activity: string;
  ask: string;
  do: string;
  done: string;
  prove: "skill" | "done" | "both" | "";
  skillId: string;
  skillName: string;
  mst: string[];
  objective: string;
  pack: string;
  lookFor: string;
};

export type LessonMatrixRow = {
  skillId: string;
  skillName: string;
  does: string;
  mst: string[];
  mstTitles: string[];
  days: boolean[];
};

export type LessonPlan = {
  course: string;
  period: number;
  grade: number;
  dates: string[];
  range: string;
  project: string;
  ask: string;
  rules: string[];
  pack: string;
  days: LessonDay[];
  matrix: LessonMatrixRow[];
  standard: string;
};

export function lessonPlanOf(file: EconomyFile, period: number, dates: string[]): LessonPlan {
  const school = dates.filter((d) => isSchoolDay(d));
  const bells = shopBells(file);
  const grade = gradeOfPeriod(file, period);
  const project = slotsOf(file, period, school[0])[0];
  const acts = project ? activitiesOf(project) : [];
  const first = school[0] ? teachJob(file, period, school[0]) : null;
  const days: LessonDay[] = school.map((date) => {
    const pin = pinnedActivityId(file, period, date);
    const act: ProjectActivity | undefined = pin ? acts.find((a) => a.id === pin) : undefined;
    const job = teachJob(file, period, date);
    const track = skillTrackOf(act?.skillId || job.skillId);
    const mst = track?.mst ?? [];
    return {
      date,
      label: formatSchoolDate(date),
      activity: act?.name || job.title || "",
      ask: job.question,
      do: job.today || act?.today || "",
      done: act?.done || job.done || "",
      prove: act ? proveOf(act) : "",
      skillId: act?.skillId || job.skillId || "",
      skillName: track?.name || "",
      mst,
      objective: teachObjective(file, date, period),
      pack: packOf(file, date, period).label,
      lookFor: act?.lookFor || job.lookFor || "",
    };
  });
  const skillIds = [...new Set(days.map((d) => d.skillId).filter(Boolean))];
  const matrix: LessonMatrixRow[] = skillIds.map((id) => {
    const track = skillTrackOf(id);
    const mst = track?.mst ?? [];
    return {
      skillId: id,
      skillName: track?.name || id,
      does: track?.does || "",
      mst,
      mstTitles: mst.map((code) => MST_SKILLS.find((s) => s.id === code)?.short || code),
      days: days.map((d) => d.skillId === id),
    };
  });
  const sec = file.meta.sections?.find((s) => s.period === period);
  return {
    course: sec?.course || periodTitle(period, bells.length ? bells : bellFor(file)),
    period,
    grade,
    dates: school,
    range: school.length ? `${formatSchoolDate(school[0])} – ${formatSchoolDate(school[school.length - 1])}` : "",
    project: project?.title || first?.title || "",
    ask: first?.question || project?.prompt || "",
    rules: first?.rules?.length ? first.rules : project?.constraints ?? [],
    pack: days[0]?.pack || "",
    days,
    matrix,
    standard: MST_STANDARD,
  };
}
