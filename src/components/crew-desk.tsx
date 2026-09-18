import { useMemo, useState } from "react";
import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, padFirst, shopBells, showFirstReal } from "@/lib/economy";
import { xpIntoLevel } from "@/lib/skills";
import { crewsOf } from "@/lib/crews";
import {
  addCrewException,
  addPeriodCrew,
  bansOf,
  BENCH,
  CREW_COLORS,
  CREW_PACKS,
  copyCrewLooksToShop,
  crewAt,
  crewConflicts,
  crewHistory,
  crewRulesOf,
  dealCrews,
  dropCrewBan,
  dropPeriodCrew,
  placeBlock,
  readCrewLogo,
  renameCrew,
  setCrewProfile,
  setCrewRules,
  setStudentCrew,
  whoOf,
} from "@/lib/crew-desk";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { abOn, crewLeaderId, onAbRoster, setCrewLeader } from "@/lib/store";
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
  const [look, setLook] = useState<string | null>(null);
  const letter = abOn(file, date);
  const rules = crewRulesOf(file);
  const kids = useMemo(
    () => file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName) && onAbRoster(s, letter)),
    [file, period, letter],
  );
  const crews = crewsOf(file, period, date);
  const bench = kids.filter((s) => crewAt(s, date) === BENCH);
  const hits = crewConflicts(file, period, date);
  const bans = bansOf(file).filter((b) => kids.some((k) => k.id === b.a) && kids.some((k) => k.id === b.b));
  const picked = pick ? kids.find((s) => s.id === pick) : null;
  const packId = CREW_PACKS.find((p) => p.min === rules.min && p.max === rules.max && p.crewsMax === rules.crewsMax)?.id;
  const real = showFirstReal(file);

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
        <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Crew tools</p>
        <p className="font-display text-2xl font-semibold tracking-tight">Who sits with whom</p>
        <p className="mt-1 text-sm text-muted">
          {rules.min}–{rules.max} per crew · up to {rules.crewsMax} crews · Separate stays on Roster
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value || date)} className="min-h-10 rounded-md bg-elevated px-2 text-sm" />
          {shop.map((p) => (
            <button key={p} type="button" onClick={() => { setPeriod(p); setPick(null); }} className={cn("min-h-10 rounded-full px-3 text-xs font-semibold", period === p ? "bg-fg text-bg" : "bg-elevated text-muted")}>
              P{p}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {CREW_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              title={p.hint}
              onClick={() => onChange(setCrewRules(file, p))}
              className={cn("tw-tap min-h-9 rounded-full px-3 text-xs font-semibold", packId === p.id ? "bg-gold text-bg" : "bg-elevated text-muted")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" onClick={() => onChange(dealCrews(file, period, date))} className="tw-tap min-h-10 rounded-md bg-accent px-3 text-xs font-semibold text-accent-fg">
            Deal even
          </button>
          <button type="button" onClick={() => onChange(copyCrewLooksToShop(file, period))} className="tw-tap min-h-10 rounded-md bg-elevated px-3 text-xs font-semibold">
            Copy look → all periods
          </button>
          {crews.length < rules.crewsMax ? (
            <button type="button" onClick={() => onChange(addPeriodCrew(file, period))} className="tw-tap min-h-10 rounded-md bg-elevated px-3 text-xs font-semibold">
              + Crew
            </button>
          ) : null}
        </div>
      </header>

      {hits.length ? (
        <div className="rounded-xl bg-loss px-3 py-2 text-accent-fg">
          <p className="text-[11px] font-bold uppercase">Separate · on this date</p>
          {hits.map((h) => (
            <p key={`${h.a.id}-${h.b.id}`} className="text-sm font-semibold">
              {padFirst(h.a, real)} + {padFirst(h.b, real)} in {h.crew}
              {h.ban.note ? ` · ${h.ban.note}` : " · roster"}
            </p>
          ))}
        </div>
      ) : null}
      {err ? <p className="rounded-lg bg-cleanup/20 px-3 py-2 text-sm font-semibold text-cleanup">{err}</p> : null}
      {picked ? (
        <p className="text-sm">
          Place <span className="font-semibold">{whoOf(picked, true)}</span> → tap Here
          <button type="button" className="ml-2 text-xs text-muted" onClick={() => { setPick(null); setErr(""); }}>
            cancel
          </button>
        </p>
      ) : (
        <p className="text-sm text-muted">Tap a worker, then Here. Deal even seats the period. Look is name, color, mark, motto.</p>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {crews.map((c) => {
          const n = c.kids.length;
          const size = n < rules.min ? "short" : n > rules.max ? "over" : "ok";
          const leadId = crewLeaderId(file, period, c.key);
          return (
            <article key={c.key} className="tw-gadget overflow-hidden p-3">
              <CrewBanner name={c.name} motto={c.motto} icon={c.icon} color={c.color} logo={c.logo} period={period} n={n} />
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className={cn("text-xs font-bold", size === "ok" ? "text-gain" : "text-loss")}>
                  {n}/{rules.max}
                </span>
                <button type="button" disabled={!picked} onClick={() => place(c.key)} className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", picked ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}>
                  Here
                </button>
                <button
                  type="button"
                  onClick={() => setLook(look === c.key ? null : c.key)}
                  className={cn("min-h-9 rounded-md px-2 text-xs font-semibold", look === c.key ? "bg-gold text-bg" : "bg-elevated")}
                >
                  Look
                </button>
                <button
                  type="button"
                  onClick={() => onChange(dropPeriodCrew(file, period, c.key, date))}
                  className="min-h-9 rounded-md px-2 text-xs font-semibold text-muted"
                >
                  Drop
                </button>
              </div>
              {look === c.key ? (
                <LookPad
                  name={c.name}
                  motto={c.motto ?? ""}
                  icon={c.icon ?? ""}
                  color={c.color ?? ""}
                  logo={c.logo ?? ""}
                  onName={(name) => onChange(renameCrew(file, period, c.key, name))}
                  onPatch={(patch) => onChange(setCrewProfile(file, period, c.key, patch))}
                />
              ) : null}
              <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Crown
                <select
                  value={leadId}
                  onChange={(e) => onChange(setCrewLeader(file, period, c.key, e.target.value))}
                  className="mt-0.5 min-h-10 w-full rounded-md bg-elevated px-2 text-sm"
                >
                  <option value="">No lead yet</option>
                  {c.kids.map((s) => (
                    <option key={s.id} value={s.id}>{padFirst(s, real)}</option>
                  ))}
                </select>
              </label>
              <ul className="mt-2 grid grid-cols-2 gap-1.5">
                {c.kids.map((s) => (
                  <Kid key={s.id} s={s} file={file} xp={xpIntoLevel(file, s.id).xp} lead={s.id === leadId} on={pick === s.id} onPick={() => { setPick(s.id); setHist(s.id); setErr(""); }} />
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
                  <span className="font-semibold">{padFirst(left, real)}</span> + <span className="font-semibold">{padFirst(c, real)}</span>
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

function LookPad({
  name,
  motto,
  icon,
  color,
  logo,
  onName,
  onPatch,
}: {
  name: string;
  motto: string;
  icon: string;
  color: string;
  logo: string;
  onName: (name: string) => void;
  onPatch: (patch: { motto?: string; icon?: string; color?: string; logo?: string }) => void;
}) {
  return (
    <div className="mt-2 grid gap-1 rounded-xl bg-elevated p-2">
      <input value={name} onChange={(e) => onName(e.target.value)} className="min-h-10 rounded-md bg-surface px-2 font-display text-lg font-semibold outline-none" aria-label="Crew name" />
      <input value={motto} onChange={(e) => onPatch({ motto: e.target.value })} placeholder="Motto" className="min-h-9 rounded-md bg-surface px-2 text-sm outline-none" aria-label="Motto" />
      <div className="flex flex-wrap gap-0.5">
        {AVATARS.slice(0, 12).map((a) => (
          <button key={a} type="button" onClick={() => onPatch({ icon: icon === a ? "" : a })} className={cn("flex size-8 items-center justify-center rounded-md text-base", icon === a ? "bg-gold text-bg" : "bg-surface")}>
            {a}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {CREW_COLORS.map((col) => (
          <button key={col} type="button" onClick={() => onPatch({ color: color === col ? "" : col })} className={cn("size-7 rounded-full ring-2", color === col ? "ring-fg" : "ring-transparent")} style={{ background: col }} aria-label={col} />
        ))}
      </div>
      <label className="block text-[11px] text-muted">
        Logo
        <input type="file" accept="image/*" className="mt-0.5 block w-full text-xs" onChange={(e) => readCrewLogo(e.target.files, (url) => onPatch({ logo: url }))} />
      </label>
      {logo ? (
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="size-10 rounded-md object-cover" />
          <button type="button" className="text-xs text-muted" onClick={() => onPatch({ logo: "" })}>
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Kid({ s, file, xp, lead, on, onPick }: { s: RawStudent; file: EconomyFile; xp: number; lead?: boolean; on: boolean; onPick: () => void }) {
  return (
    <li className={on ? "rounded-xl ring-2 ring-accent" : ""}>
      <WorkerCard
        id={s.id}
        name={padFirst(s, showFirstReal(file))}
        icon={s.icon}
        title={lead ? "Crew lead" : titleOf(xp)}
        xp={xp}
        lead={lead}
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
