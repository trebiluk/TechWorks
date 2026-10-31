import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { mockEvent, type H3Event } from "h3";
import { DatabaseSync } from "node:sqlite";
import { restoreRev } from "./bt-world.ts";
import worldGet from "./routes/api/bertopia/world.get.ts";
import worldPut from "./routes/api/bertopia/world.put.ts";
import { resetKnKeys } from "./kn-keys.ts";
import { resetKnReady } from "./kn-db.ts";
import { WHO_COOKIE, mintSession } from "./who-session.ts";

type Stmt = { sql: string; args: unknown[]; first: <T>() => Promise<T | null>; all: <T>() => Promise<{ results: T[] }>; run: () => Promise<unknown> };

/** Real SQLite behind the D1 surface bt-world uses. db.batch is one transaction, like D1. */
class Mem {
  sql = new DatabaseSync(":memory:");
  /** Test hooks: drop db.batch, or throw inside a batch right after a statement matching this pattern ran. */
  noBatch = false;
  failAfter: RegExp | null = null;
  batches = 0;
  constructor() {
    for (const ddl of SCHEMA) this.sql.exec(ddl);
  }
  private exec(sql: string, args: unknown[], how: "first" | "all" | "run") {
    const st = this.sql.prepare(sql);
    if (how === "first") return (st.get(...(args as never[])) as unknown) ?? null;
    if (how === "all") return st.all(...(args as never[]));
    const r = st.run(...(args as never[]));
    return { success: true, meta: { changes: Number(r.changes) } };
  }
  prepare(sql: string) {
    return {
      bind: (...args: unknown[]): Stmt => ({
        sql,
        args,
        first: async <T>() => this.exec(sql, args, "first") as T | null,
        all: async <T>() => ({ results: this.exec(sql, args, "all") as T[] }),
        run: async () => this.exec(sql, args, "run"),
      }),
    };
  }
  get batch() {
    if (this.noBatch) return undefined;
    return async (stmts: Stmt[]) => {
      this.batches++;
      this.sql.exec("BEGIN");
      try {
        const out: unknown[] = [];
        for (const st of stmts) {
          out.push(this.exec(st.sql, st.args, "run"));
          if (this.failAfter?.test(st.sql)) throw new Error("forced");
        }
        this.sql.exec("COMMIT");
        return out;
      } catch (err) {
        this.sql.exec("ROLLBACK");
        throw err;
      }
    };
  }
  count(table: string) {
    return Number((this.sql.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n);
  }
  revsFor(world: string) {
    return (this.sql.prepare("SELECT rev FROM bt_world_revs WHERE world = ?").all(world) as { rev: number }[]).map((row) => row.rev);
  }
  worldRefs(world: string) {
    return (this.sql.prepare("SELECT alias_ref FROM bt_worlds WHERE world = ?").all(world) as { alias_ref: string }[]).map((row) => row.alias_ref);
  }
  world(ref: string, world: string) {
    return this.sql.prepare("SELECT rev, head, bytes FROM bt_worlds WHERE alias_ref = ? AND world = ?").get(ref, world) as
      | { rev: number; head: Uint8Array; bytes: number }
      | undefined;
  }
}

const SCHEMA = [
  "CREATE TABLE kn_throttle (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL)",
  "CREATE TABLE bt_worlds (alias_ref TEXT, world TEXT, rev INTEGER NOT NULL, schema INTEGER NOT NULL, app_ver TEXT, head BLOB NOT NULL, bytes INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(alias_ref, world))",
  "CREATE TABLE bt_chunks (alias_ref TEXT, world TEXT, ck TEXT, hash TEXT NOT NULL, rev INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(alias_ref, world, ck))",
  "CREATE TABLE bt_world_revs (alias_ref TEXT, world TEXT, rev INTEGER, head BLOB, at INTEGER, why TEXT, PRIMARY KEY(alias_ref, world, rev))",
];

const KEY = Buffer.alloc(32, 7).toString("base64");
let clock = Date.parse("2026-10-11T14:00:00.000Z");
const realNow = Date.now;

function head(extra: Record<string, unknown> = {}) {
  return { format: "kuliblocks", v: 2, schema: 6, spawn: [8, 8, 1], player: { bag: 1 }, ...extra };
}

function attach(event: H3Event, db: Mem | null, key = KEY) {
  const env: Record<string, unknown> = {};
  if (db) env.KN_DB = db;
  if (key) env.KN_AUTH_KEY = key;
  (event as unknown as { context: { env: Record<string, unknown> } }).context = { env };
  return event;
}

async function token(code: string) {
  return mintSession({}, { alias: "Kid", code });
}

async function put(db: Mem, cookie: string | undefined, world: string, rev: number, body: unknown, key = KEY) {
  const headers: Record<string, string> = { "content-type": "application/json", "if-match": String(rev) };
  if (cookie) headers.cookie = `${WHO_COOKIE}=${cookie}`;
  const event = attach(
    mockEvent(`http://127.0.0.1/api/bertopia/world?world=${encodeURIComponent(world)}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    }),
    db,
    key,
  );
  const res = await worldPut(event);
  return { status: event.res.status || 200, body: res as Record<string, unknown> };
}

async function get(db: Mem, cookie: string | undefined, query = "", key = KEY) {
  const headers: Record<string, string> = {};
  if (cookie) headers.cookie = `${WHO_COOKIE}=${cookie}`;
  const event = attach(mockEvent(`http://127.0.0.1/api/bertopia/world${query}`, { headers }), db, key);
  const res = await worldGet(event);
  return { status: event.res.status || 200, body: res as Record<string, unknown> };
}

describe("bertopia world store", () => {
  beforeEach(() => {
    clock = Date.parse("2026-10-11T14:00:00.000Z");
    Date.now = () => clock;
    resetKnReady();
    process.env.KN_AUTH_KEY = KEY;
    resetKnKeys();
  });

  it("no cookie 401", async () => {
    const db = new Mem();
    const res = await get(db, undefined);
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { ok: false, error: "signin" });
  });

  it("save then load equal", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const doc = head();
    const saved = await put(db, kid, "survival", 0, { head: doc, chunks: { "0,0,0": "aaa", "1,0,0": "bbb" } });
    assert.equal(saved.status, 200);
    assert.equal(saved.body.rev, 1);
    assert.equal(typeof (saved.body.hashes as Record<string, string>)["0,0,0"], "string");
    const loaded = await get(db, kid, "?world=survival");
    assert.equal(loaded.status, 200);
    assert.equal(loaded.body.rev, 1);
    assert.equal(loaded.body.schema, 6);
    assert.deepEqual(loaded.body.head, doc);
    const meta = loaded.body.chunks as Record<string, { hash: string; rev: number }>;
    assert.equal(meta["0,0,0"].hash, (saved.body.hashes as Record<string, string>)["0,0,0"]);
    assert.equal(meta["1,0,0"].rev, 1);
    const parts = await get(db, kid, `?world=survival&ck=${encodeURIComponent("0,0,0;1,0,0")}`);
    assert.deepEqual(parts.body.chunks, { "0,0,0": "aaa", "1,0,0": "bbb" });
    assert.notEqual(db.worldRefs("survival")[0], "AB23C");
    const list = await get(db, kid);
    assert.equal((list.body.worlds as { world: string }[])[0].world, "survival");
  });

  it("second PUT with one dirty chunk changes only that chunk", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa", "1,0,0": "bbb" } });
    clock += 21_000;
    const again = await put(db, kid, "survival", 1, { head: head({ player: { bag: 2 } }), chunks: { "0,0,0": "ccc" } });
    assert.equal(again.status, 200);
    assert.equal(again.body.rev, 2);
    assert.deepEqual(Object.keys(again.body.hashes as object), ["0,0,0"]);
    const parts = await get(db, kid, "?world=survival&ck=0,0,0&ck=1,0,0");
    assert.deepEqual(parts.body.chunks, { "0,0,0": "ccc", "1,0,0": "bbb" });
  });

  it("drop removes chunk", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa", "1,0,0": "bbb" } });
    clock += 21_000;
    const dropped = await put(db, kid, "survival", 1, { head: head(), drop: ["1,0,0"] });
    assert.equal(dropped.status, 200);
    const parts = await get(db, kid, "?world=survival&ck=1,0,0");
    assert.deepEqual(parts.body.chunks, {});
    const left = await get(db, kid, "?world=survival");
    assert.equal("1,0,0" in (left.body.chunks as object), false);
    assert.equal("0,0,0" in (left.body.chunks as object), true);
  });

