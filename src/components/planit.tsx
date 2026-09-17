import { useMemo, useState } from "react";
import { CalendarDays, PanelsTopLeft, Plus, Presentation } from "lucide-react";
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
  setTeachObjective,
  setTeachPack,
  setTeachReflect,
} from "@/lib/teach";
import {
  planWeek,
  weekFillCount,
  type PlanCell,
} from "@/lib/planbook";
import {
  PLANIT_MOVES,
  newPlanitUnit,
  parkPlanitUnit,
  planitMoveOf,
  planitPreview,
  setPlanitMove,
  setPlanitQuestion,
  setPlanitTitle,
} from "@/lib/planit";
import { DraftField } from "@/components/draft-field";
import { LessonPlanSheet } from "@/components/lesson-plan-sheet";
import { KitChip } from "@/components/agenda-wall";
import { SendHour } from "@/components/send-hour";
import { cn } from "@/lib/utils";

export function PlanIt({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onTeach,
  onWall,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onTeach?: (date: string, period: number) => void;
  onWall?: () => void;
}) {
  const today = todayIso();
  const [weekDate, setWeekDate] = useState(today);
  const [open, setOpen] = useState<{ date: string; period: number } | null>({ date: today, period: shopBells(file)[0]?.period ?? 1 });
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

  function edit(next: EconomyFile) {
    if (!gate()) return;
    onChange(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-8" data-planit>
      {printOn ? <LessonPlanSheet file={file} period={cell?.period ?? bells[0]?.period ?? 1} dates={days} onClose={() => setPrintOn(false)} /> : null}
      <header className="space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PlanIt</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight">This week</h1>
          </div>
          <p className="text-sm text-muted">
            {fill.set} of {fill.total} hours set. Type the job. Wall, Teach, and Deck play the same hour.
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
              setOpen({ date: today, period: open?.period ?? bells[0]?.period ?? 1 });
            }}
            className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", days.includes(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          >
            Today
          </button>
          <button type="button" onClick={() => goWeek(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" title="Next week">
            ›
          </button>
          <span className="inline-flex items-center gap-1.5 px-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-gold" aria-hidden />
            {days[0] ? formatSchoolDate(days[0]) : ""}
            {days.length > 1 ? ` – ${formatSchoolDate(days[days.length - 1]!)}` : ""}
          </span>
          <button type="button" onClick={() => setPrintOn(true)} className="tw-tap ml-auto min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold">
            Print week
          </button>
        </div>
        {notice ? <p className="text-sm font-semibold text-gain">{notice}</p> : null}
      </header>

      <div className="flex min-h-0 flex-col gap-3 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
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
          <div className="w-full shrink-0 lg:w-[22rem] lg:sticky lg:top-2">
          <HourDesk
            key={`${cell.date}-${cell.period}`}
            file={file}
            cell={cell}
            unlocked={unlocked}
            days={days}
            onEdit={edit}
            onTeach={onTeach}
            onWall={onWall}
            onClear={() => {
              if (!gate()) return;
              let next = dropTeachDay(file, cell.date, cell.period);
              next = pinDayActivity(next, cell.date, cell.period, "");
              onChange(next);
            }}
            onNote={setNotice}
          />
          </div>
        ) : (
          <section className="tw-gadget p-3">
            <p className="text-sm text-muted">Tap a school-day cell. Title is enough — everything else is optional.</p>
          </section>
        )}
      </div>
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
        const move = planitMoveOf(c.move);
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
            <span className="mt-auto flex flex-wrap items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-80">
              {move ? <span className="rounded-full bg-bg/40 px-1.5 py-0.5">{move.label}</span> : null}
              {c.set ? c.packLabel : c.school ? "Unset" : ""}
            </span>
          </button>
        );
      })}
    </>
  );
}

