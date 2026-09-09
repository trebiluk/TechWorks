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
import { ownedQty, printsOf, RARITY_LABEL } from "@/lib/prints";
import { AVATARS, avatarOf } from "@/lib/avatars";
import { publicHandle } from "@/lib/live";
import { achievementsFor, achievementLines } from "@/lib/achievements";
import { LevelMark } from "@/components/level-mark";
import { ReportCard } from "@/components/report-card";
import { SkillScaffold } from "@/components/skill-scaffold";
import { featureOn } from "@/lib/features";
import { cn } from "@/lib/utils";
import { HouseCard } from "@/components/house-card";
import { isHouseId } from "@/lib/house";

const FACES = ["😞", "😐", "🙂", "😄", "😴"] as const;
type Pane = "overview" | "skills" | "family" | "desk";

function gradeOf(file: EconomyFile, id: string): { avg: number | null; letter: string } {
  const s = file.students.find((x) => x.id === id);
  if (!s) return { avg: null, letter: "—" };
  const g = bellFor(file).find((b) => b.period === s.period)?.grade ?? s.grade ?? 6;
  const avg = sessionMark(gradeSlots(file, g).map((slot) => postedFor(file, s, slot)));
  return { avg, letter: letterOf(avg) };
}

function deco(id: string, flags: EconomyFile["students"][number]["flags"] | undefined, unlocked: boolean) {
  const palette = ["bg-period-1", "bg-period-2", "bg-period-3", "bg-period-4", "bg-period-5", "bg-period-6", "bg-subtle", "bg-elevated"];
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
  const [pane, setPane] = useState<Pane>("overview");
  if (isHouseId(id)) return <HouseCard id={id} onClose={onClose} />;
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
  const scoredSkills = skills.filter((d) => skillScore(raw, d.id) > 0);

  function needDesk() {
    if (!unlocked) {
      onNeedPin();
      return false;
    }
    return true;
  }

  function moneyTap(field: "bonus" | "deduct" | "clutch", delta: number) {
    if (!needDesk()) return;
    onChange(bumpMoney(file, id, field, delta));
  }

  const tabs: { id: Pane; label: string }[] = [
    { id: "overview", label: "Now" },
    { id: "skills", label: "Skills" },
    { id: "family", label: "Family" },
    { id: "desk", label: "Desk" },
  ];

  return (
    <div className="tw-scrim fixed inset-0 z-40 flex items-end justify-center p-2 sm:items-center sm:p-3">
      <div className="tw-gadget tw-hud flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden bg-surface">
        <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label="Choose avatar"
              aria-expanded={pickIcon}
              onClick={() => {
                if (!needDesk()) return;
                setPickIcon((v) => !v);
              }}
              className="tw-tap flex size-14 shrink-0 items-center justify-center rounded-full bg-elevated text-3xl ring-1 ring-border sm:size-16"
            >
              {avatarOf(raw.icon, raw.id)}
            </button>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex gap-1" aria-hidden>
                {dots.map((c, i) => (
                  <span key={i} className={cn("size-1.5 rounded-full", c)} />
                ))}
              </div>
              {unlocked ? (
                <input
                  value={alias}
                  onChange={(e) => setAliasText(e.target.value)}
                  onBlur={() => alias.trim() && onChange(setAlias(file, id, alias))}
                  className="w-full bg-transparent font-display text-2xl font-semibold tracking-tight text-fg outline-none sm:text-3xl"
                />
              ) : (
                <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{raw.first}</h2>
              )}
              <p className="mt-0.5 truncate font-mono text-xs tracking-wider text-muted">
                {publicHandle(raw.id)} · P{raw.period}
                {raw.crewKey ? ` · ${raw.crewKey}` : ""}
                {rankLabel ? ` · ${rankLabel}` : ""}
              </p>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-xs text-subtle"
                onClick={() => {
                  if (!needDesk()) return;
                  setOpenInfo((v) => !v);
                }}
              >
                {openInfo ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                {openInfo ? "Hide roster" : "Roster"}
              </button>
              {openInfo ? (
                <div className="mt-1 text-sm text-muted">
                  <p>
                    {legalFirstOf(raw) || raw.first} {legalLastOf(raw)} · {raw.course} · sec {raw.section} · {raw.sem}
                  </p>
                  <p className="mt-1 text-xs text-subtle">
                    IEP {flags.iep ? "yes" : "no"} · 504 {flags.plan504 ? "yes" : "no"}
                    {flags.ell ? " · ELL" : ""}
                    {flags.dhh ? " · DHH" : ""}
                    <span className="text-subtle"> · roster, not the wall</span>
                  </p>
                </div>
              ) : null}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="tw-tap size-11 shrink-0 rounded-lg bg-elevated text-muted">
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
                  className={cn("tw-tap flex size-11 w-full items-center justify-center rounded-lg text-xl", avatarOf(raw.icon, raw.id) === a ? "bg-gold text-bg" : "bg-elevated")}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            <Kpi label="XP" value={`${band.xp}`} gold />
            <Kpi label="Grade" value={posted.avg == null ? "—" : `${posted.letter}`} />
            <Kpi label="Perks" value={money(row.quarter)} />
            <Kpi label="Stock" value={money(row.stock)} />
          </div>
          <nav className="mt-3 flex gap-1" aria-label="Profile">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (t.id === "desk" && !unlocked) {
                    onNeedPin();
                    return;
                  }
                  setPane(t.id);
                }}
                className={cn("tw-tap min-h-10 flex-1 rounded-md text-sm font-semibold", pane === t.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-5">
          {pane === "overview" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                #{card.rankSkill} skills · P{raw.period} #{card.rankPeriod} · school #{card.rankSchool}
                {posted.avg != null ? ` · ${posted.avg} ${posted.letter}` : ""}
              </p>
              <LevelMark level={band.level} xp={band.xp} className="text-lg" />
              <p className="text-xs text-subtle">Next band {band.into}/{band.need} · stock in {money(row.principal)} · earned {money(earn)}</p>
              {picks.length ? <p className="text-xs text-muted">Picks {picks.join(" · ")}</p> : null}
              {scoredSkills.length ? (
                <div className="flex flex-wrap gap-1">
                  {scoredSkills.map((d) => {
                    const n = skillScore(raw, d.id);
                    return (
                      <span key={d.id} className="rounded-md bg-elevated px-2 py-1 text-xs font-semibold text-gold">
                        {skillTrackOf(d.id)?.name ?? d.name} {n}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">No skill marks yet.</p>
              )}
              {unlocked ? (
                <div className="flex gap-1" aria-label="Affect">
                  {FACES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onChange(setAffect(file, id, todayIso(), f))}
                      className={cn("tw-tap inline-flex size-9 items-center justify-center rounded-md text-sm", (raw.affect ?? {})[todayIso()] === f ? "bg-elevated ring-1 ring-fg" : "opacity-40")}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              ) : null}
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Recent days</p>
              <ul>
                {stamps.slice(0, 8).map((st) => (
                  <li key={st.date} className="flex items-baseline justify-between gap-2 border-t border-border py-2 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{formatSchoolDate(st.date)}</span>
                      <span className="text-muted"> · {st.code || "—"}</span>
                      {st.goal ? <span className="text-subtle"> · {st.goal}</span> : null}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums">{money(st.pay)}</span>
                  </li>
                ))}
                {stamps.length === 0 ? <li className="text-sm text-muted">No days stamped.</li> : null}
              </ul>
              {featureOn(file, "achievements") ? (
                <p className="text-xs text-subtle">Led crew {achievements.timesLedCrew} · streak {achievements.crewLeadStreak}</p>
              ) : null}
            </div>
          ) : null}

          {pane === "skills" ? (
            <div className="space-y-4">
              <SkillScaffold file={file} student={raw} />
              {unlocked ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">NY Tech · {project.title}</p>
                  <div className="flex flex-wrap gap-1.5">
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
                    <ul className="space-y-0.5 text-sm text-subtle">
                      {achievementLines(achievements, { teacher: true }).slice(0, 6).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : null}

          {pane === "family" ? <ReportCard file={file} id={id} names={unlocked} print /> : null}

          {pane === "desk" && unlocked ? (
            <div className="space-y-5">
              <section className="rounded-lg bg-elevated px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Supports</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([["ell", "ELL"], ["preferSeating", "Seating"], ["extendedTime", "Ext. time"], ["dhh", "DHH"]] as const).map(([key, label]) => {
                    const on = Boolean(flags[key]);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onChange(setStudentFlags(file, id, { [key]: !on }))}
                        className={cn("tw-tap min-h-11 rounded-md px-3 text-sm font-semibold", on ? "bg-surface text-fg ring-1 ring-border" : "bg-surface text-muted")}
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

              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Adjust $</p>
              <div className="grid grid-cols-3 gap-2">
                {(["bonus", "deduct", "clutch"] as const).map((field) => (
                  <div key={field} className="rounded-lg bg-elevated p-3">
                    <p className="text-sm capitalize text-muted">{field}</p>
                    <p className="font-mono text-lg">{money(Number(raw[field] || 0))}</p>
                    <div className="mt-2 flex gap-1">
                      <button type="button" className="tw-tap min-h-11 flex-1 rounded-md bg-surface" onClick={() => moneyTap(field, -MONEY_STEP)}>
                        −{MONEY_STEP}
                      </button>
                      <button type="button" className="tw-tap min-h-11 flex-1 rounded-md bg-surface" onClick={() => moneyTap(field, MONEY_STEP)}>
                        +{MONEY_STEP}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{raw.period === 6 ? "Hall store" : "Store"}</p>
              {groups.map((g) => (
                <div key={g}>
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
                              if (!needDesk()) return;
                              onChange(buyShop(file, id, item));
                            }}
                            className={cn("tw-tap min-h-11 rounded-md px-3 text-sm uppercase tracking-wide", broke ? "bg-elevated text-subtle line-through" : "bg-elevated")}
                          >
                            {item.name} · ${item.price}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}

              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Purchases</p>
              <ul className="text-sm">
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

              {featureOn(file, "prints") ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Prints</p>
                  <div className="grid grid-cols-3 gap-2">
                    {printsOf(file)
                      .filter((p) => ownedQty(raw, p.id) > 0)
                      .map((p) => (
                        <div key={p.id} className="overflow-hidden rounded-md bg-elevated">
                          {p.photo ? <img src={p.photo} alt="" className="aspect-square w-full object-cover" /> : null}
                          <p className="truncate px-1.5 py-1 text-[11px] font-semibold">
                            {p.name} · {ownedQty(raw, p.id)} · {RARITY_LABEL[p.rarity]}
                          </p>
                        </div>
                      ))}
                  </div>
                </>
              ) : null}

              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Day log</p>
              <ul>
                {stamps.map((st) => (
                  <li key={st.date} className="border-t border-border py-2 text-sm">
                    <span className="font-medium">{formatSchoolDate(st.date)}</span>
                    <span className="text-muted"> · {st.code || "—"} · {money(st.pay)}</span>
                    {st.goal ? <span className="block text-xs text-subtle">{st.goal}</span> : null}
                    {st.note ? <span className="block text-xs text-muted">{st.note}</span> : null}
                    {(raw.passes ?? [])
                      .filter((p) => p.date === st.date)
                      .map((p, i) => (
                        <span key={`${p.out}-${i}`} className="block text-xs text-muted">
                          {p.where} · left {p.out}
                          {p.in ? ` · back ${p.in}` : " · still out"}
                        </span>
                      ))}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-lg bg-elevated px-2 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
      <p className={cn("mt-0.5 font-display text-lg font-semibold tabular-nums leading-none", gold && "text-gold")}>{value}</p>
    </div>
  );
}
