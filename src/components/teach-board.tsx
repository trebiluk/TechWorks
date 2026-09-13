import { useState } from "react";
import { RotateCcw } from "lucide-react";
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
import { livePoll } from "@/lib/polls";
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
  minClock,
  packOf,
  setTeachLine,
  setTeachPack,
  setTeachPin,
  slotNow,
  teachDay,
  teachFocusPeriod,
  teachJob,
  teachObjective,
} from "@/lib/teach";
import { saveTeachAsk, saveTeachDo, saveTeachObjective } from "@/lib/plan-sync";
import { cn } from "@/lib/utils";
import { LessonPlanSheet } from "@/components/lesson-plan-sheet";

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
  onPlan?: () => void;
  onWords?: () => void;
  onWall?: () => void;
  onDeck?: () => void;
}) {
  const today = todayIso();
  const date = dateProp || nextOpenDay(today);
  const bellsId = deskBellId(file, date);
  const now = useShopClock(deskBellId(file, today), "beat");
  const shop = shopBells(file).map((b) => b.period);
  const live = date === today ? periodNow(deskBellId(file, today), now) : null;
  const [pick, setPick] = useState<number | null>(null);
  const period = date === today ? teachFocusPeriod(file, today, now, pick) : (pick && shop.includes(pick) ? pick : shop[0] ?? 1);
  const clock = date === today ? periodClock(period, deskBellId(file, today), now) : null;
  const pack = packOf(file, date, period);
  const slots = laySlots(file, date, period);
  const cur = date === today ? slotNow(file, today, period, now) : null;
  const obj = teachObjective(file, date, period);
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

  function goDate(iso: string) {
    onDate?.(iso);
  }

  const week = weekOn(date);
  const weekDays = week?.days ?? [date];

  const hidden = layout.order.filter((id) => !teachRowOn(layout, id));

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
            {unlocked ? (
              <div className="mt-2 grid gap-2">
                <p className="text-sm font-semibold text-gold">Type here. Leave a field to save.</p>
                <label className="grid gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Ask</span>
                  <input
                    key={`ask-${date}-${period}`}
                    defaultValue={job.question}
                    placeholder="How can a small force move a bigger load?"
                    onBlur={(e) => edit(saveTeachAsk(file, date, period, e.target.value))}
                    className="tw-field tw-fill-hero min-h-12 w-full font-display text-2xl font-semibold tracking-tight"
                    aria-label="Ask the class"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Do this now</span>
                  <input
                    key={`do-${date}-${period}`}
                    defaultValue={job.today}
                    placeholder="Name the load. Sketch one machine."
                    onBlur={(e) => edit(saveTeachDo(file, date, period, e.target.value))}
                    className="tw-field"
                    aria-label="Do this now"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-subtle">Objective</span>
                  <input
                    key={`obj-${date}-${period}`}
                    defaultValue={day.objective ?? ""}
                    placeholder={obj}
                    onBlur={(e) => edit(saveTeachObjective(file, date, period, e.target.value))}
                    className="tw-field"
                    aria-label="Today's objective"
                  />
                </label>
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
                    {unlocked ? (
                      <input
                        key={`line-${date}-${period}-${s.id}`}
                        defaultValue={s.line}
                        onBlur={(e) => edit(setTeachLine(file, date, period, s.id, e.target.value))}
                        className="tw-field mt-1 min-h-10"
                        aria-label={`${s.title} line`}
                      />
                    ) : (
                      <p className="tw-fill-line opacity-80">{s.line}</p>
                    )}
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
    return null;
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-1")} data-wall-stage={sortOn ? "edit" : "show"}>
      {printOn ? <LessonPlanSheet file={file} period={period} dates={weekDays} onClose={() => setPrintOn(false)} /> : null}
      <header className="flex shrink-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {shop.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPick(p)}
              className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold", period === p ? "bg-fg text-bg" : "bg-elevated text-muted")}
            >
              P{p}
              {live === p ? <span className="ml-1 text-[10px]">now</span> : null}
            </button>
          ))}
          <span className="ml-auto flex flex-wrap items-center gap-1 font-mono text-sm text-muted">
            {clock ? `${formatBell(clock.start)}-${formatBell(clock.end)}` : formatSchoolDate(date)}
            {clock?.cleanup ? (
              <span className="rounded-full bg-cleanup px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                Cleanup {Math.max(0, Math.ceil(clock.left))}m
              </span>
            ) : null}
            {onDeck ? (
              <button type="button" onClick={onDeck} className="tw-tap min-h-8 rounded-full bg-gold px-3 text-[12px] font-semibold text-bg">
                Deck
              </button>
            ) : null}
            <button type="button" onClick={() => setPrintOn(true)} className="tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium tw-btn-2">
              Print lesson
            </button>
            {onPlan ? (
              <button type="button" onClick={onPlan} className="tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium tw-btn-2">
                Plan book
              </button>
            ) : null}
            {onWords ? (
              <button type="button" onClick={onWords} className="tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium tw-btn-2">
                Word Heat
              </button>
            ) : null}
          {onPolls ? (
            <button
              type="button"
              onClick={onPolls}
              className={cn("tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium", livePoll(file) ? "bg-accent text-accent-fg" : "tw-btn-2")}
            >
              Polls
            </button>
          ) : null}
        </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => goDate(stepSchoolDay(date, -1))}
            className="tw-tap grid size-10 place-items-center rounded-xl bg-elevated text-lg font-semibold"
            aria-label="Previous school day"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goDate(nextOpenDay(today))}
            className={cn("tw-tap min-h-10 rounded-xl px-3 text-xs font-semibold", date === today || date === nextOpenDay(today) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          >
            {isSchoolDay(today) ? "Today" : "Next class"}
          </button>
          {weekDays.map((d) => {
            const school = isSchoolDay(d);
            return (
              <button
                key={d}
                type="button"
                disabled={!school}
                onClick={() => school && goDate(d)}
                className={cn(
                  "tw-tap min-h-10 rounded-xl px-2.5 text-left text-xs font-semibold",
                  d === date ? "bg-fg text-bg" : school ? "bg-elevated text-muted" : "opacity-40",
                )}
              >
                {formatSchoolDate(d)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => goDate(stepSchoolDay(date, 1))}
            className="tw-tap grid size-10 place-items-center rounded-xl bg-elevated text-lg font-semibold"
            aria-label="Next school day"
          >
            ›
          </button>
          <p className="ml-1 text-sm font-semibold text-gold">Writing {formatSchoolDate(date)} · P{period}</p>
        </div>
      </header>

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
        className={cn("flex min-h-0 flex-1 flex-col gap-2", sortOn ? "" : "overflow-hidden")}
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
              className={id === "hero" || id === "slots" ? "tw-fill-row" : "shrink-0"}
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
