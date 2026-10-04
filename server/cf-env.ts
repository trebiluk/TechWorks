/** Durable desk. KV when one is bound, otherwise the DeskBook object. Never the cache. */

export type Kv = {
  get: (k: string) => Promise<string | null>;
  put: (k: string, v: string) => Promise<void>;
};

type Loose = {
  runtime?: { cloudflare?: { env?: Record<string, unknown> } };
  req?: { runtime?: { cloudflare?: { env?: Record<string, unknown> } } };
  context?: Record<string, unknown>;
};

type BookNs = {
  idFromName: (name: string) => unknown;
  get: (id: unknown) => { fetch: (input: string, init?: { method?: string; body?: string }) => Promise<Response> };
};

export function envOf(event: unknown): Record<string, unknown> | null {
  const e = (event ?? {}) as Loose;
  const ctx = e.context ?? {};
  const cf = ctx.cloudflare as { env?: Record<string, unknown> } | undefined;
  const runtime = ctx.runtime as { cloudflare?: { env?: Record<string, unknown> } } | undefined;
  const globalEnv = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  return (
    e.runtime?.cloudflare?.env ??
    e.req?.runtime?.cloudflare?.env ??
    cf?.env ??
    runtime?.cloudflare?.env ??
    (ctx.env as Record<string, unknown> | undefined) ??
    globalEnv ??
    null
  );
}

function asKv(ns: unknown): Kv | null {
  if (!ns || typeof ns !== "object") return null;
  const row = ns as Kv;
  if (typeof row.get === "function" && typeof row.put === "function") return row;
  return null;
}

function namedKv(env: Record<string, unknown> | null): Kv | null {
  const bound = asKv(env?.TW_DESK);
  if (bound) return bound;
  if (!env) return null;
  for (const [key, value] of Object.entries(env)) {
    if (key === "ASSETS" || key === "TW_BOOK") continue;
    const kv = asKv(value);
    if (kv) return kv;
  }
  return null;
}

function asBook(ns: unknown): BookNs | null {
  if (!ns || typeof ns !== "object") return null;
  const row = ns as BookNs & { put?: unknown };
  if (typeof row.idFromName === "function" && typeof row.get === "function" && typeof row.put !== "function") return row;
  return null;
}

function bookKv(ns: BookNs): Kv {
  const stub = ns.get(ns.idFromName("techworks-book"));
  return {
    async get(k) {
      const res = await stub.fetch("https://book.internal/" + encodeURIComponent(k));
      if (!res.ok) return null;
      const text = await res.text();
      return text.length ? text : null;
    },
    async put(k, v) {
      const res = await stub.fetch("https://book.internal/" + encodeURIComponent(k), { method: "PUT", body: v });
      if (!res.ok) throw new Error("book");
    },
  };
}

export function deskKv(event: unknown): Kv | null {
  return namedKv(envOf(event));
}

export function knDb(event: unknown): { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: <T>() => Promise<T | null>; all: <T>() => Promise<{ results?: T[] }>; run: () => Promise<unknown> } } } | null {
  const env = envOf(event);
  const db = env?.KN_DB;
  if (db && typeof db === "object" && typeof (db as { prepare?: unknown }).prepare === "function") {
    return db as { prepare: (sql: string) => { bind: (...args: unknown[]) => { first: <T>() => Promise<T | null>; all: <T>() => Promise<{ results?: T[] }>; run: () => Promise<unknown> } } };
  }
  return null;
}

export function knSecret(event: unknown, name: string): string {
  const env = envOf(event);
  const fromEnv = env && typeof env[name] === "string" ? String(env[name]) : "";
  const fromProc = typeof process !== "undefined" && process.env ? String(process.env[name] ?? "") : "";
  return (fromEnv || fromProc).trim();
}

export async function openKv(event: unknown): Promise<Kv | null> {
  const env = envOf(event);
  const live = namedKv(env);
  if (live) return live;
  const book = asBook(env?.TW_BOOK);
  if (book) return bookKv(book);
  if (process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages") return null;
  try {
    const mod = await import("./local-kv");
    return mod.fileKv();
  } catch {
    return null;
  }
}
