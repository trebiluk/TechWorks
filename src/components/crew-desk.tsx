import { useMemo, useState } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, shopBells } from "@/lib/economy";
import { xpIntoLevel } from "@/lib/skills";
import { crewsOf } from "@/lib/crews";
import {
  addCrewException,
  addPeriodCrew,
  bansOf,
  BENCH,
  CREW_COLORS,
  CREW_MAX,
  CREW_MIN,
  CREWS_MAX,
  crewAt,
  crewConflicts,
  crewHistory,
  dropCrewBan,
  placeBlock,
  readCrewLogo,
  renameCrew,
  setCrewProfile,
  setStudentCrew,
  whoOf,
} from "@/lib/crew-desk";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { abOn, onAbRoster } from "@/lib/store";
import { AVATARS } from "@/lib/avatars";
import { CrewBanner, WorkerCard } from "@/components/shop-cards";
import { titleOf } from "@/lib/flair";
import { cn } from "@/lib/utils";

export function CrewDesk({
  file,
  onChange,
  startPeriod,
}: {
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  startPeriod?: number;
}) {
  const shop = shopBells(file).map((b) => b.period);
  const [period, setPeriod] = useState(startPeriod && shop.includes(startPeriod) ? startPeriod : (shop[0] ?? 1));
  const [date, setDate] = useState(todayIso());
  const [pick, setPick] = useState<string | null>(null);
  const [hist, setHist] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [want, setWant] = useState<string | null>(null);
  const letter = abOn(file, date);
  const kids = useMemo(
    () => file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter)),
    [file, period, letter],
  );
  const crews = crewsOf(file, period, date);
  const bench = kids.filter((s) => crewAt(s, date) === BENCH);
  const hits = crewConflicts(file, period, date);
  const bans = bansOf(file).filter((b) => kids.some((k) => k.id === b.a) && kids.some((k) => k.id === b.b));
  const picked = pick ? kids.find((s) => s.id === pick) : null;

  function place(dest: string, force = false) {
    if (!picked) return;
    const block = placeBlock(file, picked, dest, date);
    if (block && !force) {
      setErr(block);
      setWant(dest);
      return;
    }
    let next = file;
    if (block && force) {
      const other = kids.find((s) => s.id !== picked.id && crewAt(s, date) === dest && bansOf(file).some((b) => (b.a === picked.id && b.b === s.id) || (b.b === picked.id && b.a === s.id)));
      if (other) next = addCrewException(next, picked.id, other.id, date, "teacher override");
    }
    onChange(setStudentCrew(next, picked.id, dest, date));
    setPick(null);
    setErr("");
    setWant(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="tw-gadget p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Crew manager</p>
        <p className="font-display text-2xl font-semibold tracking-tight">Who sits with whom</p>
        <p className="mt-1 text-sm text-muted">
          {CREW_MIN}–{CREW_MAX} per crew · up to {CREWS_MAX} crews · Separate rules live on Roster
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || date)} className="min-h-10 rounded-md bg-elevated px-2 text-sm" />
          {shop.map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setPick(null); }} className={cn("min-h-10 rounded-full px-3 text-xs font-semibold", period === p ? "bg-fg text-bg" : "bg-elevated text-muted")}>
              P{p}
            </button>
          ))}
        </div>
      </header>

      {hits.length ? (
        <div className="rounded-xl bg-loss px-3 py-2 text-accent-fg">
          <p className="text-[11px] font-bold uppercase">Separate · on this date</p>
          {hits.map((h) => (
            <p key={`${h.a.id}-${h.b.id}`} className="text-sm font-semibold">
              {h.a.first} + {h.b.first} in {h.crew}
              {h.ban.note ? ` · ${h.ban.note}` : " · roster"}
            </p>
          ))}
        </div>
      ) : null}
      {err ? <p className="rounded-lg bg-cleanup/20 px-3 py-2 text-sm font-semibold text-cleanup">{err}</p> : null}
      {picked ? (
        <p className="text-sm">
          Place <span className="font-semibold">{whoOf(picked, true)}</span> → tap a crew
          <button type="button" className="ml-2 text-xs text-muted" onClick={() => { setPick(null); setErr(""); }}>
            cancel
          </button>
        </p>
      ) : (
        <p className="text-sm text-muted">Tap a worker, then tap a crew. History is kept per day.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {crews.map((c) => {
          const n = c.kids.length;
          const size = n < CREW_MIN ? "short" : n > CREW_MAX ? "over" : "ok";
          return (
            <article key={c.key} className="tw-gadget overflow-hidden p-3">
              <CrewBanner name={c.name} motto={c.motto} icon={c.icon} color={c.color} logo={c.logo} period={period} n={n} />
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={c.name}
                  onChange={(e) => onChange(renameCrew(file, period, c.key, e.target.value))}
                  className="min-h-9 min-w-0 flex-1 bg-transparent font-display text-lg font-semibold outline-none"
                />
                <span className={cn("text-xs font-bold", size === "ok" ? "text-gain" : "text-loss")}>
                  {n}/{CREW_MAX}
                </span>
                <button type="button" disabled={!picked} onClick={() => place(c.key)} className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", picked ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                  Here
                </button>
              </div>
              <input
                value={c.motto ?? ""}
                onChange={(e) => onChange(setCrewProfile(file, period, c.key, { motto: e.target.value }))}
                placeholder="Motto"
                className="mt-1 min-h-9 w-full rounded-md bg-elevated px-2 text-sm outline-none"
              />
              <div className="mt-1 flex flex-wrap gap-0.5">
                {AVATARS.slice(0, 12).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onChange(setCrewProfile(file, period, c.key, { icon: c.icon === a ? "" : a }))}
                    className={cn("flex size-8 items-center justify-center rounded-md text-base", c.icon === a ? "bg-gold text-bg" : "bg-elevated")}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {CREW_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => onChange(setCrewProfile(file, period, c.key, { color: c.color === col ? "" : col }))}
                    className={cn("size-7 rounded-full ring-2", c.color === col ? "ring-fg" : "ring-transparent")}
                    style={{ background: col }}
                    aria-label={col}
                  />
                ))}
              </div>
              <label className="mt-1 block text-[11px] text-muted">
                Logo
                <input
                  type="file"
                  accept="image/*"
                  className="mt-0.5 block w-full text-xs"
                  onChange={(e) => readCrewLogo(e.target.files, (url) => onChange(setCrewProfile(file, period, c.key, { logo: url })))}
                />
              </label>
              {c.logo ? (
                <div className="mt-1 flex items-center gap-2">
                  <img src={c.logo} alt="" className="size-10 rounded-md object-cover" />
                  <button type="button" className="text-xs text-muted" onClick={() => onChange(setCrewProfile(file, period, c.key, { logo: "" }))}>
                    Remove
                  </button>
                </div>
              ) : null}
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {c.kids.map((s) => (
                  <Kid key={s.id} s={s} file={file} xp={xpIntoLevel(file, s.id).xp} on={pick === s.id} onPick={() => { setPick(s.id); setHist(s.id); setErr(""); }} />
                ))}
              </ul>
            </article>
          );
        })}
        <article className="tw-gadget p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-lg font-semibold">Bench</p>
            <button type="button" disabled={!picked} onClick={() => place(BENCH)} className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", picked ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
              Here
            </button>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-1">
            {bench.map((s) => (
              <Kid key={s.id} s={s} file={file} xp={xpIntoLevel(file, s.id).xp} on={pick === s.id} onPick={() => { setPick(s.id); setHist(s.id); setErr(""); }} />
            ))}
          </ul>
          {crews.length < CREWS_MAX ? (
            <button type="button" onClick={() => onChange(addPeriodCrew(file, period))} className="mt-2 min-h-9 text-xs font-semibold text-muted">
              + Crew
            </button>
          ) : null}
        </article>
      </div>

      <section className="tw-gadget p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Separate</p>
        <p className="mt-1 text-sm text-muted">Add or lift a pair on Admin → Records → Roster. This board only seats and warns.</p>
        <ul className="mt-2 space-y-1">
          {bans.map((b) => {
            const left = kids.find((s) => s.id === b.a);
            const c = kids.find((s) => s.id === b.b);
            if (!left || !c) return null;
            return (
              <li key={`${b.a}|${b.b}`} className="flex items-center justify-between gap-2 rounded-md bg-elevated px-2 py-1 text-sm">
                <span>
                  <span className="font-semibold">{left.first}</span> + <span className="font-semibold">{c.first}</span>
                  <span className="ml-2 text-muted">{b.note || "roster"}</span>
                </span>
                <button type="button" className="text-xs text-muted" onClick={() => onChange(dropCrewBan(file, b.a, b.b))}>
                  Lift
                </button>
              </li>
            );
          })}
        </ul>
        {err.startsWith("Separate") && picked && want ? (
          <button type="button" className="mt-2 min-h-9 rounded-md bg-elevated px-3 text-xs font-semibold" onClick={() => place(want, true)}>
            Override today (logged)
          </button>
        ) : null}
      </section>

      {hist ? <History file={file} id={hist} date={date} /> : null}
    </div>
  );
}

function Kid({ s, file, xp, on, onPick }: { s: RawStudent; file: EconomyFile; xp: number; on: boolean; onPick: () => void }) {
  return (
    <li className={on ? "rounded-xl ring-2 ring-accent" : ""}>
      <WorkerCard
        id={s.id}
        name={s.first}
        icon={s.icon}
        title={titleOf(xp)}
        xp={xp}
        legal={s.legalLast}
        onClick={onPick}
      />
    </li>
  );
}

function History({ file, id, date }: { file: EconomyFile; id: string; date: string }) {
  const s = file.students.find((x) => x.id === id);
  if (!s) return null;
  const rows = crewHistory(s);
  return (
    <section className="tw-gadget p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">History · {whoOf(s, true)}</p>
      <p className="mt-1 text-sm">
        {formatSchoolDate(date)} → <span className="font-semibold">{crewAt(s, date)}</span>
      </p>
      <ol className="mt-2 space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.date} className="flex justify-between gap-2">
            <span className="text-muted">{r.date === "start" ? "Roster start" : formatSchoolDate(r.date)}</span>
            <span className="font-semibold">{r.crew}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
