import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { instructionalWeeks, isSchoolDay, todayIso, weekOn, weekRangeLabel } from "@/lib/calendar";
import { activitiesOf, createActivityPlan, pinDayActivity, pinnedActivityId, projectsOf, slotsOf } from "@/lib/projects";
import {
  dropTeachDay,
  addTeachHang,
  dropTeachHang,
  hangOf,
  setTeachClose,
  setTeachHomework,
  setTeachMaterials,
  setTeachMods,
  setTeachNotes,
  setTeachReflect,
  toggleTeachSkill,
} from "@/lib/teach";
import { planWeek, weekFillCount, copyHour, hourIsSet, type PlanCell } from "@/lib/planbook";
import {
  newPlanitUnit,
  parkPlanitUnit,
  planitPreview,
  setPlanitJob,
  setPlanitProve,
  setPlanitQuestion,
  setPlanitBeat,
  weekdayShort,
} from "@/lib/planit";
import { hourAgendaDraft } from "@/lib/hour-flow";
import { SKILL_TRACK, SOFT_TRACK, skillTrackOf } from "@/lib/skills";
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
  onDeck,
  onGrade,
  date: dateProp,
  period: periodProp,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onTeach?: (date: string, period: number) => void;
  onWall?: () => void;
  onDeck?: () => void;
  onGrade?: () => void;
  date?: string;
  period?: number;
}) {
  const today = todayIso();
  const bells = shopBells(file);
  const firstP = bells[0]?.period ?? 1;
  const startDate = dateProp || today;
  const startPeriod = periodProp ?? firstP;
  const [weekDate, setWeekDate] = useState(startDate);
  const [open, setOpen] = useState<{ date: string; period: number }>({ date: startDate, period: startPeriod });
  useEffect(() => {
    if (!dateProp && periodProp == null) return;
    const d = dateProp || today;
    const p = periodProp ?? firstP;
    setWeekDate(d);
    setOpen({ date: d, period: p });
  }, [dateProp, periodProp, today, firstP]);
  const [printOn, setPrintOn] = useState(false);
  const [notice, setNotice] = useState("");
  const [gridOn, setGridOn] = useState(false);
  const fileRef = useRef(file);
  fileRef.current = file;
  const week = weekOn(weekDate);
  const days = week?.days ?? [weekDate];
  const grid = useMemo(() => planWeek(file, days, today), [file, days, today]);
  const fill = weekFillCount(file, days);
  const periods = useMemo(() => grid.map((row) => row[0]?.period).filter((p): p is number => p != null), [grid]);
  const cell = grid.flat().find((c) => c.date === open.date && c.period === open.period);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function goWeek(dir: -1 | 1) {
    const weeks = instructionalWeeks();
    const i = weeks.findIndex((w) => w.start === week?.start);
    const next = weeks[i + dir];
    if (next?.days[0]) {
      const idx = Math.max(0, days.indexOf(open.date));
      setWeekDate(next.days[0]);
      setOpen({ date: next.days[Math.min(idx, next.days.length - 1)] ?? next.days[0]!, period: open.period });
    }
  }

  useEffect(() => {
    function onTool(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id === "week") setGridOn((v) => !v);
      if (id === "print") setPrintOn(true);
    }
    window.addEventListener("tw-hour-tool", onTool);
    return () => window.removeEventListener("tw-hour-tool", onTool);
  }, []);

  function move(dx: number, dy: number) {
    const di = days.indexOf(open.date);
    const pi = periods.indexOf(open.period);
    const nd = days[Math.max(0, Math.min(days.length - 1, di + dx))];
    const np = periods[Math.max(0, Math.min(periods.length - 1, pi + dy))];
    if (nd && np != null) setOpen({ date: nd, period: np });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        move(0, 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(0, -1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open.date, open.period, days, periods]);

  const undoFile = useRef<EconomyFile | null>(null);
  const undoFn = useRef<() => void>(() => {});
  const [canUndo, setCanUndo] = useState(false);

  function edit(next: EconomyFile) {
    if (!gate()) return;
    undoFile.current = fileRef.current;
    setCanUndo(true);
    fileRef.current = next;
    onChange(next);
  }

  function undo() {
    const prev = undoFile.current;
    if (!prev) return;
    undoFile.current = null;
    setCanUndo(false);
    fileRef.current = prev;
    onChange(prev);
  }
  undoFn.current = undo;

  useEffect(() => {
    function onUndoKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undoFn.current();
      }
    }
    window.addEventListener("keydown", onUndoKey);
    return () => window.removeEventListener("keydown", onUndoKey);
  }, []);

  const pct = fill.total ? Math.round((fill.set / fill.total) * 100) : 0;

  return (
    <div className="tw-planit tw-planit-mf flex min-h-0 flex-1 flex-col" data-planit data-planit-mf>
      {printOn ? <LessonPlanSheet file={file} period={cell?.period ?? firstP} dates={days} onClose={() => setPrintOn(false)} /> : null}

      <header className="tw-planit-top tw-lcars">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: "var(--mf-cyan)" }}>
            This hour
          </p>
          <h1 className="font-display text-[1.65rem] font-semibold leading-none tracking-tight">
            {weekRangeLabel(days)}
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => goWeek(-1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated" title="Previous week">
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setWeekDate(today);
              setOpen({ date: today, period: open.period });
            }}
            className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", days.includes(today) ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            Today
          </button>
          <button type="button" onClick={() => goWeek(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated" title="Next week">
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="tw-planit-meter" title={`${fill.set} of ${fill.total} hours`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted">
          {fill.set}/{fill.total} hours · lesson, slide, and the activity you will grade.
        </p>
        {notice ? <p className="text-sm font-semibold text-gain">{notice}</p> : null}
      </header>

      {!gridOn ? (
        <div className="grid gap-1 px-1 pb-1">
          <div className="flex gap-1 overflow-x-auto">
            {shopBells(file).map((b) => (
              <button
                key={b.period}
                type="button"
                onClick={() => setOpen({ date: open.date, period: b.period })}
                className={cn("tw-tap min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold", open.period === b.period ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                P{b.period}
              </button>
            ))}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                disabled={!isSchoolDay(d)}
                onClick={() => setOpen({ date: d, period: open.period })}
                className={cn("tw-tap min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold", open.date === d ? "bg-fg text-bg" : "bg-elevated text-muted", !isSchoolDay(d) && "opacity-40")}
              >
                {weekdayShort(d)} {d.slice(8)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="tw-planit-stage" data-week={gridOn ? "on" : "off"}>
        <div className="tw-planit-board tw-lcars" style={{ ["--days" as string]: String(Math.max(days.length, 1)) }}>
          <div className="tw-planit-corner" />
          {days.map((d) => (
            <div key={d} className={cn("tw-planit-dow", d === today && "is-today")}>
              <span>{weekdayShort(d)}</span>
              <strong>{d.slice(8)}</strong>
              {!isSchoolDay(d) ? <em>off</em> : null}
            </div>
          ))}
          {grid.map((row) =>
            row.length ? (
              <PeriodRow
                key={row[0]!.period}
                row={row}
                open={open}
                onOpen={(c) => {
                  if (!c.school) return;
                  setOpen({ date: c.date, period: c.period });
                  setGridOn(false);
                }}
              />
            ) : null,
          )}
        </div>
        {gridOn ? null : cell?.school ? (
          <HourDesk
            key={`${cell.date}-${cell.period}`}
            file={file}
            cell={cell}
            unlocked={unlocked}
            days={days}
            onEdit={edit}
            canUndo={canUndo}
            onUndo={undo}
            onTeach={onTeach}
            onWall={onWall}
            onDeck={onDeck}
            onGrade={onGrade}
            onClear={() => {
              if (!gate()) return;
              let next = dropTeachDay(file, cell.date, cell.period);
              next = pinDayActivity(next, cell.date, cell.period, "");
              onChange(next);
            }}
            onNote={setNotice}
          />
        ) : (
          <aside className="tw-planit-desk tw-lcars p-4">
            <p className="font-display text-lg font-semibold">No school</p>
            <p className="mt-1 text-sm text-muted">Pick a class day. The week is the plan.</p>
          </aside>
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
  open: { date: string; period: number };
  onOpen: (c: PlanCell) => void;
}) {
  const head = row[0]!;
  return (
    <>
      <div className="tw-planit-period">
        <p>P{head.period}</p>
        <span>G{head.grade}</span>
      </div>
      {row.map((c) => {
        const on = open.date === c.date && open.period === c.period;
        const title = c.do || c.title;
        return (
          <button
            key={`${c.date}-${c.period}`}
            type="button"
            onClick={() => onOpen(c)}
            data-on={on ? "on" : undefined}
            data-live={c.live ? "on" : undefined}
            data-set={c.set ? "on" : undefined}
            data-off={c.school ? undefined : "on"}
            className="tw-tap tw-planit-cell tw-chamfer"
          >
            {c.school ? (
              <>
                <strong>{title || "·"}</strong>
                {c.skills?.length ? (
                  <em>{c.skills.map((id) => skillTrackOf(id)?.name ?? id).join(" · ")}</em>
                ) : c.materials ? (
                  <em>{c.materials}</em>
                ) : null}
              </>
            ) : (
              <span className="opacity-40">—</span>
            )}
          </button>
        );
      })}
    </>
  );
}

function gradeActivityName(file: EconomyFile, date: string, period: number): string {
  const id = pinnedActivityId(file, period, date);
  if (!id) return "";
  for (const project of projectsOf(file)) {
    const act = activitiesOf(project).find((a) => a.id === id);
    if (act?.name) return act.name;
  }
  return "";
}

function HourDesk({
  file,
  cell,
  unlocked,
  days,
  onEdit,
  canUndo,
  onUndo,
  onTeach,
  onWall,
  onDeck,
  onGrade,
  onClear,
  onNote,
}: {
  file: EconomyFile;
  cell: PlanCell;
  unlocked: boolean;
  days: string[];
  onEdit: (next: EconomyFile) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  onTeach?: (date: string, period: number) => void;
  onWall?: () => void;
  onDeck?: () => void;
  onGrade?: () => void;
  onClear: () => void;
  onNote: (note: string) => void;
}) {
  const d = cell.date;
  const p = cell.period;
  const fileRef = useRef(file);
  fileRef.current = file;
  function commit(next: EconomyFile) {
    fileRef.current = next;
    onEdit(next);
  }
  function patch(fn: (f: EconomyFile) => EconomyFile) {
    commit(fn(fileRef.current));
  }
  const [more, setMore] = useState(false);
  const [unitOn, setUnitOn] = useState(false);
  const [newName, setNewName] = useState("");
  const project = slotsOf(file, p, d)[0];
  const units = slotsOf(file, p);
  const later = shopBells(file)
    .map((b) => b.period)
    .find((n) => n > p && !hourIsSet(file, d, n));
  const preview = planitPreview(file, d, p);
  const beats = hourAgendaDraft(file, d, p);
  const hangs = hangOf(file, d, p);
  const graded = gradeActivityName(file, d, p);
  const [slideUrl, setSlideUrl] = useState("");
  const [actName, setActName] = useState(graded);
  useEffect(() => {
    function onTool(e: Event) {
      const id = (e as CustomEvent<string>).detail;
      if (id === "room") onTeach?.(d, p);
      if (id === "present") onDeck?.();
      if (id === "undo" && canUndo) onUndo?.();
    }
    window.addEventListener("tw-hour-tool", onTool);
    return () => window.removeEventListener("tw-hour-tool", onTool);
  }, [onTeach, onDeck, onUndo, canUndo, d, p]);
  useEffect(() => {
    setActName(graded);
  }, [graded, d, p]);

  return (
    <aside className="tw-planit-desk tw-lcars" data-planit-hour>
      <div className="tw-planit-hour-scroll">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            P{p} · {weekdayShort(d)} {d.slice(8)} · G{cell.grade}
          </p>
          <p className="truncate text-xs text-muted">{cell.course || cell.label}</p>
        </div>
        {cell.set ? (
          <button type="button" onClick={onClear} className="ml-auto text-xs font-semibold text-muted">
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid gap-2" data-planit-beats>
        {(
          [
            ["now", "01 Now", "Sit with your crew."],
            ["goal", "02 Do this", "The make for this hour."],
            ["next", "03 Then", "Second move."],
            ["behave", "04 How we work", "Choose → work → focus → cleanup."],
          ] as const
        ).map(([id, label, ph]) => (
          <label key={id} className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
            <DraftField
              value={beats.find((c) => c.id === id)?.body ?? ""}
              editing={unlocked}
              onCommit={(v) => patch((f) => setPlanitBeat(f, d, p, id, v))}
              placeholder={ph}
              aria-label={label}
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
            />
          </label>
        ))}
      </div>

      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Google Slides</span>
        {hangs.length ? (
          <ul className="grid gap-1">
            {hangs.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm">{h.title || h.url}</span>
                <button type="button" onClick={() => onEdit(dropTeachHang(file, d, p, h.id))} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <span className="flex flex-wrap gap-1">
          <input
            value={slideUrl}
            onChange={(e) => setSlideUrl(e.target.value)}
            placeholder="Paste the share link"
            aria-label="Google Slides link"
            className="tw-field min-h-11 min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => {
              const next = addTeachHang(file, d, p, slideUrl);
              if (next === file) {
                onNote("Paste a Google Slides share link.");
                return;
              }
              onEdit(next);
              setSlideUrl("");
              onNote("Slides are on this hour. Present plays them.");
            }}
            className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
          >
            Add slide
          </button>
        </span>
      </label>

      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Activity to grade</span>
        <span className="flex flex-wrap gap-1">
          <input
            value={actName}
            onChange={(e) => setActName(e.target.value)}
            placeholder="Name the make. You grade it later."
            aria-label="Activity to grade"
            className="tw-field min-h-11 min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => {
              const name = actName.trim();
              if (!name) return;
              if (graded) {
                onNote("Already on the grade. Open People, then Grade.");
                onGrade?.();
                return;
              }
              const made = createActivityPlan(file, {
                name,
                belong: "project",
                period: p,
                grades: [cell.grade || 6],
                dates: [d],
                do: beats.find((b) => b.id === "goal")?.body || name,
                prove: "done",
              });
              onEdit(pinDayActivity(made.file, d, p, made.activityId));
              onNote("Saved. Grade it later on People.");
            }}
            className="tw-tap min-h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
          >
            {graded ? "Grade it" : "Save activity"}
          </button>
        </span>
        <span className="text-xs text-muted">{graded ? "On the gradebook. People → Grade." : "This name becomes the column you score later."}</span>
      </label>

      {cell.set ? <WallPreview preview={preview} /> : null}

      <button type="button" onClick={() => setMore((v) => !v)} className="tw-tap min-h-11 text-left text-sm font-semibold text-muted">
        {more ? "Less" : "More"}
      </button>
      {more ? (
        <div className="grid gap-2">
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Job</span>
            <DraftField
              value={cell.do || cell.title}
              editing={unlocked}
              multiline
              onCommit={(v) => patch((f) => setPlanitJob(f, d, p, v))}
              placeholder="Same as Do this, if you want a shorter line."
              aria-label="Job"
              className="min-h-11 rounded-xl bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Question</span>
            <DraftField
              value={cell.ask}
              editing={unlocked}
              multiline
              onCommit={(v) => patch((f) => setPlanitQuestion(f, d, p, v))}
              placeholder="Optional."
              aria-label="Question"
              className="min-h-11 rounded-xl bg-elevated px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Prove</span>
            <DraftField
              value={cell.objective}
              editing={unlocked}
              onCommit={(v) => patch((f) => setPlanitProve(f, d, p, v))}
              placeholder="What they show before the bell."
              aria-label="Prove"
              className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
            />
          </label>
          <HourSkills cell={cell} unlocked={unlocked} onEdit={commit} file={file} />
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Need</span>
              <DraftField
                value={cell.materials}
                editing={unlocked}
                onCommit={(v) => patch((f) => setTeachMaterials(f, d, p, v))}
                placeholder="Stock · PPE"
                className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Close</span>
              <DraftField
                value={cell.close}
                editing={unlocked}
                onCommit={(v) => patch((f) => setTeachClose(f, d, p, v))}
                placeholder="Exit / reset"
                className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
              />
            </label>
          </div>
          <DraftField
            value={cell.homework}
            editing={unlocked}
            onCommit={(v) => patch((f) => setTeachHomework(f, d, p, v))}
            placeholder="Homework · usually none"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
          <DraftField
            value={cell.notes}
            editing={unlocked}
            multiline
            onCommit={(v) => patch((f) => setTeachNotes(f, d, p, v))}
            placeholder="Before class"
            className="min-h-14 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
          <DraftField
            value={cell.reflect}
            editing={unlocked}
            multiline
            onCommit={(v) => patch((f) => setTeachReflect(f, d, p, v))}
            placeholder="After · what to change"
            className="min-h-14 rounded-xl bg-elevated px-3 py-2 text-sm"
          />
          <DraftField
            value={cell.mods}
            editing={unlocked}
            onCommit={(v) => patch((f) => setTeachMods(f, d, p, v))}
            placeholder="Mods · no names"
            className="min-h-11 rounded-xl bg-elevated px-3 text-sm"
          />
          <button type="button" onClick={() => setUnitOn((v) => !v)} className="tw-tap min-h-11 text-left text-sm font-semibold text-muted">
            {unitOn ? "Hide units" : "Part of a unit"}
          </button>
          {unitOn ? (
            <div className="flex flex-wrap gap-1">
              {units.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    const act = activitiesOf(u)[0];
                    if (act) patch((f) => parkPlanitUnit(f, d, p, act.id));
                  }}
                  className={cn("tw-tap min-h-10 rounded-xl px-3 text-sm font-semibold", project?.id === u.id ? "bg-fg text-bg" : "bg-elevated")}
                >
                  {u.title}
                </button>
              ))}
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="New unit name"
                className="tw-field min-h-10 min-w-[8rem] flex-1"
              />
              <button
                type="button"
                disabled={!newName.trim()}
                onClick={() => {
                  onEdit(newPlanitUnit(fileRef.current, { date: d, period: p, name: newName, title: cell.do || cell.title }));
                  setNewName("");
                }}
                className="tw-tap min-h-10 rounded-xl bg-elevated px-3 text-sm font-semibold disabled:opacity-40"
              >
                Save unit
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
      </div>

      <div className="tw-planit-send-dock" data-planit-send>
      {canUndo && onUndo ? (
        <button type="button" onClick={onUndo} className="tw-tap min-h-11 text-left text-sm font-semibold text-muted">
          Undo
        </button>
      ) : null}
      {later != null && cell.set ? (
        <button
          type="button"
          onClick={() => {
            onEdit(copyHour(file, d, p, d, later));
            onNote(`Copied to P${later}.`);
          }}
          className="tw-tap min-h-11 text-left text-sm font-semibold"
        >
          Copy to P{later}
        </button>
      ) : null}

      <SendHour
        file={file}
        date={d}
        period={p}
        unlocked={unlocked}
        days={days}
        onSend={(next, note) => {
          commit(next);
          onNote(note);
        }}
      />
      </div>
    </aside>
  );
}

function HourSkills({
  file,
  cell,
  unlocked,
  onEdit,
}: {
  file: EconomyFile;
  cell: PlanCell;
  unlocked: boolean;
  onEdit: (next: EconomyFile) => void;
}) {
  const fileRef = useRef(file);
  fileRef.current = file;
  function tap(id: string) {
    if (!unlocked) return;
    const next = toggleTeachSkill(fileRef.current, cell.date, cell.period, id);
    fileRef.current = next;
    onEdit(next);
  }
  return (
    <div className="grid gap-1.5" data-planit-skills>
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Score this hour</p>
      <div className="flex flex-wrap gap-1">
        {SKILL_TRACK.map((s) => {
          const on = cell.skills?.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              title={`${s.does} · NY ${s.mst.join(" ")}`}
              onClick={() => tap(s.id)}
              className={cn("tw-tap min-h-9 rounded-xl px-2.5 text-xs font-semibold", on ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              aria-pressed={Boolean(on)}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1">
        {SOFT_TRACK.map((s) => {
          const on = cell.skills?.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              title={s.does}
              onClick={() => tap(s.id)}
              className={cn("tw-tap min-h-8 rounded-lg px-2 text-[11px] font-semibold", on ? "bg-gold text-bg" : "bg-elevated/80 text-muted")}
              aria-pressed={Boolean(on)}
            >
              {s.name}
            </button>
          );
        })}
      </div>
      {(cell.skills?.length ?? 0) >= 3 ? (
        <p className="text-[11px] text-muted">Three is the max. Watch opens on {skillTrackOf(cell.skills[0] ?? "")?.name ?? "the first"}.</p>
      ) : null}
    </div>
  );
}

function WallPreview({ preview }: { preview: ReturnType<typeof planitPreview> }) {
  return (
    <div className="tw-planit-preview" data-planit-preview>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted">On the wall</p>
      <ol>
        {preview.cards.slice(0, 4).map((c) => (
          <li key={c.n}>
            <span>{c.n}</span>
            <p>{c.body || "—"}</p>
          </li>
        ))}
      </ol>
      <KitChip kit={preview.need} />
    </div>
  );
}
