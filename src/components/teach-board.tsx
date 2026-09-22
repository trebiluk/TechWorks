import { useState } from "react";
import { BookOpen, CalendarDays, Megaphone, PanelsTopLeft, Paperclip, Presentation, Printer } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { periodClock, periodNow, formatBell } from "@/lib/bells";
import { deskBellId } from "@/lib/store";
import { formatSchoolDate, isSchoolDay, nextOpenDay, stepSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { useShopClock } from "@/lib/use-clock";
import { loadHourPick, saveHourPick, slotNow, teachFocusPeriod } from "@/lib/teach";
import { dayHourStatus } from "@/lib/hour-flow";
import { cn } from "@/lib/utils";
import { LessonPlanSheet } from "@/components/lesson-plan-sheet";
import { CleanupJobsPad } from "@/components/cleanup-wall";
import { TeachPocket, type TeachTool } from "@/components/teach-pocket";
import { TeachLive } from "@/components/teach-live";
import { DayFacts } from "@/components/day-facts";

export function TeachBoard({
  file,
  unlocked,
  date: dateProp,
  onDate,
  onChange,
  onNeedPin,
  onPolls,
  onPlan,
  onWords,
  onWall,
  onDeck,
}: {
  file: EconomyFile;
  unlocked: boolean;
  date?: string;
  onDate?: (iso: string) => void;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onPolls?: () => void;
  onPlan?: (date?: string, period?: number) => void;
  onWords?: () => void;
  onWall?: () => void;
  onDeck?: () => void;
}) {
  const today = todayIso();
  const date = dateProp || nextOpenDay(today);
  const now = useShopClock(deskBellId(file, today), "beat");
  const shop = shopBells(file).map((b) => b.period);
  const live = date === today ? periodNow(deskBellId(file, today), now) : null;
  const [pick, setPick] = useState<number | null>(() => loadHourPick());
  const period = date === today ? teachFocusPeriod(file, today, now, pick) : (pick && shop.includes(pick) ? pick : shop[0] ?? 1);
  const clock = date === today ? periodClock(period, deskBellId(file, today), now) : null;
  const cur = date === today ? slotNow(file, today, period, now) : null;
  const cleanup = Boolean(clock?.cleanup || cur?.clean);
  const liveHere = Boolean(clock?.live);
  const [printOn, setPrintOn] = useState(false);

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

  function focusHang() {
    window.requestAnimationFrame(() => {
      document.querySelector("[data-teach-hang]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  const tools: TeachTool[] = [
    ...(onPlan ? [{ id: "plan", label: "PlanIt", title: "Write the hour", icon: CalendarDays, onClick: () => onPlan(date, period) }] : []),
    ...(onDeck ? [{ id: "deck", label: "Deck", title: "Play this hour", icon: Presentation, onClick: onDeck }] : []),
    ...(onWall ? [{ id: "wall", label: "Projector", title: "Kid wall — this hour", icon: PanelsTopLeft, onClick: onWall }] : []),
    { id: "hang", label: "Hang", title: "Drive / Slides / YouTube on this hour", icon: Paperclip, onClick: focusHang },
    { id: "print", label: "Print", title: "Print this lesson", icon: Printer, onClick: () => setPrintOn(true) },
    ...(onWords ? [{ id: "words", label: "Words", title: "Shop words", icon: BookOpen, onClick: onWords }] : []),
    ...(onPolls ? [{ id: "polls", label: "Polls", title: "Class poll", icon: Megaphone, onClick: onPolls }] : []),
  ];

  return (
    <div className="tw-teach-stage flex min-h-0 flex-1 flex-col" data-wall-stage="show">
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
          period={period}
        />
      ) : null}

      <div className="tw-planit-mf min-h-0 flex-1" data-teach-mf>
        <TeachLive
          file={file}
          date={date}
          period={period}
          unlocked={unlocked}
          onEdit={edit}
          onNeedPin={onNeedPin}
          onPlan={onPlan ? () => onPlan(date, period) : undefined}
          onDeck={onDeck}
        />
      </div>
    </div>
  );
}
