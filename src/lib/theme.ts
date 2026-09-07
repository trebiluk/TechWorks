import { paintPalette, storedPalette, SOLVAY_PALETTE, type Palette } from "@/lib/palette";
import { paintFont, storedFont, type FontId } from "@/lib/fonts";
import { paintLook, storedLook, SOLVAY_LOOK, type Look } from "@/lib/look";
import { paintLang, storedLang } from "@/lib/i18n";

export const THEME_KEY = "techworks-theme-v4";
export const CONTRAST_KEY = "techworks-contrast";

export const THEMES = [
  { id: "solvay", label: "TechWorks", group: "solvay", kind: "dark", swatch: "#06122B", fg: "#22D3EE", gold: "#A855F7" },
  { id: "bearcat", label: "Bearcat paw", group: "solvay", kind: "dark", swatch: "#050816", fg: "#1E4BAF", gold: "#E85820" },
  { id: "dice", label: "Roll the Dice", group: "solvay", kind: "dark", swatch: "#050816", fg: "#2ee6ff", gold: "#8b6cff" },
  { id: "night", label: "Night Shift", group: "solvay", kind: "dark", swatch: "#0a0a0b", fg: "#f4f4f5", gold: "#e8c547" },
  { id: "ink", label: "Ink", group: "solvay", kind: "dark", swatch: "#050505", fg: "#fafafa", gold: "#f5f5f5" },
  { id: "forest", label: "Pine", group: "solvay", kind: "dark", swatch: "#0c1a14", fg: "#e7f6ee", gold: "#86efac" },
  { id: "daylight", label: "Daylight", group: "day", kind: "light", swatch: "#f4f6fb", fg: "#0b1a40", gold: "#e85820" },
  { id: "manila", label: "Manila", group: "day", kind: "light", swatch: "#f4ead8", fg: "#3f2a14", gold: "#b45309" },
  { id: "polar", label: "Polar", group: "day", kind: "light", swatch: "#ffffff", fg: "#111827", gold: "#2563eb" },
  { id: "projector", label: "Projector", group: "day", kind: "light", swatch: "#ffffff", fg: "#000000", gold: "#000000" },
  { id: "wrapping", label: "Wrapping", group: "holiday", kind: "light", swatch: "#fefce8", fg: "#14532d", gold: "#b91c1c" },
  { id: "valentine", label: "Valentine", group: "holiday", kind: "light", swatch: "#fff1f2", fg: "#9f1239", gold: "#fb7185" },
  { id: "pumpkin", label: "Pumpkin", group: "holiday", kind: "light", swatch: "#fff7ed", fg: "#7c2d12", gold: "#ea580c" },
  { id: "holly", label: "Holly", group: "holiday", kind: "dark", swatch: "#0c1f14", fg: "#fef2f2", gold: "#facc15" },
  { id: "frost", label: "Frost", group: "holiday", kind: "dark", swatch: "#0f1a28", fg: "#f8fafc", gold: "#e2e8f0" },
  { id: "harvest", label: "Harvest", group: "holiday", kind: "dark", swatch: "#1c120c", fg: "#f5e6c8", gold: "#fbbf24" },
  { id: "spooky", label: "Spooky", group: "holiday", kind: "dark", swatch: "#0a0a0a", fg: "#fb923c", gold: "#fde68a" },
  { id: "patriot", label: "Patriot", group: "holiday", kind: "dark", swatch: "#1e3a8a", fg: "#f8fafc", gold: "#f8fafc" },
  { id: "clover", label: "Clover", group: "holiday", kind: "dark", swatch: "#0a1a0c", fg: "#ecfccb", gold: "#facc15" },
  { id: "highvis", label: "High vis", group: "web", kind: "dark", swatch: "#000000", fg: "#ffffff", gold: "#ffffff" },
  { id: "contrast", label: "Contrast", group: "web", kind: "dark", swatch: "#000000", fg: "#ffffff", gold: "#ffffff" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"] | string;
export type ThemeGroup = (typeof THEMES)[number]["group"] | "custom";

export type ThemeKind = (typeof THEMES)[number]["kind"];

export const THEME_GROUPS: { id: ThemeGroup; label: string }[] = [
  { id: "solvay", label: "Brand" },
  { id: "day", label: "Day · ADA" },
  { id: "holiday", label: "Holiday" },
  { id: "web", label: "High contrast" },
  { id: "custom", label: "Saved" },
];

export function storedTheme(): ThemeId {
  try {
    if (typeof window === "undefined") return "solvay";
    const v = window.localStorage.getItem(THEME_KEY);
    if (!v) return "solvay";
    if (THEMES.some((t) => t.id === v)) return v as ThemeId;
    if (v.startsWith("custom:") && savedThemes().some((t) => t.id === v)) return v;
    return "solvay";
  } catch {
    return "solvay";
  }
}

export function storedContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CONTRAST_KEY) === "1";
}

