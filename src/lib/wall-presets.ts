import { applyDashKit, loadDashLayout, saveDashLayout, type DashKitId } from "@/lib/dash-layout";
import { commitFont, type FontId } from "@/lib/fonts";
import { commitLook, SOLVAY_LOOK, type Look } from "@/lib/look";
import { commitPalette } from "@/lib/palette";
import { THEMES, commitTheme, type ThemeId } from "@/lib/theme";

export const WALL_PRESET_KEY = "techworks-wall-preset-v1";
export const WALL_PRESET_EVENT = "techworks-wall-preset";

export type WallPreset = {
  id: string;
  label: string;
  hint: string;
  theme: ThemeId;
  font: FontId;
  kit: DashKitId;
  look: Look;
  swatch: string;
  gold: string;
};

function ink(theme: ThemeId): { swatch: string; gold: string } {
  const t = THEMES.find((x) => x.id === theme);
  return { swatch: t?.swatch ?? "#06122B", gold: t?.gold ?? "#22D3EE" };
}

function look(partial: Partial<Look>): Look {
  return { ...SOLVAY_LOOK, ...partial };
}

/** Dark walls only. One tap paints theme, type, scale, and plates. */
export const WALL_PRESETS: WallPreset[] = [
  {
    id: "shop",
    label: "Shop wall",
    hint: "Default. Glass plate. Hour left, clock right. This week sits on Hour.",
    theme: "solvay",
    font: "outfit",
    kit: "wall",
    look: look({}),
    ...ink("solvay"),
  },
  {
    id: "backrow",
    label: "Back row",
    hint: "Biggest type. Fill the plates.",
    theme: "solvay",
    font: "barlow",
    kit: "wall",
    look: look({ scale: 20, titles: 140, fill: 100, chips: 52, pad: 16, lift: 90, wallpaper: 100 }),
    ...ink("solvay"),
  },
  {
    id: "night",
    label: "Night shop",
    hint: "Steel, tight, gold XP.",
    theme: "night",
    font: "plex",
    kit: "wall",
    look: look({ scale: 18, titles: 122, chips: 46, corners: 6, pad: 12, lift: 40, wallpaper: 35, finish: "steel" }),
    ...ink("night"),
  },
  {
    id: "oswego",
    label: "Oswego",
    hint: "Hunter + sunset gold. Cast iron.",
    theme: "oswego",
    font: "oswald",
    kit: "wall",
    look: look({ scale: 19, titles: 126, chips: 48, corners: 18, stroke: 2, pad: 14, lift: 95, wallpaper: 72, caps: "small", finish: "cast" }),
    ...ink("oswego"),
  },
  {
    id: "scoreboard",
    label: "Scoreboard",
    hint: "Top 10 left. Hour under it.",
    theme: "bearcat",
    font: "teko",
    kit: "score",
    look: look({ scale: 19, titles: 132, chips: 50, corners: 8, pad: 12, lift: 70, wallpaper: 55, caps: "upper", finish: "steel" }),
    ...ink("bearcat"),
  },
  {
    id: "club",
    label: "Club night",
    hint: "Club pulse left, then the hour.",
    theme: "forest",
    font: "sora",
    kit: "club",
    look: look({ scale: 18, titles: 120, chips: 46, corners: 16, pad: 14, lift: 80, wallpaper: 78, finish: "felt" }),
    ...ink("forest"),
  },
  {
    id: "projector",
    label: "Projector",
    hint: "Black room. Max fill. Glow stays quiet.",
    theme: "projector",
    font: "archivo",
    kit: "wall",
    look: look({ scale: 20, titles: 136, chips: 52, corners: 10, stroke: 0, pad: 16, lift: 28, wallpaper: 22 }),
    ...ink("projector"),
  },
  {
    id: "harvest",
    label: "Harvest",
    hint: "Warm shop for fall.",
    theme: "harvest",
    font: "fraunces",
    kit: "wall",
    look: look({ scale: 18, titles: 122, chips: 46, corners: 16, pad: 14, lift: 85, wallpaper: 82, finish: "cast" }),
    ...ink("harvest"),
  },
];

export type WallPresetId = (typeof WALL_PRESETS)[number]["id"];

export function wallPresetOf(id: string | null | undefined): WallPreset | null {
  return WALL_PRESETS.find((p) => p.id === id) ?? null;
}

export function storedWallPreset(): WallPresetId {
  try {
    if (typeof window === "undefined") return "shop";
    const v = window.localStorage.getItem(WALL_PRESET_KEY);
    return wallPresetOf(v)?.id ?? "shop";
  } catch {
    return "shop";
  }
}

/** Theme + type + scale + dash kit. Always a dark wall. */
export function applyWallPreset(id: string): WallPreset | null {
  const p = wallPresetOf(id);
  if (!p) return null;
  commitFont(p.font);
  commitLook(p.look);
  commitPalette(null);
  commitTheme(p.theme);
  saveDashLayout(applyDashKit(loadDashLayout(), p.kit));
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(WALL_PRESET_KEY, p.id);
    } catch {
      /* */
    }
    window.dispatchEvent(new Event(WALL_PRESET_EVENT));
  }
  if (typeof document !== "undefined") {
    document.documentElement.dataset.wallPreset = p.id;
  }
  return p;
}