  it("other kid cannot read or write", async () => {
    const db = new Mem();
    const a = await token("AB23C");
    const b = await token("ZZ99Q");
    await put(db, a, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa" } });
    const peek = await get(db, b, "?world=survival");
    assert.equal(peek.status, 404);
    const clash = await put(db, b, "survival", 1, { head: head(), chunks: { "0,0,0": "zzz" } });
    assert.equal(clash.status, 409);
    assert.equal(clash.body.rev, 0);
    const still = await get(db, a, "?world=survival&ck=0,0,0");
    assert.deepEqual(still.body.chunks, { "0,0,0": "aaa" });
    clock += 21_000;
    const own = await put(db, b, "survival", 0, { head: head({ player: { bag: 9 } }), chunks: { "0,0,0": "bbb" } });
    assert.equal(own.status, 200);
    const aStill = await get(db, a, "?world=survival&ck=0,0,0");
    const bOwn = await get(db, b, "?world=survival&ck=0,0,0");
    assert.deepEqual(aStill.body.chunks, { "0,0,0": "aaa" });
    assert.deepEqual(bOwn.body.chunks, { "0,0,0": "bbb" });
  });

  it("stale If-Match 409", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa" } });
    const stale = await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "nope" } });
    assert.equal(stale.status, 409);
    assert.equal(stale.body.rev, 1);
    const still = await get(db, kid, "?world=survival&ck=0,0,0");
    assert.deepEqual(still.body.chunks, { "0,0,0": "aaa" });
  });

  it("over 2 MB 413", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const big = await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "A".repeat(2 * 1024 * 1024 + 8) } });
    assert.equal(big.status, 413);
    assert.equal(big.body.error, "size");
    assert.equal(db.count("bt_worlds"), 0);
  });

  it("6th world rejected", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    for (let i = 1; i <= 5; i++) {
      const res = await put(db, kid, `w${i}`, 0, { head: head() });
      assert.equal(res.status, 200);
    }
    const sixth = await put(db, kid, "w6", 0, { head: head() });
    assert.equal(sixth.status, 409);
    assert.equal(sixth.body.error, "worlds");
    const list = await get(db, kid);
    assert.equal((list.body.worlds as unknown[]).length, 5);
  });

  it("2nd write in 20 s 429", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const first = await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa" } });
    assert.equal(first.status, 200);
    const second = await put(db, kid, "survival", 1, { head: head(), chunks: { "0,0,0": "bbb" } });
    assert.equal(second.status, 429);
    assert.equal(second.body.error, "throttle");
    const still = await get(db, kid, "?world=survival&ck=0,0,0");
    assert.deepEqual(still.body.chunks, { "0,0,0": "aaa" });
  });

  it("revs capped at 5", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    let rev = 0;
    for (let i = 0; i < 7; i++) {
      if (i) clock += 21_000;
      const res = await put(db, kid, "revworld", rev, { head: head({ n: i }) });
      assert.equal(res.status, 200, JSON.stringify(res.body));
      rev = Number(res.body.rev);
    }
    assert.equal(rev, 7);
    assert.deepEqual(db.revsFor("revworld").sort((a, b) => a - b), [2, 3, 4, 5, 6]);
  });

  it("bad format 400", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const res = await put(db, kid, "survival", 0, { head: { format: "blocks", v: 2, schema: 6 } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "format");
    assert.equal(db.count("bt_worlds"), 0);
  });

  it("missing key or db is 503", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    delete process.env.KN_AUTH_KEY;
    const noKey = await put(db, kid, "survival", 0, { head: head() }, "");
    assert.equal(noKey.status, 503);
    assert.equal(noKey.body.error, "server-key");
    process.env.KN_AUTH_KEY = KEY;
    const noDb = await get(null as unknown as Mem, kid, "", KEY);
    assert.equal(noDb.status, 503);
    assert.equal(noDb.body.error, "no-db");
  });

  it("two parallel PUTs with the same If-Match: one 200, one 409, loser writes nothing", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const [a, b] = await Promise.all([
      put(db, kid, "survival", 0, { head: head({ n: "a" }), chunks: { "0,0,0": "from-a" } }),
      put(db, kid, "survival", 0, { head: head({ n: "b" }), chunks: { "0,0,0": "from-b", "9,9,9": "only-b" } }),
    ]);
    const codes = [a.status, b.status].sort();
    assert.deepEqual(codes, [200, 409]);
    const win = a.status === 200 ? a : b;
    const lose = a.status === 200 ? b : a;
    assert.equal(win.body.rev, 1);
    assert.equal(lose.body.rev, 1);
    assert.equal(db.count("bt_worlds"), 1);
    const kid2 = await get(db, kid, "?world=survival&ck=0,0,0;9,9,9");
    const want = a.status === 200 ? { "0,0,0": "from-a" } : { "0,0,0": "from-b", "9,9,9": "only-b" };
    assert.deepEqual(kid2.body.chunks, want);
    assert.equal(db.count("kn_throttle"), 1, "claim row is released");
  });

  it("two parallel PUTs on an existing world: rev +1 once", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "base" } });
    clock += 21_000;
    const [a, b] = await Promise.all([
      put(db, kid, "survival", 1, { head: head({ n: "a" }), chunks: { "0,0,0": "A" }, drop: [] }),
      put(db, kid, "survival", 1, { head: head({ n: "b" }), chunks: { "0,0,0": "B" } }),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    const loaded = await get(db, kid, "?world=survival");
    assert.equal(loaded.body.rev, 2);
    assert.deepEqual(db.revsFor("survival"), [1]);
    const parts = await get(db, kid, "?world=survival&ck=0,0,0");
    assert.deepEqual(parts.body.chunks, { "0,0,0": a.status === 200 ? "A" : "B" });
  });

  it("two saves in a row advance rev by exactly 1 each", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    const one = await put(db, kid, "survival", 0, { head: head() });
    clock += 21_000;
    const two = await put(db, kid, "survival", Number(one.body.rev), { head: head({ n: 2 }) });
    assert.equal(one.body.rev, 1);
    assert.equal(two.body.rev, 2);
  });

  it("no db.batch: PUT is 503 and nothing is written", async () => {
    const db = new Mem();
    db.noBatch = true;
    const kid = await token("AB23C");
    const res = await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "aaa" } });
    assert.equal(res.status, 503);
    assert.equal(db.count("bt_worlds"), 0);
    assert.equal(db.count("bt_chunks"), 0);
    assert.equal(db.count("bt_world_revs"), 0);
    assert.equal(db.count("kn_throttle"), 0);
  });

  it("a throw inside the save batch rolls everything back", async () => {
    const db = new Mem();
    const kid = await token("AB23C");
    await put(db, kid, "survival", 0, { head: head(), chunks: { "0,0,0": "base" } });
    clock += 21_000;
    const before = db.world(db.worldRefs("survival")[0]!, "survival")!;
    db.failAfter = /INSERT INTO bt_chunks/;
    await assert.rejects(put(db, kid, "survival", 1, { head: head({ n: 2 }), chunks: { "0,0,0": "new" } }));
    db.failAfter = null;
    const after = db.world(db.worldRefs("survival")[0]!, "survival")!;
    assert.equal(after.rev, before.rev);
    assert.deepEqual(after.head, before.head);
    const parts = await get(db, kid, "?world=survival&ck=0,0,0");
    assert.deepEqual(parts.body.chunks, { "0,0,0": "base" });
    assert.deepEqual(db.revsFor("survival"), []);
  });

  describe("staff head-only restore", () => {
    async function seeded() {
      const db = new Mem();
      const kid = await token("AB23C");
      await put(db, kid, "survival", 0, { head: head({ player: { bag: 1 } }), chunks: { "0,0,0": "c1" } });
      clock += 21_000;
      await put(db, kid, "survival", 1, { head: head({ player: { bag: 2 } }), chunks: { "0,0,0": "c2" } });
      const ref = db.worldRefs("survival")[0]!;
      return { db, kid, ref };
    }
    const call = (db: Mem, ref: string, target: number, ifMatch: string) =>
      restoreRev(attach(mockEvent("http://127.0.0.1/api/staff/bertopia/restore", { method: "POST" }), db), ref, "survival", target, ifMatch);

    it("restores rev 1 as the new head, keeps the old head, leaves chunks alone", async () => {
      const { db, kid, ref } = await seeded();
      const rev1 = db.sql.prepare("SELECT head FROM bt_world_revs WHERE rev = 1").get() as { head: Uint8Array };
      const out = await call(db, ref, 1, "2");
      assert.equal(out.status, 200);
      assert.equal(out.body.ok, true);
      assert.equal(out.body.mode, "head-only");
      assert.equal(out.body.rev, 3);
      assert.equal(out.body.kept, 2);
      assert.deepEqual(db.world(ref, "survival")!.head, rev1.head);
      assert.deepEqual(db.revsFor("survival").sort(), [1, 2]);
      const parts = await get(db, kid, "?world=survival&ck=0,0,0");
      assert.deepEqual(parts.body.chunks, { "0,0,0": "c2" });
      assert.equal(db.count("kn_throttle"), 1, "only the save throttle row stays");
    });

    it("stale If-Match is 409 with the current rev", async () => {
      const { db, ref } = await seeded();
      const out = await call(db, ref, 1, "1");
      assert.equal(out.status, 409);
      assert.equal(out.body.rev, 2);
      assert.equal(db.world(ref, "survival")!.rev, 2);
    });

    it("forced throw after putRev leaves the head unchanged", async () => {
      const { db, ref } = await seeded();
      const before = db.world(ref, "survival")!;
      const revsBefore = db.revsFor("survival").sort();
      db.failAfter = /INSERT INTO bt_world_revs/;
      await assert.rejects(call(db, ref, 1, "2"));
      db.failAfter = null;
      const after = db.world(ref, "survival")!;
      assert.equal(after.rev, before.rev);
      assert.deepEqual(after.head, before.head);
      assert.deepEqual(db.revsFor("survival").sort(), revsBefore);
      assert.equal(db.count("kn_throttle"), 1);
    });

    it("no db.batch: restore is 503 and writes nothing", async () => {
      const { db, ref } = await seeded();
      const before = db.world(ref, "survival")!;
      db.noBatch = true;
      const out = await call(db, ref, 1, "2");
      assert.equal(out.status, 503);
      assert.equal(db.world(ref, "survival")!.rev, before.rev);
      assert.deepEqual(db.revsFor("survival"), [1]);
    });
  });
});

afterEach(() => {
  Date.now = realNow;
});
