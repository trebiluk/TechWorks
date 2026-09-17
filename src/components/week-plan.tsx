import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, instructionalWeeks, isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { activitiesOf, pinDayActivity, slotsOf } from "@/lib/projects";
import {
  TEACH_PACKS,
  dropTeachDay,
  setTeachClose,
  setTeachHomework,
  setTeachMaterials,
  setTeachMods,
  setTeachNotes,
  setTeachPack,
  setTeachReflect,
} from "@/lib/teach";
import { saveTeachAsk, saveTeachDo, saveTeachObjective } from "@/lib/plan-sync";
import {
  planWeek,
  weekFillCount,
  type PlanCell,
} from "@/lib/planbook";
import { DraftField } from "@/components/draft-field";
import { LessonPlanSheet } from "@/components/lesson-plan-sheet";
import { SendHour } from "@/components/send-hour";
import { cn } from "@/lib/utils";

export function WeekPlan({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onTeach,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onTeach?: (date: string, period: number) => void;
}) {
  const today = todayIso();
  const [weekDate, setWeekDate] = useState(today);
  const [open, setOpen] = useState<{ date: string; period: number } | null>(null);
  const [printOn, setPrintOn] = useState(false);
  const [notice, setNotice] = useState("");
  const week = weekOn(weekDate);
  const days = week?.days ?? [weekDate];
  const grid = useMemo(() => planWeek(file, days, today), [file, days, today]);
  const fill = weekFillCount(file, days);
  const bells = shopBells(file);
  const cell = open ? grid.flat().find((c) => c.date === open.date && c.period === open.period) : undefined;

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function goWeek(dir: -1 | 1) {
    const weeks = instructionalWeeks();
    const i = weeks.findIndex((w) => w.start === week?.start);
    const next = i >= 0 ? weeks[i + dir] : null;
    if (next?.days[0]) {
      setWeekDate(next.days[0]);
      setOpen(null);
    }
  }

  function note(msg: string) {
    setNotice(msg);
  }

  function edit(next: EconomyFile) {
    if (!gate()) return;
    onChange(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-8" data-week-plan>
      {printOn ? <LessonPlanSheet file={file} period={cell?.period ?? bells[0]?.period ?? 1} dates={days} onClose={() => setPrintOn(false)} /> : null}
      <header className="space-y-1">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Plan book</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">This week</h1>
          </div>
          <p className="text-sm text-muted">
            {fill.set} of {fill.total} hours set. Type the job. Send one hour at a time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => goWeek(-1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Previous week">
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              setWeekDate(today);
              setOpen(null);
            }}
            className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", days.includes(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          >
            Today
          </button>
          <button type="button" onClick={() => goWeek(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Next week">
            ›
          </button>
          <span className="px-2 text-sm font-semibold">
            {days[0] ? formatSchoolDate(days[0]) : ""}
            {days.length > 1 ? ` – ${formatSchoolDate(days[days.length - 1]!)}` : ""}
          </span>
          <button type="button" onClick={() => setPrintOn(true)} className="tw-tap ml-auto min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold">
            Print week
          </button>
        </div>
        {notice ? <p className="text-sm font-semibold text-gain">{notice}</p> : null}
      </header>

      <div className="overflow-x-auto pb-1">
        <div className="tw-plan-grid min-w-[44rem]" style={{ ["--days" as string]: String(days.length) }}>
          <div className="tw-plan-head sticky left-0 z-10 bg-bg">Hour</div>
          {days.map((d) => (
            <div key={d} className={cn("tw-plan-head text-center", d === today ? "text-gold" : "")}>
              {formatSchoolDate(d).replace(/,.*/, "")}
              {!isSchoolDay(d) ? <span className="mt-0.5 block text-[10px] font-medium text-loss">No school</span> : null}
            </div>
          ))}
          {grid.map((row) =>
            row.length ? (
              <PeriodRow
                key={row[0]!.period}
                row={row}
                open={open}
                onOpen={(c) => setOpen({ date: c.date, period: c.period })}
              />
            ) : null,
          )}
        </div>
      </div>

      {cell?.school ? (
        <HourEditor
          file={file}
          cell={cell}
          unlocked={unlocked}
          days={days}
          onEdit={edit}
          onTeach={onTeach}
          onClear={() => {
            if (!gate()) return;
            let next = dropTeachDay(file, cell.date, cell.period);
            next = pinDayActivity(next, cell.date, cell.period, "");
            onChange(next);
          }}
          onNote={note}
        />
      ) : null}
    </div>
  );
}

function PeriodRow({
  row,
  open,
  onOpen,
}: {
  row: PlanCell[];
  open: { date: string; period: number } | null;
  onOpen: (c: PlanCell) => void;
}) {
  const head = row[0]!;
  return (
    <>
      <div className="tw-plan-period sticky left-0 z-10">
        <p className="font-display text-lg font-semibold leading-none">P{head.period}</p>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">G{head.grade}</p>
      </div>
      {row.map((c) => {
        const on = open?.date === c.date && open.period === c.period;
        return (
          <button
            key={`${c.date}-${c.period}`}
            type="button"
            onClick={() => onOpen(c)}
            className={cn(
              "tw-tap tw-plan-cell",
              on ? "bg-accent text-accent-fg" : c.live ? "bg-gold/15 ring-1 ring-gold" : "bg-elevated",
              !c.school ? "opacity-40" : "",
            )}
          >
            <span className="font-display text-sm font-semibold leading-tight">{c.title || (c.school ? "Tap to set" : "—")}</span>
            <span className="mt-auto text-[10px] font-bold uppercase tracking-wide opacity-80">
              {c.set ? c.packLabel : c.school ? "Unset" : ""}
            </span>
          </button>
        );
      })}
    </>
  );
}

function HourEditor({
  file,
  cell,
  unlocked,
  days,
  onEdit,
  onTeach,
  onClear,
  onNote,
}: {
  file: EconomyFile;
  cell: PlanCell;
  unlocked: boolean;
  days: string[];
  onEdit: (next: EconomyFile) => void;
  onTeach?: (date: string, period: number) => void;
  onClear: () => void;
  onNote: (msg: string) => void;
}) {
  const project = slotsOf(file, cell.period, cell.date)[0];
  const acts = project ? activitiesOf(project) : [];
  const d = cell.date;
  const p = cell.period;

  return (
    <section className="tw-gadget space-y-3 p-3" data-plan-hour>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">
          P{p} · G{cell.grade} · {formatSchoolDate(d)}
        </p>
        {onTeach ? (
          <button type="button" onClick={() => onTeach(d, p)} className="tw-tap min-h-9 rounded-xl bg-gold px-3 text-xs font-semibold text-bg">
            Teach this hour
          </button>
        ) : null}
        {cell.set ? (
          <button type="button" onClick={onClear} className="ml-auto text-xs font-semibold text-muted">
            Clear hour
          </button>
        ) : null}
      </div>

      {acts.length ? (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Activity</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {acts.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onEdit(pinDayActivity(file, d, p, cell.activityId === a.id ? "" : a.id))}
                className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cell.activityId === a.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                {a.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No unit on this period yet. Type Ask / Do — it parks a unit. Or Learn → Projects to park one.</p>
      )}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Hour shape</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {TEACH_PACKS.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onEdit(setTeachPack(file, d, p, pack.id))}
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cell.pack === pack.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
              title={pack.hint}
            >
              {pack.label}
            </button>
          ))}
        </div>
      </div>

      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Objective · SWBAT</span>
        <DraftField
          value={cell.objective}
          editing={unlocked}
          onCommit={(v) => onEdit(saveTeachObjective(file, d, p, v))}
          placeholder="Students will be able to…"
          className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Ask · do now</span>
          <DraftField
            value={cell.ask}
            editing={unlocked}
            multiline
            onCommit={(v) => onEdit(saveTeachAsk(file, d, p, v))}
            placeholder="Driving question"
            className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Do this now</span>
          <DraftField
            value={cell.do}
            editing={unlocked}
            multiline
            onCommit={(v) => onEdit(saveTeachDo(file, d, p, v))}
            placeholder="The job for this hour"
            className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Closure · exit</span>
          <DraftField
            value={cell.close}
            editing={unlocked}
            onCommit={(v) => onEdit(setTeachClose(file, d, p, v))}
            placeholder="How the hour ends"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Materials</span>
          <DraftField
            value={cell.materials}
            editing={unlocked}
            onCommit={(v) => onEdit(setTeachMaterials(file, d, p, v))}
            placeholder="Goggles · rulers · stock"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Homework</span>
          <DraftField
            value={cell.homework}
            editing={unlocked}
            onCommit={(v) => onEdit(setTeachHomework(file, d, p, v))}
            placeholder="Usually none"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Mods · no names</span>
          <DraftField
            value={cell.mods}
            editing={unlocked}
            onCommit={(v) => onEdit(setTeachMods(file, d, p, v))}
            placeholder="Extended time · demo first"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Teacher notes</span>
          <DraftField
            value={cell.notes}
            editing={unlocked}
            multiline
            onCommit={(v) => onEdit(setTeachNotes(file, d, p, v))}
            placeholder="Before class"
            className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Reflection</span>
          <DraftField
            value={cell.reflect}
            editing={unlocked}
            multiline
            onCommit={(v) => onEdit(setTeachReflect(file, d, p, v))}
            placeholder="After class. What to change."
            className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
        </label>
      </div>

      <SendHour
        file={file}
        date={d}
        period={p}
        unlocked={unlocked}
        days={days}
        onSend={(next, msg) => {
          onEdit(next);
          onNote(msg);
        }}
      />
    </section>
  );
}
