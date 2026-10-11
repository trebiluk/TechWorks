/** Hidden Bertopia world store. Nothing on the desk calls this yet. */

import { getHeader, setHeader, type H3Event } from "h3";
import { knDb } from "./cf-env";
import { ensureKn } from "./kn-db";
import { hmacText, rootBytes } from "./kn-keys";
import { whoCors } from "./who-cors";
import { readSession } from "./who-session";

const SLUG = /^[a-z0-9-]{1,40}$/;
const CK = /^[-0-9,]{1,40}$/;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_WORLDS = 5;
const MAX_CK = 64;
const MAX_REVS = 5;
const THROTTLE_MS = 20_000;
const MAX_DIRTY = 512;

export const BT_SQL = {
  listWorlds: "SELECT world, rev, bytes, updated_at FROM bt_worlds WHERE alias_ref = ?",
  oneWorld: "SELECT rev, schema, app_ver, head, bytes FROM bt_worlds WHERE alias_ref = ? AND world = ?",
  chunks: "SELECT ck, hash, rev, data FROM bt_chunks WHERE alias_ref = ? AND world = ?",
  countWorlds: "SELECT COUNT(*) AS n FROM bt_worlds WHERE alias_ref = ?",
  revs: "SELECT rev FROM bt_world_revs WHERE alias_ref = ? AND world = ?",
  throttle: "SELECT n, exp FROM kn_throttle WHERE k = ?",
  putThrottle:
    "INSERT INTO kn_throttle (k, n, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n, exp = excluded.exp",
  putRev:
    "INSERT INTO bt_world_revs (alias_ref, world, rev, head, at, why) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(alias_ref, world, rev) DO UPDATE SET head = excluded.head, at = excluded.at, why = excluded.why",
  delRev: "DELETE FROM bt_world_revs WHERE alias_ref = ? AND world = ? AND rev = ?",
  putChunk:
    "INSERT INTO bt_chunks (alias_ref, world, ck, hash, rev, data) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(alias_ref, world, ck) DO UPDATE SET hash = excluded.hash, rev = excluded.rev, data = excluded.data",
  delChunk: "DELETE FROM bt_chunks WHERE alias_ref = ? AND world = ? AND ck = ?",
  putWorld:
    "INSERT INTO bt_worlds (alias_ref, world, rev, schema, app_ver, head, bytes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(alias_ref, world) DO UPDATE SET rev = excluded.rev, schema = excluded.schema, app_ver = excluded.app_ver, head = excluded.head, bytes = excluded.bytes, updated_at = excluded.updated_at",
} as const;

type Bound = {
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results?: T[] }>;
  run: () => Promise<unknown>;
};

type Sql = {
  prepare: (sql: string) => { bind: (...args: unknown[]) => Bound };
  batch?: (rows: Bound[]) => Promise<unknown>;
};

export type Out = { status: number; body: Record<string, unknown> };

type Head = { format?: unknown; v?: unknown; schema?: unknown; app?: unknown };

type WorldRow = { rev: number; schema: number; app_ver: string | null; head: unknown; bytes: number };

type ChunkRow = { ck: string; hash: string; rev: number; data: unknown };

const aliasKeys = new Map<string, CryptoKey>();

export function bertopiaCors(event: H3Event) {
  whoCors(event);
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk, x-tw-pin, if-match");
}

function dbOf(event: unknown): Sql | null {
  return knDb(event) as Sql | null;
}

function fail(status: number, body: Record<string, unknown>): Out {
  return { status, body };
}

async function aliasKey(event: unknown): Promise<CryptoKey | null> {
  const root = rootBytes(event);
  if (!root) return null;
  let id = "";
  for (let i = 0; i < root.length; i++) id += root[i]!.toString(16).padStart(2, "0");
  const hit = aliasKeys.get(id);
  if (hit) return hit;
  const raw = root.buffer.slice(root.byteOffset, root.byteOffset + root.byteLength) as ArrayBuffer;
  const base = await crypto.subtle.importKey("raw", raw, "HKDF", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: new TextEncoder().encode("bt-alias-ref") },
    base,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"],
  );
  aliasKeys.set(id, key);
  return key;
}

async function gate(event: unknown, token: string | undefined): Promise<{ ref: string } | Out> {
  if (!rootBytes(event)) return fail(503, { ok: false, error: "server-key" });
  const db = dbOf(event);
  if (!db) return fail(503, { ok: false, error: "no-db" });
  if (!(await ensureKn(event))) return fail(503, { ok: false, error: "no-db" });
  const session = await readSession(event, token);
  if (!session) return fail(401, { ok: false, error: "signin" });
  const key = await aliasKey(event);
  if (!key) return fail(503, { ok: false, error: "server-key" });
  return { ref: await hmacText(key, session.code) };
}

