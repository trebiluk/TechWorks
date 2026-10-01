/** App results. Alias and a shop code. No real names. KV when bound, else a local file. Never the cache. */

import { openKv } from "./cf-env";

export type MarkV1 = {
  v: 1;
  alias: string;
  code: string;
  app: string;
  line: string;
  saved: string;
};

export type MarkEvent = "start" | "clear" | "fail" | "score" | "badge" | "xp" | "play" | "line";

export type MarkV2 = {
  v: 2;
  app: string;
  version: string;
  code: string;
  alias: string;
  event: MarkEvent;
  level: string;
  score: number;
  max: number;
  stars: number;
  xp: number;
  skill: string;
  ms: number;
  ts: string;
};

export type MarkRecord = MarkV1 | MarkV2;

const APPS = new Set([
  "baboo", "bertycad", "visualizer", "bits", "bertybots", "berty-run", "spancraft", "spire-lab",
  "drift", "holdit", "ginger", "paperlab", "logolab", "drawin", "catapult", "musiclab", "bertybeatz",
  "koderized", "throwit", "sprocket", "housekit", "techworks",
]);
const EVENTS = new Set<MarkEvent>(["start", "clear", "fail", "score", "badge", "xp", "play", "line"]);
const DATA_KEY = "tw-marks-v2";
const MAX = 800;
const CODE = /^[A-Z2-9]{5}$/;

function clip(raw: unknown, max: number) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
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

function shopCode(raw: unknown) {
  return String(raw ?? "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 5);
}

export function sanitizeV1(src: unknown): MarkV1 | null {
  if (!src || typeof src !== "object") return null;
  const row = src as { alias?: unknown; app?: unknown; line?: unknown; saved?: unknown };
  if ("event" in (src as object) || (src as { v?: unknown }).v === 2) return null;
  const alias = cleanAlias(row.alias);
  const code = codeOf(alias);
  const app = clip(row.app, 24);
  const line = clip(row.line, 32);
  if (!alias || !code || !APPS.has(app) || !line) return null;
  return { v: 1, alias, code, app, line, saved: clip(row.saved, 40) || new Date().toISOString() };
}

export function sanitizeV2(src: unknown): MarkV2 | null {
  if (!src || typeof src !== "object") return null;
  const row = src as Partial<MarkV2>;
  const code = shopCode(row.code);
  const alias = cleanAlias(row.alias);
  const app = clip(row.app, 24);
  const event = clip(row.event, 12) as MarkEvent;
  if (!CODE.test(code) || alias.length < 2 || !APPS.has(app) || !EVENTS.has(event)) return null;
  const stars = Math.max(0, Math.min(5, Math.round(Number(row.stars) || 0)));
  const score = Math.max(0, Math.min(9999, Math.round(Number(row.score) || 0)));
  const max = Math.max(0, Math.min(9999, Math.round(Number(row.max) || 0)));
  const xp = Math.max(0, Math.min(999, Math.round(Number(row.xp) || 0)));
  const ms = Math.max(0, Math.min(86_400_000, Math.round(Number(row.ms) || 0)));
  return {
    v: 2,
    app,
    version: clip(row.version, 16),
    code,
    alias,
    event,
    level: clip(row.level, 40),
    score,
    max,
    stars,
    xp,
    skill: clip(row.skill, 24),
    ms,
    ts: clip(row.ts, 40) || new Date().toISOString(),
  };
}

export function dedupeMarks(rows: MarkRecord[]): MarkRecord[] {
  const map = new Map<string, MarkRecord>();
  for (const row of rows) {
    if (row.v === 2) map.set(`${row.code}\n${row.app}\n${row.event}\n${row.level}\n${row.ts}`, row);
    else map.set(`v1\n${row.code}\n${row.app}`, row);
  }
  return [...map.values()].slice(-MAX);
}

function packStored(rows: unknown[]): MarkRecord[] {
  const out: MarkRecord[] = [];
  for (const row of rows) {
    const v2 = sanitizeV2(row);
    if (v2) {
      out.push(v2);
      continue;
    }
    const v1 = sanitizeV1(row);
    if (v1) out.push(v1);
  }
  return dedupeMarks(out);
}

export async function loadMarks(event: unknown): Promise<{ marks: MarkRecord[]; store: "kv" | "file" | "none" }> {
  const kv = await openKv(event);
  if (!kv) return { marks: [], store: "none" };
  const raw = await kv.get(DATA_KEY);
  const store = process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages" ? "kv" : "file";
  if (!raw) return { marks: [], store };
  try {
    const parsed = JSON.parse(raw) as { marks?: unknown[] };
    const marks = packStored(Array.isArray(parsed.marks) ? parsed.marks : []);
    const kept = marks.filter((row) => !((row.code === "PNZM4" && row.alias === "Nova") || (row.code === "K7Q2M" && row.alias === "Test")));
    if (kept.length !== marks.length) await kv.put(DATA_KEY, JSON.stringify({ v: 2, marks: kept }));
    return { marks: kept, store };
  } catch {
    return { marks: [], store };
  }
}

export async function saveMarks(event: unknown, incoming: unknown[]): Promise<"kv" | "file" | "none" | "reject"> {
  const kv = await openKv(event);
  if (!kv) return "none";
  const known: MarkRecord[] = [];
  for (const src of incoming) {
    const v2 = sanitizeV2(src);
    if (v2) {
      known.push(v2);
      continue;
    }
    const v1 = sanitizeV1(src);
    if (v1) known.push(v1);
  }
  if (!known.length) return "reject";
  const { marks } = await loadMarks(event);
  const next = dedupeMarks(marks.concat(known));
  await kv.put(DATA_KEY, JSON.stringify({ v: 2, marks: next }));
  return process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages" ? "kv" : "file";
}

export function marksForCode(marks: MarkRecord[], code: string): MarkRecord[] {
  const shop = shopCode(code);
  if (!CODE.test(shop)) return [];
  const when = (row: MarkRecord) => Date.parse(row.v === 2 ? row.ts : row.saved) || 0;
  return marks
    .filter((row) => row.code === shop)
    .map((row) => (row.v === 1 ? { ...row, event: "line" as const } : row))
    .sort((a, b) => when(b) - when(a));
}
