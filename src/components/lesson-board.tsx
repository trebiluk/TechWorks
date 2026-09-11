import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { cycleDayLabel, cycleNow, daySlot, formatSchoolDate, isSchoolDay, nextOpenDay, stepSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { TEACH_PACKS, teachFocusPeriod } from "@/lib/teach";
import { applyLesson, clearLesson, dropLesson, lessonOn, LESSON_CATS, lessonsOf, newLessonId, upsertLesson, type LessonPlan } from "@/lib/lessons";
import { gradeOfPeriod } from "@/lib/projects";
import { useShopClock } from "@/lib/use-clock";
import { abOn, deskBellId } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LessonBoard({
  file,
  unlocked,
  onChange,
  onNeedPin,
  onNow,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  onNeedPin: () => void;
  onNow: () => void;
}) {
  const today = todayIso();
  const now = useShopClock(deskBellId(file, today), "beat");
  const liveP = teachFocusPeriod(file, today, now);
  const shop = shopBells(file);
  const [date, setDate] = useState(today);
  const [cat, setCat] = useState<string>("all");
  const [sel, setSel] = useState<string | null>(null);
  const plans = lessonsOf(file);
  const list = useMemo(() => (cat === "all" ? plans : plans.filter((p) => p.cat === cat)), [plans, cat]);
  const open = plans.find((p) => p.id === sel) ?? list[0] ?? null;
  const slot = daySlot(date);
  const week = weekOn(date);
  const letter = abOn(file, date);
  const q = typeof file.meta.quarterName === "string" ? file.meta.quarterName : undefined;
  const isToday = date === today;

  function edit(next: EconomyFile) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(next);
  }

  function goDate(iso: string) {
    setDate(isSchoolDay(iso) ? iso : nextOpenDay(iso));
  }

  function save(patch: Partial<LessonPlan>) {
    if (!open) return;
    edit(upsertLesson(file, { ...open, ...patch }));
  }

  function park(period: number) {
    if (!open) return;
    const on = lessonOn(file, date, period);
    if (on?.id === open.id) {
      edit(clearLesson(file, date, period));
      return;
    }
    edit(applyLesson(file, open.id, date, period, q));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-1">
      <header className="shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Lesson plans</p>
        <p className="text-sm text-muted">Period shape for this date (enter / listen / work). Unit days live on Learn → Projects → Plan.</p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => goDate(stepSchoolDay(date, -1))} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold" title="Previous school day">
            ‹
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => goDate(e.target.value)}
            className="min-h-11 rounded-md bg-elevated px-2 text-sm outline-none"
            aria-label="Plan date"
          />
          <button type="button" onClick={() => goDate(stepSchoolDay(date, 1))} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold" title="Next school day">
            ›
          </button>
          <button
            type="button"
            onClick={() => goDate(today)}
            className={cn("tw-tap min-h-11 rounded-full px-3 text-xs font-semibold", isToday ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          >
            Today
          </button>
          <span className="px-2 text-sm text-muted">
            {formatSchoolDate(date)}
            {slot.label ? ` · ${cycleDayLabel(slot.label, cycleNow(date))}` : ""}
            <span className="ml-1 font-semibold text-fg">{letter}</span>
            {slot.note ? <span className="text-subtle"> · {slot.note}</span> : null}
            {!isSchoolDay(date) ? <span className="text-loss"> · no school</span> : null}
          </span>
        </div>
        {week?.days?.length ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {week.days.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => goDate(d)}
                className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", d === date ? "bg-fg text-bg" : "bg-elevated text-muted")}
              >
                {formatSchoolDate(d).replace(/,.*/, "")}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
          {shop.map((b) => {
            const on = lessonOn(file, date, b.period);
            const grade = gradeOfPeriod(file, b.period);
            const live = isToday && b.period === liveP;
            const mine = open && on?.id === open.id;
            return (
              <button
                key={b.period}
                type="button"
                title={on ? `${on.title} · tap again to clear` : open ? `Park “${open.title}” on P${b.period}` : "Select a plan first"}
                onClick={() => park(b.period)}
                className={cn(
                  "tw-tap min-h-16 rounded-xl px-2 py-2 text-left",
                  mine ? "bg-accent text-accent-fg" : on ? "bg-elevated ring-1 ring-gold" : "bg-elevated text-muted",
                  live && !mine ? "ring-1 ring-fg" : "",
                )}
              >
                <span className="flex items-baseline justify-between gap-1">
                  <span className="font-display text-lg font-semibold leading-none">P{b.period}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">G{grade}{live ? " · now" : ""}</span>
                </span>
                <span className="mt-1 block truncate text-xs font-semibold">{on?.title ?? "tap to set"}</span>
              </button>
            );
          })}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="mb-1 flex flex-wrap gap-1">
            <button type="button" onClick={() => setCat("all")} className={cn("tw-tap min-h-8 rounded-full px-2.5 text-[11px] font-semibold", cat === "all" ? "bg-fg text-bg" : "bg-elevated text-muted")}>
              All
            </button>
            {LESSON_CATS.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className={cn("tw-tap min-h-8 rounded-full px-2.5 text-[11px] font-semibold", cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}>
                {c}
              </button>
            ))}
          </div>
          <ul className="min-h-0 flex-1 overflow-auto rounded-xl bg-elevated p-1">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSel(p.id)}
                  className={cn("tw-tap flex w-full flex-col items-start rounded-lg px-3 py-2 text-left", open?.id === p.id ? "bg-surface ring-1 ring-gold" : "")}
                >
                  <span className="font-display text-base font-semibold">{p.title}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted">
                    {p.cat}
                    {p.grade ? ` · G${p.grade}` : ""}
                    {p.used?.length ? ` · ${p.used.length}×` : ""}
                  </span>
                </button>
              </li>
            ))}
            {unlocked ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const id = newLessonId();
                    edit(upsertLesson(file, { id, title: "New plan", cat: cat === "all" ? "Shop" : cat, pack: "shop" }));
                    setSel(id);
                  }}
                  className="tw-tap mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-gold"
                >
                  + New plan
                </button>
              </li>
            ) : null}
          </ul>
        </div>
        {open ? (
          <article className="min-h-0 overflow-auto rounded-xl bg-surface p-3">
            {unlocked ? (
              <input
                key={open.id}
                defaultValue={open.title}
                onBlur={(e) => save({ title: e.target.value })}
                className="w-full bg-transparent font-display text-2xl font-semibold outline-none"
              />
            ) : (
              <h2 className="font-display text-2xl font-semibold">{open.title}</h2>
            )}
            <p className="mt-1 text-sm text-muted">Selected · tap a period above to park this on {formatSchoolDate(date)}.</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {LESSON_CATS.map((c) => (
                <button key={c} type="button" onClick={() => unlocked && save({ cat: c })} className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", open.cat === c ? "bg-fg text-bg" : "bg-elevated text-muted")}>
                  {c}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-subtle">Lesson shape</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {TEACH_PACKS.map((p) => (
                <button key={p.id} type="button" onClick={() => unlocked && save({ pack: p.id })} className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", open.pack === p.id ? "bg-fg text-bg" : "bg-elevated text-muted")}>
                  {p.label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-sm">
              <span className="text-xs text-muted">Objective</span>
              <input
                key={`${open.id}-obj`}
                defaultValue={open.objective ?? ""}
                onBlur={(e) => save({ objective: e.target.value })}
                disabled={!unlocked}
                className="mt-1 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
              />
            </label>
            <label className="mt-2 block text-sm">
              <span className="text-xs text-muted">Notes / do this</span>
              <input
                key={`${open.id}-note`}
                defaultValue={open.notes ?? ""}
                onBlur={(e) => save({ notes: e.target.value })}
                disabled={!unlocked}
                className="mt-1 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
              />
            </label>
            {isToday && unlocked ? (
              <button type="button" onClick={onNow} className="tw-tap mt-4 min-h-11 rounded-md bg-fg px-4 text-sm font-semibold text-bg">
                Open Teach for P{liveP}
              </button>
            ) : null}
            {open.used?.length ? (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Parked</p>
                <ul className="mt-1 text-sm text-muted">
                  {[...open.used].reverse().slice(0, 10).map((u, i) => (
                    <li key={`${u.date}-${u.period}-${i}`}>
                      <button type="button" onClick={() => goDate(u.date)} className="tw-tap text-left hover:text-fg">
                        {u.date} · P{u.period}
                        {u.q ? ` · ${u.q}` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {unlocked && !SEED_LOCK.has(open.id) ? (
              <button type="button" onClick={() => edit(dropLesson(file, open.id))} className="mt-4 text-xs font-semibold text-loss">
                Delete plan
              </button>
            ) : null}
          </article>
        ) : (
          <p className="p-4 text-sm text-muted">No plans in this category.</p>
        )}
      </div>
    </div>
  );
}

const SEED_LOCK = new Set(["lsn-shop", "lsn-demo", "lsn-crit", "lsn-train", "lsn-draw", "lsn-free", "lsn-present", "lsn-sub"]);
