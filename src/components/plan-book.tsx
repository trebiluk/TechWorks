import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { periodTitle, shopBells } from "@/lib/economy";
import {
  activitiesOf,
  activitySpan,
  crewsForPeriod,
  pinCrewActivity,
  pinDayActivity,
  pinnedActivityId,
  planHit,
  proveOf,
  patchActivity,
  moveActivityTo,
  setActivitySpan,
  SPAN_DAYS,
  type ShopProject,
} from "@/lib/projects";
import { formatSchoolDate, instructionalWeeks, isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { SortableItem, SortableList } from "@/components/sortable";
import { cn } from "@/lib/utils";

const PROVE = [
  { id: "skill", label: "Skill" },
  { id: "done", label: "Deliverable" },
  { id: "both", label: "Both" },
] as const;

export function PlanBook({
  file,
  project,
  period,
  unlocked,
  onNeedPin,
  onChange,
  onTeach,
}: {
  file: EconomyFile;
  project: ShopProject;
  period: number;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onTeach?: (date: string) => void;
}) {
  const today = todayIso();
  const [weekDate, setWeekDate] = useState(today);
  const [focus, setFocus] = useState<string | null>(null);
  const week = weekOn(weekDate);
  const days = week?.days ?? [weekDate];
  const acts = activitiesOf(project);
  const crews = crewsForPeriod(file, period);
  const bells = shopBells(file);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function goWeek(dir: -1 | 1) {
    const weeks = instructionalWeeks();
    const i = weeks.findIndex((w) => w.start === week?.start);
    const next = i >= 0 ? weeks[i + dir] : null;
    if (next?.days[0]) setWeekDate(next.days[0]);
  }

  const cells = useMemo(() => {
    return days.map((date) => {
      const hit = planHit(project, date);
      const pin = pinnedActivityId(file, period, date);
      const pinnedAct = pin ? acts.find((a) => a.id === pin) : undefined;
      const activity = pinnedAct ?? hit.activity;
      return {
        date,
        school: isSchoolDay(date),
        live: date === today,
        activity,
        pinned: Boolean(pinnedAct),
        prove: proveOf(pinnedAct ?? activity),
      };
    });
  }, [acts, days, file, period, project, today]);

  const schoolCells = cells.filter((c) => c.school);
  const setN = schoolCells.filter((c) => c.activity).length;
  const nextUnset = schoolCells.find((c) => !c.activity)?.date ?? schoolCells.find((c) => c.live)?.date ?? schoolCells[0]?.date;
  const open = focus ?? nextUnset ?? today;
  const openCell = cells.find((c) => c.date === open);

  function park(date: string, activityId: string, crewKey?: string) {
    if (!gate()) return;
    if (crewKey) onChange(pinCrewActivity(file, date, period, crewKey, activityId));
    else onChange(pinDayActivity(file, date, period, activityId));
  }

  function copyFrom(from: string, to: string) {
    if (!gate()) return;
    const id = pinnedActivityId(file, period, from) || cells.find((c) => c.date === from)?.activity?.id;
    if (!id) return;
    onChange(pinDayActivity(file, to, period, id));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-8" data-plan-book>
      <header className="space-y-1">
        <p className="text-sm text-muted">
          Fill {periodTitle(period, bells)}. Tap a day, pick the task, then say if you score the skill, the deliverable, or both. Crews can differ.
        </p>
        <p className="text-sm font-semibold">
          {setN} of {schoolCells.length} days set
          {nextUnset && setN < schoolCells.length ? <span className="ml-2 font-normal text-gold">Next: {formatSchoolDate(nextUnset)}</span> : null}
        </p>
      </header>

      <section className="tw-gadget p-3">
        <div className="flex flex-wrap items-center gap-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">This week</p>
          <button type="button" onClick={() => goWeek(-1)} className="tw-tap ml-auto grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Previous week">
            ‹
          </button>
          <button type="button" onClick={() => setWeekDate(today)} className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", days.includes(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
            Today
          </button>
          <button type="button" onClick={() => goWeek(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Next week">
            ›
          </button>
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {cells.map((c) => {
            const on = c.date === open;
            return (
              <button
                key={c.date}
                type="button"
                onClick={() => setFocus(c.date)}
                className={cn(
                  "tw-tap flex min-h-[7.5rem] min-w-[7.25rem] flex-1 flex-col rounded-xl p-2 text-left",
                  on ? "bg-accent text-accent-fg" : c.live ? "bg-gold/15 ring-1 ring-gold" : "bg-elevated",
                  !c.school ? "opacity-50" : "",
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{formatSchoolDate(c.date)}</span>
                <span className="mt-1 font-display text-base font-semibold leading-tight">{c.activity?.name ?? (c.school ? "Tap to set" : "—")}</span>
                <span className="mt-auto text-[11px] font-medium opacity-80">
                  {c.activity ? (c.prove === "skill" ? "Skill" : c.prove === "done" ? "Deliverable" : "Skill + done") : c.school ? "Unset" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {openCell?.school ? (
        <section className="tw-gadget space-y-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">This class · {formatSchoolDate(open)}</p>
            {onTeach ? (
              <button type="button" onClick={() => onTeach(open)} className="tw-tap min-h-9 rounded-xl bg-gold px-3 text-xs font-semibold text-bg">
                Teach this day
              </button>
            ) : null}
            {openCell.activity ? (
              <button type="button" onClick={() => park(open, "")} className="ml-auto text-xs font-semibold text-muted">
                Clear day
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-1">
            {acts.map((a) => {
              const on = openCell.activity?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => park(open, on ? "" : a.id)}
                  className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", on ? "bg-fg text-bg" : "bg-elevated text-muted")}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
          {openCell.activity ? (
            <>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Score</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {PROVE.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => gate() && onChange(patchActivity(file, project.id, openCell.activity!.id, { prove: p.id }))}
                      className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", proveOf(openCell.activity) === p.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {proveOf(openCell.activity) === "skill"
                    ? "Watch the skill 1–4."
                    : proveOf(openCell.activity) === "done"
                      ? "The piece or proof is done or not."
                      : "Mark the skill and whether the work exists."}
                </p>
              </div>
              {crews.length ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Crews · same as class unless you tap</p>
                  <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                    {crews.map((crew) => {
                      const crewId = pinnedActivityId(file, period, open, crew.key);
                      const classId = pinnedActivityId(file, period, open) || openCell.activity?.id;
                      const own = crewId && crewId !== classId;
                      const name = acts.find((a) => a.id === (crewId || classId))?.name ?? "—";
                      return (
                        <li key={crew.key} className="flex flex-wrap items-center gap-1 rounded-xl bg-elevated px-2 py-2">
                          <span className="min-w-[6rem] font-semibold">{crew.name}</span>
                          <span className="text-xs text-muted">{own ? name : "Same"}</span>
                          <span className="ml-auto flex flex-wrap gap-1">
                            {acts.map((a) => (
                              <button
                                key={a.id}
                                type="button"
                                onClick={() => park(open, crewId === a.id ? "" : a.id, crew.key)}
                                className={cn("tw-tap min-h-9 rounded-md px-2 text-[11px] font-semibold", crewId === a.id ? "bg-accent text-accent-fg" : "bg-bg text-muted")}
                              >
                                {a.name.split(" ")[0]}
                              </button>
                            ))}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-wrap gap-1">
              {cells
                .filter((c) => c.school && c.date !== open && c.activity)
                .slice(0, 1)
                .map((c) => (
                  <button
                    key={c.date}
                    type="button"
                    onClick={() => copyFrom(c.date, open)}
                    className="tw-tap min-h-11 rounded-xl bg-gold px-3 text-sm font-semibold text-bg"
                  >
                    Same as {formatSchoolDate(c.date)}
                  </button>
                ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Tasks · drag to order · 1–5 days each</p>
        <SortableList
          enabled={unlocked}
          freeze={false}
          className="grid gap-1.5"
          onMove={(grab, onto) => gate() && onChange(moveActivityTo(file, project.id, grab, onto))}
        >
          {acts.map((a) => {
            const span = activitySpan(project, a.id);
            return (
              <SortableItem key={a.id} id={a.id} label={a.name}>
                <article className={cn("tw-gadget flex flex-col gap-2 p-3 sm:flex-row sm:items-center", unlocked ? "pl-12" : "")}>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-semibold leading-tight">{a.name}</p>
                    <p className="text-xs text-muted">
                      {span === 1 ? "1 day" : `${span} days`}
                      {a.today ? ` · ${a.today}` : ""}
                      {" · "}
                      {proveOf(a) === "skill" ? "skill" : proveOf(a) === "done" ? "deliverable" : "skill + done"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {SPAN_DAYS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => gate() && onChange(setActivitySpan(file, project.id, a.id, n))}
                        className={cn(
                          "tw-tap grid size-11 place-items-center rounded-lg text-sm font-bold",
                          span === n ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                        )}
                        title={`${n} day${n === 1 ? "" : "s"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </article>
              </SortableItem>
            );
          })}
        </SortableList>
      </section>
    </div>
  );
}
