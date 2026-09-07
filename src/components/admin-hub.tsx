import { useEffect, useMemo, useState } from "react";
import { QuarterChip } from "@/components/quarter-chip";
import { SettingsBody, type AdminPane } from "@/components/settings";
import { isSubDay, lunchOn, meetingsOn, schooltoolDone, setTodayMeeting } from "@/lib/store";
import { cycleDayLabel, daySlot, formatSchoolDate, todayIso } from "@/lib/calendar";
import { currentCycleOf } from "@/lib/roles";
import { periodTitle, shopBells } from "@/lib/economy";
import { dueCrews, scoredToday } from "@/lib/crews";
import { agendaFor, skillName } from "@/lib/projects";
import { periodClock, periodNow, periodNext, SCHOOLTOOL_URL } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { exportedThisPeriod } from "@/lib/store";
import { abOn } from "@/lib/store";
import type { EconomyFile } from "@/lib/economy";
import { cn } from "@/lib/utils";

type Jump = (period: number, crewKey?: string, date?: string) => void;

export function AdminHub({
  file,
  onChange,
  start = "today",
  onScore,
  onScoreCrew,
  onGrades,
  onProjects,
  onSkills,
  onStocks,
  onStore,
  onStudyHall,
  onClub,
  onExport,
  onSave,
  onHelp,
  onExportNames,
  onTips,
  onData,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  start?: AdminPane;
  onScore: () => void;
  onScoreCrew: Jump;
  onGrades: () => void;
  onProjects: () => void;
  onSkills: () => void;
  onStocks: () => void;
  onStore: () => void;
  onStudyHall: () => void;
  onClub?: () => void;
  onExport: () => void;
  onSave: () => void;
  onHelp: () => void;
  onExportNames: () => void;
  onTips?: (on: boolean) => void;
  onData?: () => void;
}) {
  const [pane, setPane] = useState<AdminPane>(start);
  const [meetDraft, setMeetDraft] = useState("");
  useEffect(() => {
    setPane(start);
  }, [start]);
  const now = useShopClock(file.meta.config?.schedule, "beat");
  const today = todayIso();
  const sub = isSubDay(file, today);
  const cycle = currentCycleOf(file);
  const slot = daySlot(today);
  const letter = abOn(file, today);
  const live = periodNow(file.meta.config?.schedule, now);
  const nxt = periodNext(file.meta.config?.schedule, now);
  const shopPeriods = shopBells(file).map((b) => b.period);
  const shown =
    live != null && shopPeriods.includes(live)
      ? live
      : nxt && shopPeriods.includes(nxt.period)
        ? nxt.period
        : (shopPeriods[0] ?? 1);
  const clock = shown ? periodClock(shown, file.meta.config?.schedule, now) : null;
  const agenda = agendaFor(file, shown);
  const due = useMemo(() => dueCrews(file, today), [file, today]);
  const late = due.filter((d) => d.kind === "late");
  const dueToday = due.filter((d) => d.kind === "due");
  const hits = scoredToday(file, today);
  const st = schooltoolDone(file, today, 1);
  const classMine = shopPeriods.includes(shown);
  const meets = meetingsOn(file, today);
  const lunch = lunchOn(file, today);
  const sent = live != null ? exportedThisPeriod(file, today, live) : true;
  const nav: { id: string; label: string; on: boolean; go: () => void }[] = [
    { id: "today", label: "Today", on: pane === "today", go: () => setPane("today") },
    { id: "data", label: "Data", on: false, go: () => onData?.() },
    { id: "hall", label: "Hall Mgr", on: false, go: onStudyHall },
    ...(onClub ? [{ id: "club", label: "Club", on: false, go: onClub }] : []),
    { id: "vault", label: "Device", on: pane === "vault", go: () => setPane("vault") },
    { id: "more", label: "More", on: pane !== "today" && pane !== "vault", go: () => setPane("modules") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <nav className="tw-gadget mb-2 flex flex-wrap gap-1 p-1" aria-label="Admin">
        {nav.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={n.go}
            className={cn("min-h-10 rounded-md px-3 text-xs font-semibold", n.on ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
          >
            {n.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-auto">
        {pane !== "today" ? (
          <SettingsBody
            file={file}
            tab={pane}
            onChange={onChange}
            onTab={setPane}
            onExportNames={onExportNames}
            onExport={onExport}
            onSave={onSave}
            onTips={onTips}
            onDesk={onScore}
          />
        ) : (
    <div className="flex flex-col gap-3">
      {sub ? (
        <section className="rounded-xl bg-cleanup px-4 py-4 text-accent-fg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Sub today</p>
          <p className="mt-1 font-display text-2xl font-semibold">No scores. Next class is the next cycle day.</p>
          <button type="button" onClick={() => setPane("day")} className="mt-3 min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
            Day settings
          </button>
        </section>
      ) : (
        <section className="tw-gadget p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">My day</p>
              <p className="font-display text-2xl font-semibold leading-none tracking-tight">
                {formatSchoolDate(today)}
                <span className="ml-2 text-base font-medium text-muted">
                  {cycleDayLabel(slot.label, cycle) || `Cycle ${cycle}`} · {letter} day
                </span>
              </p>
            </div>
            <QuarterChip />
          </div>
          {meets.length ? (
            <div className="mt-3 rounded-lg bg-gold/15 px-3 py-2 ring-1 ring-gold">
              {meets.map((m, i) => (
                <p key={`${m.title}-${i}`} className="font-display text-lg font-semibold text-gold">
                  {m.title}
                  {m.time ? <span className="ml-2 text-sm font-medium text-fg">{m.time}</span> : null}
                </p>
              ))}
            </div>
          ) : (
            <form
              className="mt-3 flex flex-wrap gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (!meetDraft.trim()) return;
                onChange(setTodayMeeting(file, today, meetDraft.trim()));
                setMeetDraft("");
              }}
            >
              <input
                value={meetDraft}
                onChange={(e) => setMeetDraft(e.target.value)}
                placeholder="Meeting today · Faculty Meeting"
                className="min-h-10 min-w-48 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
              />
              <button type="submit" className="min-h-10 rounded-md bg-elevated px-3 text-xs font-semibold">
                Pin
              </button>
            </form>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={SCHOOLTOOL_URL}
              target="_blank"
              rel="noreferrer"
              className={cn("inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold", !st ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}
            >
              SchoolTool {st ? "in" : "by 8:15"}
            </a>
            {classMine ? (
              <button type="button" onClick={() => onScoreCrew(shown)} className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
                Score P{shown}
                {clock?.live ? ` · ${clock.cleanup ? "cleanup" : `${Math.max(0, Math.ceil(clock.left))}m`}` : ""}
              </button>
            ) : shown === 6 ? (
              <button type="button" onClick={onStudyHall} className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
                Hall Manager
              </button>
            ) : (
              <button type="button" onClick={onScore} className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
                Open desk
              </button>
            )}
            <button type="button" onClick={onSave} className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", sent ? "bg-elevated text-muted" : "bg-gold text-bg")}>
              {sent ? "Saved" : "Export / save"}
            </button>
            <button type="button" onClick={onGrades} className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
              Book
            </button>
          </div>
          <p className="mt-2 text-sm text-muted">
            {classMine ? (
              <>
                <span className="font-semibold text-fg">{agenda.activityName}</span>
                <span> · {agenda.title}</span>
                {agenda.skillId ? <span> · {skillName(agenda.skillId)}</span> : null}
              </>
            ) : (
              <span>P{shown} {periodTitle(shown, file.meta.bell ?? [])}</span>
            )}
            <span className="mx-2">·</span>
            {hits.hit}/{hits.n} scored
            {dueToday.length ? <span className="ml-2 font-semibold text-loss">{dueToday.length} due</span> : null}
            {late.length ? <span className="ml-2 font-semibold text-loss">{late.length} late</span> : null}
            {lunch ? <span className="ml-2">Lunch {lunch}</span> : null}
          </p>
        </section>
      )}

      <section>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Past due · scoring</p>
          <span className="text-xs text-muted">{due.length ? `${due.length} crews` : "Caught up"}</span>
        </div>
        {due.length === 0 ? (
          <p className="tw-gadget px-4 py-3 text-sm text-muted">Every crew this week has a mark, or today is sub.</p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {due.map((c) => (
              <li key={`${c.date}|${c.period}|${c.key}`}>
                <button
                  type="button"
                  onClick={() => onScoreCrew(c.period, c.key, c.date)}
                  className="tw-gadget flex w-full min-h-12 items-center justify-between gap-2 px-3 text-left"
                >
                  <span className="min-w-0">
                    <span className={cn("text-xs font-bold uppercase tracking-wide", c.kind === "late" ? "text-loss" : "text-gold")}>
                      {c.kind === "late" ? "Overdue" : "Due"}
                    </span>
                    <span className="mt-0.5 block truncate text-sm font-semibold">
                      P{c.period} · {c.name}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {c.date.slice(5)} · {c.marked}/{c.kids.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
        )}
      </div>
    </div>
  );
}