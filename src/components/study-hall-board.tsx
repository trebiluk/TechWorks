import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Presentation, X } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import {
  abOn,
  attendOn,
  hallOf,
  happenedOn,
  lineLeaderOn,
  onAbRoster,
  pickLineLeader,
  setAbDay,
  setAffect,
  setHallNotes,
  setHallOwes,
  setHallShow,
  setHappened,
  setStudentAttend,
  setStudentCleanup,
  setStudentNote,
  setStudentReady,
  setTrack,
  studentCleanup,
  type LinePick,
} from "@/lib/store";
import { formatSchoolDate, stepSchoolDay, todayIso } from "@/lib/calendar";
import { bellForPeriod, cleanupMinsNow, formatBell, periodClock } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { QuarterChip } from "@/components/quarter-chip";
import { HallStore } from "@/components/hall-store";
import { TouchTimer } from "@/components/touch-timer";
import { cn } from "@/lib/utils";

const FACES = ["😞", "😐", "🙂", "😄", "😴"] as const;
const WHERE_OUT = [
  { id: "nurse", label: "NURSE" },
  { id: "library", label: "LIBRARY" },
  { id: "teacher", label: "TEACHER" },
  { id: "testing", label: "TESTING" },
  { id: "office", label: "OFFICE" },
  { id: "excused", label: "EXCUSED" },
  { id: "absent", label: "ABSENT" },
] as const;
const READY = [
  { id: "yes", label: "READY" },
  { id: "almost", label: "ALMOST" },
  { id: "no", label: "NOT YET" },
] as const;
const OUT = new Set<string>(WHERE_OUT.map((w) => w.id));
const P6 = 6;
const SH_LAWS = "Habits, not Tech marks. Wallet only on cleanup miss. Productive or peaceful.";

