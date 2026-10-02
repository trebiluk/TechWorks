import { CHROME_RU, CHROME_UK } from "../data/i18n-chrome.ts";
import { EXTRA_AR, EXTRA_ES, EXTRA_FA, EXTRA_RW, EXTRA_TI, SIMPLE } from "../data/i18n-extra.ts";
import { GLOSS_I18N } from "../data/i18n-glossary.ts";
import { HELP_I18N } from "../data/i18n-help.ts";
import { ensureLangFont, packOf, storedFont } from "./fonts.ts";

export const LANG_KEY = "techworks-lang";

export const LANGS = [
  { id: "en", label: "English", native: "English", short: "EN", dir: "ltr" as const, classLang: true },
  { id: "uk", label: "Ukrainian", native: "Українська", short: "УК", dir: "ltr" as const, classLang: true },
  { id: "ru", label: "Russian", native: "Русский", short: "РУ", dir: "ltr" as const, classLang: true },
  { id: "es", label: "Spanish", native: "Español", short: "ES", dir: "ltr" as const, classLang: true },
  { id: "ar", label: "Arabic", native: "العربية", short: "ع", dir: "rtl" as const, classLang: true },
  { id: "fa-AF", label: "Dari", native: "دری", short: "دری", dir: "rtl" as const, classLang: true },
  { id: "rw", label: "Kinyarwanda", native: "Ikinyarwanda", short: "RW", dir: "ltr" as const, classLang: true },
  { id: "ti", label: "Tigrinya", native: "ትግርኛ", short: "ትግ", dir: "ltr" as const, classLang: true },
] as const;

export type LangId = (typeof LANGS)[number]["id"];
export type HubLang = LangId | "simple";

export const CLASS_LANGS = LANGS.filter((l) => l.classLang);

const HUB_OK = new Set<string>([...LANGS.map((l) => l.id), "simple", "fa"]);

const SHARED_KEY: Record<string, string> = {
  Home: "home",
  "Sign in": "signIn",
  Settings: "settings",
  Play: "play",
  Pause: "pause",
  Resume: "resume",
  Retry: "retry",
  Exit: "exit",
  Sound: "sound",
  Music: "music",
  Volume: "volume",
  Next: "next",
  Back: "back",
  Help: "help",
  "What's new": "whatsNew",
  Scores: "scores",
  Levels: "levels",
  Language: "language",
};

const DICT: Record<LangId, Record<string, string>> = {
  en: {},
  uk: CHROME_UK,
  ru: CHROME_RU,
  es: EXTRA_ES,
  ar: EXTRA_AR,
  "fa-AF": EXTRA_FA,
  rw: EXTRA_RW,
  ti: EXTRA_TI,
};

function normalize(raw: string | null | undefined): HubLang | null {
  if (!raw || !HUB_OK.has(raw)) return null;
  if (raw === "fa") return "fa-AF";
  return raw as HubLang;
}

export function classicOn(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(window.location.search);
  return q.get("theme") === "classic" || q.get("hub") === "classic";
}

export function readHubLang(): HubLang | null {
  if (typeof window === "undefined" || classicOn()) return classicOn() ? "en" : null;
  const q = normalize(new URLSearchParams(window.location.search).get("lang"));
  if (q) return q;
  const hash = window.location.hash || "";
  const m = hash.match(/(?:^#|&)kp=([^&]+)/);
  if (m) {
    try {
      const parts = decodeURIComponent(m[1]).split(".");
      const fromCode = parts.length >= 7 ? normalize(parts[6]) : null;
      if (fromCode) return fromCode;
    } catch {
      /* ignore a bad hash */
    }
  }
  const prefs = (window as Window & { KulibertPrefs?: { lang?: string } }).KulibertPrefs;
  return normalize(prefs?.lang ?? null);
}

export function storedLang(): LangId {
  try {
    if (typeof window === "undefined") return "en";
    if (classicOn()) return "en";
    const hub = readHubLang();
    if (hub && hub !== "simple") return hub;
    const v = window.localStorage.getItem(LANG_KEY);
    const local = normalize(v);
    return local && local !== "simple" ? local : "en";
  } catch {
    return "en";
  }
}

export function copyMode(): HubLang {
  if (typeof document !== "undefined" && document.documentElement.dataset.lang === "simple") return "simple";
  return storedLang();
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
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), "Noto Sans Arabic", ${pack.sans}`);
  root.style.setProperty("--font-display", `var(--kp-font), "Noto Sans Arabic", ${pack.display}`);
}

function paintEthiopic() {
  if (typeof document === "undefined") return;
  ensureEthiopic();
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), "Noto Sans Ethiopic", "Noto Sans", system-ui, sans-serif`);
  root.style.setProperty("--font-display", `var(--kp-font), "Noto Sans Ethiopic", "Noto Sans", system-ui, sans-serif`);
}

