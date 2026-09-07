import { useState } from "react";
import { commitTheme, deleteCustomTheme, savedThemes, storedTheme, THEME_GROUPS, THEMES, type ThemeId } from "@/lib/theme";
import { useLang } from "@/lib/i18n-hook";
import { ThemeStudio } from "@/components/theme-studio";
import { cn } from "@/lib/utils";

type Chip = { id: string; label: string; kind: string; swatch: string; fg: string; gold: string };

function ofId(id: ThemeId, mine: Chip[]): Chip {
  return THEMES.find((t) => t.id === id) ?? mine.find((t) => t.id === id) ?? THEMES[0];
}

function MiniWall({ chip }: { chip: Chip }) {
  const plate = chip.kind === "light" ? "color-mix(in oklab, #000 6%, transparent)" : "color-mix(in oklab, #fff 8%, transparent)";
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-border" style={{ background: chip.swatch, color: chip.fg }}>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-bold tracking-[0.18em]" style={{ color: chip.gold }}>
          TECHWORKS
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{chip.kind}</span>
      </div>
      <div className="mx-2 mb-2 rounded-lg px-3 py-2" style={{ background: plate }}>
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: chip.gold }}>
          Today’s goal
        </p>
        <p className="font-display text-lg font-bold leading-tight">Brainstorming</p>
        <p className="text-sm opacity-80">Simple machines</p>
      </div>
      <div className="mx-2 mb-3 grid grid-cols-2 gap-1.5">
        <div className="rounded-md px-2 py-1.5" style={{ background: plate }}>
          <p className="truncate text-xs font-bold">Sprocket</p>
          <p className="font-mono text-sm font-semibold" style={{ color: chip.gold }}>
            28 xp
          </p>
        </div>
        <div className="rounded-md px-2 py-1.5" style={{ background: plate }}>
          <p className="truncate text-xs font-bold">Rivet</p>
          <p className="font-mono text-sm font-semibold" style={{ color: chip.gold }}>
            31 xp
          </p>
        </div>
      </div>
      <p className="px-3 pb-2 text-xs font-semibold">{chip.label}</p>
    </div>
  );
}

export function ThemePicker() {
  const [id, setId] = useState<ThemeId>(() => storedTheme());
  const [mine, setMine] = useState(() => savedThemes());
  const [hover, setHover] = useState<ThemeId | null>(null);
  const { t } = useLang();
  const chips: Chip[] = [...THEMES, ...mine];
  const shown = ofId(hover ?? id, chips);

  function pick(next: ThemeId) {
    commitTheme(next);
    setId(next);
    setHover(null);
    setMine(savedThemes());
  }

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">{t("Themes")}</p>
      <p className="mt-1 text-sm text-muted">{t("Hover the grid. Click to keep. Live wall stays until you click.")}</p>

      <div className="mt-3 grid min-w-0 items-start gap-3 lg:grid-cols-[minmax(14rem,0.85fr)_minmax(0,1.15fr)]">
        <MiniWall chip={shown} />
        <div className="min-h-0 max-h-72 overflow-auto pr-0.5">
          {THEME_GROUPS.filter((g) => g.id !== "custom" || mine.length).map((g) => {
            const rows = g.id === "custom" ? mine : THEMES.filter((x) => x.group === g.id);
            if (!rows.length) return null;
            return (
              <div key={g.id} className="mb-3">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-subtle">{t(g.label)}</p>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {rows.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      title={item.label}
                      onMouseEnter={() => setHover(item.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(item.id)}
                      onBlur={() => setHover(null)}
                      onClick={() => pick(item.id)}
                      className={cn("min-h-12 rounded-md px-2 py-1.5 text-left ring-2", id === item.id ? "ring-gold" : "ring-transparent")}
                      style={{ background: item.swatch, color: item.fg }}
                    >
                      <span className="block truncate text-xs font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
                {g.id === "custom"
                  ? mine.map((item) => (
                      <button
                        key={`${item.id}-rm`}
                        type="button"
                        className="mt-1 text-[10px] uppercase tracking-wider text-muted"
                        onClick={() => {
                          deleteCustomTheme(item.id);
                          setMine(savedThemes());
                          setId(storedTheme());
                        }}
                      >
                        Remove {item.label}
                      </button>
                    ))
                  : null}
              </div>
            );
          })}
        </div>
      </div>
      <ThemeStudio />
    </div>
  );
}
