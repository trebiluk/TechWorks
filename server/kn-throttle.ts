import { knDb } from "./cf-env";
import { ensureKn } from "./kn-db";
import { hmacText, recoveryKey } from "./kn-keys";

const IP_FLOOR = 100;

type Bound = {
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type Sql = {
  prepare: (sql: string) => { bind: (...args: unknown[]) => Bound };
};

function ipOf(event: unknown): string {
  const req = (event as { req?: { headers?: { get?: (name: string) => string | null } } }).req;
  const ip = req?.headers?.get?.("cf-connecting-ip");
  return typeof ip === "string" ? ip : "";
}

async function row(db: Sql, key: string): Promise<{ n: number; exp: number } | null> {
  return db.prepare("SELECT n, exp FROM kn_throttle WHERE k = ?").bind(key).first<{ n: number; exp: number }>();
}

function over(hit: { n: number; exp: number } | null, max: number, now: number): boolean {
  return !!hit && hit.exp > now && hit.n >= max;
}

async function bump(db: Sql, key: string, now: number, windowMs: number): Promise<void> {
  const hit = await row(db, key);
  const fresh = !hit || hit.exp <= now;
  const n = fresh ? 1 : hit.n + 1;
  const exp = fresh ? now + windowMs : hit.exp;
  await db
    .prepare("INSERT INTO kn_throttle (k, n, exp) VALUES (?, ?, ?) ON CONFLICT(k) DO UPDATE SET n = excluded.n, exp = excluded.exp")
    .bind(key, n, exp)
    .run();
}

/** Counts a try against target+IP and an IP-only backstop of at least 100. The IP is stored only as an HMAC. */
export async function chargeThrottle(event: unknown, target: string, max: number, windowMs: number): Promise<"ok" | "slow"> {
  const key = await recoveryKey(event);
  const db = knDb(event) as Sql | null;
  if (!key || !db || !(await ensureKn(event))) throw new Error("throttle");
  const now = Date.now();
  const ipHash = await hmacText(key, ipOf(event));
  const pair = `th:${target}:${ipHash}`;
  const ipOnly = `th:ip:${ipHash}`;
  if (over(await row(db, pair), max, now) || over(await row(db, ipOnly), Math.max(IP_FLOOR, max), now)) return "slow";
  await bump(db, pair, now, windowMs);
  await bump(db, ipOnly, now, windowMs);
  return "ok";
}
