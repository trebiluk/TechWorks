/**
 * Bertopia live server, P1. Dark: nothing kid-facing calls this yet.
 *
 * One Durable Object per world slug (main, game-1, game-2). Sockets use the Hibernation API
 * (ctx.acceptWebSocket), so an idle world costs nothing. Ping/pong is answered by the runtime.
 * Identity arrives from the TechWorks route as three headers over a service binding:
 * x-bt-ref (the same alias_ref the world store uses), x-bt-alias and x-bt-role. This Worker has no
 * public route, so those headers cannot come from a browser. No IPs, no user agents.
 *
 * P2 (still dark): block edits with a per-chunk rev, per-socket rate limits, and a chat hook.
 * The Durable Object's SQLite holds chunk revs, the edit layer and 30 days of chat. Aliases only.
 *
 * P3 (still dark): the object is the source of truth for a shared world. Joining clients ask for the chunk
 * revs ({t:'sync'}) and for the edited cells of the chunks they draw ({t:'chunk'}). Changed chunks are copied to
 * D1 (env.LIVE_DB, when bound) a few minutes after an edit, and a fresh object refills itself from D1 on its
 * first join, so losing the object never loses a world. Without LIVE_DB all of that stays off.
 */

export const WORLDS = ["main", "game-1", "game-2"] as const;
export const MAX_SOCKETS = 30;
export const CHUNK = 24; // Bertopia chunkSize; chunk keys are "i,j,k" like the world store's
export const MAX_MESSAGE_BYTES = 2048;
export const EDITS_PER_SECOND = 20;
export const CHAT_PER_SECOND = 2;
export const STRIKES_TO_CLOSE = 3;
export const STRIKE_WINDOW_MS = 60_000;
export const CHAT_MAX_CHARS = 200;
export const CHAT_KEEP_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
export const SNAPSHOT_DELAY_MS = 5 * 60_000; // edits settle this long before a copy goes to D1
export const SNAPSHOT_BATCH = 50; // chunks per alarm run
export const SNAPSHOT_RETRY_MS = 30_000; // first retry; doubles up to 15 minutes
export const SNAPSHOT_RETRY_MAX_MS = 15 * 60_000;
export const REVS_LIMIT = 5000;

export type Role = "kid" | "teacher";
export type Attachment = { aliasRef: string; alias: string; role: Role; joinedAt: number; world: string };

type Row = Record<string, unknown>;

type Sock = {
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
  serializeAttachment: (value: unknown) => void;
  deserializeAttachment: () => unknown;
};

type Storage = {
  sql: { exec: (query: string, ...bindings: unknown[]) => { toArray: () => Row[] } };
  transactionSync: <T>(fn: () => T) => T;
  setAlarm: (when: number) => Promise<void>;
  getAlarm: () => Promise<number | null>;
};

type Ctx = {
  acceptWebSocket: (ws: Sock) => void;
  getWebSockets: () => Sock[];
  setWebSocketAutoResponse: (pair: unknown) => void;
  storage: Storage;
};

type Stub = { fetch: (request: Request) => Promise<Response> };
type Ns = { idFromName: (name: string) => unknown; get: (id: unknown) => Stub };
type D1Stmt = { bind: (...v: unknown[]) => D1Stmt; run: () => Promise<unknown>; all: () => Promise<{ results?: Row[] }> };
export type D1 = { prepare: (q: string) => D1Stmt; batch: (stmts: D1Stmt[]) => Promise<unknown> };
export type Env = { BERTOPIA_WORLD: Ns; LIVE_DB?: D1 };

declare const WebSocketPair: new () => { 0: Sock; 1: Sock };
declare const WebSocketRequestResponsePair: new (request: string, response: string) => unknown;

function json(status: number, error: string): Response {
  return new Response(JSON.stringify({ ok: false, error }), { status, headers: { "content-type": "application/json" } });
}

export function worldOf(request: Request): string | null {
  const world = new URL(request.url).searchParams.get("world") ?? "";
  return (WORLDS as readonly string[]).includes(world) ? world : null;
}

