import { useState } from "react";
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
import { cn } from "@/lib/utils";

type Chip = { id: string; label: string; kind: string; swatch: string; fg: string; gold: string };

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

function Dots({ item }: { item: Chip }) {
  return (
    <span className="inline-flex shrink-0" aria-hidden>
      <span className="size-3.5 rounded-full ring-1 ring-black/30" style={{ background: item.swatch }} />
      <span className="-ml-1 size-3.5 rounded-full ring-1 ring-black/20" style={{ background: item.gold }} />
      <span className="-ml-1 size-3.5 rounded-full ring-1 ring-black/20" style={{ background: item.fg }} />
    </span>
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
  const { t } = useLang();
  const chips: Chip[] = [...THEMES, ...mine];
  const current = ofId(id, chips);
  const groups = THEME_GROUPS.filter((g) => g.id !== "custom" || mine.length);
  const rows =
    group === "all" ? chips : group === "custom" ? mine : THEMES.filter((x) => x.group === group);
  const hovering = Boolean(hover && hover !== id);
  const preview = hovering && hover ? paletteOf(hover) : draft;
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(saved.palette) ||
    JSON.stringify(look) !== JSON.stringify(saved.look) ||
    font !== saved.font;

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
  }

  function applyStudio() {
    commitPalette(draft);
    commitFont(font);
    commitLook(look);
    setSaved({ palette: draft, look, font });
  }

  function revert() {
    commitTheme(id);
    commitPalette(id.startsWith("custom:") ? saved.palette : null);
    commitFont(saved.font);
    commitLook(saved.look);
    setDraft(saved.palette);
    setLook(saved.look);
    setFont(saved.font);
  }

  function saveCustom(name: string) {
    applyStudio();
    const row = saveCustomTheme(name, { palette: draft, look, font, kind: ofId(id, chips).kind as "dark" | "light" });
    setId(row.id);
    setMine(savedThemes());
    setSaved({ palette: draft, look, font });
  }

  return (
    <div className="space-y-4 pb-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">{t("Theme Tools")}</p>
        <p className="mt-1 text-sm text-muted">{t("Hover paints the whole desk. Logo stays. Click to keep it.")}</p>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Dots item={hover ? ofId(hover, chips) : current} />
          <span className="font-semibold">{hover ? ofId(hover, chips).label : current.label}</span>
          <span className="text-muted">{hovering ? "preview" : current.kind}</span>
        </p>
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

      <div className="flex flex-wrap gap-1.5">
        {rows.map((item) => {
          const on = id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
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
              className={cn(
                "tw-tap inline-flex min-h-9 items-center gap-2 rounded-full py-1 pl-1.5 pr-3 text-sm font-semibold",
                on ? "bg-fg text-bg ring-2 ring-gold" : "bg-elevated text-fg",
              )}
            >
              <Dots item={item} />
              {item.label}
            </button>
          );
        })}
      </div>
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
