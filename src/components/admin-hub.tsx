import { useEffect, useMemo, useState } from "react";
import { QuarterChip } from "@/components/quarter-chip";
import { SettingsBody, type AdminPane, type SettingsTab } from "@/components/settings";
import { traceToday } from "@/lib/workflow";
import { cycleDayLabel, daySlot, formatSchoolDate, todayIso } from "@/lib/calendar";
import { currentCycleOf } from "@/lib/roles";
import { periodTitle, shopBells } from "@/lib/economy";
import { dueCrews, scoredToday } from "@/lib/crews";
import { agendaFor, skillName } from "@/lib/projects";
import { periodClock, periodNow, periodNext, SCHOOLTOOL_URL } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { abOn, deskBellId, deskPacks, exportedThisPeriod, isSubDay, lunchOn, meetingsOn, outNow, schooltoolDone, setDayBell, setSchooltoolDone, setSpecials, specialsOn, setTodayMeeting } from "@/lib/store";
import type { EconomyFile } from "@/lib/economy";
import { CloudBoard } from "@/components/cloud-board";
import { CrewDesk } from "@/components/crew-desk";
import { CtrlPad, CtrlSeg, CtrlTile } from "@/components/ctrl";
import { markOf } from "@/lib/nav-marks";
import { cn } from "@/lib/utils";
import { featureOn } from "@/lib/features";
import { ADMIN_GROUPS, PANE_LABEL, groupOfPane } from "@/lib/admin-nav";
import { cloudStatus } from "@/lib/desk-cloud";
import { markSchooltoolOpened } from "@/lib/workflow";

type Jump = (period: number, crewKey?: string, date?: string) => void;

