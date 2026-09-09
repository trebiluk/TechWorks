export type FontId =
  | "archivo"
  | "outfit"
  | "barlow"
  | "oswald"
  | "space"
  | "sora"
  | "teko"
  | "plex"
  | "nunito"
  | "fraunces"
  | "noto"
  | "naskh";

export const FONT_KEY = "techworks-font-v1";

export const FONT_PACKS: {
  id: FontId;
  label: string;
  vibe: string;
  display: string;
  sans: string;
}[] = [
  { id: "outfit", label: "Outfit", vibe: "TechWorks", display: '"Outfit", "Segoe UI", system-ui, sans-serif', sans: '"Outfit", "Segoe UI", system-ui, sans-serif' },
  { id: "archivo", label: "Archivo", vibe: "Condensed", display: '"Archivo", "Segoe UI", system-ui, sans-serif', sans: '"Archivo", "Segoe UI", system-ui, sans-serif' },
  { id: "barlow", label: "Barlow", vibe: "Scores", display: '"Barlow Condensed", "Arial Narrow", sans-serif', sans: '"Barlow", "Segoe UI", system-ui, sans-serif' },
  { id: "oswald", label: "Oswald", vibe: "Athletic", display: '"Oswald", "Arial Narrow", sans-serif', sans: '"Source Sans 3", "Segoe UI", sans-serif' },
  { id: "space", label: "Space Grotesk", vibe: "Tech", display: '"Space Grotesk", "Segoe UI", sans-serif', sans: '"Space Grotesk", "Segoe UI", sans-serif' },
  { id: "sora", label: "Sora", vibe: "Round modern", display: '"Sora", "Segoe UI", sans-serif', sans: '"Sora", "Segoe UI", sans-serif' },
  { id: "teko", label: "Teko", vibe: "Jersey", display: '"Teko", "Arial Narrow", sans-serif', sans: '"Nunito Sans", "Segoe UI", sans-serif' },
  { id: "plex", label: "IBM Plex", vibe: "Blueprint", display: '"IBM Plex Sans", "Segoe UI", sans-serif', sans: '"IBM Plex Sans", "Segoe UI", sans-serif' },
  { id: "nunito", label: "Nunito", vibe: "Friendly", display: '"Nunito", "Segoe UI", sans-serif', sans: '"Nunito", "Segoe UI", sans-serif' },
  { id: "fraunces", label: "Fraunces", vibe: "Editorial", display: '"Fraunces", Georgia, serif', sans: '"Source Sans 3", "Segoe UI", sans-serif' },
  { id: "noto", label: "Noto", vibe: "Cyrillic · world", display: '"Noto Sans", "Segoe UI", sans-serif', sans: '"Noto Sans", "Segoe UI", sans-serif' },
  { id: "naskh", label: "Naskh", vibe: "Arabic · Farsi", display: '"Noto Naskh Arabic", "Noto Sans Arabic", serif', sans: '"Noto Sans Arabic", "Segoe UI", sans-serif' },
];

export function storedFont(): FontId {
  try {
    if (typeof window === "undefined") return "outfit";
    const v = window.localStorage.getItem(FONT_KEY);
    return FONT_PACKS.some((f) => f.id === v) ? (v as FontId) : "outfit";
  } catch {
    return "outfit";
  }
}

export function packOf(id: FontId) {
  return FONT_PACKS.find((f) => f.id === id) ?? FONT_PACKS[0];
}

const FONT_HREF: Partial<Record<FontId, string>> = {
  archivo: "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800&display=swap",
  barlow: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600&family=Barlow+Condensed:wght@600;700&display=swap",
  oswald: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Source+Sans+3:wght@400;600;700&display=swap",
  space: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap",
  sora: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&display=swap",
  teko: "https://fonts.googleapis.com/css2?family=Teko:wght@500;600;700&family=Nunito+Sans:wght@400;700&display=swap",
  plex: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap",
  nunito: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap",
  fraunces: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Source+Sans+3:wght@400;600;700&display=swap",
  noto: "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap",
  naskh: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@500;700&family=Noto+Sans+Arabic:wght@400;600;700&display=swap",
};

export function ensureLangFont(id: FontId) {
  ensureFontLink(id);
}

function ensureFontLink(id: FontId) {
  const href = FONT_HREF[id];
  if (!href || typeof document === "undefined") return;
  const tag = `tw-font-${id}`;
  if (document.getElementById(tag)) return;
  const l = document.createElement("link");
  l.id = tag;
  l.rel = "stylesheet";
  l.href = href;
  document.head.appendChild(l);
}


export function paintFont(id: FontId | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (!id) {
    root.style.removeProperty("--font-display");
    root.style.removeProperty("--font-sans");
    return;
  }
  ensureFontLink(id);
  const pack = packOf(id);
  root.style.setProperty("--font-display", pack.display);
  root.style.setProperty("--font-sans", pack.sans);
}

export function commitFont(id: FontId | null) {
  paintFont(id ?? "outfit");
  if (typeof window === "undefined") return;
  if (!id || id === "outfit") window.localStorage.removeItem(FONT_KEY);
  else window.localStorage.setItem(FONT_KEY, id);
}

export function fontStyle(id: FontId): { fontFamily: string; ["--font-display"]: string; ["--font-sans"]: string } {
  const pack = packOf(id);
  return { fontFamily: pack.sans, ["--font-display"]: pack.display, ["--font-sans"]: pack.sans };
}
