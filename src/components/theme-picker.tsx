import { useEffect, useRef, useState } from "react";
import {
  commitTheme,
  paintTheme,
  deleteCustomTheme,
  paletteOf,
  saveCustomTheme,
  savedThemes,
  storedTheme,
  THEME_GROUPS,
  THEMES,
  type ThemeGroup,
  type ThemeId,
} from "@/lib/theme";
import { commitPalette, storedPalette, type Palette } from "@/lib/palette";
import { commitFont, storedFont, type FontId } from "@/lib/fonts";
import { commitLook, SOLVAY_LOOK, storedLook, type Look } from "@/lib/look";
import { useLang } from "@/lib/i18n-hook";
import { ThemeStudio } from "@/components/theme-studio";
import { WallLookChips } from "@/components/wall-looks";
import { wallPresetOf } from "@/lib/wall-presets";
import { cn } from "@/lib/utils";

type Chip = { id: string; label: string; kind: string; swatch: string; fg: string; gold: string; group?: string };

function ofId(id: ThemeId, mine: Chip[]): Chip {
  return THEMES.find((t) => t.id === id) ?? mine.find((t) => t.id === id) ?? THEMES[0];
}

function snapshot(id: ThemeId): { palette: Palette; look: Look; font: FontId } {
  const custom = id.startsWith("custom:") ? savedThemes().find((t) => t.id === id) : null;
  if (custom) return { palette: custom.palette, look: custom.look, font: custom.font };
  return {
    palette: paletteOf(id),
    look: storedLook() ?? SOLVAY_LOOK,
    font: storedFont(),
  };
}

function TileSwatch({ item }: { item: Chip }) {
  return (
    <span
      className="tw-theme-swatch"
      style={{
        background: `linear-gradient(135deg, ${item.swatch} 0 58%, ${item.gold} 58% 76%, ${item.fg} 76% 100%)`,
      }}
      aria-hidden
    />
  );
}

