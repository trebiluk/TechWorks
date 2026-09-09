import { useMemo, useState } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, shopBells } from "@/lib/economy";
import { crewsOf } from "@/lib/crews";
import {
  addCrewBan,
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
  const [banA, setBanA] = useState("");
  const [banB, setBanB] = useState("");
  const [banNote, setBanNote] = useState("");
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
          {CREW_MIN}–{CREW_MAX} per crew · up to {CREWS_MAX} crews · principal “do not pair” stays off the wall
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
          <p className="text-[11px] font-bold uppercase">Do not pair · on this date</p>
          {hits.map((h) => (
            <p key={`${h.a.id}-${h.b.id}`} className="text-sm font-semibold">
              {h.a.first} + {h.b.first} in {h.crew}
              {h.ban.note ? ` · ${h.ban.note}` : " · principal"}
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
            <article key={c.key} className="tw-gadget p-3">
              <div className="flex items-center gap-2">
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
              <ul className="mt-2 grid grid-cols-2 gap-1">
                {c.kids.map((s) => (
                  <Kid key={s.id} s={s} on={pick === s.id} onPick={() => { setPick(s.id); setHist(s.id); setErr(""); }} onHist={() => setHist(s.id)} />
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
              <Kid key={s.id} s={s} on={pick === s.id} onPick={() => { setPick(s.id); setHist(s.id); setErr(""); }} onHist={() => setHist(s.id)} />
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
        <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Principal · do not pair</p>
        <form
          className="mt-2 flex flex-wrap gap-1"
          onSubmit={(e) => {
            e.preventDefault();
            if (!banA || !banB || banA === banB) return;
            onChange(addCrewBan(file, banA, banB, banNote, "principal"));
            setBanA("");
            setBanB("");
            setBanNote("");
          }}
        >
          <select value={banA} onChange={(e) => setBanA(e.target.value)} className="min-h-10 rounded-md bg-elevated px-2 text-sm">
            <option value="">Worker A</option>
            {kids.map((s) => (
              <option key={s.id} value={s.id}>
                {whoOf(s, true)}
              </option>
            ))}
          </select>
          <select value={banB} onChange={(e) => setBanB(e.target.value)} className="min-h-10 rounded-md bg-elevated px-2 text-sm">
            <option value="">Worker B</option>
            {kids.map((s) => (
              <option key={s.id} value={s.id}>
                {whoOf(s, true)}
              </option>
            ))}
          </select>
          <input value={banNote} onChange={(e) => setBanNote(e.target.value)} placeholder="Why (office note)" className="min-h-10 min-w-40 flex-1 rounded-md bg-elevated px-2 text-sm" />
          <button type="submit" className="min-h-10 rounded-md bg-loss px-3 text-xs font-semibold text-accent-fg">
            Lock pair
          </button>
        </form>
        <ul className="mt-2 space-y-1">
          {bans.map((b) => {
            const a = kids.find((s) => s.id === b.a);
            const c = kids.find((s) => s.id === b.b);
            if (!a || !c) return null;
            return (
              <li key={`${b.a}|${b.b}`} className="flex items-center justify-between gap-2 rounded-md bg-elevated px-2 py-1 text-sm">
                <span>
                  <span className="font-semibold">{a.first}</span> + <span className="font-semibold">{c.first}</span>
                  <span className="ml-2 text-muted">{b.note || "principal"}</span>
                </span>
                <button type="button" className="text-xs text-muted" onClick={() => onChange(dropCrewBan(file, b.a, b.b))}>
                  Lift
                </button>
              </li>
            );
          })}
        </ul>
        {err.startsWith("Principal") && picked && want ? (
          <button type="button" className="mt-2 min-h-9 rounded-md bg-elevated px-3 text-xs font-semibold" onClick={() => place(want, true)}>
            Override today (logged)
          </button>
        ) : null}
      </section>

      {hist ? <History file={file} id={hist} date={date} /> : null}
    </div>
  );
}

function Kid({ s, on, onPick, onHist }: { s: RawStudent; on: boolean; onPick: () => void; onHist: () => void }) {
  return (
    <li>
      <button type="button" onClick={onPick} onDoubleClick={onHist} className={cn("tw-tap min-h-11 w-full rounded-lg px-2 text-left text-sm font-semibold", on ? "bg-accent text-accent-fg" : "bg-elevated")}>
        {s.first}
        {s.legalLast ? <span className="ml-1 text-[10px] font-medium opacity-70">{s.legalLast}</span> : null}
      </button>
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
