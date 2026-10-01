/** Per-app settings for one shop code. Same book as marks. Never the cache. */

import { openKv } from "./cf-env";

const DATA_KEY = "tw-prefs-v1";
const CAP = 8 * 1024;
const CODE = /^[A-Z2-9]{5}$/;
const APP = /^[a-z0-9-]{1,24}$/;

type Book = Record<string, Record<string, unknown>>;

export function shopCode(raw: unknown) {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
}

export function appSlug(raw: unknown) {
  return String(raw ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24);
}

export function fitPrefs(raw: unknown): { ok: true; prefs: Record<string, unknown>; bytes: number } | { ok: false; reason: "shape" | "big" } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, reason: "shape" };
  let prefs: Record<string, unknown>;
  try {
    prefs = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;
  } catch {
    return { ok: false, reason: "shape" };
  }
  const bytes = new TextEncoder().encode(JSON.stringify(prefs)).length;
  if (bytes > CAP) return { ok: false, reason: "big" };
  return { ok: true, prefs, bytes };
}

async function readBook(event: unknown): Promise<{ book: Book; store: "kv" | "file" | "none" }> {
  const kv = await openKv(event);
  if (!kv) return { book: {}, store: "none" };
  const store = process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages" ? "kv" : "file";
  const raw = await kv.get(DATA_KEY);
  if (!raw) return { book: {}, store };
  try {
    const parsed = JSON.parse(raw) as { prefs?: Book };
    const book = parsed.prefs && typeof parsed.prefs === "object" ? parsed.prefs : {};
    return { book, store };
  } catch {
    return { book: {}, store };
  }
}

export async function loadPrefs(event: unknown, code: string, app: string): Promise<{ prefs: Record<string, unknown>; store: "kv" | "file" | "none" }> {
  const shop = shopCode(code);
  const slug = appSlug(app);
  if (!CODE.test(shop) || !APP.test(slug)) return { prefs: {}, store: "none" };
  const { book, store } = await readBook(event);
  const row = book[shop]?.[slug];
  const prefs = row && typeof row === "object" && !Array.isArray(row) ? (row as Record<string, unknown>) : {};
  return { prefs, store };
}

export async function savePrefs(
  event: unknown,
  code: string,
  app: string,
  raw: unknown,
): Promise<"kv" | "file" | "none" | "reject" | "big" | "shape"> {
  const shop = shopCode(code);
  const slug = appSlug(app);
  if (!CODE.test(shop) || !APP.test(slug)) return "reject";
  const fit = fitPrefs(raw);
  if (!fit.ok) return fit.reason;
  const kv = await openKv(event);
  if (!kv) return "none";
  const { book } = await readBook(event);
  const mine = { ...(book[shop] ?? {}), [slug]: fit.prefs };
  const next: Book = { ...book, [shop]: mine };
  await kv.put(DATA_KEY, JSON.stringify({ v: 1, prefs: next }));
  return process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages" ? "kv" : "file";
}
