import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { money, score, legalFirstOf, legalLastOf, bellFor } from "@/lib/economy";
import { skillsOf, skillScore, skillTrackOf, xpIntoLevel, levelBandsOf } from "@/lib/skills";
import { gradeSlots, letterOf, postedFor, sessionMark } from "@/lib/grades";
import { currentProject, recordOn, MST_SKILLS } from "@/lib/mst";
import { formatSchoolDate, todayIso } from "@/lib/calendar";
import { workerCards } from "@/lib/report";
import { bumpMoney, buyShop, catalogOf, MONEY_STEP, setAffect, setAlias, setAvatar, setStudentFlags, setQuietNotes } from "@/lib/store";
import { AVATARS, avatarOf } from "@/lib/avatars";
import { publicHandle } from "@/lib/live";
import { achievementsFor, achievementLines } from "@/lib/achievements";
import { QuarterChip } from "@/components/quarter-chip";
import { LevelMark } from "@/components/level-mark";
import { ReportCard } from "@/components/report-card";
import { featureOn } from "@/lib/features";
import { cn } from "@/lib/utils";

const FACES = ["😞", "😐", "🙂", "😄", "😴"] as const;
const MARK = ["", "1 Beg", "2 Dev", "3 Prof", "4 Dist"] as const;

function gradeOf(file: EconomyFile, id: string): { avg: number | null; letter: string } {
  const s = file.students.find((x) => x.id === id);
  if (!s) return { avg: null, letter: "—" };
  const g = bellFor(file).find((b) => b.period === s.period)?.grade ?? s.grade ?? 6;
  const avg = sessionMark(gradeSlots(file, g).map((slot) => postedFor(file, s, slot)));
  return { avg, letter: letterOf(avg) };
}

function deco(id: string, flags: EconomyFile["students"][number]["flags"] | undefined, unlocked: boolean) {
  const palette = [
    "bg-period-1",
    "bg-period-2",
    "bg-period-3",
    "bg-period-4",
    "bg-period-5",
    "bg-period-6",
    "bg-subtle",
    "bg-elevated",
  ];
  const hash = [...id].reduce((n, c) => n + c.charCodeAt(0), 0);
  const dots = Array.from({ length: 8 }, (_, i) => palette[(hash + i * 3) % palette.length]);
  if (unlocked && flags?.iep) dots[hash % 8] = "bg-dot-iep";
  if (unlocked && flags?.plan504) dots[(hash + 5) % 8] = "bg-dot-504";
  if (unlocked && flags?.dhh) dots[(hash + 2) % 8] = "bg-subtle";
  return dots;
}

