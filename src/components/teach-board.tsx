import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { periodClock, periodNow, formatBell } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { useShopClock } from "@/lib/use-clock";
import { BertyCueBot } from "@/components/berty";
import { ProgressRing } from "@/components/progress-ring";
import { DashTools, ToolsToggle } from "@/components/dash-tools";
import { PollWall } from "@/components/polls";
import { livePoll } from "@/lib/polls";
import { featureOn } from "@/lib/features";
import { loadTeachLook, saveTeachLook, type TeachLook } from "@/lib/teach-look";
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

export function TeachBoard({
  file,
  unlocked,
  onChange,
  onNeedPin,
  onPolls,
  onBerty,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onPolls?: () => void;
  onBerty?: () => void;
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
  const workSlot = slots.find((s) => s.kind === "work") ?? slots.find((s) => !s.clean);
  const title = between
    ? "BETWEEN CLASSES"
    : cleanup
      ? (workSlot?.title ?? "CREW WORK")
      : cur?.title ?? "ENTER";
  const line = between
    ? "Next bell: sit with your crew."
    : cleanup
      ? obj
      : cur?.line ?? "Sit with your crew.";
  const [look, setLook] = useState<TeachLook>(() => loadTeachLook());

  function setLookFlag(key: keyof TeachLook, on: boolean) {
    const next = { ...look, [key]: on };
    setLook(next);
    saveTeachLook(next);
  }

  function edit(next: EconomyFile) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(next);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-1">
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
          {unlocked ? (
            <>
              <button type="button" onClick={() => setLookFlag("pad", !look.pad)} className={cn("tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium", look.pad ? "bg-fg text-bg" : "tw-btn-2")}>
                {look.pad ? "Cards on" : "Cards"}
              </button>
              <button type="button" onClick={() => setLookFlag("slots", !look.slots)} className={cn("tw-tap min-h-8 rounded-full px-3 text-[12px] font-medium", look.slots ? "bg-fg text-bg" : "tw-btn-2")}>
                {look.slots ? "Slots on" : "Slots"}
              </button>
            </>
          ) : null}
          <ToolsToggle on={look.tools} onClick={() => setLookFlag("tools", !look.tools)} />
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

      {unlocked && look.pad ? (
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
      ) : null}

      <section data-teach-hero className="tw-gadget shrink-0 p-3">
        <div className="min-w-0">
          {cleanup ? (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cleanup">
              Cleanup {Math.max(0, Math.ceil(left))}m · tools, scraps, seats
            </p>
          ) : (
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              {between ? "Next" : "Today"}
              <span className="ml-2 text-muted">P{period}</span>
            </p>
          )}
          <h1 className="font-display text-3xl font-semibold leading-[0.95] tracking-tight lg:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-lg text-muted lg:text-xl">{line}</p>
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
          {day.notes ? <p className="mt-1 text-base text-muted">{day.notes}</p> : null}
        </div>
        <div className="flex items-center gap-4">
          {featureOn(file, "berty") || cleanup || passing ? (
            <BertyCueBot
              on={featureOn(file, "berty")}
              cue={{ cleanup, live: liveHere, passing: passing && !cleanup, slot: cur?.kind, greeting: !liveHere }}
              size="lg"
              onOpen={onBerty}
            />
          ) : null}
          <TeachRing period={period} bellsId={bellsId} cleanup={cleanup} liveHere={liveHere} />
        </div>
      </section>

      {!slots.length ? (
        <p className="tw-gadget p-4 text-sm text-muted">No bell for P{period} on this schedule. Admin → Day → pick Regular / Delay / Half.</p>
      ) : look.slots ? (
      <ol data-teach-slots>
        {slots.map((s) => {
          const on = cur?.id === s.id;
          return (
            <li key={s.id} className="min-h-0">
              <button
                type="button"
                onClick={() => edit(setTeachPin(file, today, period, day.pin === s.id ? undefined : s.id))}
                className={cn(
                  "tw-tap flex h-full min-h-24 w-full flex-col justify-center rounded-xl px-3 py-4 text-left",
                  on ? (s.clean ? "bg-cleanup text-accent-fg" : "bg-accent text-accent-fg") : "bg-elevated",
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {minClock(s.startMin)} · {s.mins}m
                </p>
                <p className="font-display text-xl font-semibold lg:text-2xl">{s.title}</p>
                <p className="text-sm opacity-80">{s.line}</p>
              </button>
            </li>
          );
        })}
      </ol>
      ) : null}
      {look.slots && day.pin ? (
        <button type="button" className="self-start text-xs font-semibold text-muted" onClick={() => edit(setTeachPin(file, today, period, undefined))}>
          Auto clock
        </button>
      ) : look.slots ? (
        <p className="sr-only">Slots follow the bell.</p>
      ) : null}

      {look.tools ? <DashTools file={file} period={period} /> : null}
      <PollWall file={file} period={period} />
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
      size="md"
      live={liveHere}
    />
  );
}
