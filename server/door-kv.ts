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
  return `"tw-door-${pack.updated}-${pack.links.length}-${pack.note.length}"`;
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
  return {
    kind: "tech-room-included",
    updated: typeof src.updated === "string" ? src.updated.slice(0, 40) : new Date().toISOString(),
    note: sanitizeNote(src.note),
    links,
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
