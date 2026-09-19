import { useCallback, useRef, useState } from "react";
import { BookOpen, CalendarDays, GripVertical, Megaphone, PanelsTopLeft, Paperclip, Presentation, Printer, RotateCcw } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { periodClock, periodNow, formatBell } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { formatSchoolDate, isSchoolDay, nextOpenDay, stepSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { useShopClock } from "@/lib/use-clock";
import { BertyCueBot } from "@/components/berty";
import { ProgressRing } from "@/components/progress-ring";
import { DashTools } from "@/components/dash-tools";
import { PollWall } from "@/components/polls";
import { featureOn } from "@/lib/features";
import {
  DEFAULT_TEACH_LAYOUT,
  hideTeachRow,
  loadTeachLayout,
  moveTeachTo,
  saveTeachLayout,
  teachRowOn,
  TEACH_ROWS,
  type TeachLayout,
  type TeachRowId,
} from "@/lib/teach-look";
import { SortableItem, SortableList } from "@/components/sortable";
import { MarkChip } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";
import {
  TEACH_PACKS,
  laySlots,
  loadHourPick,
  minClock,
  packOf,
  saveHourPick,
  setTeachPack,
  setTeachPin,
  slotNow,
  teachDay,
  teachFocusPeriod,
  teachJob,
  hangOf,
  addTeachHang,
  dropTeachHang,
} from "@/lib/teach";
import { dayHourStatus, hourAgendaDraft } from "@/lib/hour-flow";
import { cn } from "@/lib/utils";
import { LessonPlanSheet } from "@/components/lesson-plan-sheet";
import { HangFrame } from "@/components/hang-frame";
import { CleanupJobsPad } from "@/components/cleanup-wall";
import { TeachPocket, type TeachTool } from "@/components/teach-pocket";
import { DayFacts } from "@/components/day-facts";

export function TeachBoard({
  file,
  unlocked,
  editing,
  date: dateProp,
  onDate,
  onChange,
  onNeedPin,
  onPolls,
  onBerty,
  onPlan,
  onWords,
  onWall,
  onDeck,
  onArrange,
}: {
  file: EconomyFile;
  unlocked: boolean;
  editing?: boolean;
  date?: string;
  onDate?: (iso: string) => void;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onPolls?: () => void;
  onBerty?: () => void;
  onPlan?: (date?: string, period?: number) => void;
  onWords?: () => void;
  onWall?: () => void;
  onDeck?: () => void;
  onArrange?: () => void;
}) {
  const today = todayIso();
  const date = dateProp || nextOpenDay(today);
  const bellsId = deskBellId(file, date);
  const now = useShopClock(deskBellId(file, today), "beat");
  const shop = shopBells(file).map((b) => b.period);
  const live = date === today ? periodNow(deskBellId(file, today), now) : null;
  const [pick, setPick] = useState<number | null>(() => loadHourPick());
  const period = date === today ? teachFocusPeriod(file, today, now, pick) : (pick && shop.includes(pick) ? pick : shop[0] ?? 1);
  const clock = date === today ? periodClock(period, deskBellId(file, today), now) : null;
  const pack = packOf(file, date, period);
  const slots = laySlots(file, date, period);
  const cur = date === today ? slotNow(file, today, period, now) : null;
  const day = teachDay(file, date, period);
  const cleanup = Boolean(clock?.cleanup || cur?.clean);
  const liveHere = Boolean(clock?.live);
  const passing = date === today && !liveHere;
  const left = clock?.left ?? 0;
  const between = date === today && !liveHere && !cur;
  const job = teachJob(file, period, date);
  const writing = date !== today || !liveHere;
  const title = writing ? (job.question || job.title || "This class") : cleanup ? "CLEAN UP" : cur?.title ?? "ENTER";
  const line = writing
    ? job.today || "Type what they do this hour."
    : cleanup
      ? "Tools, scraps, seats. Cleanup score is live."
      : cur?.kind === "work"
        ? job.today || cur?.line
        : cur?.line ?? "Sit with your crew.";
  const [layout, setLayout] = useState<TeachLayout>(() => loadTeachLayout());
  const [printOn, setPrintOn] = useState(false);
  const sortOn = unlocked && editing !== false;
  const fileRef = useRef(file);
  fileRef.current = file;

  const editNow = useCallback(
    (fn: (f: EconomyFile) => EconomyFile) => {
      if (!unlocked) {
        onNeedPin();
        return;
      }
      onChange(fn(fileRef.current));
    },
    [unlocked, onChange, onNeedPin],
  );

  function commitLayout(next: TeachLayout) {
    setLayout(next);
    saveTeachLayout(next);
  }

  function edit(next: EconomyFile) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(next);
  }

  function choose(p: number) {
    setPick(p);
    saveHourPick(p);
  }

  function goDate(iso: string) {
    onDate?.(iso);
  }

  const week = weekOn(date);
  const weekDays = week?.days ?? [date];
  const hourRows = dayHourStatus(file, date, shop);
  const hoursSet = hourRows.filter((r) => r.set).length;
  const hidden = layout.order.filter((id) => !teachRowOn(layout, id));

  function focusHang() {
    commitLayout(hideTeachRow(layout, "hang", true));
    window.requestAnimationFrame(() => {
      document.querySelector("[data-teach-hang]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  const tools: TeachTool[] = [
    ...(onPlan ? [{ id: "plan", label: "PlanIt", title: "Write the hour", icon: CalendarDays, onClick: () => onPlan(date, period) }] : []),
    ...(onDeck ? [{ id: "deck", label: "Deck", title: "Play this hour", icon: Presentation, onClick: onDeck }] : []),
    ...(onWall ? [{ id: "wall", label: "Projector", title: "Kid wall — this hour", icon: PanelsTopLeft, onClick: onWall }] : []),
    { id: "hang", label: "Hang", title: "Drive / Slides / YouTube on this hour", icon: Paperclip, onClick: focusHang },
    ...(onArrange ? [{ id: "arrange", label: "Arrange", title: sortOn ? "Done arranging" : "Arrange plates", on: sortOn, icon: GripVertical, onClick: onArrange }] : []),
    { id: "print", label: "Print", title: "Print this lesson", icon: Printer, onClick: () => setPrintOn(true) },
    ...(onWords ? [{ id: "words", label: "Words", title: "Word Heat", icon: BookOpen, onClick: onWords }] : []),
    ...(onPolls ? [{ id: "polls", label: "Polls", title: "Class poll", icon: Megaphone, onClick: onPolls }] : []),
  ];

  function plateOf(id: TeachRowId) {
    if (id === "hero") {
      return (
        <section
          data-teach-hero
          className={cn("tw-gadget tw-fill-wide flex shrink-0 gap-3 p-3", cleanup && !writing && "bg-cleanup text-accent-fg")}
        >
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.22em]", cleanup && !writing ? "opacity-90" : "text-gold")}>
              {writing ? `This class · ${formatSchoolDate(date)}` : cleanup ? `Cleanup ${Math.max(0, Math.ceil(left))}m` : between ? "Next" : "Today"}
              <span className={cn("ml-2", cleanup && !writing ? "opacity-80" : "text-muted")}>P{period}</span>
              <span className="ml-2 text-muted">Deck plays this</span>
            </p>
            {writing ? (
              <div className="mt-2 grid gap-2" data-teach-mirror>
                <p className="text-sm font-semibold text-gold">PlanIt writes this hour. Wall and Deck play it.</p>
                <p className="tw-fill-hero font-display text-2xl font-semibold tracking-tight">{job.question || title}</p>
                {job.today ? <p className="text-sm"><span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Job </span>{job.today}</p> : null}
                {day.objective ? <p className="text-sm"><span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Prove </span>{day.objective}</p> : null}
                <ol className="grid gap-1">
                  {hourAgendaDraft(file, date, period).map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">{c.n} {c.kicker} </span>
                      {c.body || "—"}
                    </li>
                  ))}
                </ol>
                {day.materials ? <p className="text-sm text-muted">Need · {day.materials}</p> : null}
                {onPlan ? (
                  <button
                    type="button"
                    onClick={() => onPlan(date, period)}
                    className="tw-tap mt-1 inline-flex min-h-11 w-fit items-center rounded-xl bg-accent px-3 text-sm font-semibold text-accent-fg"
                  >
                    Open PlanIt
                  </button>
                ) : null}
              </div>
            ) : (
              <>
                <h1 className="tw-fill-hero font-display font-semibold tracking-tight">{title}</h1>
                <p className={cn("tw-fill-line mt-2 max-w-3xl", cleanup ? "opacity-95" : "text-muted")}>{line}</p>
              </>
            )}
            {day.notes ? <p className={cn("mt-1 text-base", cleanup ? "opacity-90" : "text-muted")}>{day.notes}</p> : null}
          </div>
          {writing ? null : (
          <div className="flex items-center gap-4">
            {featureOn(file, "berty") || cleanup || passing ? (
              <BertyCueBot
                on={featureOn(file, "berty")}
                cue={{ cleanup, live: liveHere, passing: passing && !cleanup, slot: cur?.kind, greeting: !liveHere }}
                size={cleanup ? "xl" : "lg"}
                onOpen={onBerty}
              />
            ) : null}
            <TeachRing period={period} bellsId={deskBellId(file, today)} cleanup={cleanup && !writing} liveHere={liveHere} />
          </div>
          )}
        </section>
      );
    }
    if (id === "packs") {
      return (
        <section className="tw-gadget flex shrink-0 flex-wrap items-center gap-2 p-2">
          <p className="w-full text-[11px] font-bold uppercase tracking-wider text-subtle">Hour shape · Deck plays this pack</p>
          {TEACH_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => edit(setTeachPack(file, date, period, p.id))}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", pack.id === p.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              {p.label}
            </button>
          ))}
        </section>
      );
    }
    if (id === "slots") {
      if (!slots.length) {
        return <p className="tw-gadget p-4 text-sm text-muted">No bell for P{period} on this schedule. Admin → Day → pick Regular / Delay / Half.</p>;
      }
      return (
        <div>
          <ol data-teach-slots>
            {slots.map((s) => {
              const on = cur?.id === s.id;
              return (
                <li key={s.id} className="min-h-0">
                  <div
                    className={cn(
                      "tw-fill flex h-full min-h-24 w-full flex-col justify-center rounded-xl px-3 py-3 text-left",
                      on ? (s.clean ? "bg-cleanup text-accent-fg" : "bg-accent text-accent-fg") : "bg-elevated",
                    )}
                  >
                    <p className="tw-fill-label font-bold uppercase tracking-wider opacity-80">
                      {minClock(s.startMin)} · {s.mins}m
                    </p>
                    <p className="tw-fill-hero font-display font-semibold">{s.title}</p>
                    <p className="tw-fill-line opacity-80">{s.line}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          {day.pin ? (
            <button type="button" className="mt-1 self-start text-xs font-semibold text-muted" onClick={() => edit(setTeachPin(file, date, period, undefined))}>
              Auto clock
            </button>
          ) : (
            <p className="sr-only">Slots follow the bell.</p>
          )}
        </div>
      );
    }
    if (id === "tools") return <DashTools file={file} period={period} />;
    if (id === "poll") return <PollWall file={file} period={period} />;
    if (id === "hang") {
      const hangs = hangOf(file, date, period);
      if (!hangs.length && !unlocked && !sortOn) return null;
      return (
        <div data-teach-hang>
        <HangFrame
          items={hangs}
          unlocked={unlocked}
          onHang={(raw) => editNow((f) => addTeachHang(f, date, period, raw))}
          onDrop={(hid) => editNow((f) => dropTeachHang(f, date, period, hid))}
        />
        </div>
      );
    }
    return null;
  }

  return (
    <div className="tw-teach-stage flex min-h-0 flex-1 flex-col" data-wall-stage={sortOn ? "edit" : "show"}>
      {printOn ? <LessonPlanSheet file={file} period={period} dates={weekDays} onClose={() => setPrintOn(false)} /> : null}
      <header className="tw-teach-top flex flex-col gap-1">
        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto">
          <TeachPocket
            tools={tools}
            extra={
              <div className="grid gap-1">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted">Day</p>
                <div className="flex flex-wrap gap-1">
                  <button type="button" onClick={() => goDate(stepSchoolDay(date, -1))} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="Previous school day">
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => goDate(nextOpenDay(today))}
                    className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", date === today || date === nextOpenDay(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                  >
                    {isSchoolDay(today) ? "Today" : "Next"}
                  </button>
                  <button type="button" onClick={() => goDate(stepSchoolDay(date, 1))} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="Next school day">
                    ›
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {weekDays.map((d) => {
                    const school = isSchoolDay(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!school}
                        onClick={() => school && goDate(d)}
                        className={cn(
                          "tw-tap min-h-11 rounded-xl px-2.5 text-left text-xs font-semibold",
                          d === date ? "bg-fg text-bg" : school ? "bg-elevated text-muted" : "opacity-40",
                        )}
                      >
                        {formatSchoolDate(d).replace(/,.*/, "")}
                      </button>
                    );
                  })}
                </div>
              </div>
            }
          />
          {shop.length ? (
            hourRows.map((row) => (
              <button
                key={row.period}
                type="button"
                onClick={() => choose(row.period)}
                className={cn("tw-tap min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold", period === row.period ? "bg-fg text-bg" : "bg-elevated text-muted")}
                title={row.set ? (row.title || "Set") : "No plan yet"}
              >
                P{row.period}
                {live === row.period ? <span className="ml-1 text-[10px]">now</span> : null}
                <span className={cn("ml-1 inline-block size-1.5 rounded-full", row.set ? "bg-gain" : "bg-fg/30")} />
              </button>
            ))
          ) : (
            <p className="text-sm text-muted">No shop periods. Admin → Day.</p>
          )}
          {shop.length ? <p className="shrink-0 text-xs font-semibold text-muted">{hoursSet} of {shop.length} hours set</p> : null}
          <p className="ml-auto shrink-0 font-mono text-sm text-muted">
            {clock ? `${formatBell(clock.start)}-${formatBell(clock.end)}` : formatSchoolDate(date)}
            {clock?.cleanup ? (
              <span className="ml-2 rounded-full bg-cleanup px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                Cleanup {Math.max(0, Math.ceil(clock.left))}m
              </span>
            ) : null}
          </p>
        </div>
        <div data-teach-day-facts className="min-w-0 px-1 pb-1">
          <DayFacts file={file} date={date} period={period} edit unlocked={unlocked} onNeedPin={onNeedPin} onChange={edit} />
        </div>
      </header>

      {cleanup && liveHere ? (
        <CleanupJobsPad
          file={file}
          unlocked={unlocked}
          onChange={edit}
          hall={period === 6}
        />
      ) : null}

      {sortOn ? (
        <section className="flex shrink-0 flex-wrap items-center gap-1">
          <p className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Drag plates</p>
          <MarkChip mark={RotateCcw} title="Reset Teach plates" onClick={() => commitLayout(DEFAULT_TEACH_LAYOUT)}>
            Reset
          </MarkChip>
          {hidden.length ? <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Show</span> : null}
          {hidden.map((id) => {
            const row = TEACH_ROWS.find((r) => r.id === id);
            if (!row) return null;
            return (
              <MarkChip key={id} mark={markOf(id)} title={`Show ${row.label}`} onClick={() => commitLayout(hideTeachRow(layout, id, true))}>
                {row.label}
              </MarkChip>
            );
          })}
        </section>
      ) : null}

      <SortableList
        enabled={sortOn}
        className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto")}
        onMove={(grab, onto) => commitLayout(moveTeachTo(layout, grab, onto))}
      >
        {layout.order.map((id) => {
          if (!teachRowOn(layout, id)) return null;
          const body = plateOf(id);
          if (!body) return null;
          const row = TEACH_ROWS.find((r) => r.id === id);
          return (
            <SortableItem
              key={id}
              id={id}
              label={row?.label}
              className={id === "hero" || id === "slots" || id === "hang" ? "tw-fill-row" : "shrink-0"}
              onHide={id === "hero" ? undefined : () => commitLayout(hideTeachRow(layout, id, false))}
            >
              {body}
            </SortableItem>
          );
        })}
      </SortableList>
    </div>
  );
}

function TeachRing({
  period,
  bellsId,
  cleanup,
  liveHere,
}: {
  period: number;
  bellsId: string;
  cleanup: boolean;
  liveHere: boolean;
}) {
  const now = useShopClock(bellsId, "fine");
  const clock = periodClock(period, bellsId, now);
  const left = clock?.left ?? 0;
  return (
    <ProgressRing
      pct={clock?.pct ?? 0}
      label={liveHere ? `${Math.max(0, Math.ceil(left))}m` : "—"}
      sub={cleanup ? "cleanup" : liveHere ? "left" : "wait"}
      tone={cleanup ? "warn" : "accent"}
      size={cleanup ? "lg" : "md"}
      live={liveHere}
    />
  );
}
