"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLUB_CLEAN_JOBS,
  CLUB_DISMISS,
  CLUB_DOW,
  CLUB_OVERLAY,
  CLUB_PACKS,
  CLUB_STATIONS,
  CLUB_CASH,
  CLUB_XP,
  CLUB_WALL_CARDS,
  activityLeft,
  addClubEvent,
  addMember,
  checkinMember,
  clubAgendaOf,
  clubClock,
  clubPackOf,
  clubSlotNow,
  clubStudentId,
  dropClubEvent,
  dropMember,
  formatClubDay,
  isClubDay,
  layClubSlots,
  loadClub,
  meetingOf,
  minutesText,
  monthClubGrid,
  monthKey,
  nextClubDay,
  overlayOn,
  patchMeeting,
  patchMember,
  prevClubDay,
  rowOf,
  saveClub,
  setActivity,
  setClubPack,
  setClubPin,
  setDayClub,
  shiftMonth,
  startActivity,
  stopActivity,
  toggleWallCard,
  toggleWeekday,
  upcomingClubDays,
  upcomingEvents,
  wallCardOn,
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
  const today = todayIso();
  const [date, setDate] = useState(today);
  const clock = useClubTick();
  const rang = useRef("");
  const liveMeet = meetingOf(file, today);
  const meet = meetingOf(file, date);
  const [name, setName] = useState("");
  const [station, setStation] = useState<ClubStation>("workshop");
  const [dismiss, setDismiss] = useState<ClubDismiss>("latebus");
  const [month, setMonth] = useState(() => monthKey(today));

  useEffect(() => {
    if (clock.phase !== "warn" && clock.phase !== "clean") return;
    const key = `${today}-${clock.phase}`;
    if (rang.current === key) return;
    rang.current = key;
    ringBell();
  }, [clock.phase, today]);

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

  const monthDays = monthClubGrid(file, month);
  const upcoming = upcomingClubDays(file, today, 8);
  const pack = clubPackOf(file, date);
  const slots = layClubSlots(file, date);
  const [nowTick, setNowTick] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const cur = clubSlotNow(file, wall ? today : date, nowTick);
  const livePresent = liveMeet.rows.filter((r) => r.in);
  const present = meet.rows.filter((r) => r.in);
  const bus = (wall ? livePresent : present).filter((r) => r.dismiss === "latebus");
  const wallRows = wall ? livePresent : present;
  const byStation = useMemo(
    () => Object.fromEntries(CLUB_STATIONS.map((s) => [s.id, wallRows.filter((r) => r.station === s.id)])),
    [wallRows],
  );
  const roster = [...file.members].sort((a, b) => a.name.localeCompare(b.name));
  const hereN = roster.filter((m) => rowOf(meet, m.id)?.in).length;
  const clubOn = isClubDay(file, date);
  const released = Boolean(cur && (cur.kind === "work" || cur.kind === "contest" || cur.clean));

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
    const liveOverlay = CLUB_OVERLAY.find((o) => o.n === overlayOn(file, today));
    const liveAgenda = clubAgendaOf(file, today);
    const liveSlots = layClubSlots(file, today);
    const liveCur = clubSlotNow(file, today, nowTick);
    const liveReleased = Boolean(liveCur && (liveCur.kind === "work" || liveCur.kind === "contest" || liveCur.clean));
    if (clock.cleanup || liveCur?.clean) {
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
    if (!liveReleased) {
      return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-1">
          <header className="flex shrink-0 flex-wrap items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Tech Club</p>
            <span className="ml-auto flex items-center gap-2 font-mono text-sm text-muted">
              {clock.label}
              {unlocked && onWall ? (
                <button type="button" onClick={onWall} className="tw-tap min-h-10 rounded-lg bg-elevated px-3 text-sm font-semibold text-fg">
                  Edit
                </button>
              ) : null}
            </span>
          </header>
          <section data-teach-hero className="tw-gadget tw-fill-wide shrink-0 p-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">{liveCur?.title ?? "BRIEF"}</p>
              <h1 className="tw-fill-hero font-display font-semibold tracking-tight">{liveCur?.title ?? "BRIEF"}</h1>
              <p className="tw-fill-line mt-2 max-w-3xl text-muted">{liveMeet.agenda?.trim() || liveCur?.line || liveAgenda}</p>
            </div>
            <Berty pose="waving" size="lg" />
          </section>
          <ol data-teach-slots>
            {liveSlots.map((s) => {
              const on = liveCur?.id === s.id;
              return (
                <li key={s.id} className="min-h-0">
                  <div
                    className={cn(
                      "tw-fill flex h-full min-h-24 w-full flex-col justify-center rounded-xl px-3 py-4 text-left",
                      on ? (s.clean ? "bg-cleanup text-accent-fg" : "bg-accent text-accent-fg") : "bg-elevated",
                    )}
                  >
                    <p className="tw-fill-label font-bold uppercase tracking-wider opacity-80">{s.mins}m</p>
                    <p className="tw-fill-hero font-display font-semibold">{s.title}</p>
                    <p className="tw-fill-line opacity-80">{s.line}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      );
    }
    const show = (id: (typeof CLUB_WALL_CARDS)[number]["id"]) => wallCardOn(file, id);
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className={cn("flex items-center justify-between rounded-xl px-4 py-3", clock.phase === "warn" ? "bg-cleanup text-accent-fg" : "bg-surface")}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">Technology Club · {liveCur?.title ?? "WORK"}</p>
            <p className="font-display text-2xl font-semibold">{liveMeet.agenda?.trim() || file.activity.title || clock.headline}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-display text-4xl font-semibold tabular-nums">{clock.phase === "work" || clock.phase === "sign" || clock.phase === "warn" || clock.phase === "arrive" ? clock.label : ""}</p>
            {unlocked && onWall ? (
              <button type="button" onClick={onWall} className="tw-tap min-h-10 rounded-lg bg-elevated px-3 text-sm font-semibold">
                Edit
              </button>
            ) : null}
          </div>
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
          {show("overlay") && liveOverlay ? (
            <section className="col-span-6 rounded-xl bg-surface p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Workshop overlay</p>
              <p className="font-display text-3xl font-semibold">{liveOverlay.n} · {liveOverlay.title}</p>
              <p className="mt-1 text-sm text-muted">{liveOverlay.stamp}. Other stations still run.</p>
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
      <header className={cn("flex shrink-0 flex-wrap items-center gap-2 rounded-xl px-3 py-2", clock.cleanup && date === today ? "bg-cleanup text-accent-fg" : "bg-surface")}>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
            Tech Club · {date === today ? "today" : "planning"}
          </p>
          <p className="font-display text-xl font-semibold">{cur?.title ?? clock.headline}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const prev = prevClubDay(file, date);
            if (prev) {
              setDate(prev);
              setMonth(monthKey(prev));
            }
          }}
          className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold"
          aria-label="Previous club day"
        >
          ‹
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            const next = e.target.value || today;
            setDate(next);
            setMonth(monthKey(next));
          }}
          className="min-h-11 rounded-xl bg-elevated px-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => {
            const nxt = nextClubDay(file, date, false);
            if (nxt) {
              setDate(nxt);
              setMonth(monthKey(nxt));
            }
          }}
          className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold"
          aria-label="Next club day"
        >
          ›
        </button>
        <button type="button" onClick={() => { setDate(today); setMonth(monthKey(today)); }} className="tw-tap min-h-11 rounded-xl bg-elevated px-3 text-xs font-semibold">
          Today
        </button>
        <p className="font-mono text-2xl font-semibold tabular-nums">{clock.label}</p>
        <span className="rounded-md bg-elevated px-2 py-1 text-xs font-semibold">{hereN}/{roster.length} in</span>
        {onWall ? (
          <button type="button" onClick={onWall} className="min-h-10 rounded-md bg-fg px-3 text-xs font-semibold text-bg">
            Wall
          </button>
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(18rem,34%)_1fr]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-auto">
          <section className="rounded-xl bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">Set club days</p>
            <p className="mt-1 text-sm text-muted">Usual weekdays, then tap any school day to add or skip.</p>
            <div className="mt-2 flex flex-wrap gap-1">
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
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="Previous month">
                ‹
              </button>
              <p className="flex-1 text-center text-sm font-semibold">
                {new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
              <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} className="tw-tap grid size-11 place-items-center rounded-xl bg-elevated text-lg font-semibold" aria-label="Next month">
                ›
              </button>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1">
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <p key={`${d}-${i}`} className="text-center text-[10px] font-bold uppercase tracking-wider text-subtle">{d}</p>
              ))}
              {Array.from({ length: Math.max(0, (monthDays[0]?.dow ?? 1) - 1) }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {monthDays.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    if (!gate()) return;
                    if (d.date === date) cal(setDayClub(file, d.date, !d.club));
                    else {
                      setDate(d.date);
                      if (!d.club) cal(setDayClub(file, d.date, true));
                    }
                  }}
                  className={cn(
                    "min-h-11 rounded-lg text-sm font-semibold",
                    d.date === date ? "ring-2 ring-fg" : "",
                    d.club ? "bg-accent text-accent-fg" : d.school ? "bg-elevated text-muted" : "bg-elevated/40 text-subtle",
                  )}
                >
                  {d.n}
                  {d.planned ? <span className="block text-[9px] uppercase tracking-wide">set</span> : null}
                </button>
              ))}
            </div>
            {upcoming.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {upcoming.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDate(d); setMonth(monthKey(d)); }}
                    className={cn("tw-tap min-h-9 rounded-full px-3 text-[11px] font-semibold", d === date ? "bg-fg text-bg" : "bg-elevated text-muted")}
                  >
                    {formatClubDay(d)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No club days yet. Tap a date or a weekday.</p>
            )}
          </section>

          <section className="rounded-xl bg-surface p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-subtle">This meeting</p>
            {!clubOn ? <p className="mt-1 text-sm font-semibold text-loss">Off this day. Tap the date again to set club.</p> : null}
            <div className="mt-2 flex flex-wrap gap-1">
              {CLUB_PACKS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  title={p.hint}
                  onClick={() => gate() && commit(setClubPack(file, date, p.id))}
                  className={cn("tw-tap min-h-10 rounded-full px-3 text-xs font-semibold", pack.id === p.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="mt-2 grid gap-1 text-sm">
              <span className="text-[11px] font-bold uppercase tracking-wide text-subtle">Agenda</span>
              <input
                value={meet.agenda ?? ""}
                onChange={(e) => edit({ agenda: e.target.value.slice(0, 160) })}
                placeholder={pack.hint}
                className="min-h-11 rounded-xl bg-elevated px-3 outline-none"
              />
            </label>
            <ol className="mt-2 grid gap-1">
              {slots.map((s) => {
                const on = cur?.id === s.id;
                const release = s.kind === "work" || s.kind === "contest";
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => gate() && commit(setClubPin(file, date, meet.pin === s.id ? undefined : s.id))}
                      className={cn(
                        "tw-tap flex min-h-14 w-full items-center justify-between rounded-xl px-3 text-left",
                        on ? (s.clean ? "bg-cleanup text-accent-fg" : "bg-accent text-accent-fg") : "bg-elevated text-muted",
                      )}
                    >
                      <span>
                        <span className="block text-[11px] font-bold uppercase tracking-wider opacity-80">{s.mins}m · {s.title}</span>
                        <span className="text-sm">{s.line}</span>
                      </span>
                      {release && !released ? <span className="text-xs font-bold uppercase tracking-wide">Release</span> : null}
                    </button>
                  </li>
                );
              })}
            </ol>
            {meet.pin ? (
              <button type="button" onClick={() => gate() && commit(setClubPin(file, date, undefined))} className="mt-1 text-xs font-semibold text-muted">
                Auto clock
              </button>
            ) : null}
            <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-subtle">Workshop invite</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => edit({ overlay: 0 })}
                className={cn("tw-tap min-h-10 rounded-md px-2 text-xs font-semibold", meet.overlay === 0 ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                None
              </button>
              {CLUB_OVERLAY.map((o) => (
                <button
                  key={o.n}
                  type="button"
                  onClick={() => edit({ overlay: o.n })}
                  className={cn("tw-tap min-h-10 rounded-md px-2 text-xs font-semibold", meet.overlay === o.n ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                >
                  {o.n} {o.title}
                </button>
              ))}
            </div>
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
