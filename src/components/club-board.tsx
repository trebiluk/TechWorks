"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLUB_CLEAN_JOBS,
  CLUB_DISMISS,
  CLUB_DOW,
  CLUB_OVERLAY,
  CLUB_STATIONS,
  CLUB_CASH,
  CLUB_XP,
  CLUB_WALL_CARDS,
  activityLeft,
  addClubEvent,
  addDaysIso,
  addMember,
  checkinMember,
  clubClock,
  clubStudentId,
  dropClubEvent,
  dropMember,
  loadClub,
  meetingOf,
  minutesText,
  mondayOf,
  patchMeeting,
  patchMember,
  rowOf,
  saveClub,
  setActivity,
  setDayClub,
  startActivity,
  stopActivity,
  toggleWallCard,
  toggleWeekday,
  upcomingEvents,
  wallCardOn,
  weekGrid,
  type ClubDismiss,
  type ClubFile,
  type ClubStation,
} from "@/lib/club";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { grantClubEarn } from "@/lib/store";
import type { EconomyFile } from "@/lib/economy";
import { downloadText } from "@/lib/live";
import { ringBell } from "@/lib/bells";
import { Berty } from "@/components/berty";
import { TouchTimer } from "@/components/touch-timer";
import { cn } from "@/lib/utils";

function useClubTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return clubClock(now);
}

