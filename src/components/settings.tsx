import { X } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { boardCardsOf, isSubDay, resetAbCycle, setBoardCard, setCleanupMins, setCleanupSound, setCurrentCycle, setLevelConfig, setSchedule, setSubDay, setVisit, setVisitAll, visitOn, VISIT_STATES } from "@/lib/store";
import { DEFAULT_LEVEL_BANDS, levelBandsOf } from "@/lib/skills";
import { storedLeadXp, setLeadXpBonus, clampLeadXp } from "@/lib/roles";
import { RosterOnboard } from "@/components/roster-onboard";
import { VersionChip } from "@/components/version-chip";
import { todayIso } from "@/lib/calendar";
import { CLEANUP_SOUNDS, clampCleanupMins, cleanupMinsNow, cleanupSoundOf, previewCleanupSound, SCHEDULES, scheduleOf } from "@/lib/bells";
import { LayoutToggle } from "@/components/layout-toggle";
import { ThemePicker } from "@/components/theme-picker";
import { LunchPanel } from "@/components/lunch-panel";
import { QuarterChip } from "@/components/quarter-chip";
import { commitContrast, storedContrast } from "@/lib/theme";
import { savePortalPin, storedPortalPin } from "@/lib/pin";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { COPYRIGHT_LONG } from "@/lib/copy";
import { RewardBar, RewardEditor } from "@/components/reward-bar";
import { ShopLists, SkillLists } from "@/components/score-panels";
import { commitDescribe, storedDescribe } from "@/lib/describe";
import { FEATURES, FEATURE_GROUPS, featureOn, setFeature, type FeatureId } from "@/lib/features";
import { VisitPad } from "@/components/visit-chip";
import { DEMO_SETS, commitDemo, storedDemo, type DemoId } from "@/lib/demo";
import { downloadDeskBackup, unpackDesk, isLiveWallText, listDeskBackups, restoreBackupDay } from "@/lib/vault";
import { saveDeskNow } from "@/lib/store";