function HourDesk({
  file,
  cell,
  unlocked,
  days,
  onEdit,
  onTeach,
  onWall,
  onClear,
  onNote,
}: {
  file: EconomyFile;
  cell: PlanCell;
  unlocked: boolean;
  days: string[];
  onEdit: (next: EconomyFile) => void;
  onTeach?: (date: string, period: number) => void;
  onWall?: () => void;
  onClear: () => void;
  onNote: (note: string) => void;
}) {
  const project = slotsOf(file, cell.period, cell.date)[0];
  const acts = project ? activitiesOf(project) : [];
  const units = slotsOf(file, cell.period);
  const d = cell.date;
  const p = cell.period;
  const [more, setMore] = useState(false);
  const [newOn, setNewOn] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQ, setNewQ] = useState("");
  const preview = planitPreview(file, d, p);

  return (
    <section className="tw-gadget space-y-3 p-3" data-planit-hour>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">
          P{p} · G{cell.grade} · {formatSchoolDate(d)}
        </p>
        {onTeach ? (
          <button type="button" onClick={() => onTeach(d, p)} className="tw-tap inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-gold px-3 text-xs font-semibold text-bg">
            <Presentation className="size-3.5" aria-hidden />
            Teach this hour
          </button>
        ) : null}
        {onWall ? (
          <button type="button" onClick={onWall} className="tw-tap inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-elevated px-3 text-xs font-semibold">
            <PanelsTopLeft className="size-3.5" aria-hidden />
            See wall
          </button>
        ) : null}
        {cell.set ? (
          <button type="button" onClick={onClear} className="ml-auto text-xs font-semibold text-muted">
            Clear hour
          </button>
        ) : null}
      </div>

      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Do this now</span>
        <DraftField
          value={cell.do || cell.title}
          editing={unlocked}
          multiline
          onCommit={(v) => onEdit(setPlanitTitle(file, d, p, v))}
          placeholder="The job kids see on the wall"
          className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
        />
      </label>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Unit</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                const act = activitiesOf(u)[0];
                if (act) onEdit(parkPlanitUnit(file, d, p, act.id));
              }}
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", project?.id === u.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {u.title}
            </button>
          ))}
          {acts.length > 1
            ? acts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onEdit(parkPlanitUnit(file, d, p, a.id))}
                  className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cell.activityId === a.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                >
                  {a.name}
                </button>
              ))
            : null}
          <button
            type="button"
            onClick={() => setNewOn((v) => !v)}
            className={cn("tw-tap inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold", newOn ? "bg-gold text-bg" : "bg-elevated text-muted")}
          >
            <Plus className="size-3.5" aria-hidden />
            New unit
          </button>
        </div>
        {newOn ? (
          <div className="mt-2 grid gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="CO2 cars"
              aria-label="Unit name"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
            <input
              value={newQ}
              onChange={(e) => setNewQ(e.target.value)}
              placeholder="Driving question (optional)"
              aria-label="Driving question"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
            <button
              type="button"
              disabled={!newName.trim()}
              onClick={() => {
                onEdit(
                  newPlanitUnit(file, {
                    date: d,
                    period: p,
                    name: newName,
                    question: newQ,
                    title: cell.do || cell.title,
                  }),
                );
                setNewOn(false);
                setNewName("");
                setNewQ("");
              }}
              className="tw-tap min-h-11 rounded-xl bg-gold px-3 text-sm font-semibold text-bg disabled:opacity-40"
            >
              Save on this hour
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Move · tag only</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {PLANIT_MOVES.map((m) => (
            <button
              key={m.id}
              type="button"
              title={m.hint}
              onClick={() => onEdit(setPlanitMove(file, d, p, m.id))}
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", cell.move === m.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

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
        <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Need · wall</span>
        <DraftField
          value={cell.materials}
          editing={unlocked}
          onCommit={(v) => onEdit(setTeachMaterials(file, d, p, v))}
          placeholder="Goggles · rulers · stock"
          className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
        />
      </label>

      <WallPreview preview={preview} />

      <SendHour
        file={file}
        date={d}
        period={p}
        unlocked={unlocked}
        days={days}
        onSend={(next, note) => {
          onEdit(next);
          onNote(note);
        }}
      />

      <button type="button" onClick={() => setMore((v) => !v)} className="tw-tap min-h-9 text-left text-xs font-semibold uppercase tracking-wider text-muted">
        {more ? "Hide extra fields" : "More · question, close, homework, mods"}
      </button>
      {more ? (
        <div className="grid gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Question</span>
            <DraftField
              value={cell.ask}
              editing={unlocked}
              multiline
              onCommit={(v) => onEdit(setPlanitQuestion(file, d, p, v))}
              placeholder="Driving question kids hear"
              className="min-h-16 rounded-xl bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Objective · SWBAT</span>
            <DraftField
              value={cell.objective}
              editing={unlocked}
              onCommit={(v) => onEdit(setTeachObjective(file, d, p, v))}
              placeholder="Students will be able to…"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Closure · Then</span>
            <DraftField
              value={cell.close}
              editing={unlocked}
              onCommit={(v) => onEdit(setTeachClose(file, d, p, v))}
              placeholder="How the hour ends"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Homework</span>
            <DraftField
              value={cell.homework}
              editing={unlocked}
              onCommit={(v) => onEdit(setTeachHomework(file, d, p, v))}
              placeholder="Usually none"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Mods · no names</span>
            <DraftField
              value={cell.mods}
              editing={unlocked}
              onCommit={(v) => onEdit(setTeachMods(file, d, p, v))}
              placeholder="Extended time · demo first"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm text-fg"
            />
          </label>
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
      ) : null}
    </section>
  );
}

function WallPreview({ preview }: { preview: ReturnType<typeof planitPreview> }) {
  return (
    <div className="tw-planit-preview rounded-2xl bg-elevated/80 p-3" data-planit-preview>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Wall preview</p>
      <ol className="mt-2 grid grid-cols-2 gap-1.5">
        {preview.cards.slice(0, 4).map((c) => (
          <li key={c.n} className="rounded-xl bg-bg px-2 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {c.n} · {c.kicker}
            </p>
            <p className="mt-0.5 line-clamp-2 font-display text-sm font-semibold leading-snug">{c.body || "—"}</p>
          </li>
        ))}
      </ol>
      <KitChip kit={preview.need} />
    </div>
  );
}
