import type { EconomyFile } from "@/lib/economy";
import { setCleanupMins, setCleanupSound, setCurrentCycle, setLevelConfig, setSchedule, resetAbCycle } from "@/lib/store";
import { DEFAULT_LEVEL_BANDS, levelBandsOf } from "@/lib/skills";
import { storedLeadXp, setLeadXpBonus, clampLeadXp } from "@/lib/roles";
import { RosterOnboard } from "@/components/roster-onboard";
import { YearRoster } from "@/components/year-roster";
import { VersionChip } from "@/components/version-chip";
import { todayIso } from "@/lib/calendar";
import { CLEANUP_SOUNDS, clampCleanupMins, cleanupMinsNow, cleanupSoundOf, previewCleanupSound, SCHEDULES, scheduleOf } from "@/lib/bells";
import { ThemePicker } from "@/components/theme-picker";
import { LunchPanel } from "@/components/lunch-panel";
import { commitContrast, storedContrast } from "@/lib/theme";
import { savePortalPin, storedPortalPin } from "@/lib/pin";
import { PinField } from "@/components/pin-pad";
import { MarkChip } from "@/components/ui";
import { markOf } from "@/lib/nav-marks";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { COPYRIGHT_LONG } from "@/lib/copy";
import { HOUSE_BERTY, HOUSE_MRK } from "@/lib/house";
import { RewardBar, RewardEditor } from "@/components/reward-bar";
import { ShopLists, SkillLists } from "@/components/score-panels";
import { commitDescribe } from "@/lib/describe";
import { FEATURES, FEATURE_GROUPS, featureOn, setFeature, type FeatureId } from "@/lib/features";
import { DEMO_SETS, commitDemo, storedDemo, type DemoId } from "@/lib/demo";
import { YearPlanBoard } from "@/components/year-plan-board";
import { VaultBoard } from "@/components/vault-board";
import { TEACH_PACKS, setDefaultTeachPack } from "@/lib/teach";
import { Fold } from "@/components/fold";

