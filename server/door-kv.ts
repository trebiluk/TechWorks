/** Public school-door links. Same TW_DESK KV, key door-links. Not student data. */

import { deskKv, type Kv } from "./cf-env";
import { loadRow } from "./desk-kv";

export type DoorLink = {
  id: string;
  name: string;
  href: string;
  icon: string;
};

export type DoorPack = {
  kind: "tech-room-included";
  updated: string;
  note: string;
  links: DoorLink[];
  hidden: string[];
  club: string;
  doors: string;
  lastBell: string;
  search: string;
  footer: string;
  closed: boolean;
  closedMsg: string;
  staffEdit: boolean;
  shortcuts: boolean;
  paste: boolean;
  maxCuts: number;
  welcome: string;
  period: string;
  showNote: boolean;
  recents: boolean;
  pins: boolean;
  searchOn: boolean;
  bellsOn: boolean;
  aliasOn: boolean;
  staffLane: boolean;
  hotkeys: boolean;
  categories: boolean;
  newTab: boolean;
  lockup: boolean;
  density: "roomy" | "compact";
  focus: string;
  chips: boolean;
};

export type DoorStore = "kv" | "cache" | "none";

const ICONS = new Set([
  "link",
  "globe",
  "bookmark",
  "video",
  "file",
  "game",
  "music",
  "calc",
  "news",
  "school",
]);
const MAX = 24;
const MAX_NOTE = 80;
const APP_IDS = new Set([
  "techworks",
  "baboo",
  "koderized",
  "bertycad",
  "bertybots",
  "berty-run",
  "paperlab",
  "logolab",
  "sprocket",
  "den",
  "bistro",
  "housekit",
  "drift",
]);
const ALIAS: Record<string, string> = { "bearcat-den": "den", "bearcat-bistro": "bistro" };
const DATA_KEY = "door-links";
const LOCK_KEY = "door-links-auth";
const CACHE_DATA = "https://tw.kulibert.net/__kv/door-links";
const CACHE_LOCK = "https://tw.kulibert.net/__kv/door-links-auth";

function cacheOf(): { match: (req: Request) => Promise<Response | undefined>; put: (req: Request, res: Response) => Promise<void> } | null {
  try {
    const cachesObj = (globalThis as unknown as { caches?: { default?: { match: (req: Request) => Promise<Response | undefined>; put: (req: Request, res: Response) => Promise<void> } } }).caches;
    const c = cachesObj?.default;
    if (c && typeof c.match === "function" && typeof c.put === "function") return c;
  } catch {
    /* node / vercel */
  }
  return null;
}

function cleanUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.href.length > 2048) return null;
  return url.href;
}