export function StudyHallBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onOpenId,
  onWall,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onOpenId: (id: string) => void;
  onWall?: () => void;
}) {
  const [date, setDate] = useState(() => todayIso());
  const now = useShopClock(file.meta.config?.schedule);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [outId, setOutId] = useState<string | null>(null);
  const [spin, setSpin] = useState<string | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [oweId, setOweId] = useState("");
  const [oweItem, setOweItem] = useState("");
  const hall = hallOf(file);
  const letter = abOn(file, date);
  const kids = useMemo(
    () =>
      file.students
        .filter((s) => s.period === P6 && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter))
        .sort((a, b) => a.crewKey.localeCompare(b.crewKey) || a.first.localeCompare(b.first)),
    [file, letter],
  );
  const leadId = lineLeaderOn(file, date);
  const lead = kids.find((s) => s.id === leadId);
  const bell = bellForPeriod(P6, file.meta.config?.schedule);
  const clock = periodClock(P6, file.meta.config?.schedule, now);
  const happened = happenedOn(file, date, P6);
  const hereN = kids.filter((s) => !OUT.has(attendOn(s, date))).length;

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function pick(mode: LinePick) {
    if (!gate()) return;
    if (mode === "draw") {
      const names = kids.map((s) => s.first);
      let i = 0;
      setSpin(names[0] ?? "—");
      const t = window.setInterval(() => {
        i += 1;
        setSpin(names[i % names.length] ?? "—");
      }, 80);
      window.setTimeout(() => {
        window.clearInterval(t);
        setSpin(null);
        onChange(pickLineLeader(file, date, kids, "draw"));
      }, 1200);
      return;
    }
    onChange(pickLineLeader(file, date, kids, mode));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <p className="shrink-0 rounded-lg bg-elevated px-3 py-2 text-xs font-medium text-muted ring-1 ring-border">{SH_LAWS}</p>
      <header className="flex shrink-0 flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Study Hall Manager</h1>
        <QuarterChip date={date} />
        {bell ? <span className="font-mono text-sm text-muted">{formatBell(bell.start)}–{formatBell(bell.end)}</span> : null}
        <span className="text-sm text-muted">{hereN} here · {kids.length - hereN} out</span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button type="button" aria-label="Previous day" className="tw-tap inline-flex size-11 items-center justify-center rounded-lg bg-surface" onClick={() => setDate(stepSchoolDay(date, -1))}>
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm">{formatSchoolDate(date)}</span>
          <button type="button" aria-label="Next day" className="tw-tap inline-flex size-11 items-center justify-center rounded-lg bg-surface" onClick={() => setDate(stepSchoolDay(date, 1))}>
            <ChevronRight className="size-4" />
          </button>
          <button type="button" onClick={() => onWall?.()} className="tw-tap inline-flex min-h-11 items-center gap-2 rounded-lg bg-fg px-3 text-sm font-semibold text-accent-fg">
            <Presentation className="size-4" />
            Wall
          </button>
          <button
            type="button"
            onClick={() => gate() && onChange(setAbDay(file, date, letter === "A" ? "B" : "A"))}
            className="tw-tap min-h-11 rounded-lg bg-elevated px-3 text-sm font-semibold uppercase tracking-widest ring-1 ring-fg"
          >
            {letter}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[minmax(16rem,28%)_1fr]">
        <aside className="flex min-h-0 flex-col gap-2 overflow-auto">
          {clock?.live ? (
            <p className={cn("rounded-xl px-3 py-3 text-sm font-semibold", clock.cleanup ? "bg-cleanup text-accent-fg" : "bg-surface")}>
              {clock.cleanup ? `Cleanup · ${cleanupMinsNow()} min` : `${Math.ceil(clock.left)} min left`}
            </p>
          ) : null}
          <TouchTimer title="Study hall timer" />
          <section className="rounded-xl bg-surface px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Line leader</p>
            <p className="font-display text-3xl font-semibold">{spin ?? lead?.first ?? "—"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["fair", "xp", "draw"] as const).map((m) => (
                <button key={m} type="button" onClick={() => pick(m)} className="tw-tap min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold uppercase">
                  {m}
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-xl bg-surface px-3 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Teacher notes</p>
              <button type="button" onClick={() => gate() && onChange(setHallShow(file, "notes", !hall.showNotes))} className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold uppercase", hall.showNotes ? "bg-gold text-bg" : "bg-elevated text-muted")}>
                {hall.showNotes ? "Wall" : "Hide"}
              </button>
            </div>
            <textarea
              value={hall.notes.join("\n")}
              onFocus={() => { if (!unlocked) onNeedPin(); }}
              onChange={(e) => unlocked && onChange(setHallNotes(file, e.target.value.split("\n")))}
              rows={3}
              placeholder="One note per line"
              className="mt-2 w-full rounded-lg bg-elevated px-3 py-2 text-sm outline-none"
            />
          </section>
          <section className="rounded-xl bg-surface px-3 py-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Owes work</p>
              <button type="button" onClick={() => gate() && onChange(setHallShow(file, "owes", !hall.showOwes))} className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold uppercase", hall.showOwes ? "bg-gold text-bg" : "bg-elevated text-muted")}>
                {hall.showOwes ? "Wall" : "Hide"}
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {hall.owes.map((o, i) => (
                <li key={`${o.id}|${i}`} className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{file.students.find((s) => s.id === o.id)?.first ?? o.id}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{o.item}</span>
                  <button type="button" onClick={() => gate() && onChange(setHallOwes(file, hall.owes.filter((_, j) => j !== i)))} className="text-xs text-muted">Done</button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <select value={oweId} onChange={(e) => setOweId(e.target.value)} className="min-h-11 rounded-md bg-elevated px-2 text-sm">
                <option value="">Name</option>
                {kids.map((s) => <option key={s.id} value={s.id}>{s.first}</option>)}
              </select>
              <input value={oweItem} onChange={(e) => setOweItem(e.target.value)} placeholder="What they owe" className="min-h-11 min-w-[8rem] flex-1 rounded-md bg-elevated px-3 text-sm outline-none" />
              <button
                type="button"
                onClick={() => {
                  if (!gate() || !oweId || !oweItem.trim()) return;
                  onChange(setHallOwes(file, [...hall.owes, { id: oweId, item: oweItem.trim() }]));
                  setOweItem("");
                }}
                className="tw-tap min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg"
              >
                Add
              </button>
            </div>
          </section>
          <input
            value={happened}
            onFocus={() => { if (!unlocked) onNeedPin(); }}
            onChange={(e) => { if (!unlocked) return; onChange(setHappened(file, date, P6, e.target.value)); }}
            maxLength={160}
            placeholder="Happened today"
            className="min-h-11 w-full rounded-xl bg-surface px-3 text-sm outline-none"
          />
          <HallStore file={file} unlocked={unlocked} kids={kids} onNeedPin={onNeedPin} onChange={onChange} />
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-surface p-2">
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-widest text-subtle">Check-in · tap HERE or where they went</p>
          <ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
            {kids.map((s) => {
              const miss = studentCleanup(s, date) === "miss";
              const mood = (s.affect ?? {})[date] ?? "";
              const track = (s.trackDays ?? {})[date] ?? "";
              const where = attendOn(s, date);
              const gone = OUT.has(where);
              const onTask = !gone && track !== "off";
              const more = outId === s.id;
              return (
                <li key={s.id} className={cn("flex flex-col gap-1 rounded-xl p-2", gone ? "bg-bg ring-1 ring-border" : "bg-elevated")}>
                  <button type="button" onClick={() => setDrawerId(s.id)} className="truncate text-left font-display text-xl font-semibold">
                    {s.first}
                    {s.id === leadId ? <span className="ml-1 text-gold">★</span> : null}
                  </button>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => gate() && onChange(setStudentAttend(file, s.id, date, ""))}
                      className={cn("tw-tap min-h-14 rounded-lg text-sm font-semibold", !gone ? "bg-gain text-bg" : "bg-surface text-muted")}
                    >
                      HERE
                    </button>
                    {(["nurse", "library", "teacher"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => gate() && onChange(setStudentAttend(file, s.id, date, where === code ? "" : code))}
                        className={cn("tw-tap min-h-14 rounded-lg text-[11px] font-semibold uppercase", where === code ? "bg-fg text-bg" : "bg-surface text-muted")}
                      >
                        {code}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => gate() && onChange(setStudentAttend(file, s.id, date, where === "testing" ? "" : "testing"))}
                      className={cn("tw-tap min-h-14 rounded-lg text-[11px] font-semibold uppercase", where === "testing" ? "bg-fg text-bg" : "bg-surface text-muted")}
                    >
                      TEST
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutId(more ? null : s.id)}
                      className={cn("tw-tap min-h-14 rounded-lg text-[11px] font-semibold uppercase", where === "office" || where === "excused" || where === "absent" || more ? "bg-fg text-bg" : "bg-surface text-muted")}
                    >
                      MORE
                    </button>
                  </div>
                  {more ? (
                    <div className="grid grid-cols-3 gap-1">
                      {(["office", "excused", "absent"] as const).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            if (!gate()) return;
                            onChange(setStudentAttend(file, s.id, date, where === code ? "" : code));
                            setOutId(null);
                          }}
                          className={cn("tw-tap min-h-12 rounded-lg text-[11px] font-semibold uppercase", where === code ? "bg-fg text-bg" : "bg-surface text-muted")}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="grid grid-cols-3 gap-1">
                    <button type="button" disabled={gone} onClick={() => gate() && onChange(setTrack(file, s.id, date, "on"))} className={cn("tw-tap min-h-11 rounded-md text-[11px] font-semibold disabled:opacity-30", onTask ? "bg-fg text-bg" : "bg-surface text-muted")}>
                      ON TASK
                    </button>
                    <button type="button" disabled={gone} onClick={() => gate() && onChange(setTrack(file, s.id, date, track === "off" ? "" : "off"))} className={cn("tw-tap min-h-11 rounded-md text-[11px] font-semibold disabled:opacity-30", track === "off" ? "bg-loss text-accent-fg" : "bg-surface text-muted")}>
                      OFF
                    </button>
                    <button type="button" onClick={() => gate() && onChange(setStudentCleanup(file, s.id, date, miss ? "" : "miss"))} className={cn("tw-tap min-h-11 rounded-md text-[11px] font-semibold", miss ? "bg-cleanup text-accent-fg" : "bg-surface text-muted")}>
                      {miss ? "CLEAN −$10" : "CLEAN"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {FACES.map((f) => (
                      <button key={f} type="button" onClick={() => gate() && onChange(setAffect(file, s.id, date, f))} className={cn("tw-tap size-10 rounded-md text-sm", mood === f ? "bg-surface ring-1 ring-fg" : "opacity-40")}>
                        {f}
                      </button>
                    ))}
                    <button type="button" onClick={() => setNoteId(noteId === s.id ? null : s.id)} className="tw-tap min-h-10 rounded-md px-2 text-xs text-subtle">Note</button>
                  </div>
                  {noteId === s.id ? (
                    <textarea value={(s.notes ?? {})[date] ?? ""} onChange={(e) => gate() && onChange(setStudentNote(file, s.id, date, e.target.value))} rows={2} placeholder="Private" className="w-full rounded-md bg-surface px-3 py-2 text-sm outline-none" />
                  ) : null}
                </li>
              );
            })}
          </ul>
          {!kids.length ? <p className="p-3 text-sm text-muted">No study hall roster for {letter} day.</p> : null}
        </section>
      </div>
      {drawerId ? (
        <HallDrawer
          file={file}
          id={drawerId}
          date={date}
          letter={letter}
          lead={drawerId === leadId}
          unlocked={unlocked}
          onNeedPin={onNeedPin}
          onChange={onChange}
          onClose={() => setDrawerId(null)}
          onProfile={() => onOpenId(drawerId)}
        />
      ) : null}
    </div>
  );
}

function HallDrawer({
  file,
  id,
  date,
  letter,
  lead,
  unlocked,
  onNeedPin,
  onChange,
  onClose,
  onProfile,
}: {
  file: EconomyFile;
  id: string;
  date: string;
  letter: string;
  lead: boolean;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onClose: () => void;
  onProfile: () => void;
}) {
  const s = file.students.find((x) => x.id === id);
  if (!s) return null;
  const where = attendOn(s, date);
  const gone = OUT.has(where);
  const track = (s.trackDays ?? {})[date] ?? "";
  const ready = (s.readyDays ?? {})[date] ?? "";
  const mood = (s.affect ?? {})[date] ?? "";
  const miss = studentCleanup(s, date) === "miss";
  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }
  return (
    <div className="tw-scrim fixed inset-0 z-[90] flex items-end justify-center p-2 sm:items-center">
      <div className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-bg ring-1 ring-border">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="font-display text-lg font-semibold">
              {s.first}
              {lead ? <span className="ml-1 text-gold">★</span> : null}
            </p>
            <p className="text-xs text-subtle">Study Hall Manager · Day {letter}</p>
          </div>
          <button type="button" aria-label="Close" className="inline-flex size-10 items-center justify-center rounded-lg bg-surface" onClick={onClose}>
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Where</p>
          <div className="grid grid-cols-4 gap-1">
            <button type="button" onClick={() => gate() && onChange(setStudentAttend(file, id, date, ""))} className={cn("tw-tap min-h-11 rounded-lg text-xs font-semibold", !gone ? "bg-gain text-bg" : "bg-elevated text-muted")}>HERE</button>
            {WHERE_OUT.map((w) => (
              <button key={w.id} type="button" onClick={() => gate() && onChange(setStudentAttend(file, id, date, where === w.id ? "" : w.id))} className={cn("tw-tap min-h-11 rounded-lg text-[10px] font-semibold uppercase", where === w.id ? "bg-fg text-bg" : "bg-elevated text-muted")}>
                {w.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Ready</p>
          <div className="grid grid-cols-3 gap-1">
            {READY.map((r) => (
              <button key={r.id} type="button" disabled={gone} onClick={() => gate() && onChange(setStudentReady(file, id, date, r.id))} className={cn("tw-tap min-h-11 rounded-lg text-xs font-semibold disabled:opacity-30", ready === r.id ? "bg-fg text-bg" : "bg-elevated text-muted")}>
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Habits · not pay</p>
          <div className="grid grid-cols-3 gap-1">
            <button type="button" disabled={gone} onClick={() => gate() && onChange(setTrack(file, id, date, "on"))} className={cn("tw-tap min-h-11 rounded-md text-xs font-semibold disabled:opacity-30", !gone && track !== "off" ? "bg-fg text-bg" : "bg-elevated text-muted")}>ON TASK</button>
            <button type="button" disabled={gone} onClick={() => gate() && onChange(setTrack(file, id, date, track === "off" ? "" : "off"))} className={cn("tw-tap min-h-11 rounded-md text-xs font-semibold disabled:opacity-30", track === "off" ? "bg-loss text-accent-fg" : "bg-elevated text-muted")}>OFF</button>
            <button type="button" onClick={() => gate() && onChange(setStudentCleanup(file, id, date, miss ? "" : "miss"))} className={cn("tw-tap min-h-11 rounded-md text-xs font-semibold", miss ? "bg-cleanup text-accent-fg" : "bg-elevated text-muted")}>{miss ? "CLEAN −$10" : "CLEAN"}</button>
          </div>
          <div className="flex flex-wrap gap-1">
            {FACES.map((f) => (
              <button key={f} type="button" onClick={() => gate() && onChange(setAffect(file, id, date, f))} className={cn("tw-tap size-10 rounded-md text-sm", mood === f ? "bg-surface ring-1 ring-fg" : "opacity-40")}>
                {f}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Private note</span>
            <textarea value={(s.notes ?? {})[date] ?? ""} onChange={(e) => gate() && onChange(setStudentNote(file, id, date, e.target.value))} rows={3} className="mt-1 w-full rounded-md bg-elevated px-3 py-2 text-sm outline-none" />
          </label>
          <button type="button" onClick={onProfile} className="min-h-11 w-full rounded-lg bg-elevated text-sm font-semibold">
            Full profile (PIN)
          </button>
        </div>
      </div>
    </div>
  );
}