export function Dossier({
  file,
  id,
  unlocked,
  onChange,
  onClose,
  onNeedPin,
}: {
  file: EconomyFile;
  id: string;
  unlocked: boolean;
  onChange: (next: EconomyFile) => void;
  onClose: () => void;
  onNeedPin: () => void;
}) {
  const list = useMemo(() => score(file), [file]);
  const cards = useMemo(() => workerCards(file), [file]);
  const raw = file.students.find((s) => s.id === id);
  const row = list.find((s) => s.id === id);
  const card = cards.find((s) => s.id === id);
  const [alias, setAliasText] = useState(raw?.first ?? "");
  const [openInfo, setOpenInfo] = useState(false);
  const [pickIcon, setPickIcon] = useState(false);
  if (!raw || !row || !card) return null;
  const shop = catalogOf(file, raw.period);
  const groups = [...new Set(shop.map((x) => x.category))];
  const flags = raw.flags ?? {};
  const dots = deco(raw.id, flags, unlocked);
  const band = xpIntoLevel(file, raw.id);
  const skills = skillsOf(file);
  const achievements = achievementsFor(file, id);
  const rankLabel = levelBandsOf(file).filter((b) => band.xp >= b.minXp).at(-1)?.label || "";
  const posted = gradeOf(file, id);
  const project = currentProject(file);
  const stamps = [...card.stamps].reverse();
  const earn = row.stock - row.principal;
  const picks = (raw.picks ?? []).filter(Boolean);

  function moneyTap(field: "bonus" | "deduct" | "clutch", delta: number) {
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(bumpMoney(file, id, field, delta));
  }

  return (
    <div className="tw-scrim fixed inset-0 z-40 flex items-end justify-center p-3 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface">
        <header className="shrink-0 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                aria-label="Choose avatar"
                aria-expanded={pickIcon}
                onClick={() => {
                  if (!unlocked) {
                    onNeedPin();
                    return;
                  }
                  setPickIcon((v) => !v);
                }}
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-elevated text-3xl ring-1 ring-border"
              >
                {avatarOf(raw.icon, raw.id)}
              </button>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex gap-1" aria-hidden>
                  {dots.map((c, i) => (
                    <span key={i} className={cn("size-1.5 rounded-full", c)} />
                  ))}
                </div>
                {unlocked ? (
                  <input
                    value={alias}
                    onChange={(e) => setAliasText(e.target.value)}
                    onBlur={() => alias.trim() && onChange(setAlias(file, id, alias))}
                    className="w-full bg-transparent font-display text-3xl font-semibold tracking-tight text-fg outline-none"
                  />
                ) : (
                  <h2 className="font-display text-3xl font-semibold tracking-tight">{raw.first}</h2>
                )}
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  {publicHandle(raw.id)}
                  <QuarterChip />
                </p>
                <div className="mt-2 flex gap-1" aria-label="Affect">
                  {FACES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onChange(setAffect(file, id, todayIso(), f))}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-md text-sm",
                        (raw.affect ?? {})[todayIso()] === f ? "bg-elevated ring-1 ring-fg" : "opacity-50 hover:opacity-100",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-muted"
                  onClick={() => {
                    if (!unlocked) {
                      onNeedPin();
                      return;
                    }
                    setOpenInfo((v) => !v);
                  }}
                >
                  {openInfo ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  {openInfo ? "Hide full info" : "Show full info"}
                </button>
                {openInfo ? (
                  <div className="mt-2 text-sm text-muted">
                    <p>
                      {legalFirstOf(raw) || raw.first} {legalLastOf(raw)} · {raw.course} · P{raw.period} · sec {raw.section} · {raw.crewKey} · {raw.sem}
                    </p>
                    <p className="mt-2 text-sm">
                      IEP {flags.iep ? "yes" : "no"}
                      <span className="mx-2 text-subtle">·</span>
                      504 {flags.plan504 ? "yes" : "no"}
                      {flags.ell ? <span className="ml-2">· ELL</span> : null}
                      {flags.dhh ? <span className="ml-2">· DHH</span> : null}
                      <span className="ml-2 text-subtle">(IEP/504 from roster · not editable here)</span>
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="size-11 shrink-0 rounded-lg bg-elevated text-muted">
              <X className="mx-auto size-4" />
            </button>
          </div>
          {pickIcon && unlocked ? (
            <div className="mt-3 grid grid-cols-6 gap-1 sm:grid-cols-10" role="listbox" aria-label="Avatar">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="option"
                  aria-selected={avatarOf(raw.icon, raw.id) === a}
                  onClick={() => {
                    onChange(setAvatar(file, id, a));
                    setPickIcon(false);
                  }}
                  className={cn(
                    "flex size-11 w-full items-center justify-center rounded-lg text-xl",
                    avatarOf(raw.icon, raw.id) === a ? "bg-gold text-bg" : "bg-elevated",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-5 pb-5">
          <p className="mb-3 text-sm text-subtle">
            Four games: <span className="text-gold">XP</span> from workshop skills · <span className="text-fg">grade</span> from 3/2/1 + skills
            · <span className="text-muted">perks $</span> from pay − store − P · <span className="text-fg">STOCK</span> from invested pay × market. They do not mix.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-elevated p-3">
              <p className="text-sm text-muted">Skill XP {rankLabel ? `· ${rankLabel}` : ""}</p>
              <LevelMark level={band.level} xp={band.xp} className="mt-1 text-lg" />
              <p className="mt-1 text-xs text-subtle">#{card.rankSkill} skills · next {band.into}/{band.need}</p>
            </div>
            <Stat label="Grade" value={posted.avg == null ? "—" : `${posted.avg} ${posted.letter}`} />
            <Stat label="Perks" value={money(row.quarter)} />
            <Stat label="STOCK" value={money(row.stock)} />
          </div>
          <p className="mt-2 text-xs text-subtle">
            P{raw.period} rank #{card.rankPeriod} · school #{card.rankSchool} · earned {money(card.earned)} · opening {money(Number(raw.opening || 0))}
          </p>
          <p className="mt-1 text-xs text-muted">
            STOCK invested {money(row.principal)} · earnings {money(earn)}
            {picks.length ? ` · ${picks.join(" · ")}` : " · no 3 picks yet"}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {skills.map((d) => {
              const n = skillScore(raw, d.id);
              const track = skillTrackOf(d.id);
              return (
                <span
                  key={d.id}
                  title={track?.does}
                  className={cn("rounded-md px-2 py-1 text-xs font-semibold", n ? "bg-elevated text-gold" : "bg-elevated text-subtle")}
                >
                  {track?.name ?? d.name} {n ? MARK[n] : "—"}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-medium uppercase tracking-wider text-subtle">NY Tech · {project.title}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {MST_SKILLS.map((sk) => {
              const rec = recordOn(file, id, project.id, sk.id);
              return (
                <span key={sk.id} title={sk.bench} className={cn("rounded-md px-2 py-1 text-xs", rec?.score ? "bg-elevated text-fg" : "bg-elevated text-subtle")}>
                  {sk.id} {sk.short} {rec?.score ?? "—"}
                </span>
              );
            })}
          </div>

          {featureOn(file, "achievements") ? (
          <>
          <p className="mt-5 text-sm font-medium uppercase tracking-wider text-subtle">Achievements</p>
          <p className="mt-1 text-sm text-muted">Crew lead count · Skills XP from confirmed leads only (never wallet).</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Times led crew" value={String(achievements.timesLedCrew)} />
            <Stat label="Crew-lead streak" value={String(achievements.crewLeadStreak)} />
            {unlocked ? <Stat label="Lead Skills XP" value={`+${achievements.leadSkillsXp}`} /> : null}
          </div>
          {unlocked ? (
            <ul className="mt-2 space-y-0.5 text-sm text-subtle">
              {achievementLines(achievements, { teacher: true }).slice(0, 6).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
          </>
          ) : null}

          {unlocked ? (
            <section className="mt-5 rounded-lg bg-elevated px-3 py-3">
              <p className="text-sm font-medium uppercase tracking-wider text-subtle">Supports</p>
              <p className="mt-1 text-sm text-muted">PIN only. Quiet chips — never on the wall. IEP and 504 stay on the roster.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  ["ell", "ELL"],
                  ["preferSeating", "Seating"],
                  ["extendedTime", "Ext. time"],
                  ["dhh", "DHH"],
                ] as const).map(([key, label]) => {
                  const on = Boolean(flags[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onChange(setStudentFlags(file, id, { [key]: !on }))}
                      className={cn(
                        "min-h-11 rounded-md px-3 text-sm font-semibold",
                        on ? "bg-elevated text-fg ring-1 ring-border" : "bg-surface text-muted",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 block">
                <span className="text-sm text-subtle">Quiet notes</span>
                <textarea
                  value={raw.quietNotes ?? ""}
                  onChange={(e) => onChange(setQuietNotes(file, id, e.target.value))}
                  rows={2}
                  className="mt-1 w-full rounded-md bg-surface px-3 py-2 text-sm text-fg outline-none"
                />
              </label>
            </section>
          ) : null}

          <ReportCard file={file} id={id} names={unlocked} print />

          <p className="mt-5 text-sm font-medium uppercase tracking-wider text-subtle">Money (PIN)</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["bonus", "deduct", "clutch"] as const).map((field) => (
              <div key={field} className="rounded-lg bg-elevated p-3">
                <p className="text-sm capitalize text-muted">{field}</p>
                <p className="font-mono text-lg">{money(Number(raw[field] || 0))}</p>
                <div className="mt-2 flex gap-1">
                  <button type="button" className="min-h-11 flex-1 rounded-md bg-surface" onClick={() => moneyTap(field, -MONEY_STEP)}>
                    −{MONEY_STEP}
                  </button>
                  <button type="button" className="min-h-11 flex-1 rounded-md bg-surface" onClick={() => moneyTap(field, MONEY_STEP)}>
                    +{MONEY_STEP}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm font-medium uppercase tracking-wider text-subtle">{raw.period === 6 ? "Hall store" : "Tech store"}</p>
          {groups.map((g) => (
            <div key={g} className="mt-2">
              <p className="text-sm text-muted">{g}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {shop
                  .filter((x) => x.category === g)
                  .map((item) => {
                    const broke = row.quarter < item.price;
                    return (
                    <button
                      key={item.name}
                      type="button"
                      disabled={broke}
                      onClick={() => {
                        if (broke) return;
                        if (!unlocked) {
                          onNeedPin();
                          return;
                        }
                        onChange(buyShop(file, id, item));
                      }}
                      className={cn(
                        "min-h-11 rounded-md px-3 text-sm uppercase tracking-wide",
                        broke ? "bg-elevated text-subtle line-through" : "bg-elevated",
                      )}
                    >
                      {item.name} · ${item.price}
                      {broke ? " · can't afford" : ""}
                    </button>
                    );
                  })}
              </div>
            </div>
          ))}

          <p className="mt-5 text-sm font-medium uppercase tracking-wider text-subtle">Purchases</p>
          <ul className="mt-2 text-sm">
            {(raw.purchases ?? []).length === 0 ? (
              <li className="text-muted">None yet.</li>
            ) : (
              (raw.purchases ?? []).map((p, i) => (
                <li key={i} className="flex justify-between border-t border-border py-2">
                  <span>
                    {p.category} · {p.item}
                  </span>
                  <span className="font-mono text-loss">{money(-p.price)}</span>
                </li>
              ))
            )}
          </ul>

          <p className="mt-5 text-sm font-medium uppercase tracking-wider text-subtle">Day log · newest first</p>
          <table className="mt-2 w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 font-medium">Daily goal</th>
                <th className="py-1 font-medium">Observed</th>
                <th className="py-1 font-medium">Happened</th>
                <th className="py-1 font-medium">Code</th>
                <th className="py-1 text-right font-medium">Pay</th>
                <th className="py-1 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {stamps.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted" colSpan={7}>
                    No days stamped.
                  </td>
                </tr>
              ) : (
                stamps.map((st) => (
                  <tr key={st.date} className="border-t border-border align-top">
                    <td className="py-2">{formatSchoolDate(st.date)}</td>
                    <td className="uppercase text-muted">{st.goal || "—"}</td>
                    <td className="uppercase text-muted">{st.activity || "—"}</td>
                    <td className="text-muted">{st.happened || "—"}</td>
                    <td className="font-mono">{st.code || "—"}</td>
                    <td className="text-right font-mono">
                      {money(st.pay)}
                      {st.invested ? <span className="ml-2 text-gold">inv {money(st.invested)}</span> : null}
                      {(raw.affect ?? {})[st.date] ? <span className="ml-1">{(raw.affect ?? {})[st.date]}</span> : null}
                    </td>
                    <td className="text-muted">{st.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevated p-3">
      <p className="text-sm text-subtle">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
