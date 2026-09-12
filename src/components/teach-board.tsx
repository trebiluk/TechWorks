import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { periodClock, periodNow, formatBell } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
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
  setTeachObjective,
  setTeachPack,
  setTeachPin,
  slotNow,
  teachDay,
  teachFocusPeriod,
  teachObjective,
} from "@/lib/teach";
import { cn } from "@/lib/utils";
import { jobCardOf } from "@/lib/projects";

export function TeachBoard({
  file,
  unlocked,
  onChange,
  onNeedPin,
  onPolls,
  onBerty,
  onPlan,
  onWall,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onPolls?: () => void;
  onBerty?: () => void;
  onPlan?: () => void;
  onWall?: () => void;
}) {
  const today = todayIso();
  const bellsId = deskBellId(file, today);
  const now = useShopClock(bellsId, "beat");
  const shop = shopBells(file).map((b) => b.period);
  const live = periodNow(bellsId, now);
  const [pick, setPick] = useState<number | null>(null);
  const period = teachFocusPeriod(file, today, now, pick);
  const clock = periodClock(period, bellsId, now);
  const pack = packOf(file, today, period);
  const slots = laySlots(file, today, period);
  const cur = slotNow(file, today, period, now);
  const obj = teachObjective(file, today, period);
  const day = teachDay(file, today, period);
  const cleanup = Boolean(clock?.cleanup || cur?.clean);
  const liveHere = Boolean(clock?.live);
  const passing = !liveHere;
  const left = clock?.left ?? 0;
  const between = !liveHere && !cur;
  const job = jobCardOf(file, period);
  const title = between ? "BETWEEN CLASSES" : cleanup ? "CLEAN UP" : cur?.title ?? "ENTER";
  const line = between
    ? "Next bell: sit with your crew."
    : cleanup
      ? "Tools, scraps, seats. Cleanup score is live."
      : cur?.kind === "work"
        ? job.today || cur?.line
        : cur?.line ?? "Sit with your crew.";
  const [layout, setLayout] = useState<TeachLayout>(() => loadTeachLayout());
  const sortOn = unlocked;

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

  const hidden = layout.order.filter((id) => !teachRowOn(layout, id));

  function plateOf(id: TeachRowId) {
    if (id === "hero") {
      return (
        <section
          data-teach-hero
          className={cn("tw-gadget tw-fill-wide shrink-0 p-3", cleanup && "bg-cleanup text-accent-fg")}
        >
          <div className="min-w-0">
            <p className={cn("text-[11px] font-bold uppercase tracking-[0.22em]", cleanup ? "opacity-90" : "text-gold")}>
              {cleanup ? `Cleanup ${Math.max(0, Math.ceil(left))}m` : between ? "Next" : "Today"}
              <span className={cn("ml-2", cleanup ? "opacity-80" : "text-muted")}>P{period}</span>
            </p>
            <h1 className="tw-fill-hero font-display font-semibold tracking-tight">{title}</h1>
            <p className={cn("tw-fill-line mt-2 max-w-3xl", cleanup ? "opacity-95" : "text-muted")}>{line}</p>
            {!cleanup ? (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-base font-semibold">
                Objective
                <input
                  key={`obj-${today}-${period}`}
                  defaultValue={day.objective ?? ""}
                  placeholder={obj}
                  onBlur={(e) => edit(setTeachObjective(file, today, period, e.target.value))}
                  disabled={!unlocked}
                  className="edit-field min-h-10 min-w-[12rem] flex-1 rounded-md bg-elevated px-3 text-base font-normal text-fg outline-none ring-0 disabled:opacity-80"
                  aria-label="Today's objective"
                />
              </label>
            ) : null}
            {day.notes ? <p className={cn("mt-1 text-base", cleanup ? "opacity-90" : "text-muted")}>{day.notes}</p> : null}
          </div>
          <div className="flex items-center gap-4">
            {featureOn(file, "berty") || cleanup || passing ? (
              <BertyCueBot
                on={featureOn(file, "berty")}
                cue={{ cleanup, live: liveHere, passing: passing && !cleanup, slot: cur?.kind, greeting: !liveHere }}
                size={cleanup ? "xl" : "lg"}
                onOpen={onBerty}
              />
            ) : null}
            <TeachRing period={period} bellsId={bellsId} cleanup={cleanup} liveHere={liveHere} />
          </div>
        </section>
      );
    }
    if (id === "packs") {
      return (
        <section className="tw-gadget flex shrink-0 flex-wrap items-center gap-2 p-2">
          {TEACH_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => edit(setTeachPack(file, today, period, p.id))}
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
                  <button
                    type="button"
                    onClick={() => edit(setTeachPin(file, today, period, day.pin === s.id ? undefined : s.id))}
                    className={cn(
                      "tw-fill tw-tap flex h-full min-h-24 w-full flex-col justify-center rounded-xl px-3 py-4 text-left",
                      on ? (s.clean ? "bg-cleanup text-accent-fg" : "bg-accent text-accent-fg") : "bg-elevated",
                    )}
                  >
                    <p className="tw-fill-label font-bold uppercase tracking-wider opacity-80">
                      {minClock(s.startMin)} · {s.mins}m
                    </p>
                    <p className="tw-fill-hero font-display font-semibold">{s.title}</p>
                    <p className="tw-fill-line opacity-80">{s.line}</p>
                  </button>
                </li>
              );
            })}
          </ol>
          {day.pin ? (
            <button type="button" className="mt-1 self-start text-xs font-semibold text-muted" onClick={() => edit(setTeachPin(file, today, period, undefined))}>
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
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-1", sortOn ? "overflow-auto" : "")} data-wall-stage={sortOn ? "edit" : "show"}>
      <header className="flex shrink-0 flex-wrap items-center gap-2">
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
          {clock ? `${formatBell(clock.start)}-${formatBell(clock.end)}` : ""}
          {clock?.cleanup ? (
            <span className="rounded-full bg-cleanup px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
              Cleanup {Math.max(0, Math.ceil(clock.left))}m
            </span>
          ) : null}
          {onWall ? (
            <button type="button" onClick={onWall} className="tw-tap min-h-8 rounded-full bg-fg px-3 text-[12px] font-medium text-bg">
              Wall
            </button>
          ) : null}
          {onPlan ? (
            <button type="button" onClick={onPlan} className="tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium tw-btn-2">
              Plan book
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