function hrefKey(href: string) {
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/\/+$/, "");
    return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`.toLowerCase();
  } catch {
    return href.replace(/\/+$/, "").toLowerCase();
  }
}

export function sanitizeNote(raw: unknown) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NOTE);
}

export function packEtag(pack: DoorPack) {
  return `"tw-door-${pack.updated}-${pack.links.length}-${pack.note.length}-${pack.hidden.length}-${pack.closed ? 1 : 0}-${pack.focus}-${pack.density}"`;
}

function clip(raw: unknown, max: number) {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function flag(raw: unknown, fallback: boolean) {
  if (typeof raw === "boolean") return raw;
  if (raw === "true" || raw === 1) return true;
  if (raw === "false" || raw === 0) return false;
  return fallback;
}

function sanitizeHidden(value: unknown) {
  if (!Array.isArray(value)) return [];
  const next: string[] = [];
  for (const item of value) {
    const id = ALIAS[String(item)] ?? String(item ?? "");
    if (!APP_IDS.has(id) || next.includes(id)) continue;
    next.push(id);
  }
  return next;
}

export function sanitizePack(raw: unknown): DoorPack {
  const src = raw && typeof raw === "object" ? (raw as Partial<DoorPack>) : {};
  const links: DoorLink[] = [];
  const seenId = new Set<string>();
  const seenHref = new Set<string>();
  const rows = Array.isArray(src.links) ? src.links : [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DoorLink>;
    const name = String(row.name ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
    const href = cleanUrl(String(row.href ?? ""));
    if (!name || !href) continue;
    const key = hrefKey(href);
    if (seenHref.has(key)) continue;
    const id =
      typeof row.id === "string" && row.id.startsWith("cut-")
        ? row.id.slice(0, 24)
        : `cut-${links.length + 1}`;
    if (seenId.has(id)) continue;
    seenId.add(id);
    seenHref.add(key);
    const icon = ICONS.has(String(row.icon)) ? String(row.icon) : "link";
    links.push({ id, name, href, icon });
    if (links.length >= MAX) break;
  }
  const maxCuts = Number(src.maxCuts);
  const focusId = ALIAS[clip((src as { focus?: unknown }).focus, 24)] ?? clip((src as { focus?: unknown }).focus, 24);
  return {
    kind: "tech-room-included",
    updated: typeof src.updated === "string" ? src.updated.slice(0, 40) : new Date().toISOString(),
    note: sanitizeNote(src.note),
    links,
    hidden: sanitizeHidden((src as { hidden?: unknown }).hidden),
    club: clip((src as { club?: unknown }).club, 80),
    doors: clip((src as { doors?: unknown }).doors, 24),
    lastBell: clip((src as { lastBell?: unknown }).lastBell, 24),
    search: clip((src as { search?: unknown }).search, 40),
    footer: clip((src as { footer?: unknown }).footer, 80),
    closed: flag((src as { closed?: unknown }).closed, false),
    closedMsg: clip((src as { closedMsg?: unknown }).closedMsg, 80),
    staffEdit: flag((src as { staffEdit?: unknown }).staffEdit, true),
    shortcuts: flag((src as { shortcuts?: unknown }).shortcuts, true),
    paste: flag((src as { paste?: unknown }).paste, true),
    maxCuts: Number.isFinite(maxCuts) ? Math.min(18, Math.max(1, Math.round(maxCuts))) : 18,
    welcome: clip((src as { welcome?: unknown }).welcome, 60),
    period: clip((src as { period?: unknown }).period, 24),
    showNote: flag((src as { showNote?: unknown }).showNote, true),
    recents: flag((src as { recents?: unknown }).recents, true),
    pins: flag((src as { pins?: unknown }).pins, true),
    searchOn: flag((src as { searchOn?: unknown }).searchOn, true),
    bellsOn: flag((src as { bellsOn?: unknown }).bellsOn, true),
    aliasOn: flag((src as { aliasOn?: unknown }).aliasOn, true),
    staffLane: flag((src as { staffLane?: unknown }).staffLane, true),
    hotkeys: flag((src as { hotkeys?: unknown }).hotkeys, true),
    categories: flag((src as { categories?: unknown }).categories, true),
    newTab: flag((src as { newTab?: unknown }).newTab, true),
    lockup: flag((src as { lockup?: unknown }).lockup, true),
    density: (src as { density?: unknown }).density === "compact" ? "compact" : "roomy",
    focus: APP_IDS.has(focusId) ? focusId : "",
    chips: flag((src as { chips?: unknown }).chips, true),
  };
}

async function cacheGet(url: string): Promise<string | null> {
  const cache = cacheOf();
  if (!cache) return null;
  const hit = await cache.match(new Request(url));
  if (!hit) return null;
  try {
    return await hit.text();
  } catch {
    return null;
  }
}

async function cachePut(url: string, value: string): Promise<boolean> {
  const cache = cacheOf();
  if (!cache) return false;
  await cache.put(
    new Request(url),
    new Response(value, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "public, max-age=31536000",
      },
    }),
  );
  return true;
}

export async function loadDoor(event: unknown): Promise<{ pack: DoorPack; store: DoorStore }> {
  const kv = deskKv(event);
  if (kv) {
    const raw = await kv.get(DATA_KEY);
    if (!raw) return { pack: sanitizePack({ links: [] }), store: "kv" };
    try {
      return { pack: sanitizePack(JSON.parse(raw)), store: "kv" };
    } catch {
      return { pack: sanitizePack({ links: [] }), store: "kv" };
    }
  }
  const cached = await cacheGet(CACHE_DATA);
  if (cached) {
    try {
      return { pack: sanitizePack(JSON.parse(cached)), store: "cache" };
    } catch {
      return { pack: sanitizePack({ links: [] }), store: "cache" };
    }
  }
  if (cacheOf()) return { pack: sanitizePack({ links: [] }), store: "cache" };
  return { pack: sanitizePack({ links: [] }), store: "none" };
}

export async function saveDoor(event: unknown, pack: DoorPack): Promise<DoorStore> {
  const body = JSON.stringify(sanitizePack(pack));
  const kv = deskKv(event);
  if (kv) {
    await kv.put(DATA_KEY, body);
    return "kv";
  }
  if (await cachePut(CACHE_DATA, body)) return "cache";
  return "none";
}

async function loadLock(event: unknown): Promise<string | null> {
  const kv = deskKv(event);
  if (kv) return (await kv.get(LOCK_KEY))?.trim() || null;
  return (await cacheGet(CACHE_LOCK))?.trim() || null;
}

async function saveLock(event: unknown, token: string): Promise<void> {
  const kv = deskKv(event);
  if (kv) {
    await kv.put(LOCK_KEY, token);
    return;
  }
  await cachePut(CACHE_LOCK, token);
}

export function isDeskToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}

/** Desk row wins when Cloud is bound. Otherwise first writer claims the door lock. */
export async function allowDoorWrite(
  event: unknown,
  token: string,
): Promise<"ok" | "deny" | "none"> {
  if (!isDeskToken(token)) return "deny";
  const kv: Kv | null = deskKv(event);
  const cache = cacheOf();
  if (!kv && !cache) return "none";
  const { row } = await loadRow(event);
  if (row && row.keyHash !== token) return "deny";
  const lock = await loadLock(event);
  if (lock && lock !== token) return "deny";
  return "ok";
}

export async function claimDoorWrite(event: unknown, token: string): Promise<void> {
  await saveLock(event, token);
}
