/** Grade-book inbox. Alias and one line per app. No real names. */

import { deskKv, type Kv } from "./cf-env";

export type MarkRow = {
  alias: string;
  code: string;
  app: string;
  line: string;
  saved: string;
};

const APPS = new Set([
  "baboo",
  "bertycad",
  "visualizer",
  "bits",
  "bertybots",
  "berty-run",
  "spancraft",
  "spire-lab",
  "drift",
  "holdit",
  "ginger",
  "paperlab",
  "logolab",
  "drawin",
  "catapult",
  "musiclab",
  "bertybeatz",
  "koderized",
]);
const DATA_KEY = "tw-marks-v1";
const CACHE_DATA = "https://tw.kulibert.net/__kv/tw-marks-v1";
const MAX = 400;

function cacheOf() {
  try {
    const cachesObj = (globalThis as unknown as { caches?: { default?: { match: (req: Request) => Promise<Response | undefined>; put: (req: Request, res: Response) => Promise<void> } } }).caches;
    return cachesObj?.default ?? null;
  } catch {
    return null;
  }
}

function cleanAlias(raw: unknown) {
  return String(raw ?? "")
    .replace(/[^\p{L}\p{N} \-']/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

function codeOf(alias: string) {
  const s = alias.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  if (!s) return "";
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const n = (h >>> 0) % (chars.length * chars.length);
  return s.toUpperCase() + "-" + chars[Math.floor(n / chars.length)] + chars[n % chars.length];
}

function clip(raw: unknown, max: number) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function sanitizeMark(src: unknown): MarkRow | null {
  if (!src || typeof src !== "object") return null;
  const row = src as { alias?: unknown; app?: unknown; line?: unknown };
  const alias = cleanAlias(row.alias);
  const code = codeOf(alias);
  const app = clip(row.app, 24);
  const line = clip(row.line, 32);
  if (!alias || !code || !APPS.has(app) || !line) return null;
  return { alias, code, app, line, saved: new Date().toISOString() };
}

function pack(rows: MarkRow[]) {
  const map = new Map<string, MarkRow>();
  for (const row of rows) {
    const clean = sanitizeMark(row);
    if (!clean) continue;
    clean.saved = clip(row.saved, 40) || clean.saved;
    map.set(clean.code + "\n" + clean.app, clean);
  }
  return [...map.values()].slice(-MAX);
}

async function cacheGet(): Promise<string | null> {
  const cache = cacheOf();
  if (!cache) return null;
  const hit = await cache.match(new Request(CACHE_DATA));
  if (!hit) return null;
  try {
    return await hit.text();
  } catch {
    return null;
  }
}

async function cachePut(value: string) {
  const cache = cacheOf();
  if (!cache) return false;
  await cache.put(
    new Request(CACHE_DATA),
    new Response(value, { headers: { "content-type": "application/json; charset=utf-8" } }),
  );
  return true;
}

async function readRaw(kv: Kv | null): Promise<{ raw: string | null; store: "kv" | "cache" | "none" }> {
  if (kv) return { raw: await kv.get(DATA_KEY), store: "kv" };
  const cached = await cacheGet();
  if (cached != null || cacheOf()) return { raw: cached, store: "cache" };
  return { raw: null, store: "none" };
}

export async function loadMarks(event: unknown): Promise<{ marks: MarkRow[]; store: "kv" | "cache" | "none" }> {
  const kv = deskKv(event);
  const { raw, store } = await readRaw(kv);
  if (!raw) return { marks: [], store };
  try {
    const parsed = JSON.parse(raw) as { marks?: MarkRow[] };
    return { marks: pack(Array.isArray(parsed.marks) ? parsed.marks : []), store };
  } catch {
    return { marks: [], store };
  }
}

export async function saveMarks(event: unknown, incoming: unknown[]): Promise<"kv" | "cache" | "none"> {
  const kv = deskKv(event);
  const { marks } = await loadMarks(event);
  const next = pack(marks.concat(incoming as MarkRow[]));
  const body = JSON.stringify({ v: 1, marks: next });
  if (kv) {
    await kv.put(DATA_KEY, body);
    return "kv";
  }
  if (await cachePut(body)) return "cache";
  return "none";
}
