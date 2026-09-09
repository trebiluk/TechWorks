import { CHROME_RU, CHROME_UK } from "../data/i18n-chrome.ts";
import { GLOSS_I18N } from "../data/i18n-glossary.ts";
import { HELP_I18N } from "../data/i18n-help.ts";
import { ensureLangFont, packOf, storedFont } from "./fonts.ts";

export const LANG_KEY = "techworks-lang";

export const LANGS = [
  { id: "en", label: "English", native: "English", short: "EN", dir: "ltr" as const, classLang: true },
  { id: "uk", label: "Ukrainian", native: "Українська", short: "УК", dir: "ltr" as const, classLang: true },
  { id: "ru", label: "Russian", native: "Русский", short: "РУ", dir: "ltr" as const, classLang: true },
  { id: "es", label: "Cuban", native: "Cubano", short: "ES", dir: "ltr" as const, classLang: false },
  { id: "ar", label: "Arabic", native: "العربية", short: "AR", dir: "rtl" as const, classLang: false },
  { id: "fa", label: "Farsi", native: "فارسی", short: "FA", dir: "rtl" as const, classLang: false },
] as const;

export type LangId = (typeof LANGS)[number]["id"];

export const CLASS_LANGS = LANGS.filter((l) => l.classLang);

const EXTRA_ES: Record<string, string> = {
  Themes: "Temas",
  Dashboard: "Pizarra",
  Week: "Semana",
  Admin: "Admin",
  Lunch: "Almuerzo",
  Now: "Ahora",
  Cleanup: "Recoger",
  "Apply look": "Guardar estilo",
  "Reset Solvay": "Volver a Solvay",
  Scale: "Escala",
  Titles: "Títulos",
  Chips: "Fichas",
  Corners: "Esquinas",
  Stroke: "Línea",
  Pad: "Relleno",
  Lift: "Sombra",
  Wallpaper: "Fondo",
  Type: "Letra",
  Color: "Color",
  Size: "Tamaño",
  Caps: "Mayúsculas",
  Language: "Idioma",
  "Small caps": "Versalitas",
  "All caps": "MAYÚSCULAS",
  Shadows: "Sombras",
  Glow: "Brillo",
  Today: "Hoy",
  "Hall wall": "Pizarra de estudio",
  "Tech store": "Tienda",
  "FERPA wall": "Pizarra FERPA",
  "Theme tools": "Estilo",
  Off: "No",
  Apply: "Aplicar",
  Revert: "Deshacer",
};

const EXTRA_AR: Record<string, string> = {
  Themes: "السمات",
  Dashboard: "اللوحة",
  Week: "الأسبوع",
  Admin: "الإدارة",
  Lunch: "الغداء",
  Now: "الآن",
  Cleanup: "ترتيب",
  Language: "اللغة",
  Today: "اليوم",
  Off: "لا",
  Apply: "تطبيق",
  Revert: "تراجع",
};

const EXTRA_FA: Record<string, string> = {
  Themes: "پوسته‌ها",
  Dashboard: "تابلو",
  Week: "هفته",
  Admin: "مدیر",
  Lunch: "ناهار",
  Now: "الان",
  Cleanup: "جمع کردن",
  Language: "زبان",
  Today: "امروز",
  Off: "نه",
  Apply: "اعمال",
  Revert: "بازگشت",
};

const DICT: Record<LangId, Record<string, string>> = {
  en: {},
  uk: CHROME_UK,
  ru: CHROME_RU,
  es: EXTRA_ES,
  ar: EXTRA_AR,
  fa: EXTRA_FA,
};

export function storedLang(): LangId {
  try {
    if (typeof window === "undefined") return "en";
    const v = window.localStorage.getItem(LANG_KEY);
    return LANGS.some((l) => l.id === v) ? (v as LangId) : "en";
  } catch {
    return "en";
  }
}

export function langOf(id: LangId) {
  return LANGS.find((l) => l.id === id) ?? LANGS[0];
}

const subs = new Set<() => void>();

export function lang(): LangId {
  return storedLang();
}

function paintCyrillicFallback() {
  if (typeof document === "undefined") return;
  ensureLangFont("noto");
  const pack = packOf(storedFont());
  if (pack.id === "noto" || pack.id === "naskh") return;
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `"Noto Sans", ${pack.sans}`);
  root.style.setProperty("--font-display", `"Noto Sans", ${pack.display}`);
}

function paintRtlFallback() {
  if (typeof document === "undefined") return;
  ensureLangFont("naskh");
  const pack = packOf(storedFont());
  if (pack.id === "naskh") return;
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `"Noto Sans Arabic", ${pack.sans}`);
  root.style.setProperty("--font-display", `"Noto Naskh Arabic", ${pack.display}`);
}

function restoreFont() {
  if (typeof document === "undefined") return;
  const pack = packOf(storedFont());
  const root = document.documentElement;
  root.style.setProperty("--font-sans", pack.sans);
  root.style.setProperty("--font-display", pack.display);
}

export function paintLang(id: LangId = storedLang()) {
  if (typeof document === "undefined") return;
  const row = langOf(id);
  document.documentElement.lang = id === "es" ? "es-CU" : id;
  document.documentElement.dir = row.dir;
  document.documentElement.dataset.lang = id;
  if (id === "uk" || id === "ru") paintCyrillicFallback();
  else if (id === "ar" || id === "fa") paintRtlFallback();
  else restoreFont();
}

export function commitLang(id: LangId) {
  if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, id);
  paintLang(id);
  subs.forEach((fn) => fn());
}

export function onLang(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function t(phrase: string, id: LangId = storedLang()): string {
  if (id === "en") return phrase;
  return DICT[id]?.[phrase] || phrase;
}

export function articleCopy(id: string, title: string, body: string, langId: LangId = storedLang()): { title: string; body: string } {
  if (langId !== "uk" && langId !== "ru") return { title, body };
  const pack = HELP_I18N[langId][id];
  return pack ?? { title, body };
}

export function glossCopy(id: string, def: string, use: string, langId: LangId = storedLang()): { def: string; use: string } {
  if (langId !== "uk" && langId !== "ru") return { def, use };
  const pack = GLOSS_I18N[langId][id];
  return pack ?? { def, use };
}

export function bootLang() {
  paintLang(storedLang());
}
