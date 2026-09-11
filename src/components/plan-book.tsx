import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import {
  activitiesOf,
  activitySpan,
  pinDayActivity,
  planHit,
  plannedShopDays,
  moveActivityTo,
  setActivitySpan,
  setUnitCycles,
  SPAN_DAYS,
  unitCells,
  type ShopProject,
} from "@/lib/projects";
import { formatSchoolDate, instructionalWeeks, isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { SortableItem, SortableList } from "@/components/sortable";
import { cn } from "@/lib/utils";

export function PlanBook({
  file,
  project,
  period,
  unlocked,
  onNeedPin,
  onChange,
}: {
  file: EconomyFile;
  project: ShopProject;
  period: number;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
}) {
  const today = todayIso();
  const [weekDate, setWeekDate] = useState(today);
  const [hold, setHold] = useState<string | null>(null);
  const week = weekOn(weekDate);
  const days = week?.days ?? [weekDate];
  const acts = activitiesOf(project);
  const seats = unitCells(project).length;
  const planned = plannedShopDays(project);
  const cycleLen = (project.cycleLen === 1 ? 1 : 2) as 1 | 2;
  const pins = file.meta.dayLog;

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
      const pin = pins?.[date]?.periodActivity?.[String(period)] ?? "";
      const pinnedAct = pin ? acts.find((a) => a.id === pin) : undefined;
      const activity = pinnedAct ?? hit.activity;
      const live = date === today;
      return {
        date,
        school: isSchoolDay(date),
        hit: pinnedAct ? { ...hit, activity: pinnedAct, pinned: true, day: 1, of: activitySpan(project, pinnedAct.id) } : hit,
        activity,
        live,
        pinned: Boolean(pinnedAct),
      };
    });
  }, [acts, days, period, pins, project, today]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-4" data-plan-book>
      <header className="space-y-2">
        <p className="text-sm text-muted">
          {project.title}. Tap 1–4 days on an activity. Drag to reorder. Tap an activity, then a day, to park just that class.
        </p>
      </header>

      <section className="tw-gadget p-3">
        <div className="flex flex-wrap items-center gap-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">This week</p>
          <button type="button" onClick={() => goWeek(-1)} className="tw-tap ml-auto grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Previous week">
            ‹
          </button>
          <button type="button" onClick={() => setWeekDate(today)} className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", weekDate === today || days.includes(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
            Today
          </button>
          <button type="button" onClick={() => goWeek(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Next week">
            ›
          </button>
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {cells.map((c) => {
            const onHold = hold && c.activity?.id === hold;
            const label = c.activity?.name ?? "—";
            const span = c.hit.of > 1 && !c.pinned ? `Day ${c.hit.day} of ${c.hit.of}` : c.pinned ? "Parked" : c.hit.slot;
            return (
              <button
                key={c.date}
                type="button"
                onClick={() => {
                  if (!gate()) return;
                  if (!c.school) return;
                  if (hold) {
                    const already = c.pinned && c.activity?.id === hold;
                    onChange(pinDayActivity(file, c.date, period, already ? "" : hold));
                    return;
                  }
                  if (c.activity) setHold(c.activity.id);
                }}
                className={cn(
                  "tw-tap flex min-h-[7.5rem] min-w-[7.25rem] flex-1 flex-col rounded-xl p-2 text-left",
                  c.live ? "bg-accent text-accent-fg" : c.pinned ? "bg-gold/15 ring-1 ring-gold" : "bg-elevated",
                  onHold && !c.live ? "ring-1 ring-accent" : "",
                  !c.school ? "opacity-50" : "",
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{formatSchoolDate(c.date)}</span>
                <span className="mt-1 font-display text-base font-semibold leading-tight">{label}</span>
                <span className="mt-auto text-[11px] font-medium opacity-80">{span}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Sequence</p>
          <span className={cn("text-xs font-semibold", planned > seats ? "text-loss" : "text-muted")}>
            {planned} / {seats} shop days
          </span>
          <span className="ml-auto flex gap-1">
            {([1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => gate() && onChange(setUnitCycles(file, project.id, n))}
                className={cn("tw-tap min-h-10 rounded-md px-3 text-xs font-semibold", cycleLen === n ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                {n === 1 ? "1 cycle · 4 days" : "2 cycles · 8 days"}
              </button>
            ))}
          </span>
        </div>
        {planned > seats ? (
          <p className="text-sm text-loss">This sequence is longer than the unit. Shorten an activity, or give the unit 2 cycles.</p>
        ) : null}
        <SortableList
          enabled={unlocked}
          freeze={false}
          className="grid gap-1.5"
          onMove={(grab, onto) => gate() && onChange(moveActivityTo(file, project.id, grab, onto))}
        >
          {acts.map((a) => {
            const span = activitySpan(project, a.id);
            const on = hold === a.id;
            return (
              <SortableItem key={a.id} id={a.id} label={a.name}>
                <article className={cn("tw-gadget flex flex-col gap-2 p-3 sm:flex-row sm:items-center", unlocked ? "pl-12" : "", on ? "ring-1 ring-accent" : "")}>
                  <button type="button" onClick={() => setHold(on ? null : a.id)} className="min-w-0 flex-1 text-left">
                    <p className="font-display text-lg font-semibold leading-tight">{a.name}</p>
                    <p className="text-xs text-muted">{span === 1 ? "1 day" : `${span} days`}{a.today ? ` · ${a.today}` : ""}</p>
                  </button>
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
        <p className="text-xs text-muted">
          {hold ? `Parking ${acts.find((a) => a.id === hold)?.name ?? "this"} — tap a day, or tap the name again to cancel.` : "Unlock, then tap a name to park it on one class without rewriting the unit."}
        </p>
      </section>
    </div>
  );
}