export const SETTINGS_TABS = [
  { id: "vault", label: "Records" },
  { id: "roster", label: "Roster" },
  { id: "day", label: "Day" },
  { id: "economy", label: "Rewards" },
  { id: "modules", label: "Modules" },
  { id: "room", label: "Theme" },
  { id: "about", label: "About" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"] | "lunch" | "skills" | "privacy";
export type AdminPane = "today" | "crews" | "cloud" | "wall" | SettingsTab;

const OPEN_MOD: Record<string, string> = {
  club: "club",
  studyhall: "studyhall",
  prints: "prints",
  stocks: "wallet",
  lucky: "lucky",
  store: "store",
  polls: "polls",
  teach: "teach",
  crews: "crews",
};

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
  onOpenId,
  onOpenMod,
  embed,
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
  onOpenId?: (id: string) => void;
  onOpenMod?: (id: string) => void;
  embed?: boolean;
}) {
  const cycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
  const [, setContrast] = useState(() => storedContrast());
  const [portalPin, setPortalPin] = useState(() => storedPortalPin());
  const [leadXp, setLeadXp] = useState(() => storedLeadXp());
  const [demoId, setDemoId] = useState<DemoId>(() => storedDemo());
  const [rosterOpen, setRosterOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <div className={cn(embed ? "px-0 py-0" : "px-1 py-2 pb-16 sm:px-2")}>
            {onTab ? (
              <nav className="mb-3 flex flex-wrap gap-1" aria-label="Settings">
                {TABS.map((t) => (
                  <MarkChip key={t.id} mark={markOf(t.id)} on={tab === t.id} onClick={() => onTab(t.id)}>
                    {t.label}
                  </MarkChip>
                ))}
              </nav>
            ) : null}
            {tab === "room" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Theme</h2>
                <p className="mt-1 text-sm text-muted">One desk. Bottom dock is Dash · Learn · Crew · Admin. Widescreen adds columns; portrait wraps the same cards. Hover a chip to paint the whole desk (logo stays). Click to keep it.</p>
                <div className="mt-6">
                  <ThemePicker />
                </div>
              </section>
            ) : null}

            {tab === "day" ? (
              <section className="space-y-3">
                <YearPlanBoard file={file} onChange={onChange} />
                <Fold label="Shop defaults" hint="Usual bells, cycle, cleanup, A/B, Teach pack" open={shopOpen} onToggle={() => setShopOpen((v) => !v)}>
                  <div className="grid gap-4 p-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Usual bells</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(Object.keys(SCHEDULES) as (keyof typeof SCHEDULES)[]).map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => onChange(setSchedule(file, id))}
                            className={cn(
                              "min-h-11 rounded-md px-3 text-sm font-semibold",
                              scheduleOf(file.meta.config?.schedule) === id ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                            )}
                          >
                            {SCHEDULES[id].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Cycle</p>
                      <div className="mt-2 grid grid-cols-8 gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => onChange(setCurrentCycle(file, n))}
                            className={cn(
                              "min-h-11 rounded-md font-mono text-sm font-semibold",
                              n === cycle ? "bg-accent text-accent-fg" : "bg-elevated text-muted",
                            )}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Cleanup</p>
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
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">Teach pack</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {TEACH_PACKS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            title={p.hint}
                            onClick={() => onChange(setDefaultTeachPack(file, p.id))}
                            className={cn(
                              "min-h-10 rounded-full px-3 text-xs font-semibold",
                              (file.meta.config?.teachPack || "shop") === p.id ? "bg-fg text-bg" : "bg-elevated text-muted",
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-subtle">A / B</p>
                      <p className="mt-1 text-sm text-muted">A today makes tomorrow B. Snow day: start today as A.</p>
                      <button
                        type="button"
                        onClick={() => onChange(resetAbCycle(file, todayIso()))}
                        className="mt-2 min-h-11 rounded-lg bg-elevated px-4 text-sm font-medium text-loss"
                      >
                        Reset A/B · today is A
                      </button>
                    </div>
                  </div>
                </Fold>
              </section>
            ) : null}

            {tab === "lunch" ? <LunchPanel file={file} onChange={onChange} /> : null}

            {tab === "roster" || tab === "privacy" ? (
              <section>
                {tab === "roster" ? (
                  <YearRoster file={file} onChange={onChange} onOpenId={onOpenId} onImport={() => setRosterOpen(true)} />
                ) : (
                  <>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">People</h2>
                    <p className="mt-1 text-sm text-muted">Paste legal names. The wall only gets shop names. Supports stay vault-only.</p>
                  </>
                )}
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Privacy</p>
                <p className="mt-1 text-sm text-muted">Wall is shop names only. Teacher PIN is the one you set on the lock bar — Set teacher PIN. Never 1111.</p>
                <p className="mt-4 text-sm font-medium uppercase tracking-wider text-subtle">Worker portal PIN</p>
                <p className="mt-1 text-sm text-muted">Only if the portal module is on. Default 2627. Not the teacher PIN.</p>
                <PinField
                  value={portalPin}
                  onChange={setPortalPin}
                  className="mt-2"
                  placeholder="portal PIN"
                  label="Worker portal PIN"
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

            {tab === "economy" || tab === "skills" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">Rewards</h2>
                <p className="mt-1 text-sm text-muted">Reward is XP · grade · effort — not pay. Skills are 1–4, XP only.</p>
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
                <p className="mt-6 text-sm font-medium uppercase tracking-wider text-subtle">Skill levels</p>
                <p className="mt-1 text-sm text-muted">Dashboard shows XP. Color-by-level is optional.</p>
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
                <p className="mt-1 text-sm text-muted">Tap a card to turn it on or off. Same toggles live on Dash when the desk is unlocked. Open jumps to that desk.</p>
                {FEATURE_GROUPS.map((g) => (
                  <div key={g} className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-subtle">{g}</p>
                    <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {FEATURES.filter((f) => f.group === g).map((f) => {
                        const on = featureOn(file, f.id);
                        const jump = OPEN_MOD[f.id];
                        return (
                          <li key={f.id} className={cn("tw-gadget flex flex-col gap-2 p-3", on ? "ring-1 ring-gold" : "opacity-60")}>
                            <button
                              type="button"
                              onClick={() => {
                                const next = !on;
                                onChange(setFeature(file, f.id as FeatureId, next));
                                if (f.id === "debug") {
                                  const set = next ? (demoId === "off" ? "week" : demoId) : "off";
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
                              className="text-left"
                            >
                              <span className={cn("mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest", on ? "bg-gold text-bg" : "bg-elevated text-muted")}>
                                {on ? "On" : "Off"}
                              </span>
                              <span className="block text-sm font-semibold">{f.label}</span>
                              <span className="text-[11px] text-subtle">{f.hint}</span>
                            </button>
                            <div className="mt-auto flex items-center justify-between gap-2">
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider", on ? "text-gold" : "text-muted")}>{on ? "On" : "Off"}</span>
                              {jump && on && onOpenMod ? (
                                <button type="button" onClick={() => onOpenMod(jump)} className="tw-tap min-h-8 rounded-full bg-elevated px-2 text-[11px] font-semibold">
                                  Open
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Fake data</p>
                  <p className="mt-1 text-sm text-muted">Paints Wall, Week, Year, Score, Crews, Learn, Wallet, Rosters, and Data. The saved roster stays day 0. Turn Off before you import Monday’s names.</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {DEMO_SETS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          commitDemo(s.id);
                          setDemoId(s.id);
                          onChange(setFeature(file, "debug", s.id !== "off"));
                        }}
                        className={cn(
                          "min-h-11 rounded-md px-3 text-sm font-semibold",
                          demoId === s.id ? "bg-gold text-bg" : "bg-elevated text-muted",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            {tab === "vault" ? (
              <VaultBoard
                file={file}
                onChange={onChange}
                onExport={onExport}
                onExportNames={onExportNames}
                onSave={onSave}
                onImport={() => setRosterOpen(true)}
              />
            ) : null}

            {tab === "about" ? (
              <section>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-subtle">About</h2>
                <p className="mt-2">
                  <VersionChip />
                </p>
                {onOpenId ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => onOpenId(HOUSE_BERTY)} className="tw-tap min-h-11 rounded-full bg-elevated px-4 text-sm font-semibold">
                      Berty
                    </button>
                    <button type="button" onClick={() => onOpenId(HOUSE_MRK)} className="tw-tap min-h-11 rounded-full bg-elevated px-4 text-sm font-semibold">
                      Mr. K
                    </button>
                  </div>
                ) : null}
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