export function paintContrast(on: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.contrast = on ? "high" : "off";
}

export function commitContrast(on: boolean) {
  paintContrast(on);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONTRAST_KEY, on ? "1" : "0");
}

export function paintTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  const custom = id.startsWith("custom:") ? savedThemes().find((t) => t.id === id) : null;
  if (custom) {
    document.documentElement.dataset.theme = "solvay";
    document.documentElement.dataset.kind = custom.kind;
    document.documentElement.removeAttribute("data-vibe");
    paintContrast(storedContrast());
    paintPalette(custom.palette);
    paintFont(custom.font);
    paintLook(custom.look);
    paintLang(storedLang());
    return;
  }
  const row = THEMES.find((t) => t.id === id);
  document.documentElement.dataset.theme = id;
  document.documentElement.dataset.kind = row?.kind ?? "dark";
  document.documentElement.removeAttribute("data-vibe");
  paintContrast(storedContrast());
  paintPalette(storedPalette());
  paintFont(storedFont());
  paintLook(storedLook() ?? SOLVAY_LOOK);
  paintLang(storedLang());
}

export function commitTheme(id: ThemeId) {
  paintTheme(id);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, id);
}

const CUSTOM_KEY = "techworks-custom-themes-v1";

export type SavedTheme = {
  id: string;
  label: string;
  kind: "dark" | "light";
  palette: Palette;
  look: Look;
  font: FontId;
  swatch: string;
  fg: string;
  gold: string;
};

export function savedThemes(): SavedTheme[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as SavedTheme[];
    return Array.isArray(list) ? list.filter((t) => t?.id?.startsWith("custom:")) : [];
  } catch {
    return [];
  }
}

export function saveCustomTheme(label: string): SavedTheme {
  const name = label.trim() || `Look ${savedThemes().length + 1}`;
  const palette = storedPalette() ?? SOLVAY_PALETTE;
  const look = storedLook() ?? SOLVAY_LOOK;
  const font = storedFont();
  const row: SavedTheme = {
    id: `custom:${Date.now().toString(36)}`,
    label: name.slice(0, 24),
    kind: document.documentElement.dataset.kind === "light" ? "light" : "dark",
    palette,
    look,
    font,
    swatch: palette.navy,
    fg: palette.white,
    gold: palette.orange,
  };
  const next = [...savedThemes().filter((t) => t.label !== row.label), row].slice(-12);
  window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  commitTheme(row.id);
  return row;
}

export function deleteCustomTheme(id: string) {
  const next = savedThemes().filter((t) => t.id !== id);
  window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(next));
  if (storedTheme() === id) commitTheme("solvay");
}

export function applyTheme(id: ThemeId) {
  commitTheme(id);
}

/** @deprecated Fonts live on each theme now. Kept so old saves don't crash. */
export const VIBE_KEY = "techworks-vibe";
export const VIBES = [{ id: "shop", label: "TechWorks", display: "Outfit", body: "Outfit", sample: "TECHWORKS" }] as const;
export type VibeId = (typeof VIBES)[number]["id"];
export function storedVibe(): VibeId {
  return "shop";
}
export function paintVibe(_id?: VibeId) {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-vibe");
}
export function commitVibe(id: VibeId) {
  paintVibe(id);
}
export function applyVibe(id: VibeId) {
  paintVibe(id);
}