function ensureEthiopic() {
  if (typeof document === "undefined" || document.getElementById("tw-font-ethiopic")) return;
  const l = document.createElement("link");
  l.id = "tw-font-ethiopic";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;600;700&display=swap";
  document.head.appendChild(l);
}

function restoreFont() {
  if (typeof document === "undefined") return;
  const pack = packOf(storedFont());
  const root = document.documentElement;
  root.style.setProperty("--font-sans", `var(--kp-font), ${pack.sans}`);
  root.style.setProperty("--font-display", `var(--kp-font), ${pack.display}`);
}

export function paintLang(id: HubLang = storedLang()) {
  if (typeof document === "undefined") return;
  const simple = id === "simple";
  const langId: LangId = simple ? "en" : id;
  const row = langOf(langId);
  document.documentElement.lang = simple ? "en" : langId;
  document.documentElement.dir = simple ? "ltr" : row.dir;
  document.documentElement.dataset.lang = simple ? "simple" : langId;
  if (langId === "uk" || langId === "ru") paintCyrillicFallback();
  else if (langId === "ar" || langId === "fa-AF") paintRtlFallback();
  else if (langId === "ti") paintEthiopic();
  else restoreFont();
}

export function commitLang(id: HubLang) {
  const stored = id === "simple" ? "en" : id;
  if (typeof window !== "undefined" && !classicOn()) window.localStorage.setItem(LANG_KEY, stored);
  paintLang(classicOn() ? "en" : id);
  subs.forEach((fn) => fn());
}

export function onLang(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

function sharedLine(phrase: string, id: HubLang): string {
  const key = SHARED_KEY[phrase];
  if (!key || typeof window === "undefined") return "";
  const api = (window as Window & { KulibertI18n?: { t?: (k: string) => string } }).KulibertI18n;
  const line = api?.t?.(key) || "";
  if (!line || line === key) return "";
  if (id === "en" || id === "simple") return line;
  return line;
}

export function t(phrase: string, id: HubLang = copyMode()): string {
  const shared = sharedLine(phrase, id);
  if (id === "en") return shared || phrase;
  if (id === "simple") return SIMPLE[phrase] || shared || phrase;
  return DICT[id]?.[phrase] || shared || phrase;
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

const NO_VOICE = new Set(["rw", "ti"]);

export function sayLine(text: string) {
  if (typeof window === "undefined") return;
  const words = text.replace(/\s+/g, " ").trim().slice(0, 180);
  if (!words || classicOn()) return;
  const prefs = (window as Window & { KulibertPrefs?: { say?: (s: string) => void; voiceFor?: (lang: string) => unknown; lang?: string } }).KulibertPrefs;
  if (prefs?.say) {
    prefs.say(words);
    return;
  }
  const langId = copyMode();
  const node = document.getElementById("tw-say") || document.createElement("p");
  node.id = "tw-say";
  node.setAttribute("role", "status");
  const quiet = NO_VOICE.has(langId) || !window.speechSynthesis;
  node.textContent = quiet ? `${words} ${t("No voice yet", langId)}` : words;
  if (!node.parentElement) document.body.appendChild(node);
  if (quiet || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words);
    u.lang = langId === "simple" ? "en-US" : langId;
    window.speechSynthesis.speak(u);
  } catch {
    node.textContent = `${words} ${t("No voice yet", langId)}`;
  }
}

function applyIncoming(raw: string | null | undefined) {
  const next = classicOn() ? "en" : normalize(raw);
  if (!next) return;
  commitLang(next);
}

export function bootLang() {
  const hub = readHubLang();
  paintLang(classicOn() ? "en" : hub ?? storedLang());
  if (typeof window === "undefined" || (window as Window & { __twLang?: number }).__twLang) return;
  (window as Window & { __twLang?: number }).__twLang = 1;
  window.addEventListener("kulibert-lang", (ev) => {
    const detail = (ev as CustomEvent<{ lang?: string }>).detail;
    applyIncoming(detail?.lang);
  });
  window.addEventListener("hashchange", () => applyIncoming(readHubLang()));
  window.addEventListener("message", (ev) => {
    const data = ev.data as { type?: string; lang?: string } | null;
    if (!data || (data.type !== "kulibert-lang" && data.type !== "kw-lang")) return;
    applyIncoming(data.lang);
  });
  const root = document.documentElement;
  if (window.MutationObserver) {
    new MutationObserver(() => {
      const attr = root.getAttribute("data-kp-lang");
      if (attr && attr !== root.dataset.lang) applyIncoming(attr);
    }).observe(root, { attributes: true, attributeFilter: ["data-kp-lang"] });
  }
}