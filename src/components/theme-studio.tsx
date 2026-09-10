import { useEffect, useMemo, useState } from "react";
import { PALETTE_FIELDS, TEXT_FIELDS, paletteStyle, type Palette } from "@/lib/palette";
import { FONT_PACKS, type FontId } from "@/lib/fonts";
import { FINISHES, LOOK_FIELDS, lookStyle, type CapsMode, type FinishId, type Look } from "@/lib/look";
import { CLASS_LANGS, commitLang, LANGS, storedLang, type LangId } from "@/lib/i18n";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

type ToolTab = "finish" | "size" | "color" | "type" | "caps" | "lang";

export function ThemeStudio({
  draft,
  onDraft,
  look,
  onLook,
  font,
  onFont,
  preview,
  hovering,
  dirty,
  onApply,
  onRevert,
  onSave,
}: {
  draft: Palette;
  onDraft: (p: Palette) => void;
  look: Look;
  onLook: (l: Look) => void;
  font: FontId;
  onFont: (f: FontId) => void;
  preview: Palette;
  hovering?: boolean;
  dirty?: boolean;
  onApply: () => void;
  onRevert: () => void;
  onSave: (name: string) => void;
}) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<ToolTab>("color");
  const [langId, setLangId] = useState<LangId>(() => storedLang());
  const [saveName, setSaveName] = useState("");
  useEffect(() => setLangId(lang), [lang]);
  const pack = FONT_PACKS.find((f) => f.id === font) ?? FONT_PACKS[0];
  const shown = hovering ? preview : draft;
  const style = useMemo(
    () => ({
      ...paletteStyle(shown),
      ...lookStyle(look),
      fontFamily: pack.sans,
      ["--font-display" as string]: pack.display,
      ["--font-sans" as string]: pack.sans,
    }),
    [shown, pack, look],
  );

  function slide(key: keyof Look, value: number) {
    onLook({ ...look, [key]: value });
  }

  function caps(mode: CapsMode) {
    onLook({ ...look, caps: mode });
  }

  function pickFinish(id: FinishId) {
    const f = FINISHES.find((x) => x.id === id);
    if (!f) return;
    onLook({ ...look, finish: id, lift: f.lift, stroke: f.stroke, corners: f.corners, wallpaper: f.wallpaper });
  }

  const tabs: { id: ToolTab; label: string }[] = [
    { id: "color", label: t("Color") },
    { id: "finish", label: t("Finish") },
    { id: "size", label: t("Size") },
    { id: "type", label: t("Type") },
    { id: "caps", label: t("Caps") },
    { id: "lang", label: t("Language") },
  ];

  return (
    <div className="mt-4">
      <div className="mt-1 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1">
            {tabs.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={cn(
                  "min-h-11 rounded-md px-3 text-sm font-semibold",
                  tab === x.id ? "bg-gold text-bg" : "bg-elevated text-muted",
                )}
              >
                {x.label}
              </button>
            ))}
          </div>

          {tab === "finish" ? (
            <div className="mt-3 grid gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => pickFinish(f.id)}
                  className={cn(
                    "flex min-h-16 items-center justify-between rounded-xl bg-surface px-3 py-2 text-left",
                    look.finish === f.id ? "ring-2 ring-gold" : "ring-1 ring-transparent",
                  )}
                  data-finish={f.id}
                >
                  <span>
                    <span className="block text-sm font-semibold">{t(f.label)}</span>
                    <span className="text-xs text-muted">{t(f.hint)}</span>
                  </span>
                  <span className="h-10 w-16 rounded-md bg-elevated" />
                </button>
              ))}
            </div>
          ) : null}

          {tab === "size" ? (
            <div className="mt-3 grid gap-2">
              <p className="text-xs text-muted">Scale is the whole desk. Fill makes Now, Goals, Do this now, and Teach eat empty plate so the back row can read it. Pad and corners ride the plates.</p>
              {LOOK_FIELDS.map((f) => (
                <label key={f.key} className="rounded-md bg-elevated px-3 py-2">
                  <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider">
                    <span>{t(f.label)}</span>
                    <span className="font-mono text-muted">{look[f.key]}</span>
                  </span>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={look[f.key]}
                    onChange={(e) => slide(f.key, Number(e.target.value))}
                    className="mt-1 w-full"
                    aria-label={f.label}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {tab === "color" ? (
            <div className="mt-3 grid gap-2">
              {PALETTE_FIELDS.map((f) => (
                <label key={f.key} className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-2">
                  <input
                    type="color"
                    value={hexOf(draft[f.key])}
                    onChange={(e) => onDraft({ ...draft, [f.key]: e.target.value })}
                    className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                    aria-label={f.label}
                  />
                  <span className="w-24 text-xs font-semibold uppercase tracking-wider text-subtle">{t(f.label)}</span>
                  <input
                    value={draft[f.key]}
                    onChange={(e) => onDraft({ ...draft, [f.key]: e.target.value })}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
                  />
                </label>
              ))}
            </div>
          ) : null}

          {tab === "type" ? (
            <div className="mt-3 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Fonts</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_PACKS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onFont(f.id)}
                  className={cn(
                    "min-h-16 rounded-md px-2 py-2 text-left ring-1",
                    font === f.id ? "bg-elevated ring-fg" : "bg-surface ring-transparent",
                  )}
                  style={{ fontFamily: f.display }}
                >
                  <span className="block text-lg font-semibold leading-none">Aa</span>
                  <span className="mt-1 block text-xs font-semibold">{f.label}</span>
                  <span className="block text-[10px] text-muted">{f.vibe}</span>
                </button>
              ))}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">Text colors</p>
              {TEXT_FIELDS.map((f) => (
                <label key={f.key} className="flex min-h-11 items-center gap-2 rounded-md bg-elevated px-2">
                  <input
                    type="color"
                    value={hexOf(draft[f.key] || "#f7f9ff")}
                    onChange={(e) => onDraft({ ...draft, [f.key]: e.target.value })}
                    className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                    aria-label={f.label}
                  />
                  <span className="w-20 text-xs font-semibold uppercase tracking-wider text-subtle">{t(f.label)}</span>
                  <span className="hidden text-[10px] text-muted sm:inline">{f.hint}</span>
                  <input
                    value={draft[f.key] || ""}
                    onChange={(e) => onDraft({ ...draft, [f.key]: e.target.value })}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
                  />
                </label>
              ))}
            </div>
          ) : null}

          {tab === "caps" ? (
            <div className="mt-3 grid gap-2">
              <ToggleRow on={look.caps === "off"} label={t("Off")} onClick={() => caps("off")} />
              <ToggleRow on={look.caps === "small"} label={t("Small caps")} onClick={() => caps("small")} />
              <ToggleRow on={look.caps === "upper"} label={t("All caps")} onClick={() => caps("upper")} />
              <ToggleRow on={look.lift > 0} label={t("Shadows")} onClick={() => slide("lift", look.lift > 0 ? 0 : 70)} />
              <ToggleRow on={look.wallpaper > 0} label={t("Glow")} onClick={() => slide("wallpaper", look.wallpaper > 0 ? 0 : 80)} />
            </div>
          ) : null}

          {tab === "lang" ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs leading-snug text-muted">{t("This quarter: English, Ukrainian, Russian.")}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{t("This quarter")}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {CLASS_LANGS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLangId(l.id);
                      commitLang(l.id);
                      if (l.id === "uk" || l.id === "ru") onFont("noto");
                    }}
                    className={cn("min-h-14 rounded-md px-3 py-2 text-left", langId === l.id ? "bg-gold text-bg" : "bg-elevated")}
                    dir={l.dir}
                  >
                    <span className="block text-sm font-semibold">{l.native}</span>
                    <span className="text-xs opacity-70">{l.short} · {t(l.label)}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs leading-snug text-muted">{t("Shop words stay English. Help and Words change.")}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{t("More languages")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LANGS.filter((l) => !l.classLang).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setLangId(l.id);
                      commitLang(l.id);
                      if (l.id === "ar" || l.id === "fa") onFont("naskh");
                    }}
                    className={cn("min-h-14 rounded-md px-3 py-2 text-left", langId === l.id ? "bg-gold text-bg" : "bg-elevated")}
                    dir={l.dir}
                  >
                    <span className="block text-sm font-semibold">{l.native}</span>
                    <span className="text-xs opacity-70">{l.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={onApply} className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
              {t("Apply")}
            </button>
            <button type="button" onClick={onRevert} className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
              {t("Revert")}
            </button>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Custom name"
              className="min-h-11 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                onSave(saveName);
                setSaveName("");
              }}
              className="min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg"
            >
              {t("Save custom")}
            </button>
            {dirty ? <span className="text-sm text-gold">Unsaved edits</span> : hovering ? <span className="text-sm text-muted">Preview only</span> : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 rounded-xl p-2 sm:p-3" style={style} data-caps={look.caps} data-finish={look.finish}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">{hovering ? "Preview" : "This look"}</p>
          <DashPreview />
          <DataPreview />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className="flex min-h-11 items-center justify-between rounded-md bg-elevated px-3 text-sm font-semibold"
    >
      <span>{label}</span>
      <span className={cn("relative h-7 w-12 rounded-full", on ? "bg-gold" : "bg-surface")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-fg transition-transform", on ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

function DashPreview() {
  return (
    <>
      <article className="tw-gadget tw-hud tw-fill flex h-56 flex-col justify-center p-3">
        <p className="tw-fill-label font-semibold uppercase tracking-widest text-subtle">Now</p>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="tw-fill-hero font-display font-semibold tracking-tight">P1</p>
          <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs font-semibold text-accent-fg">LIVE</span>
        </div>
        <p className="tw-fill-line mt-1 text-muted">Grade 6 · 7:55a</p>
      </article>
      <article data-job-plate className="tw-gadget tw-hud tw-fill-wide flex h-56 flex-col p-3">
        <p className="tw-fill-label font-bold uppercase tracking-[0.18em] text-gold">P1 · G6 · Modeling</p>
        <p className="tw-fill-ask mt-1 font-display font-semibold tracking-tight text-gold">How can a small force move a bigger load?</p>
        <p className="tw-fill-line mt-1 text-muted">Materials, force, speed, and what the test showed.</p>
        <dl className="tw-job-rows">
          <dt className="tw-job-k text-muted">Rules</dt>
          <dd className="tw-job-v">One tool at a time. Goggles on.</dd>
          <dt className="tw-job-k text-muted">Today</dt>
          <dd className="tw-job-v">Build a model that lifts or moves a load.</dd>
          <dt className="tw-job-k text-gold">Look-for</dt>
          <dd className="tw-job-v font-semibold text-gold">3 = working the model, not the phone.</dd>
        </dl>
      </article>
    </>
  );
}

function DataPreview() {
  return (
    <article className="rounded-xl bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">Data</p>
      <p className="mt-2 font-display text-xl font-semibold tracking-tight">Week trend</p>
      <div className="mt-3 flex h-16 items-end gap-1">
        {[40, 55, 48, 72, 64, 80].map((n, i) => (
          <span key={i} className={cn("flex-1 rounded-sm", i === 5 ? "bg-accent" : "bg-gain")} style={{ height: `${n}%` }} />
        ))}
      </div>
      <p className="mt-2 flex justify-between text-xs">
        <span className="text-muted">Mean XP 62</span>
        <span className="text-gold">$1,240</span>
      </p>
    </article>
  );
}

function hexOf(v: string): string {
  const m = v.trim().match(/^#([0-9a-f]{6})$/i);
  return m ? v : "#02040c";
}
