// Fakes for running the live Worker outside workerd (node:test). Real SQLite stands in for Durable Object storage.
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { BertopiaWorld } from "../src/index.ts";

export class FakeSocket {
  sent: string[] = [];
  closed: { code?: number; reason?: string } | null = null;
  attachment: unknown = null;
  send(data: string) { this.sent.push(data); }
  close(code?: number, reason?: string) { this.closed = { code, reason }; }
  serializeAttachment(v: unknown) { this.attachment = JSON.parse(JSON.stringify(v)); }
  deserializeAttachment() { return this.attachment; }
  /** Parsed messages this socket has been sent. */
  msgs(): Array<Record<string, unknown>> { return this.sent.map((m) => JSON.parse(m)); }
}

export class FakeStorage {
  db = new DatabaseSync(":memory:");
  alarm: number | null = null;
  sql = {
    exec: (query: string, ...bindings: unknown[]) => {
      const st = this.db.prepare(query);
      if (/^\s*(select|pragma)/i.test(query)) {
        const rows = st.all(...(bindings as never[])) as Array<Record<string, unknown>>;
        return { toArray: () => rows };
      }
      st.run(...(bindings as never[]));
      return { toArray: () => [] as Array<Record<string, unknown>> };
    },
  };
  transactionSync<T>(fn: () => T): T {
    this.db.exec("BEGIN");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }
  async setAlarm(when: number) { this.alarm = when; }
  async getAlarm() { return this.alarm; }
  rows(query: string, ...bindings: unknown[]) { return this.sql.exec(query, ...bindings).toArray(); }
}

export class FakeCtx {
  accepted: FakeSocket[] = [];
  autoResponse: unknown = null;
  storage = new FakeStorage();
  acceptWebSocket(ws: FakeSocket) { this.accepted.push(ws); }
  getWebSockets() { return this.accepted.filter((w) => !w.closed); }
  setWebSocketAutoResponse(pair: unknown) { this.autoResponse = pair; }
}

/** client socket -> the server end the Durable Object holds */
export const clientsFor = new Map<FakeSocket, FakeSocket>();

const g = globalThis as Record<string, unknown>;
g.WebSocketPair = class {
  0: FakeSocket;
  1: FakeSocket;
  constructor() {
    this[0] = new FakeSocket();
    this[1] = new FakeSocket();
    clientsFor.set(this[0], this[1]);
  }
};
g.WebSocketRequestResponsePair = class {
  request: string;
  response: string;
  constructor(request: string, response: string) {
    this.request = request;
    this.response = response;
  }
};
BertopiaWorld.respond = (client) => ({ status: 101, webSocket: client }) as unknown as Response;

export function joinRequest(world: string, alias: string, role = "kid", ref = "ref-" + alias) {
  return new Request(`https://x/live?world=${world}`, { headers: { upgrade: "websocket", "x-bt-ref": ref + "x".repeat(10), "x-bt-alias": alias, "x-bt-role": role } });
}

/** Join a world on a Durable Object; returns the server end of the socket. */
export async function join(dobj: BertopiaWorld, world: string, alias: string): Promise<FakeSocket> {
  const res = (await dobj.fetch(joinRequest(world, alias))) as unknown as { webSocket: FakeSocket };
  return clientsFor.get(res.webSocket)!;
}

type Stmt = { bind: (...v: unknown[]) => Stmt; run: () => Promise<unknown>; all: () => Promise<{ results: Array<Record<string, unknown>> }>; q: string; args: () => unknown[] };

/** D1 stand-in on real SQLite, created from the real migration file. */
export class FakeD1 {
  db = new DatabaseSync(":memory:");
  failBatches = 0; // the next N batches throw
  failReads = false;
  reads = 0;
  batches: string[][] = []; // the chunk keys written by each successful batch
  onBatch: (() => void) | null = null; // runs while a batch is "in flight"
  constructor() {
    this.db.exec(readFileSync(new URL("../migrations/0001_live_chunks.sql", import.meta.url), "utf8"));
  }
  prepare(q: string): Stmt {
    let held: unknown[] = [];
    const st: Stmt = {
      q,
      args: () => held,
      bind: (...v) => { held = v; return st; },
      run: async () => { this.db.prepare(q).run(...(held as never[])); },
      all: async () => {
        this.reads++;
        if (this.failReads) throw new Error("d1 down");
        return { results: this.db.prepare(q).all(...(held as never[])) as Array<Record<string, unknown>> };
      },
    };
    return st;
  }
  async batch(stmts: Stmt[]) {
    if (this.onBatch) { const f = this.onBatch; this.onBatch = null; f(); }
    await Promise.resolve();
    if (this.failBatches > 0) { this.failBatches--; throw new Error("d1 down"); }
    this.db.exec("BEGIN");
    try {
      for (const st of stmts) this.db.prepare(st.q).run(...(st.args() as never[]));
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
    this.batches.push(stmts.map((st) => String(st.args()[1])));
  }
  rows(world?: string) {
    const q = world ? "SELECT * FROM bt_live_chunks WHERE world = ? ORDER BY ck" : "SELECT * FROM bt_live_chunks ORDER BY world, ck";
    return (world ? this.db.prepare(q).all(world) : this.db.prepare(q).all()) as Array<Record<string, unknown>>;
  }
  put(world: string, ck: string, rev: number, cells: number[][]) {
    this.db.prepare("INSERT OR REPLACE INTO bt_live_chunks (world, ck, rev, cells, at) VALUES (?, ?, ?, ?, 1)").run(world, ck, rev, JSON.stringify(cells));
  }
}
