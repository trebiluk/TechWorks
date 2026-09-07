"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLUB_DISMISS,
  CLUB_DOW,
  CLUB_OVERLAY,
  CLUB_STATIONS,
  addDaysIso,
  addMember,
  checkinMember,
  clubClock,
  dropMember,
  loadClub,
  meetingOf,
  minutesText,
  mondayOf,
  patchMeeting,
  patchMember,
  rowOf,
  saveClub,
  setDayClub,
  toggleWeekday,
  weekGrid,
  type ClubDismiss,
  type ClubFile,
  type ClubStation,
} from "@/lib/club";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
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
}: {
  unlocked: boolean;
  onNeedPin: () => void;
  wall?: boolean;
  onWall?: () => void;
}) {
  const [file, setFile] = useState<ClubFile>(() => loadClub());
  const [date, setDate] = useState(() => todayIso());
  const clock = useClubTick();
  const rang = useRef("");
  const meet = meetingOf(file, date);
  const [name, setName] = useState("");
  const [station, setStation] = useState<ClubStation>("workshop");
  const [dismiss, setDismiss] = useState<ClubDismiss>("latebus");
  const [weekMon, setWeekMon] = useState(() => mondayOf(todayIso()));
  const [calOpen, setCalOpen] = useState(false);

  useEffect(() => {
    if (!clock.cleanup) return;
    const key = `${date}-${clock.phase}`;
    if (rang.current === key) return;
    rang.current = key;
    ringBell();
  }, [clock.cleanup, clock.phase, date]);

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
    let next = addMember(file, n, station, dismiss);
    const mem = next.members[next.members.length - 1];
    if (mem) next = checkinMember(next, date, { ...mem, station, dismiss }, true);
    commit(next);
    setName("");
  }

  if (wall) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className={cn("flex items-center justify-between rounded-xl px-4 py-3", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface")}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">Technology Club</p>
            <p className="font-display text-2xl font-semibold">{clock.headline}</p>
          </div>
          <p className="font-display text-4xl font-semibold tabular-nums">{clock.cleanup || clock.phase === "work" || clock.phase === "sign" ? clock.label : ""}</p>
        </div>
        {clock.cleanup ? <Berty pose="point" size="icon" alert className="self-end" /> : null}
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
          {CLUB_STATIONS.map((s) => (
            <section key={s.id} className="flex min-h-0 flex-col rounded-xl bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">{s.label}</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 overflow-auto">
                {(byStation[s.id] ?? []).map((r) => (
                  <li key={r.id} className="rounded-md bg-elevated px-2 py-1 text-sm font-semibold">
                    {r.name}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <section className="rounded-xl bg-surface px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Late bus · {bus.length}</p>
          <p className="mt-1 text-lg font-semibold">{bus.map((r) => r.name).join("  ·  ") || "—"}</p>
        </section>
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
            <span className="text-sm text-muted">{bus.length} late bus</span>
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
              const st = row?.station ?? m.station;
              const di = row?.dismiss ?? m.dismiss;
              return (
                <li key={m.id} className={cn("rounded-xl p-2", here ? "bg-elevated ring-1 ring-gain" : "bg-bg")}>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-display text-lg font-semibold">{m.name}</p>
                    <button
                      type="button"
                      onClick={() => gate() && commit(checkinMember(file, date, m, !here))}
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
          {!roster.length ? <p className="text-sm text-muted">Add names once. Next meeting, tap IN.</p> : null}
          <p className="text-sm font-semibold">Late bus · {bus.map((r) => r.name).join(" · ") || "none"}</p>
        </section>
      </div>
    </div>
  );
}