export function identityOf(request: Request): Omit<Attachment, "world"> | null {
  const aliasRef = (request.headers.get("x-bt-ref") ?? "").trim();
  const alias = (request.headers.get("x-bt-alias") ?? "").trim().slice(0, 16);
  if (!aliasRef || aliasRef.length > 200 || !alias) return null;
  const role: Role = request.headers.get("x-bt-role") === "teacher" ? "teacher" : "kid";
  return { aliasRef, alias, role, joinedAt: Date.now() };
}

function isUpgrade(request: Request): boolean {
  return (request.headers.get("upgrade") ?? "").toLowerCase() === "websocket";
}

export class BertopiaWorld {
  /** The 101 answer. A hook so tests can run outside workerd, where Response cannot carry a socket. */
  static respond: (client: Sock) => Response = (client) =>
    new Response(null, { status: 101, webSocket: client } as ResponseInit & { webSocket: Sock });

  private ctx: Ctx;
  // Rate-limit state lives in memory per socket. It resets if the object hibernates, which only happens when idle.
  private limits = new WeakMap<Sock, Limits>();

  private env: Partial<Env>;
  private world = "";
  private hydrating: Promise<boolean> | null = null;
  private snapFails = 0;

  constructor(ctx: Ctx, env: unknown) {
    this.ctx = ctx;
    this.env = (env ?? {}) as Partial<Env>;
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    const sql = this.ctx.storage.sql;
    sql.exec("CREATE TABLE IF NOT EXISTS chunks (ck TEXT PRIMARY KEY, rev INTEGER NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS blocks (x INTEGER NOT NULL, y INTEGER NOT NULL, z INTEGER NOT NULL, ck TEXT NOT NULL, block INTEGER NOT NULL, PRIMARY KEY (x, y, z))");
    sql.exec("CREATE TABLE IF NOT EXISTS dirty (ck TEXT PRIMARY KEY)");
    sql.exec("CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS chat (id INTEGER PRIMARY KEY AUTOINCREMENT, alias TEXT NOT NULL, world TEXT NOT NULL, text TEXT NOT NULL, at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0)");
  }

  async fetch(request: Request): Promise<Response> {
    const world = worldOf(request);
    if (!world) return json(400, "world");
    const who = identityOf(request);
    if (!who) return json(401, "signin");
    if (!isUpgrade(request)) return json(426, "upgrade");
    // With a D1 copy bound, a fresh object loads it before anyone joins. If that fails, nobody joins:
    // starting empty could later write an older world over the copy.
    if (!(await this.hydrate(world))) return json(503, "hydrate");

    const full = this.ctx.getWebSockets().length >= MAX_SOCKETS;
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    if (full) {
      server.close(4001, "full");
      return BertopiaWorld.respond(client);
    }
    const att: Attachment = { ...who, world };
    server.serializeAttachment(att);
    server.send(JSON.stringify({ t: "hello", world, tick: 0, you: who.alias }));
    return BertopiaWorld.respond(client);
  }

