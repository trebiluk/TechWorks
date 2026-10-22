import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";
import { knDb, knSecret } from "./cf-env";
import { ensureKn } from "./kn-db";
import { hmacText, recoveryKey } from "./kn-keys";

const HOUR_MS = 60 * 60 * 1000;
const IP_MAX = 5;
const ALL_MAX = 50;

type Verdict = "ok" | "bad" | "used" | "slow";

type Bound = {
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type Sql = {
  prepare: (sql: string) => { bind: (...args: unknown[]) => Bound };
};

/** A blank or short value counts as unset. The real token stays out of the repo. */
export function enrollOpen(event: unknown): boolean {
  return knSecret(event, "KN_ENROLL_TOKEN").length >= 32;
}

/**
 * Equal length, then a timing-safe compare of the UTF-8 bytes.
 * Workers have `crypto.subtle.timingSafeEqual`. Node 22's test runner does not, so the node twin is the fallback.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.byteLength !== right.byteLength) return false;
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (x: BufferSource, y: BufferSource) => boolean;
  };
  if (typeof subtle.timingSafeEqual === "function") return subtle.timingSafeEqual(left, right);
  return nodeTimingSafeEqual(left, right);
}

function dbOf(event: unknown): Sql | null {
  return knDb(event) as Sql | null;
}

function connectingIp(event: unknown): string {
  const req = (event as { req?: { headers?: { get?: (name: string) => string | null } } }).req;
  const ip = req?.headers?.get?.("cf-connecting-ip");
  return typeof ip === "string" ? ip : "";
}

async function throttleRow(db: Sql, key: string): Promise<{ n: number; exp: number } | null> {
  return db.prepare("SELECT n, exp FROM kn_throttle WHERE k = ?").bind(key).first<{ n: number; exp: number }>();
}

function overLimit(row: { n: number; exp: number } | null, max: number, now: number): boolean {
  return !!row && row.exp > now && row.n >= max;
}

async function bump(db: Sql, key: string, now: number): Promise<void> {
  const row = await throttleRow(db, key);
  const fresh = !row || row.exp <= now;
  const n = fresh ? 1 : row.n + 1;
  const exp = fresh ? now + HOUR_MS : row.exp;
  await db
    .prepare("INSERT INTO kn_throttle (k, n, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n, exp = excluded.exp")
    .bind(key, n, exp)
    .run();
}

export async function checkEnrollToken(event: unknown, token: string): Promise<Verdict> {
  const key = await recoveryKey(event);
  const db = dbOf(event);
  if (!key || !db || !(await ensureKn(event))) throw new Error("enroll");
  const now = Date.now();
  const ipKey = `enroll:ip:${await hmacText(key, connectingIp(event))}`;
  const ipRow = await throttleRow(db, ipKey);
  const allRow = await throttleRow(db, "enroll:all");
  if (overLimit(ipRow, IP_MAX, now) || overLimit(allRow, ALL_MAX, now)) return "slow";
  const secret = knSecret(event, "KN_ENROLL_TOKEN");
  const a = await hmacText(key, token);
  const b = await hmacText(key, secret);
  if (!safeEqual(a, b)) {
    await bump(db, ipKey, now);
    await bump(db, "enroll:all", now);
    return "bad";
  }
  const used = await db.prepare("SELECT v FROM kn_meta WHERE k = 'enroll_used'").bind().first<{ v: string }>();
  if (used && safeEqual(used.v, a)) return "used";
  return "ok";
}

/** Writes the HMAC only. No route calls this in 1.94.22. */
export async function markEnrollUsed(event: unknown, token: string): Promise<void> {
  const key = await recoveryKey(event);
  const db = dbOf(event);
  if (!key || !db || !(await ensureKn(event))) throw new Error("enroll");
  const mac = await hmacText(key, token);
  await db.prepare("INSERT OR REPLACE INTO kn_meta (k,v) VALUES ('enroll_used', ?)").bind(mac).run();
}
