import { useMemo, useState } from "react";
import {
  commitPalette,
  PALETTE_FIELDS,
  paletteStyle,
  SOLVAY_PALETTE,
  storedPalette,
  type Palette,
} from "@/lib/palette";
import { commitFont, FONT_PACKS, storedFont, type FontId } from "@/lib/fonts";
import { commitLook, FINISHES, LOOK_FIELDS, lookStyle, paintLook, SOLVAY_LOOK, storedLook, type CapsMode, type FinishId, type Look } from "@/lib/look";
import { TwWordmark } from "@/components/tw-mark";
import { commitLang, LANGS, storedLang, type LangId } from "@/lib/i18n";
import { saveCustomTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n-hook";
import { cn } from "@/lib/utils";

type ToolTab = "finish" | "size" | "color" | "type" | "caps" | "lang";

export function ThemeStudio() {
  const { t } = useLang();
  const [tab, setTab] = useState<ToolTab>("finish");
  const [draft, setDraft] = useState<Palette>(() => storedPalette() ?? SOLVAY_PALETTE);
  const [font, setFont] = useState<FontId>(() => storedFont());
  const [look, setLook] = useState<Look>(() => storedLook() ?? SOLVAY_LOOK);
  const [langId, setLangId] = useState<LangId>(() => storedLang());
  const [saveName, setSaveName] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const pack = FONT_PACKS.find((f) => f.id === font) ?? FONT_PACKS[0];
  const style = useMemo(
    () => ({
      ...paletteStyle(draft),
      ...lookStyle(look),
      fontFamily: pack.sans,
      ["--font-display" as string]: pack.display,
      ["--font-sans" as string]: pack.sans,
    }),
    [draft, pack, look],
  );

  function slide(key: keyof Look, value: number) {
    const next = { ...look, [key]: value };
    setLook(next);
    paintLook(next);
  }

  function caps(mode: CapsMode) {
    const next = { ...look, caps: mode };
    setLook(next);
    paintLook(next);
  }

  function apply() {
    commitPalette(draft);
    commitFont(font);
    commitLook(look);
    commitLang(langId);
  }

  function reset() {
    setDraft(SOLVAY_PALETTE);
    setFont("archivo");
    setLook(SOLVAY_LOOK);
    setLangId("en");
    commitPalette(null);
    commitFont(null);
    commitLook(SOLVAY_LOOK);
    commitLang("en");
  }

  const tabs: { id: ToolTab; label: string }[] = [
    { id: "finish", label: t("Finish") },
    { id: "size", label: t("Size") },
    { id: "color", label: t("Color") },
    { id: "type", label: t("Type") },
    { id: "caps", label: t("Caps") },
    { id: "lang", label: t("Language") },
  ];

  function saveAs() {
    apply();
    const row = saveCustomTheme(saveName);
    setSavedNote(`Saved ${row.label}`);
    setSaveName("");
  }

  function pickFinish(id: FinishId) {
    const f = FINISHES.find((x) => x.id === id);
    if (!f) return;
    const next: Look = { ...look, finish: id, lift: f.lift, stroke: f.stroke, corners: f.corners, wallpaper: f.wallpaper };
    setLook(next);
    paintLook(next);
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">{t("Theme tools")}</p>
      <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className="size-8 shrink-0 cursor-pointer rounded border-0 bg-transparent"
                    aria-label={f.label}
                  />
                  <span className="w-24 text-xs font-semibold uppercase tracking-wider text-subtle">{t(f.label)}</span>
                  <input
                    value={draft[f.key]}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                    className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none"
                  />
                </label>
              ))}
            </div>
          ) : null}

          {tab === "type" ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_PACKS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFont(f.id)}
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
          ) : null}

          {tab === "caps" ? (
            <div className="mt-3 grid gap-2">
              <ToggleRow
                on={look.caps === "off"}
                label={t("Off")}
                onClick={() => caps("off")}
              />
              <ToggleRow on={look.caps === "small"} label={t("Small caps")} onClick={() => caps("small")} />
              <ToggleRow on={look.caps === "upper"} label={t("All caps")} onClick={() => caps("upper")} />
              <ToggleRow
                on={look.lift > 0}
                label={t("Shadows")}
                onClick={() => slide("lift", look.lift > 0 ? 0 : 70)}
              />
              <ToggleRow
                on={look.wallpaper > 0}
                label={t("Glow")}
                onClick={() => slide("wallpaper", look.wallpaper > 0 ? 0 : 80)}
              />
            </div>
          ) : null}

          {tab === "lang" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLangId(l.id);
                    commitLang(l.id);
                    if (l.id === "ar" || l.id === "fa") setFont("naskh");
                    if (l.id === "uk" || l.id === "ru") setFont("noto");
                  }}
                  className={cn(
                    "min-h-14 rounded-md px-3 py-2 text-left",
                    langId === l.id ? "bg-gold text-bg" : "bg-elevated",
                  )}
                  dir={l.dir}
                >
                  <span className="block text-sm font-semibold">{l.native}</span>
                  <span className="text-xs opacity-70">{l.label}</span>
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={apply} className="min-h-11 rounded-md bg-accent px-3 text-sm font-semibold text-accent-fg">
              {t("Apply look")}
            </button>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name this look"
              className="min-h-11 min-w-0 flex-1 rounded-md bg-elevated px-3 text-sm outline-none"
            />
            <button type="button" onClick={saveAs} className="min-h-11 rounded-md bg-gold px-3 text-sm font-semibold text-bg">
              {t("Save theme")}
            </button>
            <button type="button" onClick={reset} className="min-h-11 rounded-md bg-elevated px-3 text-sm font-semibold">
              {t("Reset Solvay")}
            </button>
            {savedNote ? <span className="text-sm text-gold">{savedNote}</span> : null}
          </div>
        </div>

        <div className="grid min-w-0 gap-3 overflow-hidden rounded-xl p-2 sm:p-3" style={style} data-caps={look.caps} data-finish={look.finish}>
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
    <article className="rounded-xl bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">Dash</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <TwWordmark />
        <span className="rounded-md bg-cleanup px-2 py-1 font-mono text-xs font-semibold text-accent-fg">CLEANUP 4:12</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
        <div className="h-full w-4/5 rounded-full bg-accent" />
      </div>
      <ol className="mt-3 space-y-1">
        {["Wren · P1", "Arlo · P8", "Kai · P3"].map((n, i) => (
          <li key={n} className="flex items-center justify-between rounded-md bg-elevated px-2 py-1 text-xs">
            <span>
              {i + 1} {n}
            </span>
            <span className="text-gold">XP {90 - i * 8}</span>
          </li>
        ))}
      </ol>
    </article>
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