export function ThemePicker() {
  const startId = storedTheme();
  const start = snapshot(startId);
  const [id, setId] = useState<ThemeId>(startId);
  const [mine, setMine] = useState(() => savedThemes());
  const [group, setGroup] = useState<ThemeGroup | "all">("all");
  const [hover, setHover] = useState<ThemeId | null>(null);
  const [draft, setDraft] = useState<Palette>(() => storedPalette() ?? start.palette);
  const [look, setLook] = useState<Look>(start.look);
  const [font, setFont] = useState<FontId>(start.font);
  const [saved, setSaved] = useState(start);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);
  const { t } = useLang();
  useEffect(() => () => {
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
  }, []);
  const chips: Chip[] = [...THEMES, ...mine];
  const current = ofId(id, chips);
  const groups = THEME_GROUPS.filter((g) => g.id !== "custom" || mine.length);
  const hovering = Boolean(hover && hover !== id);
  const preview = hovering && hover ? paletteOf(hover) : draft;
  const shown = hover ? ofId(hover, chips) : current;
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(saved.palette) ||
    JSON.stringify(look) !== JSON.stringify(saved.look) ||
    font !== saved.font;

  function pulse(label: string) {
    setFlash(label);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1400);
  }

  function pick(next: ThemeId) {
    commitTheme(next);
    const snap = snapshot(next);
    setId(next);
    setDraft(snap.palette);
    setLook(snap.look);
    setFont(snap.font);
    setSaved(snap);
    setMine(savedThemes());
    setHover(null);
    pulse(`${ofId(next, [...THEMES, ...savedThemes()]).label} · on`);
  }

  function applyStudio() {
    commitPalette(draft);
    commitFont(font);
    commitLook(look);
    setSaved({ palette: draft, look, font });
    pulse("Custom paint · on");
  }

  function revert() {
    commitTheme(id);
    commitPalette(id.startsWith("custom:") ? saved.palette : null);
    commitFont(saved.font);
    commitLook(saved.look);
    setDraft(saved.palette);
    setLook(saved.look);
    setFont(saved.font);
    pulse("Reverted");
  }

  function saveCustom(name: string) {
    applyStudio();
    const row = saveCustomTheme(name, { palette: draft, look, font, kind: ofId(id, chips).kind as "dark" | "light" });
    setId(row.id);
    setMine(savedThemes());
    setSaved({ palette: draft, look, font });
    pulse(`${row.label} · saved`);
  }

  const sections =
    group === "all"
      ? groups.map((g) => ({
          id: g.id,
          label: g.label,
          items: g.id === "custom" ? mine : THEMES.filter((x) => x.group === g.id),
        }))
      : [
          {
            id: group,
            label: groups.find((g) => g.id === group)?.label ?? "All",
            items: group === "custom" ? mine : THEMES.filter((x) => x.group === group),
          },
        ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">{t("Theme Tools")}</p>
        <p className="mt-1 text-sm text-muted">
          {t("Looks are full walls. Tap a look or a color chip to keep it. Hover previews paint only. Logo stays. Top buttons stay tappable.")}
        </p>
        <p className="tw-theme-status mt-2" role="status" aria-live="polite">
          <TileSwatch item={shown} />
          <span className="min-w-0">
            <span className="block font-semibold leading-tight">{shown.label}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {flash ? flash : hovering ? "Preview · tap to keep" : `${current.kind} · on`}
            </span>
          </span>
        </p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Wall looks</p>
        <p className="mt-1 text-sm text-muted">Color, type, scale, and plates in one tap. All dark. Mini wall is the preview.</p>
        <div className="mt-2">
          <WallLookChips
            onPick={(lookId) => {
              const snap = snapshot(storedTheme());
              setId(storedTheme());
              setDraft(snap.palette);
              setLook(snap.look);
              setFont(snap.font);
              setSaved(snap);
              pulse(`${wallPresetOf(lookId)?.label ?? lookId} · on`);
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setGroup("all")}
          className={cn("tw-tap min-h-8 rounded-full px-3 text-[11px] font-semibold", group === "all" ? "bg-fg text-bg" : "bg-elevated text-muted")}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGroup(g.id)}
            className={cn("tw-tap min-h-8 rounded-full px-3 text-[11px] font-semibold", group === g.id ? "bg-fg text-bg" : "bg-elevated text-muted")}
          >
            {t(g.label)}
          </button>
        ))}
      </div>

      {sections.map((sec) =>
        sec.items.length ? (
          <div key={sec.id} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t(sec.label)}</p>
            <div className="tw-theme-grid">
              {sec.items.map((item) => {
                const on = id === item.id;
                const dice = item.id === "dice";
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    aria-pressed={on}
                    data-theme-id={item.id}
                    onMouseEnter={() => {
                      setHover(item.id);
                      paintTheme(item.id);
                    }}
                    onMouseLeave={() => {
                      setHover(null);
                      paintTheme(id);
                    }}
                    onFocus={() => {
                      setHover(item.id);
                      paintTheme(item.id);
                    }}
                    onBlur={() => {
                      setHover(null);
                      paintTheme(id);
                    }}
                    onClick={() => pick(item.id)}
                    className={cn("tw-tap tw-theme-tile", on && "tw-theme-tile-on", dice && "tw-theme-tile-dice")}
                  >
                    <TileSwatch item={item} />
                    <span className="tw-theme-name">{item.label}</span>
                    <span className="tw-theme-kind">{on ? "ON" : item.kind}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null,
      )}
      {mine.length
        ? mine.map((item) => (
            <button
              key={`${item.id}-rm`}
              type="button"
              className="mr-2 text-[10px] uppercase tracking-wider text-muted"
              onClick={() => {
                deleteCustomTheme(item.id);
                setMine(savedThemes());
                const next = storedTheme();
                pick(next);
              }}
            >
              Remove {item.label}
            </button>
          ))
        : null}

      <ThemeStudio
        draft={draft}
        onDraft={setDraft}
        look={look}
        onLook={setLook}
        font={font}
        onFont={setFont}
        preview={preview}
        hovering={hovering}
        dirty={dirty}
        onApply={applyStudio}
        onRevert={revert}
        onSave={saveCustom}
      />
    </div>
  );
}