  /** Players are the open sockets, read from their attachments. */
  players(): Attachment[] {
    return this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment() as Attachment | null).filter((a): a is Attachment => !!a);
  }

  async webSocketMessage(ws: Sock, message: string | ArrayBuffer): Promise<void> {
    const att = ws.deserializeAttachment() as Attachment | null;
    if (!att) { ws.close(1008, "who"); return; }
    const now = Date.now();
    const bytes = typeof message === "string" ? new TextEncoder().encode(message).byteLength : message.byteLength;
    if (bytes > MAX_MESSAGE_BYTES) { this.strike(ws, now); return; }
    if (typeof message !== "string") { this.say(ws, { t: "error", code: "binary" }); return; }
    let m: Row;
    try {
      const parsed = JSON.parse(message);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || typeof parsed.t !== "string") throw new Error("shape");
      m = parsed as Row;
    } catch {
      if (this.take(ws, "ops", now)) this.say(ws, { t: "error", code: "bad" });
      return;
    }
    if (m.t === "chat") {
      if (this.take(ws, "chat", now)) await this.chat(ws, att, m, now);
      return;
    }
    if (!this.take(ws, "ops", now)) return;
    if (m.t === "edit") await this.edit(ws, att, m);
    else if (m.t === "sync") this.sendRevs(ws);
    else if (m.t === "chunk") this.sendCells(ws, m);
    else this.say(ws, { t: "error", code: "type" });
  }

  webSocketClose(ws: Sock, code: number): void {
    // 1005 and 1006 are not allowed on the wire; answer with a normal close. The player leaves with the socket.
    try { ws.close(code === 1005 || code === 1006 || !code ? 1000 : code, "bye"); } catch { /* already closed */ }
  }

  webSocketError(ws: Sock): void {
    try { ws.close(1011, "error"); } catch { /* already closed */ }
  }

  /** Purges chat older than 30 days and copies changed chunks to D1, then sets the next alarm. */
  async alarm(): Promise<void> {
    const now = Date.now();
    const sql = this.ctx.storage.sql;
    sql.exec("DELETE FROM chat WHERE at < ?", now - CHAT_KEEP_MS);
    let next: number | null = null;
    if (Number(sql.exec("SELECT COUNT(*) AS n FROM chat").toArray()[0]?.n ?? 0) > 0) next = now + DAY_MS;
    const snap = await this.snapshot(now);
    if (snap === "retry") {
      this.snapFails += 1;
      const wait = Math.min(SNAPSHOT_RETRY_MAX_MS, SNAPSHOT_RETRY_MS * 2 ** (this.snapFails - 1));
      next = next == null ? now + wait : Math.min(next, now + wait);
    } else {
      this.snapFails = 0;
      if (this.env.LIVE_DB && Number(sql.exec("SELECT COUNT(*) AS n FROM dirty").toArray()[0]?.n ?? 0) > 0) {
        next = next == null ? now + SNAPSHOT_DELAY_MS : Math.min(next, now + SNAPSHOT_DELAY_MS);
      }
    }
    if (next != null) await this.ctx.storage.setAlarm(next);
  }

  // ---- limits: fixed one-second windows per socket and bucket; one strike per violating window ----

  private take(ws: Sock, bucket: "ops" | "chat", now: number): boolean {
    const lim = this.limitsOf(ws);
    const cap = bucket === "chat" ? CHAT_PER_SECOND : EDITS_PER_SECOND;
    const w = lim[bucket];
    if (now - w.start >= 1000 || w.start > now) { w.start = now; w.n = 0; w.struck = false; }
    w.n += 1;
    if (w.n <= cap) return true;
    if (!w.struck) { w.struck = true; this.strike(ws, now); }
    return false;
  }

  private strike(ws: Sock, now: number): void {
    const lim = this.limitsOf(ws);
    lim.strikes = lim.strikes.filter((t) => now - t < STRIKE_WINDOW_MS);
    lim.strikes.push(now);
    this.say(ws, { t: "slow" });
    if (lim.strikes.length >= STRIKES_TO_CLOSE) {
      try { ws.close(4008, "slow down"); } catch { /* already closed */ }
    }
  }

  private limitsOf(ws: Sock): Limits {
    let lim = this.limits.get(ws);
    if (!lim) {
      lim = { ops: { start: 0, n: 0, struck: false }, chat: { start: 0, n: 0, struck: false }, strikes: [] };
      this.limits.set(ws, lim);
    }
    return lim;
  }

  // ---- block edits: the rev rule of the world store (bt-world.ts): the sender's rev must equal the stored rev, a write bumps it by one ----

  private async edit(ws: Sock, att: Attachment, m: Row): Promise<void> {
    const x = m.x, y = m.y, z = m.z, block = m.block, rev = m.rev;
    if (!isInt(x, -1_000_000, 1_000_000) || !isInt(y, -4096, 4096) || !isInt(z, -1_000_000, 1_000_000) || !isInt(block, 0, 65535) || !isInt(rev, 0, Number.MAX_SAFE_INTEGER)) {
      this.say(ws, { t: "error", code: "bad" });
      return;
    }
    const ck = `${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)},${Math.floor(z / CHUNK)}`;
    const sql = this.ctx.storage.sql;
    let stale: number | null = null;
    let next = 0;
    this.ctx.storage.transactionSync(() => {
      const row = sql.exec("SELECT rev FROM chunks WHERE ck = ?", ck).toArray()[0];
      const cur = row ? Number(row.rev) : 0;
      if (rev !== cur) { stale = cur; return; }
      next = cur + 1;
      sql.exec("INSERT INTO chunks (ck, rev) VALUES (?, ?) ON CONFLICT(ck) DO UPDATE SET rev = excluded.rev", ck, next);
      sql.exec("INSERT INTO blocks (x, y, z, ck, block) VALUES (?, ?, ?, ?, ?) ON CONFLICT(x, y, z) DO UPDATE SET block = excluded.block, ck = excluded.ck", x, y, z, ck, block);
      sql.exec("INSERT OR IGNORE INTO dirty (ck) VALUES (?)", ck);
    });
    if (stale !== null) {
      this.say(ws, { t: "reject", chunk: ck, rev: stale });
      return;
    }
    this.say(ws, { t: "ack", chunk: ck, rev: next });
    this.broadcast({ t: "edit", x, y, z, block, rev: next, chunk: ck, from: att.alias }, ws);
    if (this.env.LIVE_DB) await this.schedule(Date.now() + SNAPSHOT_DELAY_MS);
  }

  // ---- sync for joining clients: revs of every edited chunk, then the edited cells of the chunks they draw ----

  private sendRevs(ws: Sock): void {
    const rows = this.ctx.storage.sql.exec("SELECT ck, rev FROM chunks ORDER BY ck LIMIT ?", REVS_LIMIT).toArray();
    const chunks: Record<string, number> = {};
    for (const r of rows) chunks[String(r.ck)] = Number(r.rev);
    this.say(ws, { t: "revs", chunks, more: rows.length >= REVS_LIMIT });
  }

  private sendCells(ws: Sock, m: Row): void {
    const ck = m.chunk;
    if (typeof ck !== "string" || !/^-?\d{1,7},-?\d{1,7},-?\d{1,7}$/.test(ck)) { this.say(ws, { t: "error", code: "bad" }); return; }
    const sql = this.ctx.storage.sql;
    const rev = Number(sql.exec("SELECT rev FROM chunks WHERE ck = ?", ck).toArray()[0]?.rev ?? 0);
    const cells = sql.exec("SELECT x, y, z, block FROM blocks WHERE ck = ?", ck).toArray().map((r) => [Number(r.x), Number(r.y), Number(r.z), Number(r.block)]);
    this.say(ws, { t: "cells", chunk: ck, rev, cells });
  }

  // ---- one alarm slot: the earliest of the daily chat purge and the next copy to D1 ----

  private async schedule(when: number): Promise<void> {
    const cur = await this.ctx.storage.getAlarm();
    if (cur == null || when < cur) await this.ctx.storage.setAlarm(when);
  }

  private meta(k: string): string | null {
    const r = this.ctx.storage.sql.exec("SELECT v FROM meta WHERE k = ?", k).toArray()[0];
    return r ? String(r.v) : null;
  }

  private setMeta(k: string, v: string): void {
    this.ctx.storage.sql.exec("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v", k, v);
  }

  /** First join of a fresh object with a D1 bound: load the stored world once. Returns false if it could not. */
  private hydrate(world: string): Promise<boolean> {
    const db = this.env.LIVE_DB;
    if (!db) return Promise.resolve(true);
    if (!this.hydrating) {
      this.hydrating = (async () => {
        try {
          if (this.meta("hydrated") === "1") { this.world = this.meta("world") ?? world; return true; }
          const got = await db.prepare("SELECT ck, rev, cells FROM bt_live_chunks WHERE world = ?").bind(world).all();
          const rows = got.results ?? [];
          this.ctx.storage.transactionSync(() => {
            const sql = this.ctx.storage.sql;
            for (const r of rows) {
              const cells = JSON.parse(String(r.cells)) as number[][];
              sql.exec("INSERT INTO chunks (ck, rev) VALUES (?, ?) ON CONFLICT(ck) DO UPDATE SET rev = excluded.rev", String(r.ck), Number(r.rev));
              for (const c of cells) {
                sql.exec("INSERT INTO blocks (x, y, z, ck, block) VALUES (?, ?, ?, ?, ?) ON CONFLICT(x, y, z) DO UPDATE SET block = excluded.block, ck = excluded.ck", c[0], c[1], c[2], String(r.ck), c[3]);
              }
            }
            this.setMeta("world", world);
            this.setMeta("hydrated", "1");
          });
          this.world = world;
          return true;
        } catch {
          return false;
        }
      })();
    }
    return this.hydrating.then((ok) => { if (!ok) this.hydrating = null; return ok; });
  }

  /** Copies up to SNAPSHOT_BATCH changed chunks to D1. 'none' = nothing to do, 'retry' = D1 failed, edits stay marked. */
  private async snapshot(now: number): Promise<"none" | "ok" | "retry"> {
    const db = this.env.LIVE_DB;
    if (!db) return "none";
    const sql = this.ctx.storage.sql;
    const rows = sql.exec("SELECT d.ck AS ck, c.rev AS rev FROM dirty d JOIN chunks c ON c.ck = d.ck ORDER BY d.ck LIMIT ?", SNAPSHOT_BATCH).toArray();
    if (!rows.length) { sql.exec("DELETE FROM dirty"); return "none"; }
    const world = this.world || this.meta("world") || "";
    if (!world) return "retry";
    const stmts = rows.map((r) => {
      const cells = sql.exec("SELECT x, y, z, block FROM blocks WHERE ck = ?", String(r.ck)).toArray().map((c) => [Number(c.x), Number(c.y), Number(c.z), Number(c.block)]);
      return db
        .prepare("INSERT INTO bt_live_chunks (world, ck, rev, cells, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(world, ck) DO UPDATE SET rev = excluded.rev, cells = excluded.cells, at = excluded.at WHERE excluded.rev >= bt_live_chunks.rev")
        .bind(world, String(r.ck), Number(r.rev), JSON.stringify(cells), now);
    });
    try {
      await db.batch(stmts);
    } catch {
      return "retry";
    }
    // An edit may have landed while D1 was answering: only chunks still at the copied rev are marked clean.
    this.ctx.storage.transactionSync(() => {
      for (const r of rows) sql.exec("DELETE FROM dirty WHERE ck = ? AND (SELECT rev FROM chunks WHERE ck = ?) = ?", String(r.ck), String(r.ck), Number(r.rev));
    });
    return "ok";
  }

  // ---- chat hook: stored for 30 days, then sent to everyone in the world. No UI yet. ----

  private async chat(ws: Sock, att: Attachment, m: Row, now: number): Promise<void> {
    if (typeof m.text !== "string") { this.say(ws, { t: "error", code: "bad" }); return; }
    const text = m.text.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
    if (!text || text.length > CHAT_MAX_CHARS) { this.say(ws, { t: "error", code: "chat" }); return; }
    const verdict = moderate(text);
    if (verdict === "block") { this.say(ws, { t: "error", code: "blocked" }); return; }
    const hidden = verdict === "hide" ? 1 : 0;
    this.ctx.storage.sql.exec("INSERT INTO chat (alias, world, text, at, hidden) VALUES (?, ?, ?, ?, ?)", att.alias, att.world, text, now, hidden);
    await this.schedule(now + DAY_MS);
    const out = { t: "chat", alias: att.alias, text, at: now };
    if (hidden) this.say(ws, out); // a held line is only shown to its sender
    else this.broadcast(out, null);
  }

  private say(ws: Sock, msg: unknown): void {
    try { ws.send(JSON.stringify(msg)); } catch { /* socket is going away */ }
  }

  private broadcast(msg: unknown, except: Sock | null): void {
    const text = JSON.stringify(msg);
    for (const other of this.ctx.getWebSockets()) {
      if (other === except) continue;
      try { other.send(text); } catch { /* socket is going away */ }
    }
  }
}

type Window = { start: number; n: number; struck: boolean };
type Limits = { ops: Window; chat: Window; strikes: number[] };

function isInt(v: unknown, lo: number, hi: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;
}

/** Chat filter hook. P2 allows everything; the multi-language filter comes later. 'hide' keeps a line for staff only, 'block' drops it. */
export function moderate(_text: string): "allow" | "hide" | "block" {
  return "allow";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const world = worldOf(request);
    if (!world) return json(400, "world");
    if (!identityOf(request)) return json(401, "signin");
    if (!isUpgrade(request)) return json(426, "upgrade");
    const stub = env.BERTOPIA_WORLD.get(env.BERTOPIA_WORLD.idFromName(world));
    return stub.fetch(request);
  },
};
