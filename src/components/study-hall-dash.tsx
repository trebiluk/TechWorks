import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { abOn, attendOn, deskBellId, hallOf, happenedOn, lineLeaderOn, onAbRoster, pickLineLeader, setHallShow, setLineLeader, specialsOn, type LinePick } from "@/lib/store";
import { roleHistoryOf } from "@/lib/roles";
import { todayIso } from "@/lib/calendar";
import { formatBell, leftClock, periodClock, periodNow } from "@/lib/bells";
import { useShopClock } from "@/lib/use-clock";
import { avatarOf } from "@/lib/avatars";
import { DayStrip } from "@/components/day-strip";
import { WeatherChip } from "@/components/weather-chip";
import { featureOn } from "@/lib/features";
import { Btn, Chip } from "@/components/ui";
import { Berty, BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

const P6 = 6;
const OUT = new Set(["nurse", "library", "teacher", "testing", "office", "excused", "absent"]);

const WHERE: Record<string, string> = {
  nurse: "nurse",
  library: "library",
  teacher: "a teacher",
  testing: "testing",
  office: "office",
  excused: "excused",
  absent: "home",
};

export function StudyHallDash({
  file,
  unlocked,
  onPeriod,
  onOpenId,
  onChange,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onPeriod: (period: number) => void;
  onOpenId: (id: string) => void;
  onChange?: (next: EconomyFile) => void;
}) {
  const bellsId = deskBellId(file);
  const now = useShopClock(bellsId, "beat");
  const [spin, setSpin] = useState<string | null>(null);
  const today = todayIso();
  const letter = abOn(file, today);
  const clock = periodClock(P6, bellsId, now);
  const live = periodNow(bellsId, now);
  const hall = hallOf(file);
  const kids = useMemo(
    () =>
      file.students
        .filter((s) => s.period === P6 && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter))
        .sort((a, b) => a.first.localeCompare(b.first)),
    [file, letter],
  );
  const leadId = lineLeaderOn(file, today);
  const lead = kids.find((s) => s.id === leadId);
  const here = kids.filter((s) => !OUT.has(attendOn(s, today)));
  const away = kids.filter((s) => OUT.has(attendOn(s, today)));
  const shop = file.meta.bell?.filter((b) => b.period !== 6).map((b) => b.period) ?? [1, 2, 3, 8, 9, 10];
  const happened = happenedOn(file, today, P6);
  const notesOn = hall.showNotes && hall.notes.length > 0;
  const owesOn = hall.showOwes && hall.owes.length > 0;
  const nameOf = (id: string) => kids.find((s) => s.id === id)?.first ?? file.students.find((s) => s.id === id)?.first ?? "friend";
  const neverLed = here.filter((s) => !roleHistoryOf(file).some((e) => e.role === "line_leader" && e.studentId === s.id)).length;

  function play(mode: LinePick) {
    if (!unlocked || !onChange || !here.length) return;
    if (mode === "draw") {
      const names = here.map((s) => s.first);
      let i = 0;
      setSpin(names[0] ?? "—");
      const t = window.setInterval(() => {
        i += 1;
        setSpin(names[i % names.length] ?? "—");
      }, 90);
      window.setTimeout(() => {
        window.clearInterval(t);
        setSpin(null);
        onChange(pickLineLeader(file, today, here, "draw"));
      }, 1600);
      return;
    }
    onChange(pickLineLeader(file, today, here, mode));
  }

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col gap-2 overflow-auto">
      {clock?.cleanup ? (
        <Berty pose="point" size="sm" alert className="absolute top-2 right-2" />
      ) : featureOn(file, "berty") ? (
        <BertyPeek className="absolute bottom-1 right-2" />
      ) : null}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-surface px-4 py-2">
        {featureOn(file, "weather") ? <WeatherChip compact /> : null}
        <span className="rounded-full bg-elevated px-3 py-1 text-sm font-semibold text-fg">Day {letter}</span>
        <span className="text-sm text-muted">Study Hall</span>
        {unlocked && onChange ? (
          <div className="flex flex-wrap gap-1">
            <Chip on={hall.showNotes} onClick={() => onChange(setHallShow(file, "notes", !hall.showNotes))}>
              Notes
            </Chip>
            <Chip on={hall.showOwes} onClick={() => onChange(setHallShow(file, "owes", !hall.showOwes))}>
              Owes work
            </Chip>
          </div>
        ) : null}
      </div>

      {notesOn ? (
        <section className="rounded-3xl bg-surface px-5 py-4">
          <p className="font-display text-2xl font-semibold tracking-tight">Notes from Grade 5 teachers</p>
          <ul className="mt-3 space-y-2">
            {hall.notes.map((n, i) => (
              <li key={i} className="rounded-2xl bg-elevated px-4 py-3 text-lg">
                {n}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {owesOn ? (
        <section className="rounded-3xl bg-surface px-5 py-4">
          <p className="font-display text-2xl font-semibold tracking-tight">Owes work</p>
          <p className="mt-1 text-sm text-muted">Finish these when you can. Ask if you need help.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {hall.owes.map((o) => (
              <li key={`${o.id}|${o.item}`} className="flex items-center gap-2 rounded-2xl bg-elevated px-3 py-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-surface text-lg">
                  {avatarOf(file.students.find((s) => s.id === o.id)?.icon, o.id)}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{nameOf(o.id)}</span>
                  <span className="block truncate text-sm text-muted">{o.item}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl bg-surface px-5 py-5">
        <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Productive or peaceful.</p>
        <p className="mt-2 max-w-2xl text-lg text-muted">You can work. You can rest quietly. You can do both. Kind voices. Calm bodies.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <p className="rounded-2xl bg-elevated px-4 py-3 text-lg font-semibold">✏️ Productive — read, write, finish something</p>
          <p className="rounded-2xl bg-elevated px-4 py-3 text-lg font-semibold">🌙 Peaceful — quiet seat, kind words, soft feet</p>
        </div>
      </section>

      <DayStrip schedule={bellsId} shop={shop} view={6} onPeriod={onPeriod} specials={specialsOn(file, today)} />

      <section className="grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.7fr)]">
        <article className="rounded-3xl bg-surface px-5 py-4">
          <p className="text-sm font-semibold text-muted">Helper this week</p>
          <div className="mt-2 flex items-center gap-3">
            {lead && !spin ? (
              <span className="flex size-14 items-center justify-center rounded-full bg-elevated text-3xl">{avatarOf(lead.icon, lead.id)}</span>
            ) : null}
            <p className={cn("font-display font-semibold tracking-tight", spin ? "text-5xl text-gold sm:text-6xl" : "text-4xl")}>
              {spin ?? lead?.first ?? "Let’s pick"}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted">
            {neverLed ? `${neverLed} friends have not been helper yet.` : "Everyone has had a turn. Fair starts over."}
          </p>
          {unlocked && onChange ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Btn kind="do" onClick={() => play("fair")}>Fair</Btn>
              <Btn kind="quiet" onClick={() => play("xp")}>XP</Btn>
              <Btn kind="quiet" onClick={() => play("draw")}>Draw</Btn>
              <span className="text-sm text-muted">or tap a friend below</span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">Watch the draw. Be ready if your name pops.</p>
          )}
          {happened ? <p className="mt-3 text-sm text-muted">{happened}</p> : null}
        </article>
        <HallTime clock={clock} live={live === P6} />
      </section>

      <section className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(14rem,0.7fr)]">
        <article className="rounded-3xl bg-surface px-4 py-4">
          <p className="text-lg font-semibold">With us · {here.length}</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {here.map((s) => {
              const reset = (s.trackDays ?? {})[today] === "off";
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      if (unlocked && onChange) {
                        onChange(setLineLeader(file, today, s.id));
                        return;
                      }
                      onOpenId(s.id);
                    }}
                    className={cn("flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left disabled:cursor-default", reset ? "bg-elevated/70" : "bg-elevated")}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface text-xl">{avatarOf(s.icon, s.id)}</span>
                    <span className="min-w-0">
                      <span className={cn("block truncate font-semibold", s.id === leadId ? "text-gold" : "")}>{s.first}</span>
                      <span className="block text-xs text-muted">{reset ? "reset" : s.id === leadId ? "helper" : "you’ve got this"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </article>
        <article className="rounded-3xl bg-surface px-4 py-4">
          <p className="text-lg font-semibold">With someone else · {away.length}</p>
          {away.length ? (
            <ul className="mt-3 space-y-2">
              {away.map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-full bg-elevated text-sm">{avatarOf(s.icon, s.id)}</span>
                  <span className="min-w-0 truncate font-semibold">{s.first}</span>
                  <span className="ml-auto text-sm text-muted">{WHERE[attendOn(s, today)] ?? attendOn(s, today)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Everyone is in the room. Nice.</p>
          )}
        </article>
      </section>
    </div>
  );
}

function HallTime({
  clock,
  live,
}: {
  clock: ReturnType<typeof periodClock>;
  live: boolean;
}) {
  const hot = Boolean(clock?.cleanup);
  const tick = clock?.live ? leftClock(clock.left) : null;
  const pct = clock?.live ? clock.pct : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  const drawn = (pct / 100) * c;
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl px-5 py-5",
        hot ? "bg-cleanup text-accent-fg" : "bg-surface",
      )}
    >
      {!hot ? (
        <span
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-gold/20 blur-2xl"
          aria-hidden
        />
      ) : null}
      <div className="relative flex items-center gap-4">
        <div className={cn("relative size-28 shrink-0 sm:size-32", hot ? "animate-pulse" : "")}>
          <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden>
            <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="9" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${drawn} ${c}`}
              className={hot ? "text-accent-fg" : "text-gold"}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <p className="font-display text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
              {tick?.label ?? (live ? "—" : "soon")}
            </p>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">
            {hot ? "Pack up" : clock?.live ? "Still time" : "Hall next"}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {hot ? "Five-minute glow" : tick ? `${tick.mm} to shine` : "Hang tight"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {clock ? `${formatBell(clock.start)} – ${formatBell(clock.end)}` : "11:18 – 11:55"}
          </p>
        </div>
      </div>
    </article>
  );
}