export function AdminHub({
  file,
  onChange,
  start = "today",
  onScore,
  onScoreCrew,
  onGrades,
  onProjects: _onProjects,
  onSkills: _onSkills,
  onStocks,
  onLucky,
  onStore,
  onPrints,
  onWall,
  onStudyHall,
  onClub,
  onExport,
  onSave,
  onHelp: _onHelp,
  onExportNames,
  onTips,
  onData: _onData,
  onOpenId,
  onTeach,
  onPolls,
  unlocked = false,
  onNeedPin,
  onPane,
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
  onLucky?: () => void;
  onStore: () => void;
  onPrints?: () => void;
  onWall?: () => void;
  onStudyHall: () => void;
  onClub?: () => void;
  onExport: () => void;
  onSave: () => void;
  onHelp: () => void;
  onExportNames: () => void;
  onTips?: (on: boolean) => void;
  onData?: () => void;
  onOpenId?: (id: string) => void;
  onTeach?: () => void;
  onPolls?: () => void;
  unlocked?: boolean;
  onNeedPin?: () => void;
  onPane?: (pane: AdminPane) => void;
}) {
  const [more, setMore] = useState(false);
  const [pane, setPane] = useState<AdminPane>(start);
  const [meetDraft, setMeetDraft] = useState("");
  const [specDate, setSpecDate] = useState(() => todayIso());
  const [draftWho, setDraftWho] = useState("Grade 6");
  const [draftTitle, setDraftTitle] = useState("Assembly");
  const [draftPlace, setDraftPlace] = useState("Auditorium");
  const [draftStart, setDraftStart] = useState("08:00");
  const [draftEnd, setDraftEnd] = useState("08:40");
  useEffect(() => {
    setPane(start);
  }, [start]);
  function pickPane(next: AdminPane) {
    setPane(next);
    onPane?.(next);
  }
  const now = useShopClock(deskBellId(file), "beat");
  const today = todayIso();
  const sub = isSubDay(file, today);
  const cycle = currentCycleOf(file);
  const slot = daySlot(today);
  const letter = abOn(file, today);
  const live = periodNow(deskBellId(file), now);
  const nxt = periodNext(deskBellId(file), now);
  const shopPeriods = shopBells(file).map((b) => b.period);
  const shown =
    live != null && shopPeriods.includes(live)
      ? live
      : nxt && shopPeriods.includes(nxt.period)
        ? nxt.period
        : (shopPeriods[0] ?? 1);
  const clock = shown ? periodClock(shown, deskBellId(file), now) : null;
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
  const away = outNow(file, today);
  const group = groupOfPane(pane);
  const inner = group.panes.length > 1 ? [...group.panes] : [];
  const rooms: { id: string; label: string; on: boolean; go: () => void; show: boolean }[] = [
    ...ADMIN_GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      on: group.id === g.id,
      go: () => {
        if (g.id === "wall" && onWall) {
          onWall();
          return;
        }
        pickPane(g.panes[0] as AdminPane);
      },
      show: true,
    })),
    { id: "club", label: "Club", on: false, go: () => onClub?.(), show: featureOn(file, "club") && Boolean(onClub) },
    { id: "hall", label: "Hall", on: false, go: () => onStudyHall(), show: featureOn(file, "studyhall") },
    { id: "prints", label: "Prints", on: false, go: () => onPrints?.(), show: featureOn(file, "prints") && Boolean(onPrints) },
    { id: "lucky", label: "Lucky", on: false, go: () => onLucky?.(), show: featureOn(file, "lucky") && Boolean(onLucky) },
    { id: "stocks", label: "Stocks", on: false, go: () => onStocks(), show: featureOn(file, "stocks") },
    { id: "store", label: "Store", on: false, go: () => onStore(), show: featureOn(file, "store") },
  ];

  const dailyIds = new Set(["today", "day", "records", "people", "wall"]);
  const dailyRooms = rooms.filter((r) => r.show && dailyIds.has(r.id));
  const moreRooms = rooms.filter((r) => r.show && !dailyIds.has(r.id));
  const cloud = cloudStatus();
  const cloudDue = cloud === "this-pc" || cloud === "off" || cloud === "need-key" || cloud === "error";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-1 pb-2">
        <CtrlPad>
          {dailyRooms.map((r) => (
            <CtrlTile key={r.id} id={r.id} label={r.label} on={r.on} onClick={r.go} mark={markOf(r.id)} />
          ))}
        </CtrlPad>
        <button
          type="button"
          onClick={() => setMore((v) => !v)}
          className={cn("tw-tap mt-1 min-h-10 w-full rounded-xl text-xs font-bold uppercase tracking-wide", more ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
        >
          {more ? "Less" : "More · Class Theme Club"}
        </button>
        {more ? (
          <CtrlPad className="mt-1">
            {moreRooms.map((r) => (
              <CtrlTile key={r.id} id={r.id} label={r.label} on={r.on} onClick={r.go} mark={markOf(r.id)} />
            ))}
          </CtrlPad>
        ) : null}
        {inner.length ? (
          <div className="mt-1">
            <CtrlSeg
              items={inner.map((id) => ({ id, label: PANE_LABEL[id] ?? id }))}
              value={pane}
              onChange={(id) => pickPane(id as AdminPane)}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {pane === "crews" ? (
          <CrewDesk file={file} onChange={onChange} startPeriod={shown} />
        ) : pane === "cloud" ? (
          <CloudBoard file={file} unlocked={unlocked} onNeedPin={() => onNeedPin?.()} onLoad={onChange} />
        ) : pane === "wall" ? (
          <p className="p-3 text-sm text-muted">The wall is the projector. Unlock and stay on Dash — drag plates there. This pad is records and the day.</p>
        ) : pane !== "today" ? (
          <SettingsBody
            file={file}
            tab={pane as SettingsTab}
            onChange={onChange}
            onTab={undefined}
            onExportNames={onExportNames}
            onExport={onExport}
            onSave={onSave}
            onTips={onTips}
            onDesk={onScore}
            onOpenId={onOpenId}
            onOpenMod={(id) => {
              if (id === "crews") {
                setPane("crews");
                return;
              }
              if (id === "club") onClub?.();
              else if (id === "studyhall") onStudyHall();
              else if (id === "prints") onPrints?.();
              else if (id === "wallet") onStocks();
              else if (id === "lucky") onLucky?.();
              else if (id === "store") onStore();
              else if (id === "polls") onPolls?.();
              else if (id === "teach") onTeach?.();
            }}
          />
        ) : (
    <div className="grid items-start gap-3 lg:grid-cols-2">
    <div className="flex flex-col gap-3">
      {sub ? (
        <section className="rounded-xl bg-cleanup px-4 py-4 text-accent-fg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Sub today</p>
          <p className="mt-1 font-display text-2xl font-semibold">No scores. Next class is the next cycle day.</p>
          <button type="button" onClick={() => setPane("today")} className="mt-3 min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
            Schedule
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
          <button
            type="button"
            onClick={() => pickPane("day")}
            className="tw-tap mt-3 min-h-11 w-full rounded-xl bg-elevated px-3 text-left text-sm font-semibold"
          >
            Plan ahead · any day through June, or copy a quarter
          </button>
          {cloudDue ? (
            <button
              type="button"
              onClick={() => pickPane("cloud")}
              className="mt-3 w-full rounded-xl bg-cleanup px-3 py-2 text-left text-sm font-semibold text-accent-fg"
            >
              Cloud is not bound. Tap for the desk key so the other shop PC gets tonight's save.
            </button>
          ) : null}
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
            <p className="mt-3 text-sm text-muted">Pin a meeting on the right.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={SCHOOLTOOL_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => markSchooltoolOpened(today)}
              className={cn("inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold", !st ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}
            >
              SchoolTool {st ? "open" : "open · by 8:15"}
            </a>
            <button
              type="button"
              onClick={() => onChange(setSchooltoolDone(file, today, 1, !st))}
              className={cn("min-h-11 rounded-xl px-3 text-sm font-semibold", st ? "bg-gain text-bg" : "bg-gold text-bg")}
            >
              {st ? "Undo in" : "I'm in"}
            </button>
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
          {away.length ? (
            <div className="mt-3 rounded-lg bg-cleanup/20 px-3 py-2 ring-1 ring-cleanup">
              <p className="text-[11px] font-bold uppercase tracking-wide text-cleanup">Out of room</p>
              {away.map(({ student, where, pass }) => (
                <p key={student.id} className="text-sm font-semibold">
                  {student.first}
                  <span className="ml-2 font-mono text-muted">
                    {where}
                    {pass?.out ? ` · left ${pass.out}` : ""}
                    {pass?.in ? ` · back ${pass.in}` : ""}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
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
          <ol className="mt-3 grid gap-1 sm:grid-cols-2">
            {traceToday(file, today).map((t) => (
              <li
                key={`${t.role}-${t.label}`}
                className={cn(
                  "flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-sm",
                  t.state === "due" ? "bg-loss/15" : "bg-elevated/60",
                )}
              >
                <span className="font-semibold">
                  <span className={cn("mr-1.5 inline-block size-1.5 rounded-full", t.state === "ok" ? "bg-gain" : t.state === "due" ? "bg-loss" : "bg-muted")} />
                  {t.label}
                </span>
                <span className="truncate text-xs text-muted">{t.detail}</span>
              </li>
            ))}
          </ol>
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
    <div className="flex flex-col gap-3">
      <section className="tw-gadget p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Schedule · announcements</p>
        <p className="mt-1 text-sm text-muted">Pin a meeting or special for today. Plan any later day on Day.</p>
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
        <details className="mt-3 text-sm" open={specialsOn(file, specDate).length > 0}>
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted">
            Assembly / specials
            {specialsOn(file, specDate).length ? ` · ${specialsOn(file, specDate).length}` : ""}
          </summary>
          <form
            className="mt-2 flex flex-col gap-2 rounded-lg bg-elevated/80 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              onChange(
                setSpecials(file, specDate, [
                  ...specialsOn(file, specDate),
                  { title: draftTitle, who: draftWho, place: draftPlace, start: draftStart, end: draftEnd },
                ]),
              );
            }}
          >
            <input type="date" value={specDate} onChange={(e) => setSpecDate(e.target.value || specDate)} className="min-h-10 w-44 rounded-md bg-bg px-2 text-sm" />
            <ul className="flex flex-col gap-1">
              {specialsOn(file, specDate).map((s, i) => (
                <li key={`${s.title}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-bg px-2 py-1 text-sm text-fg">
                  <span>
                    <span className="font-semibold">{s.who || "All"}</span> · {s.title}
                    <span className="ml-2 text-muted">
                      {s.place} {s.start}–{s.end}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted"
                    onClick={() => onChange(setSpecials(file, specDate, specialsOn(file, specDate).filter((_, j) => j !== i)))}
                  >
                    Drop
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-1">
              {["Grade 6", "Grade 7", "Grade 8", "All"].map((w) => (
                <button key={w} type="button" onClick={() => setDraftWho(w)} className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", draftWho === w ? "bg-fg text-bg" : "bg-bg text-muted")}>
                  {w}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Assembly" className="min-h-10 min-w-32 flex-1 rounded-md bg-bg px-2 text-sm" />
              <input value={draftPlace} onChange={(e) => setDraftPlace(e.target.value)} placeholder="Auditorium" className="min-h-10 w-36 rounded-md bg-bg px-2 text-sm" />
              <input type="time" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} className="min-h-10 rounded-md bg-bg px-2 text-sm" />
              <input type="time" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} className="min-h-10 rounded-md bg-bg px-2 text-sm" />
              <button type="submit" className="min-h-10 rounded-md bg-gold px-3 text-xs font-semibold text-bg">
                Add to board
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {deskPacks(file).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange(setDayBell(file, specDate, p.id))}
                  className={cn("min-h-9 rounded-full px-3 text-xs font-semibold", deskBellId(file, specDate) === p.id ? "bg-fg text-bg" : "bg-bg text-muted")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </form>
        </details>
        <button
          type="button"
          onClick={() => pickPane("day")}
          className="tw-tap mt-3 min-h-11 w-full rounded-xl bg-fg px-3 text-sm font-semibold text-bg"
        >
          Open year plan
        </button>
      </section>
    </div>
    </div>
        )}
      </div>
    </div>
  );
}