export function ClubBoard({
  unlocked,
  onNeedPin,
  wall,
  onWall,
  desk,
  onDesk,
}: {
  unlocked: boolean;
  onNeedPin: () => void;
  wall?: boolean;
  onWall?: () => void;
  desk?: EconomyFile;
  onDesk?: (next: EconomyFile) => void;
}) {
  const [file, setFile] = useState<ClubFile>(() => loadClub());
  const [date] = useState(() => todayIso());
  const clock = useClubTick();
  const rang = useRef("");
  const meet = meetingOf(file, date);
  const [name, setName] = useState("");
  const [station, setStation] = useState<ClubStation>("workshop");
  const [dismiss, setDismiss] = useState<ClubDismiss>("latebus");
  const [weekMon, setWeekMon] = useState(() => mondayOf(todayIso()));
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    if (clock.phase !== "warn" && clock.phase !== "clean") return;
    const key = `${date}-${clock.phase}`;
    if (rang.current === key) return;
    rang.current = key;
    ringBell();
  }, [clock.phase, date]);

  function commit(next: ClubFile) {
    setFile(next);
    saveClub(next);
  }
  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }
  function edit(patch: Parameters<typeof patchMeeting>[2]) {
    if (!gate()) return;
    commit(patchMeeting(file, date, patch));
  }
  function cal(next: ClubFile) {
    if (!gate()) return;
    commit(next);
  }

  const days = weekGrid(file, weekMon);
  const weekNote = file.weekNote[weekMon] ?? "";
  const present = meet.rows.filter((r) => r.in);
  const bus = present.filter((r) => r.dismiss === "latebus");
  const byStation = useMemo(
    () => Object.fromEntries(CLUB_STATIONS.map((s) => [s.id, present.filter((r) => r.station === s.id)])),
    [present],
  );
  const overlay = CLUB_OVERLAY.find((o) => o.n === meet.overlay);
  const roster = [...file.members].sort((a, b) => a.name.localeCompare(b.name));
  const hereN = roster.filter((m) => rowOf(meet, m.id)?.in).length;

  function add() {
    if (!gate()) return;
    const n = name.trim();
    if (!n) return;
    let next = addMember(file, n, station, dismiss, desk ? clubStudentId(desk, n) : undefined);
    const mem = next.members[next.members.length - 1];
    if (mem) next = checkinMember(next, date, { ...mem, station, dismiss }, true);
    commit(next);
    setName("");
  }

  if (wall) {
    const comps = upcomingEvents(file, "comp");
    const events = upcomingEvents(file, "event");
    const left = activityLeft(file.activity);
    const actOn = Boolean(file.activity.startedAt) && left > 0;
    const m = Math.floor(left / 60);
    const s = Math.floor(left % 60);
    const actLabel = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    if (clock.cleanup) {
      return (
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-cleanup px-5 py-4 text-accent-fg">
          <header className="flex shrink-0 items-center gap-3">
            <Berty pose="point" size="md" alert />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em]">Tech Club · 3:00–3:05</p>
              <h1 className="font-display text-5xl font-semibold leading-none tracking-tight">Cleanup</h1>
              <p className="mt-1 text-lg">{clock.headline}</p>
            </div>
            <p className="font-display text-6xl font-semibold tabular-nums">{clock.label}</p>
          </header>
          <div className="mt-3 grid min-h-0 flex-1 grid-cols-12 gap-3 overflow-auto">
            <div className="col-span-5 rounded-xl bg-black/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Jobs</p>
              <ol className="mt-2 space-y-2">
                {CLUB_CLEAN_JOBS.map((j, i) => (
                  <li key={j} className="flex gap-2 text-xl leading-snug">
                    <span className="w-6 font-mono text-sm opacity-70">{i + 1}</span>
                    <span>{j}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="col-span-4 rounded-xl bg-black/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Stations</p>
              <ul className="mt-2 space-y-2">
                {CLUB_STATIONS.map((st) => (
                  <li key={st.id}>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-80">{st.label}</p>
                    <p className="text-lg font-semibold">{(byStation[st.id] ?? []).map((r) => r.name).join(" · ") || "clear"}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-3 rounded-xl bg-black/20 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] opacity-80">Late bus · {bus.length}</p>
              <p className="mt-2 font-display text-2xl font-semibold leading-snug">{bus.map((r) => r.name).join(" · ") || "None"}</p>
              <p className="mt-3 text-sm opacity-80">Pickup stays seated. Walkers wait for the all-clear.</p>
            </div>
          </div>
        </section>
      );
    }
    const show = (id: (typeof CLUB_WALL_CARDS)[number]["id"]) => wallCardOn(file, id);
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className={cn("flex items-center justify-between rounded-xl px-4 py-3", clock.phase === "warn" ? "bg-cleanup text-accent-fg" : "bg-surface")}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">Technology Club</p>
            <p className="font-display text-2xl font-semibold">{clock.headline}</p>
          </div>
          <p className="font-display text-4xl font-semibold tabular-nums">{clock.phase === "work" || clock.phase === "sign" || clock.phase === "warn" || clock.phase === "arrive" ? clock.label : ""}</p>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-2 overflow-auto">
          {show("activity") ? (
            <section className="col-span-4 flex flex-col rounded-xl bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Activity</p>
              <p className="font-display text-3xl font-semibold leading-none">{file.activity.title || "Choice stations"}</p>
              <p className={cn("mt-2 font-display font-semibold tabular-nums", actOn ? "text-5xl text-accent" : "text-4xl text-muted")}>{actLabel}</p>
              <p className="mt-1 text-sm text-muted">{actOn ? "Running" : file.activity.startedAt ? "Done" : `${file.activity.mins} min ready`}</p>
            </section>
          ) : null}
          {show("comps") ? (
            <section className="col-span-4 rounded-xl bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Competitions</p>
              {comps.length ? (
                <ul className="mt-2 space-y-2">
                  {comps.slice(0, 4).map((e) => (
                    <li key={e.id}>
                      <p className="font-display text-xl font-semibold leading-none">{e.title}</p>
                      <p className="text-sm text-muted">{formatSchoolDate(e.date)}{e.note ? ` · ${e.note}` : ""}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No competitions posted.</p>
              )}
            </section>
          ) : null}
          {show("events") ? (
            <section className="col-span-4 rounded-xl bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Upcoming</p>
              {events.length ? (
                <ul className="mt-2 space-y-2">
                  {events.slice(0, 4).map((e) => (
                    <li key={e.id}>
                      <p className="font-display text-xl font-semibold leading-none">{e.title}</p>
                      <p className="text-sm text-muted">{formatSchoolDate(e.date)}{e.note ? ` · ${e.note}` : ""}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No events posted.</p>
              )}
            </section>
          ) : null}
          {show("stations") ? (
            <div className="col-span-12 grid min-h-0 grid-cols-4 gap-2">
              {CLUB_STATIONS.map((st) => (
                <section key={st.id} className="flex min-h-0 flex-col rounded-xl bg-surface p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">{st.label}</p>
                  <ul className="mt-2 grid grid-cols-1 gap-1 overflow-auto">
                    {(byStation[st.id] ?? []).map((r) => (
                      <li key={r.id} className="rounded-md bg-elevated px-2 py-1 text-sm font-semibold">
                        {r.name}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
          {show("overlay") && overlay ? (
            <section className="col-span-6 rounded-xl bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Workshop overlay</p>
              <p className="font-display text-3xl font-semibold">{overlay.n} · {overlay.title}</p>
              <p className="mt-1 text-sm text-muted">{overlay.stamp}. Other stations still run.</p>
            </section>
          ) : null}
          {show("bus") ? (
            <section className="col-span-6 rounded-xl bg-surface px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Late bus · {bus.length}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{bus.map((r) => r.name).join("  ·  ") || "—"}</p>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <header className={cn("flex shrink-0 flex-wrap items-center gap-2 rounded-xl px-3 py-2", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface")}>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Technology Club · {formatSchoolDate(date)}</p>
          <p className="font-display text-xl font-semibold">{clock.headline}</p>
        </div>
        <p className="font-mono text-2xl font-semibold tabular-nums">{clock.label}</p>
        <span className="rounded-md bg-elevated px-2 py-1 text-xs font-semibold">{hereN}/{roster.length} in</span>
        {onWall ? (
          <button type="button" onClick={onWall} className="min-h-10 rounded-md bg-elevated px-3 text-xs font-semibold">
            Wall
          </button>
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(18rem,34%)_1fr]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-auto">
          <section className="rounded-xl bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Today’s goal</p>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => edit({ overlay: 0 })}
                className={cn("tw-tap min-h-14 rounded-lg px-2 text-left text-xs font-semibold", meet.overlay === 0 ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                Choice stations
              </button>
              {CLUB_OVERLAY.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  onClick={() => edit({ overlay: o.n })}
                  className={cn("tw-tap min-h-14 rounded-lg px-2 text-left text-xs font-semibold", meet.overlay === o.n ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                >
                  {o.n} {o.title}
                </button>
              ))}
            </div>
            {overlay ? <p className="mt-2 text-sm text-muted">Workshop invite · {overlay.stamp}. Other stations still run.</p> : null}
          </section>

          <TouchTimer title="Custom timer" />

          <section className="rounded-xl bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Activity timer</p>
            <input
              value={file.activity.title}
              onChange={(e) => gate() && commit(setActivity(file, { title: e.target.value }))}
              placeholder="What they're doing"
              className="mt-2 min-h-10 w-full rounded-md bg-elevated px-3 text-sm outline-none"
            />
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={40}
                value={file.activity.mins}
                onChange={(e) => gate() && commit(setActivity(file, { mins: Math.max(1, Number(e.target.value) || 1) }))}
                className="min-h-10 w-16 rounded-md bg-elevated px-2 text-sm outline-none"
              />
              <span className="text-xs text-muted">min</span>
              <button type="button" onClick={() => gate() && commit(startActivity(file))} className="tw-tap min-h-10 flex-1 rounded-md bg-accent px-2 text-xs font-semibold text-accent-fg">
                Start
              </button>
              <button type="button" onClick={() => gate() && commit(stopActivity(file))} className="tw-tap min-h-10 rounded-md bg-elevated px-2 text-xs font-semibold">
                Reset
              </button>
            </div>
          </section>

          <section className={cn("rounded-xl p-3", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface")}>
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Cleanup alarm</p>
            <p className="font-display text-4xl font-semibold tabular-nums">{clock.label}</p>
            <p className="text-sm">{clock.headline}</p>
            <button
              type="button"
              onClick={() => ringBell()}
              className="tw-tap mt-2 min-h-12 w-full rounded-md bg-elevated px-3 text-sm font-semibold text-fg"
            >
              Ring now
            </button>
          </section>

          <section className="rounded-xl bg-surface p-3">
            <button type="button" onClick={() => setCalOpen((v) => !v)} className="text-[11px] font-semibold uppercase tracking-widest text-subtle">
              Calendar {calOpen ? "· hide" : ""}
            </button>
            {calOpen ? (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1">
                  {CLUB_DOW.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => cal(toggleWeekday(file, d.id))}
                      className={cn("min-h-10 rounded-md px-2 text-xs font-semibold", file.weekdays.includes(d.id) ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setWeekMon(addDaysIso(weekMon, -7))} className="min-h-9 rounded-md bg-elevated px-2 text-xs font-semibold">‹</button>
                  <p className="text-sm font-semibold">Week of {weekMon.slice(5)}</p>
                  <button type="button" onClick={() => setWeekMon(addDaysIso(weekMon, 7))} className="min-h-9 rounded-md bg-elevated px-2 text-xs font-semibold">›</button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {days.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      disabled={!d.school && !d.extra}
                      onClick={() => cal(setDayClub(file, d.date, !d.club))}
                      className={cn("rounded-lg p-2 text-left", d.club ? "bg-elevated ring-1 ring-accent" : "bg-elevated/50", !d.school ? "opacity-40" : "")}
                    >
                      <p className="text-[11px] font-semibold">{d.label}</p>
                      <p className="text-[10px] text-muted">{d.club ? "CLUB" : "off"}</p>
                    </button>
                  ))}
                </div>
                <input
                  value={weekNote}
                  onChange={(e) => cal({ ...file, weekNote: { ...file.weekNote, [weekMon]: e.target.value } })}
                  placeholder="This week…"
                  className="min-h-10 w-full rounded-md bg-elevated px-3 text-sm outline-none"
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {file.weekdays.map((d) => CLUB_DOW.find((x) => x.id === d)?.label).join(" · ") || "No day"} · {days.filter((d) => d.club).map((d) => d.label).join(", ") || "none this week"}
              </p>
            )}
          </section>

          <section className="rounded-xl bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Club wall cards</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {CLUB_WALL_CARDS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => gate() && commit(toggleWallCard(file, c.id))}
                  className={cn("tw-tap min-h-9 rounded-full px-3 text-[11px] font-semibold", wallCardOn(file, c.id) ? "bg-fg text-bg" : "bg-elevated text-muted line-through")}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted">Cleanup 3:00–3:05 always takes the wall.</p>
          </section>

          <ClubEventsEdit file={file} kind="comp" onCommit={(next) => gate() && commit(next)} />
          <ClubEventsEdit file={file} kind="event" onCommit={(next) => gate() && commit(next)} />

          <textarea
            value={meet.notes}
            onChange={(e) => edit({ notes: e.target.value })}
            placeholder="Minutes · who showed, what ran, cleanup."
            rows={3}
            className="rounded-xl bg-surface px-3 py-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={() => downloadText(`club-minutes-${date}.txt`, minutesText(meet), "text/plain")}
            className="min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold"
          >
            Export minutes
          </button>
        </aside>

        <section className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-xl bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Roster · check-in</p>
            <span className="text-sm text-muted">{bus.length} late bus · IN = ${CLUB_CASH} + {CLUB_XP} XP (once)</span>
          </div>
          <form
            className="flex flex-wrap gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Add first + last initial"
              className="min-h-12 min-w-[10rem] flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
            />
            {CLUB_STATIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => setStation(s.id)} className={cn("tw-tap min-h-12 rounded-md px-2 text-[11px] font-semibold", station === s.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                {s.label.split(" ")[0]}
              </button>
            ))}
            {CLUB_DISMISS.map((d) => (
              <button key={d.id} type="button" onClick={() => setDismiss(d.id)} className={cn("tw-tap min-h-12 rounded-md px-2 text-[11px] font-semibold", dismiss === d.id ? "bg-gold text-bg" : "bg-elevated text-muted")}>
                {d.label}
              </button>
            ))}
            <button type="submit" className="tw-tap min-h-12 rounded-md bg-fg px-3 text-xs font-semibold text-bg">
              Add
            </button>
          </form>

          <ul className="grid min-h-0 flex-1 grid-cols-1 gap-1 overflow-auto sm:grid-cols-2">
            {roster.map((m) => {
              const row = rowOf(meet, m.id);
              const here = Boolean(row?.in);
              const sid = desk ? clubStudentId(desk, m.name, m.studentId) : undefined;
              const paid = Boolean(sid && desk?.students.find((s) => s.id === sid)?.clubDays?.[date]);
              const st = row?.station ?? m.station;
              const di = row?.dismiss ?? m.dismiss;
              return (
                <li key={m.id} className={cn("rounded-xl p-2", here ? "bg-elevated ring-1 ring-gain" : "bg-bg")}>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold">
                      {m.name}
                      {paid ? <span className="ml-2 font-sans text-[10px] font-semibold text-gold">+${CLUB_CASH} · +{CLUB_XP} XP</span> : null}
                      {desk && !sid ? <span className="ml-2 font-sans text-[10px] font-medium text-subtle">no class match</span> : null}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!gate()) return;
                        const goingIn = !here;
                        commit(checkinMember(file, date, m, goingIn));
                        if (goingIn && desk && onDesk) {
                          const hit = clubStudentId(desk, m.name, m.studentId);
                          if (hit) onDesk(grantClubEarn(desk, hit, date));
                        }
                      }}
                      className={cn("tw-tap min-h-12 min-w-[4.5rem] rounded-lg text-sm font-semibold", here ? "bg-gain text-bg" : "bg-elevated text-muted")}
                    >
                      {here ? "IN" : "OUT"}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {CLUB_STATIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (!gate()) return;
                          let next = patchMember(file, m.id, { station: s.id });
                          if (row) next = patchMeeting(next, date, { rows: meetingOf(next, date).rows.map((r) => (r.id === m.id ? { ...r, station: s.id } : r)) });
                          commit(next);
                        }}
                        className={cn("tw-tap min-h-9 rounded-md px-2 text-[10px] font-semibold", st === s.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                      >
                        {s.label.split(" ")[0]}
                      </button>
                    ))}
                    {CLUB_DISMISS.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          if (!gate()) return;
                          let next = patchMember(file, m.id, { dismiss: d.id });
                          if (row) next = patchMeeting(next, date, { rows: meetingOf(next, date).rows.map((r) => (r.id === m.id ? { ...r, dismiss: d.id } : r)) });
                          commit(next);
                        }}
                        className={cn("tw-tap min-h-9 rounded-md px-2 text-[10px] font-semibold", di === d.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
                      >
                        {d.label === "LATE BUS" ? "BUS" : d.label === "PICKUP" ? "PICK" : "WALK"}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => gate() && commit(dropMember(file, m.id))}
                      className="tw-tap min-h-9 rounded-md px-2 text-[10px] text-muted"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function ClubEventsEdit({
  file,
  kind,
  onCommit,
}: {
  file: ClubFile;
  kind: "comp" | "event";
  onCommit: (next: ClubFile) => void;
}) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(() => todayIso());
  const [note, setNote] = useState("");
  const list = upcomingEvents(file, kind);
  return (
    <section className="rounded-xl bg-surface p-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">{kind === "comp" ? "Competitions" : "Upcoming events"}</p>
      <form
        className="mt-2 grid gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          onCommit(addClubEvent(file, kind, title, when, note));
          setTitle("");
          setNote("");
        }}
      >
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={kind === "comp" ? "Minecraft build-off" : "Family night"} className="min-h-10 rounded-md bg-elevated px-3 text-sm outline-none" />
        <div className="flex gap-1">
          <input type="date" value={when} onChange={(e) => setWhen(e.target.value)} className="min-h-10 flex-1 rounded-md bg-elevated px-2 text-sm outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className="min-h-10 flex-1 rounded-md bg-elevated px-2 text-sm outline-none" />
          <button type="submit" className="tw-tap min-h-10 rounded-md bg-fg px-3 text-xs font-semibold text-bg">Add</button>
        </div>
      </form>
      <ul className="mt-2 space-y-1">
        {list.map((e) => (
          <li key={e.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{e.title}</span> <span className="text-muted">{e.date}</span></span>
            <button type="button" onClick={() => onCommit(dropClubEvent(file, e.id))} className="text-xs text-muted">Remove</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
