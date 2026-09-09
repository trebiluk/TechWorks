import type { CSSProperties } from "react";

export type Palette = {
  navy: string;
  surface: string;
  elevated: string;
  orange: string;
  royal: string;
  white: string;
  gold: string;
  title: string;
  muted: string;
  chip: string;
};

export const PALETTE_KEY = "techworks-palette-v1";

export const SOLVAY_PALETTE: Palette = {
  navy: "#050816",
  surface: "#0b1028",
  elevated: "#141c42",
  orange: "#2ee6ff",
  royal: "#8b6cff",
  white: "#f7f9ff",
  gold: "#f0d48a",
  title: "#f7f9ff",
  muted: "#b7c4ea",
  chip: "#f7f9ff",
};

export const PALETTE_FIELDS: { key: keyof Palette; label: string }[] = [
  { key: "navy", label: "Navy" },
  { key: "surface", label: "Surface" },
  { key: "elevated", label: "Elevated" },
  { key: "orange", label: "Cyan / accent" },
  { key: "royal", label: "Violet" },
  { key: "white", label: "White / text" },
  { key: "gold", label: "Gold / XP" },
  { key: "title", label: "Title text" },
  { key: "muted", label: "Muted text" },
  { key: "chip", label: "Chip text" },
];

export const TEXT_FIELDS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: "title", label: "Titles", hint: "Headlines · display" },
  { key: "white", label: "Body", hint: "Main copy" },
  { key: "muted", label: "Muted", hint: "Hints · labels" },
  { key: "chip", label: "Chips", hint: "Buttons · tags" },
  { key: "gold", label: "Gold", hint: "XP · money" },
];

const VARS: [keyof Palette, string[]][] = [
  ["navy", ["--color-bg", "--color-crew"]],
  ["surface", ["--color-surface"]],
  ["elevated", ["--color-elevated"]],
  ["orange", ["--color-accent"]],
  ["royal", ["--color-period-1", "--color-work-w", "--color-crew-hi"]],
  ["white", ["--color-fg"]],
  ["gold", ["--color-gold"]],
  ["title", ["--color-title"]],
  ["muted", ["--color-muted"]],
  ["chip", ["--color-chip"]],
];

export function storedPalette(): Palette | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PALETTE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Palette;
    if (!p?.navy || !p.orange) return null;
    const orange = p.orange.toLowerCase();
    const navy = p.navy.toLowerCase();
    if (orange === "#e85820" || navy === "#010309") return null;
    return { ...SOLVAY_PALETTE, ...p };
  } catch {
    return null;
  }
}

export function paintPalette(p: Palette | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!p) {
    for (const [, keys] of VARS) for (const k of keys) root.style.removeProperty(k);
    root.style.removeProperty("--color-muted");
    root.style.removeProperty("--color-subtle");
    root.style.removeProperty("--color-border");
    root.style.removeProperty("--color-title");
    root.style.removeProperty("--color-chip");
    return;
  }
  for (const [field, keys] of VARS) {
    for (const k of keys) root.style.setProperty(k, p[field]);
  }
  root.style.setProperty("--color-subtle", p.muted);
  root.style.setProperty("--color-border", "color-mix(in oklab, #ffffff 16%, transparent)");
}

export function commitPalette(p: Palette | null) {
  paintPalette(p);
  if (typeof window === "undefined") return;
  if (!p) window.localStorage.removeItem(PALETTE_KEY);
  else window.localStorage.setItem(PALETTE_KEY, JSON.stringify(p));
}

export function paletteStyle(p: Palette): CSSProperties {
  return {
    background: p.navy,
    color: p.white,
    ["--color-bg"]: p.navy,
    ["--color-surface"]: p.surface,
    ["--color-elevated"]: p.elevated,
    ["--color-fg"]: p.white,
    ["--color-accent"]: p.orange,
    ["--color-accent-fg"]: p.white,
    ["--color-gold"]: p.gold,
    ["--color-title"]: p.title || p.white,
    ["--color-chip"]: p.chip || p.white,
    ["--color-gain"]: p.royal,
    ["--color-cleanup"]: p.orange,
    ["--color-muted"]: p.muted || mix(p.white, p.royal, 0.35),
  } as CSSProperties;
}

function mix(a: string, b: string, t: number): string {
  return `color-mix(in oklab, ${a} ${Math.round((1 - t) * 100)}%, ${b})`;
}