export const SETTINGS_TABS = [
  { id: "room", label: "Look" },
  { id: "day", label: "Day" },
  { id: "lunch", label: "Lunch" },
  { id: "roster", label: "Roster" },
  { id: "economy", label: "Money" },
  { id: "skills", label: "Skills" },
  { id: "modules", label: "Modules" },
  { id: "privacy", label: "Privacy" },
  { id: "vault", label: "Device" },
  { id: "about", label: "About" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];
export type AdminPane = "today" | SettingsTab;

const TABS = SETTINGS_TABS;

export function SettingsBody({
  file,
  tab,
  onChange,
  onTab,
  onExportNames,
  onExport,
  onSave,
  onTips,
  onDesk,
}: {
  file: EconomyFile;
  tab: SettingsTab;
  onChange: (next: EconomyFile) => void;
  onTab?: (id: SettingsTab) => void;
  onExportNames: () => void;
  onExport?: () => void;
  onSave?: () => void;
  onTips?: (on: boolean) => void;
  onDesk?: () => void;
}) {
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
  const [contrast, setContrast] = useState(() => storedContrast());
  const [portalPin, setPortalPin] = useState(() => storedPortalPin());
  const [leadXp, setLeadXp] = useState(() => storedLeadXp());
  const [demoId, setDemoId] = useState<DemoId>(() => storedDemo());
  const [rosterOpen, setRosterOpen] = useState(false);
  const [vaultMsg, setVaultMsg] = useState("");
  const [backups, setBackups] = useState<{ day: string }[]>([]);
  useEffect(() => {
    if (tab !== "vault") return;
    void listDeskBackups().then(setBackups);
  }, [tab, file.meta.savedAt]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 py-2 pb-10 sm:px-2">
            {onTab ? (
              <nav className="mb-3 flex flex-wrap gap-1" aria-label="Settings">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTab(t.id)}
                    className={cn("min-h-10 rounded-md px-2.5 text-xs font-semibold", tab === t.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            ) : null}
            {tab === "room" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Look</h2>
                <p className="mt-1 text-sm text-muted">Theme, projector vs phone, contrast. Preview stays in this row.</p>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Screen</p>
                <LayoutToggle className="mt-2 w-full" />
                <div className="mt-6">
                  <ThemePicker />
                </div>
              </section>
            ) : null}

            {tab === "day" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Day</h2>
                <p className="mt-1 text-sm text-muted">Cycle, bells, A/B, sub. Sub voids scores and the projector. Lunch has its own tab.</p>
                <button
                  type="button"
                  onClick={() => onChange(setSubDay(file, todayIso(), !isSubDay(file, todayIso())))}
                  className={cn(
                    "mt-3 min-h-11 rounded-md px-4 text-sm font-semibold uppercase tracking-wide",
                    isSubDay(file, todayIso()) ? "bg-work-pto text-accent-fg ring-2 ring-fg" : "bg-elevated text-muted",
                  )}
                >
                  {isSubDay(file, todayIso()) ? "Sub day · on" : "Sub day"}
                </button>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Current cycle</p>
                <div className="mt-2 grid grid-cols-8 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onChange(setCurrentCycle(file, n))}
                      className={cn(
                        "min-h-11 rounded-md font-mono text-sm font-semibold",
                        n === cycle ? "bg-accent text-accent-fg ring-2 ring-fg" : "bg-elevated text-muted",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Bell schedule</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(Object.keys(SCHEDULES) as (keyof typeof SCHEDULES)[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChange(setSchedule(file, id))}
                      className={cn(
                        "min-h-11 rounded-md px-2 text-sm font-semibold uppercase tracking-wide",
                        scheduleOf(file.meta.config?.schedule) === id ? "bg-accent text-accent-fg ring-2 ring-fg" : "bg-elevated text-muted",
                      )}
                    >
                      {SCHEDULES[id].label}
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Cleanup</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange(setCleanupMins(file, clampCleanupMins((file.meta.config?.cleanupMins ?? 5) - 1)))}
                    className="min-h-11 min-w-11 rounded-md bg-elevated text-lg font-semibold"
                  >
                    −
                  </button>
                  <span className="min-w-[5.5rem] text-center font-mono text-sm tabular-nums">
                    {clampCleanupMins(file.meta.config?.cleanupMins ?? cleanupMinsNow())} min
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(setCleanupMins(file, clampCleanupMins((file.meta.config?.cleanupMins ?? 5) + 1)))}
                    className="min-h-11 min-w-11 rounded-md bg-elevated text-lg font-semibold"
                  >
                    +
                  </button>
                </div>
                <p className="mt-3 text-sm font-medium uppercase tracking-wider text-subtle">Alarm</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {CLEANUP_SOUNDS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onChange(setCleanupSound(file, s.id))}
                      className={cn(
                        "min-h-11 rounded-md px-3 text-xs font-semibold",
                        cleanupSoundOf(file.meta.config?.cleanupSound) === s.id ? "bg-gold text-bg" : "bg-elevated text-muted",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => previewCleanupSound(file.meta.config?.cleanupSound)}
                    className="min-h-11 rounded-md bg-fg px-3 text-xs font-semibold text-accent-fg"
                  >
                    Preview
                  </button>
                </div>
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Daily schedule · passes</p>
                <p className="mt-1 text-sm text-muted">Can students request a pass and visit this room? OPEN / MEETING / CLOSED / SUB. Today only.</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {VISIT_STATES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange(setVisitAll(file, todayIso(), s))}
                      className="min-h-10 rounded-full bg-elevated px-3 text-xs font-semibold uppercase tracking-wide text-muted"
                    >
                      All {s}
                    </button>
                  ))}
                </div>
                <ul className="mt-3 space-y-2">
                  {(file.meta.bell ?? [{ period: 1, grade: 6 }, { period: 2, grade: 8 }, { period: 3, grade: 7 }, { period: 6, grade: 5 }, { period: 8, grade: 7 }, { period: 9, grade: 8 }, { period: 10, grade: 6 }]).map((b) => (
                    <li key={b.period} className="flex flex-wrap items-center gap-2">
                      <span className="w-16 text-sm font-semibold">P{b.period}</span>
                      <VisitPad
                        value={visitOn(file, todayIso(), b.period)}
                        onPick={(s) => onChange(setVisit(file, todayIso(), b.period, s))}
                      />
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-muted">A today makes tomorrow B. Snow day: reset starts today as A.</p>
                <button
                  type="button"
                  onClick={() => onChange(resetAbCycle(file, todayIso()))}
                  className="mt-2 min-h-11 rounded-lg bg-elevated px-4 text-sm font-medium text-loss"
                >
                  Reset A/B · today is A
                </button>
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Announcements</p>
                <p className="mt-1 text-sm text-muted">Up to two cards on the projector. Leave the title blank to hide.</p>
                {([0, 1] as const).map((i) => {
                  const card = boardCardsOf(file)[i];
                  return (
                    <div key={i} className="mt-3 rounded-lg bg-elevated p-3">
                      <input
                        value={card.title}
                        onChange={(e) => onChange(setBoardCard(file, i, { ...card, title: e.target.value }))}
                        placeholder={`Card ${i + 1} title`}
                        className="min-h-11 w-full rounded-md bg-surface px-3 text-sm outline-none"
                      />
                      <textarea
                        value={card.body}
                        onChange={(e) => onChange(setBoardCard(file, i, { ...card, body: e.target.value }))}
                        placeholder="One or two lines"
                        rows={2}
                        className="mt-2 w-full rounded-md bg-surface px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  );
                })}
              </section>
            ) : null}

            {tab === "lunch" ? <LunchPanel file={file} onChange={onChange} /> : null}

            {tab === "roster" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Roster</h2>
                <p className="mt-1 text-sm text-muted">Paste legal names. The wall only gets aliases. IEP/504 stay vault-only.</p>
                <button
                  type="button"
                  onClick={() => setRosterOpen(true)}
                  className="mt-4 min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                >
                  Add / import roster
                </button>
                {rosterOpen ? (
                  <RosterOnboard
                    file={file}
                    onChange={onChange}
                    onClose={() => setRosterOpen(false)}
                    onDesk={() => {
                      setRosterOpen(false);
                      onDesk?.();
                    }}
                  />
                ) : null}
              </section>
            ) : null}

            {tab === "economy" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Money</h2>
                <p className="mt-1 text-sm text-muted">Class reward is XP · grade · effort — not pay. Lead XP is Skills only.</p>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Class reward</p>
                <RewardBar file={file} detail />
                <RewardEditor file={file} onChange={onChange} />
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Crew-lead XP</p>
                <p className="mt-1 text-sm text-muted">Once per confirmed lead. Never wallet. Never a mark.</p>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={leadXp}
                  onChange={(e) => setLeadXp(clampLeadXp(Number(e.target.value)))}
                  className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 font-mono text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => onChange(setLeadXpBonus(file, leadXp))}
                  className="mt-2 min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                >
                  Save lead XP ({leadXp})
                </button>
                <ShopLists file={file} onChange={onChange} />
              </section>
            ) : null}

            {tab === "skills" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Skills</h2>
                <p className="mt-1 text-sm text-muted">Dashboard shows XP. Color-by-level is reserved for later.</p>
                <button
                  type="button"
                  onClick={() =>
                    onChange(setLevelConfig(file, { colorOn: !file.meta.config?.levels?.colorOn, bands: levelBandsOf(file) }))
                  }
                  className={cn(
                    "mt-3 min-h-11 rounded-md px-3 text-sm font-semibold",
                    file.meta.config?.levels?.colorOn ? "bg-fg text-bg" : "bg-elevated text-muted",
                  )}
                >
                  Color by level {file.meta.config?.levels?.colorOn ? "on (reserved)" : "off"}
                </button>
                <div className="mt-2 grid grid-cols-[3rem_minmax(0,1fr)_5rem] gap-1 text-sm">
                  <span className="text-subtle">XP ≥</span>
                  <span className="text-subtle">Label</span>
                  <span className="text-subtle">Swatch</span>
                  {levelBandsOf(file).map((b, i) => (
                    <LevelBandRow
                      key={i}
                      band={b}
                      onChange={(next) => {
                        const bands = [...levelBandsOf(file)];
                        bands[i] = next;
                        onChange(setLevelConfig(file, { bands }));
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onChange(setLevelConfig(file, { colorOn: false, bands: DEFAULT_LEVEL_BANDS }))}
                  className="mt-2 min-h-11 rounded-md bg-elevated px-3 text-sm text-muted"
                >
                  Reset bands
                </button>
                <SkillLists file={file} onChange={onChange} />
              </section>
            ) : null}

            {tab === "modules" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Modules</h2>
                <p className="mt-1 text-sm text-muted">Off greys the icon. Scoring, Overview, Crew, Desk, and Skills stay on.</p>
                {FEATURE_GROUPS.map((g) => (
                  <div key={g} className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{g}</p>
                    <ul className="mt-1 divide-y divide-border rounded-md bg-elevated">
                      {FEATURES.filter((f) => f.group === g).map((f) => {
                        const on = featureOn(file, f.id);
                        return (
                          <li key={f.id} className="flex items-center justify-between gap-2 px-3 py-2">
                            <span>
                              <span className="block text-sm font-semibold">{f.label}</span>
                              <span className="text-xs text-subtle">{f.hint}</span>
                            </span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={on}
                              onClick={() => {
                                const next = !on;
                                onChange(setFeature(file, f.id as FeatureId, next));
                                if (f.id === "debug") {
                                  const set = next ? "week" : "off";
                                  commitDemo(set);
                                  setDemoId(set);
                                }
                                if (f.id === "tips") {
                                  commitDescribe(next);
                                  onTips?.(next);
                                }
                                if (f.id === "contrast") {
                                  commitContrast(next);
                                  setContrast(next);
                                }
                              }}
                              className={cn("relative h-7 w-12 shrink-0 rounded-full", on ? "bg-gold" : "bg-surface")}
                            >
                              <span className={cn("absolute top-1 size-5 rounded-full bg-fg transition-transform", on ? "left-6" : "left-1")} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                {featureOn(file, "debug") ? (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Graph set</p>
                    <p className="mt-1 text-sm text-muted">Paints the wall only. Desk and the saved roster stay day 0.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {DEMO_SETS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            commitDemo(s.id);
                            setDemoId(s.id);
                          }}
                          className={cn(
                            "min-h-11 rounded-md px-3 text-sm font-semibold",
                            demoId === s.id ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {tab === "privacy" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Privacy</h2>
                <p className="mt-1 text-sm text-muted">Wall is aliases only. Teacher PIN stays 1111 unless you change it on the lock bar.</p>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Worker portal PIN</p>
                <p className="mt-1 text-sm text-muted">Only if the portal module is on. Default 2627. Not the teacher PIN.</p>
                <input
                  inputMode="numeric"
                  value={portalPin}
                  onChange={(e) => setPortalPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 font-mono tracking-[0.3em] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    savePortalPin(portalPin);
                    setPortalPin(storedPortalPin());
                  }}
                  className="mt-2 min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                >
                  Save portal PIN
                </button>
                <button
                  type="button"
                  onClick={onExportNames}
                  className="mt-6 min-h-11 rounded-lg bg-elevated px-4 text-sm font-medium"
                >
                  Export names vault (private)
                </button>
              </section>
            ) : null}

            {tab === "vault" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">This device</h2>
                <p className="mt-1 text-sm text-muted">
                  The gradebook lives here (this phone or computer). Drive comes later. Live wall export stays — aliases only, no names.
                </p>
                <p className="mt-3 font-mono text-sm text-subtle">
                  Last save {file.meta.savedAt ? new Date(file.meta.savedAt).toLocaleString() : "not yet"} · schema {file.meta.schema ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      saveDeskNow(file);
                      onChange({ ...file, meta: { ...file.meta, savedAt: new Date().toISOString(), schema: file.meta.schema } });
                      onSave?.();
                      setVaultMsg("Saved on this device");
                    }}
                    className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg"
                  >
                    Save now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadDeskBackup(file);
                      setVaultMsg("Desk backup downloaded · keep it private (names inside)");
                    }}
                    className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                  >
                    Download desk backup
                  </button>
                  <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md bg-elevated px-3 text-sm font-semibold">
                    Restore from file
                    <input
                      type="file"
                      accept="application/json,.json,.txt"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (!f) return;
                        const text = await f.text();
                        if (isLiveWallText(text)) {
                          setVaultMsg("That’s the live wall file (no names). Use a desk backup to restore.");
                          return;
                        }
                        const next = unpackDesk(text);
                        if (!next) {
                          setVaultMsg("Couldn’t read that file.");
                          return;
                        }
                        saveDeskNow(next);
                        onChange(next);
                        setVaultMsg(`Restored ${next.students.length} workers from ${f.name}`);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      onExport?.();
                      setVaultMsg("Live wall downloaded · aliases only");
                    }}
                    className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                  >
                    Download live wall
                  </button>
                  <button
                    type="button"
                    onClick={onExportNames}
                    className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold"
                  >
                    Names vault
                  </button>
                </div>
                {vaultMsg ? <p className="mt-3 text-sm text-gold">{vaultMsg}</p> : null}
                {backups.length ? (
                  <div className="mt-6">
                    <p className="text-sm font-medium uppercase tracking-wider text-subtle">Daily snapshots on this device</p>
                    <ul className="mt-2 space-y-1">
                      {backups.map((b) => (
                        <li key={b.day} className="flex items-center justify-between gap-2 rounded-md bg-elevated px-3 py-2">
                          <span className="font-mono text-sm">{b.day}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const next = await restoreBackupDay(b.day);
                              if (!next) {
                                setVaultMsg("Snapshot missing.");
                                return;
                              }
                              saveDeskNow(next);
                              onChange(next);
                              setVaultMsg(`Restored snapshot ${b.day}`);
                            }}
                            className="min-h-9 rounded-md px-2 text-sm font-semibold text-gold"
                          >
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-subtle">Snapshots appear after the first save.</p>
                )}
              </section>
            ) : null}

            {tab === "about" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">About</h2>
                <p className="mt-2">
                  <VersionChip />
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{COPYRIGHT_LONG}</p>
                <p className="mt-6 text-sm text-muted">Workshop noise for the projector. Opens in a new tab.</p>
                <a
                  href="https://neal.fun/ambient-chaos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex min-h-11 items-center rounded-md bg-elevated px-3 text-sm font-semibold text-gold"
                >
                  Ambient Chaos — neal.fun
                </a>
              </section>
            ) : null}
    </div>
  );
}

function LevelBandRow({
  band,
  onChange,
}: {
  band: { minXp: number; label: string; swatch: string };
  onChange: (next: { minXp: number; label: string; swatch: string }) => void;
}) {
  return (
    <>
      <input
        type="number"
        value={band.minXp}
        onChange={(e) => onChange({ ...band, minXp: Number(e.target.value) || 0 })}
        className="min-h-11 rounded-md bg-elevated px-2 font-mono text-sm outline-none"
      />
      <input
        value={band.label}
        onChange={(e) => onChange({ ...band, label: e.target.value })}
        placeholder="later"
        className="min-h-11 rounded-md bg-elevated px-2 text-sm outline-none"
      />
      <input
        value={band.swatch}
        onChange={(e) => onChange({ ...band, swatch: e.target.value })}
        placeholder="gain"
        className="min-h-11 rounded-md bg-elevated px-2 font-mono text-sm outline-none"
      />
    </>
  );
}
