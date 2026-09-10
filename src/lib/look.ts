import type { CSSProperties } from "react";

export type CapsMode = "off" | "small" | "upper";
export type FinishId = "plate" | "steel" | "cast" | "paper" | "felt";

export type Look = {
  scale: number;
  titles: number;
  fill: number;
  chips: number;
  corners: number;
  stroke: number;
  pad: number;
  lift: number;
  wallpaper: number;
  caps: CapsMode;
  finish: FinishId;
};

export const LOOK_KEY = "techworks-look-v2";

export const FINISHES: {
  id: FinishId;
  label: string;
  hint: string;
  lift: number;
  stroke: number;
  corners: number;
  wallpaper: number;
}[] = [
  { id: "plate", label: "Plate", hint: "Industrial default", lift: 82, stroke: 1, corners: 12, wallpaper: 80 },
  { id: "steel", label: "Brushed steel", hint: "Tighter, cooler", lift: 40, stroke: 1, corners: 6, wallpaper: 25 },
  { id: "cast", label: "Cast iron", hint: "Heavy drop", lift: 95, stroke: 2, corners: 18, wallpaper: 55 },
  { id: "paper", label: "Chipboard", hint: "Flat paper", lift: 18, stroke: 0, corners: 2, wallpaper: 8 },
  { id: "felt", label: "Locker felt", hint: "Soft pad", lift: 55, stroke: 0, corners: 22, wallpaper: 30 },
];

export const SOLVAY_LOOK: Look = {
  scale: 16,
  titles: 100,
  fill: 100,
  chips: 44,
  corners: 12,
  stroke: 1,
  pad: 12,
  lift: 82,
  wallpaper: 80,
  caps: "off",
  finish: "plate",
};

export const LOOK_FIELDS: { key: Exclude<keyof Look, "caps" | "finish">; label: string; min: number; max: number; step: number; hint: string }[] = [
  { key: "scale", label: "Scale", min: 13, max: 22, step: 1, hint: "Whole desk" },
  { key: "titles", label: "Titles", min: 80, max: 160, step: 5, hint: "% display" },
  { key: "fill", label: "Fill", min: 0, max: 100, step: 5, hint: "Now, job card, Teach" },
  { key: "chips", label: "Chips", min: 36, max: 56, step: 2, hint: "px tap" },
  { key: "corners", label: "Corners", min: 0, max: 28, step: 1, hint: "px" },
  { key: "stroke", label: "Stroke", min: 0, max: 4, step: 1, hint: "px line" },
  { key: "pad", label: "Pad", min: 6, max: 28, step: 2, hint: "card px" },
  { key: "lift", label: "Lift", min: 0, max: 100, step: 5, hint: "shadow" },
  { key: "wallpaper", label: "Wallpaper", min: 0, max: 100, step: 5, hint: "glow" },
];

export function storedLook(): Look | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LOOK_KEY);
    if (!raw) return null;
    return { ...SOLVAY_LOOK, ...(JSON.parse(raw) as Look) };
  } catch {
    return null;
  }
}

export function lookVars(look: Look): Record<string, string> {
  const r = look.corners;
  const lift = look.lift / 100;
  const glow = look.wallpaper / 100;
  const fill = Math.max(0, Math.min(100, look.fill ?? 100)) / 100;
  return {
    "--ui-base": `${look.scale}px`,
    "--ui-title": String(look.titles / 100),
    "--ui-fill": String(fill),
    "--ui-chip": `${look.chips}px`,
    "--ui-radius": `${r}px`,
    "--ui-line": `${look.stroke}px`,
    "--ui-pad": `${look.pad}px`,
    "--ui-shadow": String(lift),
    "--ui-glow": String(glow),
    "--radius-xs": `${Math.max(0, Math.round(r * 0.33))}px`,
    "--radius-sm": `${Math.max(0, Math.round(r * 0.66))}px`,
    "--radius-md": `${r}px`,
    "--radius-lg": `${Math.round(r * 1.33)}px`,
    "--radius-xl": `${Math.round(r * 2)}px`,
  };
}

export function paintLook(look: Look | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const keys = [
    "--ui-base",
    "--ui-title",
    "--ui-fill",
    "--ui-chip",
    "--ui-radius",
    "--ui-line",
    "--ui-pad",
    "--ui-shadow",
    "--ui-glow",
    "--radius-xs",
    "--radius-sm",
    "--radius-md",
    "--radius-lg",
    "--radius-xl",
  ];
  if (!look) {
    for (const k of keys) root.style.removeProperty(k);
    root.removeAttribute("data-look");
    root.removeAttribute("data-caps");
    root.removeAttribute("data-finish");
    return;
  }
  root.setAttribute("data-look", "on");
  root.setAttribute("data-caps", look.caps || "off");
  root.setAttribute("data-finish", look.finish || "plate");
  const vars = lookVars({ ...SOLVAY_LOOK, ...look });
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

export function commitLook(look: Look | null) {
  paintLook(look);
  if (typeof window === "undefined") return;
  if (!look) window.localStorage.removeItem(LOOK_KEY);
  else window.localStorage.setItem(LOOK_KEY, JSON.stringify({ ...SOLVAY_LOOK, ...look }));
}

export function lookStyle(look: Look): CSSProperties {
  return lookVars({ ...SOLVAY_LOOK, ...look }) as CSSProperties;
}
