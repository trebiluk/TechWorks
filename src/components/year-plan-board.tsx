import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { formatSchoolDate, isSchoolDay, quarterNow, reason, schoolDays, stepSchoolDay, todayIso } from "@/lib/calendar";
import {
  deskBellId,
  deskPacks,
  isSubDay,
  lunchOn,
  meetingsOn,
  periodGoal,
  setDayBell,
  setDayCards,
  setLunch,
  setPeriodGoal,
  setSubDay,
  setTodayMeeting,
  dayCardsOn,
} from "@/lib/store";
import { copyDayPlan, copyDayToRestOfQuarter, copyDayToRestOfYear, copyQuarterCurriculum, isPlannedDay, schoolDaysInQuarter } from "@/lib/year-plan";
import { agendaFor } from "@/lib/projects";
import { cn } from "@/lib/utils";

export function YearPlanBoard({
  file,
  onChange,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
}) {
  const today = todayIso();
  const [date, setDate] = useState(today);
  const [notice, setNotice] = useState("");
  const q = quarterNow(date);
  const closed = reason(date);
  const school = isSchoolDay(date);
  const cards = dayCardsOn(file, date);
  const meet = meetingsOn(file, date)[0];
  const lunch = lunchOn(file, date);
  const sub = isSubDay(file, date);
  const bell = deskBellId(file, date);
  const periods = shopBells(file);
  const days = useMemo(() => schoolDays(), []);
  const qDays = useMemo(() => schoolDaysInQuarter(q.n), [q.n]);
  const qIndex = qDays.indexOf(date);
  const plannedOn = isPlannedDay(file, date);

  function go(dir: -1 | 1) {
    const next = stepSchoolDay(date, dir);
    if (next) setDate(next);
  }

  function note(msg: string) {
    setNotice(msg);
  }

  return (
    <section className="tw-gadget p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Year plan</p>
      <p className="mt-1 text-sm text-muted">Lunch, sub, bells, and wall cards for any school day. The unit calendar is Learn → Projects → Plan.</p>
      <div className="mt-3 flex flex-wrap items-center gap-1">
        <button type="button" onClick={() => go(-1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold">
          ‹
        </button>
        <input
          type="date"
          value={date}
          min={days[0]?.date}
          max={days.at(-1)?.date}
          onChange={(e) => setDate(e.target.value || today)}
          className="min-h-11 rounded-xl bg-elevated px-3 text-sm outline-none"
        />
        <button type="button" onClick={() => go(1)} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold">
          ›
        </button>
        <button type="button" onClick={() => setDate(today)} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold">
          Today
        </button>
        <span className="text-sm font-semibold">
          {formatSchoolDate(date)}
          <span className="ml-2 text-muted">{q.label}</span>
          {qIndex >= 0 ? (
            <span className="ml-2 font-mono text-xs font-medium text-muted">
              day {qIndex + 1}/{qDays.length}
            </span>
          ) : null}
          {plannedOn ? <span className="ml-2 text-xs font-bold uppercase tracking-wide text-gain">Planned</span> : null}
        </span>
      </div>
      {!school ? <p className="mt-2 text-sm font-semibold text-loss">{closed ?? "No school"}</p> : null}

      {school ? (
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Meeting on the wall</span>
            <input
              value={meet?.title ?? ""}
              onChange={(e) => onChange(setTodayMeeting(file, date, e.target.value, meet?.time))}
              placeholder="Open house · assembly"
              className="min-h-11 rounded-xl bg-elevated px-3 outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Lunch</span>
            <input
              value={lunch}
              onChange={(e) => onChange(setLunch(file, date, e.target.value))}
              placeholder="What's on the tray"
              className="min-h-11 rounded-xl bg-elevated px-3 outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onChange(setSubDay(file, date, !sub))}
              className={cn("tw-tap min-h-11 rounded-xl px-3 text-sm font-semibold", sub ? "bg-work-pto text-accent-fg" : "bg-elevated text-muted")}
            >
              {sub ? "Sub · on" : "Sub day"}
            </button>
            {deskPacks(file).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(setDayBell(file, date, p.id))}
                className={cn("tw-tap min-h-11 rounded-xl px-3 text-xs font-semibold", bell === p.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {p.label}
              </button>
            ))}
          </div>
          {([0, 1] as const).map((i) => (
            <div key={i} className="grid gap-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Wall card {i + 1}</p>
              <input
                value={cards[i]?.title ?? ""}
                onChange={(e) => {
                  const next = [...cards];
                  next[i] = { title: e.target.value, body: cards[i]?.body ?? "" };
                  onChange(setDayCards(file, date, next));
                }}
                placeholder="Title"
                className="min-h-11 rounded-xl bg-elevated px-3 text-sm outline-none"
              />
              <textarea
                value={cards[i]?.body ?? ""}
                onChange={(e) => {
                  const next = [...cards];
                  next[i] = { title: cards[i]?.title ?? "", body: e.target.value };
                  onChange(setDayCards(file, date, next));
                }}
                placeholder="One or two lines"
                rows={2}
                className="rounded-xl bg-elevated px-3 py-2 text-sm outline-none"
              />
            </div>
          ))}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Period goals</p>
            <p className="text-xs text-muted">The plan book fills the wall. Type here only to override that day’s line.</p>
            <ul className="mt-1 grid gap-1">
              {periods.map((b) => {
                const planned = agendaFor(file, b.period, date);
                return (
                <li key={b.period} className="flex items-center gap-2">
                  <span className="w-8 text-xs font-bold">P{b.period}</span>
                  <input
                    value={periodGoal(file, date, b.period)}
                    onChange={(e) => onChange(setPeriodGoal(file, date, b.period, e.target.value))}
                    placeholder={planned.activityName ? `${planned.activityName} · ${planned.title}` : "Override the project stage"}
                    className="min-h-10 flex-1 rounded-xl bg-elevated px-3 text-sm outline-none"
                  />
                </li>
                );
              })}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                const nxt = stepSchoolDay(date, 1);
                if (!nxt) return;
                onChange(copyDayPlan(file, date, nxt));
                note(`Copied onto ${nxt}`);
              }}
              className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
            >
              Copy to next school day
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(copyDayToRestOfQuarter(file, date));
                note(`Copied through ${q.label}`);
              }}
              className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
            >
              Copy through {q.label}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(copyDayToRestOfYear(file, date));
                note("Copied through last student day");
              }}
              className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-sm font-semibold"
            >
              Copy through June
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl bg-elevated p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Copy a quarter</p>
        <p className="mt-1 text-sm text-muted">
          Duplicates grade projects onto the next quarter’s cycles, copies planned days in order, and snapshots the Deck so you can edit slides without losing this quarter.
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                onChange(copyQuarterCurriculum(file, n, (n + 1) as 2 | 3 | 4));
                note(`Q${n} curriculum is now on Q${n + 1}. Edit projects and Deck.`);
              }}
              className="tw-tap min-h-11 rounded-xl bg-fg px-3 text-sm font-semibold text-bg"
            >
              Copy Q{n} → Q{n + 1}
            </button>
          ))}
        </div>
      </div>
      {notice ? <p className="mt-2 text-sm font-semibold">{notice}</p> : null}
    </section>
  );
}