function isOut(row: { ref: string } | Out): row is Out {
  return "status" in row;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  let hex = "";
  for (const b of new Uint8Array(buf)) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function asBytes(v: unknown): Uint8Array {
  if (v instanceof Uint8Array) return v;
  if (v instanceof ArrayBuffer) return new Uint8Array(v);
  if (ArrayBuffer.isView(v)) return new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
  return new Uint8Array();
}

function asText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array || v instanceof ArrayBuffer || ArrayBuffer.isView(v)) return new TextDecoder().decode(asBytes(v));
  return "";
}

function asBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function gzipJson(value: unknown): Promise<Uint8Array> {
  const raw = new TextEncoder().encode(JSON.stringify(value));
  const stream = new Blob([asBuffer(raw)]).stream().pipeThrough(new CompressionStream("gzip"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzipJson(bytes: Uint8Array): Promise<unknown> {
  const stream = new Blob([asBuffer(bytes)]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text());
}

function parseRev(raw: string | undefined): number | null {
  if (raw == null) return null;
  const text = raw.trim().replace(/^W\//i, "").replace(/^"(.*)"$/, "$1");
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return Number.isSafeInteger(n) ? n : null;
}

function oneCk(text: string): string[] | null {
  if (!CK.test(text)) return null;
  const tokens = text.split(",");
  if (tokens.length > 3 && tokens.length % 3 === 0 && tokens.every((part) => /^-?\d+$/.test(part))) {
    const keys: string[] = [];
    for (let i = 0; i < tokens.length; i += 3) keys.push(tokens.slice(i, i + 3).join(","));
    return keys;
  }
  return [text];
}

export function parseCkList(raw: string | string[]): string[] | null {
  const bits = Array.isArray(raw) ? raw.map((part) => String(part)) : [String(raw)];
  const out: string[] = [];
  for (const bit of bits) {
    if (!bit) return null;
    if (bit.includes(";")) {
      for (const part of bit.split(";")) {
        if (!CK.test(part)) return null;
        out.push(part);
      }
      continue;
    }
    const keys = oneCk(bit);
    if (!keys) return null;
    out.push(...keys);
  }
  if (!out.length || out.length > MAX_CK || out.some((key) => !CK.test(key))) return null;
  return out;
}

function checkHead(head: unknown): { head: Head; schema: number; app: string | null } | string {
  if (!head || typeof head !== "object" || Array.isArray(head)) return "format";
  const row = head as Head;
  if (row.format !== "kuliblocks") return "format";
  if (row.v !== 1 && row.v !== 2) return "format";
  if (typeof row.schema !== "number" || !Number.isInteger(row.schema) || row.schema < 2 || row.schema > 7) return "format";
  const app = typeof row.app === "string" ? row.app.slice(0, 40) : null;
  return { head: row, schema: row.schema, app };
}

function checkChunks(raw: unknown): Record<string, string> | string {
  if (raw == null) return {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "ck";
  const out: Record<string, string> = {};
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length > MAX_DIRTY) return "ck";
  for (const [ck, data] of entries) {
    if (!CK.test(ck) || typeof data !== "string") return "ck";
    out[ck] = data;
  }
  return out;
}

function checkDrop(raw: unknown): string[] | string {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_DIRTY) return "ck";
  const out: string[] = [];
  for (const ck of raw) {
    if (typeof ck !== "string" || !CK.test(ck)) return "ck";
    out.push(ck);
  }
  return out;
}

async function applyBatch(db: Sql, stmts: Bound[]) {
  if (typeof db.batch === "function") {
    await db.batch.call(db, stmts);
    return;
  }
  for (const row of stmts) await row.run();
}

export async function readWorld(event: unknown, q: { world?: unknown; ck?: unknown }, token: string | undefined): Promise<Out> {
  const who = await gate(event, token);
  if (isOut(who)) return who;
  const db = dbOf(event)!;
  const world = q.world == null ? "" : String(q.world);
  if (!world) {
    const listed = await db.prepare(BT_SQL.listWorlds).bind(who.ref).all<{ world: string; rev: number; bytes: number; updated_at: number }>();
    const worlds = (listed.results ?? [])
      .slice()
      .sort((a, b) => b.updated_at - a.updated_at)
      .map((row) => ({ world: row.world, rev: row.rev, bytes: row.bytes, updatedAt: row.updated_at }));
    return { status: 200, body: { ok: true, worlds } };
  }
  if (!SLUG.test(world)) return fail(400, { ok: false, error: "slug" });
  const doc = await db.prepare(BT_SQL.oneWorld).bind(who.ref, world).first<WorldRow>();
  if (!doc) return fail(404, { ok: false, error: "missing" });
  const stored = await db.prepare(BT_SQL.chunks).bind(who.ref, world).all<ChunkRow>();
  const rows = stored.results ?? [];
  if (q.ck != null) {
    const keys = parseCkList(Array.isArray(q.ck) ? q.ck.map((part) => String(part)) : String(q.ck));
    if (!keys) return fail(400, { ok: false, error: "ck" });
    const want = new Set(keys);
    const chunks: Record<string, string> = {};
    for (const row of rows) if (want.has(row.ck)) chunks[row.ck] = asText(row.data);
    return { status: 200, body: { ok: true, chunks } };
  }
  let head: unknown;
  try {
    head = await gunzipJson(asBytes(doc.head));
  } catch {
    return fail(500, { ok: false, error: "head" });
  }
  const chunks: Record<string, { hash: string; rev: number }> = {};
  for (const row of rows) chunks[row.ck] = { hash: row.hash, rev: row.rev };
  return { status: 200, body: { ok: true, rev: doc.rev, schema: doc.schema, head, chunks } };
}

export async function writeWorld(event: unknown, worldRaw: unknown, token: string | undefined, ifMatch: string | undefined, body: unknown): Promise<Out> {
  const who = await gate(event, token);
  if (isOut(who)) return who;
  const world = worldRaw == null ? "" : String(worldRaw);
  if (!SLUG.test(world)) return fail(400, { ok: false, error: "slug" });
  const match = parseRev(ifMatch);
  if (match == null) return fail(400, { ok: false, error: "match" });
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail(400, { ok: false, error: "format" });
  const bag = body as { head?: unknown; chunks?: unknown; drop?: unknown };
  const head = checkHead(bag.head);
  if (typeof head === "string") return fail(400, { ok: false, error: head });
  const chunks = checkChunks(bag.chunks);
  if (typeof chunks === "string") return fail(400, { ok: false, error: chunks });
  const drop = checkDrop(bag.drop);
  if (typeof drop === "string") return fail(400, { ok: false, error: drop });
  const packed = JSON.stringify(bag.head);
  if (packed.length > MAX_BYTES * 4) return fail(413, { ok: false, error: "size" });
  const db = dbOf(event)!;
  const current = await db.prepare(BT_SQL.oneWorld).bind(who.ref, world).first<WorldRow>();
  const curRev = current?.rev ?? 0;
  if (match !== curRev) return fail(409, { ok: false, rev: curRev });
  if (!current) {
    const count = await db.prepare(BT_SQL.countWorlds).bind(who.ref).first<{ n: number }>();
    if ((count?.n ?? 0) >= MAX_WORLDS) return fail(409, { ok: false, error: "worlds" });
  }
  const gzip = await gzipJson(bag.head);
  const have = await db.prepare(BT_SQL.chunks).bind(who.ref, world).all<ChunkRow>();
  const sizes = new Map<string, number>();
  for (const row of have.results ?? []) sizes.set(row.ck, new TextEncoder().encode(asText(row.data)).byteLength);
  for (const ck of drop) sizes.delete(ck);
  for (const [ck, data] of Object.entries(chunks)) sizes.set(ck, new TextEncoder().encode(data).byteLength);
  let bytes = gzip.byteLength;
  for (const n of sizes.values()) bytes += n;
  if (bytes > MAX_BYTES) return fail(413, { ok: false, error: "size" });
  const now = Date.now();
  const throttleKey = `bt:${who.ref}:${world}`;
  const hit = await db.prepare(BT_SQL.throttle).bind(throttleKey).first<{ n: number; exp: number }>();
  if (hit && hit.exp > now) return fail(429, { ok: false, error: "throttle" });
  const nextRev = curRev + 1;
  const hashes: Record<string, string> = {};
  for (const [ck, data] of Object.entries(chunks)) hashes[ck] = await sha256Hex(data);
  const stmts: Bound[] = [];
  if (current) {
    stmts.push(db.prepare(BT_SQL.putRev).bind(who.ref, world, current.rev, asBytes(current.head), now, "save"));
    const prev = await db.prepare(BT_SQL.revs).bind(who.ref, world).all<{ rev: number }>();
    const nums = (prev.results ?? []).map((row) => row.rev);
    if (!nums.includes(current.rev)) nums.push(current.rev);
    const keep = new Set([...nums].sort((a, b) => b - a).slice(0, MAX_REVS));
    for (const rev of nums) if (!keep.has(rev)) stmts.push(db.prepare(BT_SQL.delRev).bind(who.ref, world, rev));
  }
  for (const [ck, data] of Object.entries(chunks)) {
    stmts.push(db.prepare(BT_SQL.putChunk).bind(who.ref, world, ck, hashes[ck], nextRev, data));
  }
  for (const ck of drop) if (!(ck in chunks)) stmts.push(db.prepare(BT_SQL.delChunk).bind(who.ref, world, ck));
  stmts.push(db.prepare(BT_SQL.putWorld).bind(who.ref, world, nextRev, head.schema, head.app, gzip, bytes, now));
  stmts.push(db.prepare(BT_SQL.putThrottle).bind(throttleKey, 1, now + THROTTLE_MS));
  await applyBatch(db, stmts);
  return { status: 200, body: { ok: true, rev: nextRev, hashes } };
}

export function ifMatchOf(event: H3Event): string | undefined {
  return getHeader(event, "if-match") ?? undefined;
}
