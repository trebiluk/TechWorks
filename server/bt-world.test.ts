import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { mockEvent, type H3Event } from "h3";
import { BT_SQL } from "./bt-world.ts";
import worldGet from "./routes/api/bertopia/world.get.ts";
import worldPut from "./routes/api/bertopia/world.put.ts";
import { resetKnKeys } from "./kn-keys.ts";
import { WHO_COOKIE, mintSession } from "./who-session.ts";

type World = {
  alias_ref: string;
  world: string;
  rev: number;
  schema: number;
  app_ver: string | null;
  head: Uint8Array;
  bytes: number;
  updated_at: number;
};
type Chunk = { alias_ref: string; world: string; ck: string; hash: string; rev: number; data: string };
type Rev = { alias_ref: string; world: string; rev: number; head: Uint8Array; at: number; why: string };

class Mem {
  worlds = new Map<string, World>();
  chunks = new Map<string, Chunk>();
  revs = new Map<string, Rev>();
  throttle = new Map<string, { n: number; exp: number }>();
  prepare(sql: string) {
    return {
      bind: (...args: unknown[]) => ({
        first: async <T>() => run(this, sql, args, "first") as T | null,
        all: async <T>() => ({ results: run(this, sql, args, "all") as T[] }),
        run: async () => {
          run(this, sql, args, "run");
          return { success: true };
        },
      }),
    };
  }
  async batch(stmts: { run: () => Promise<unknown> }[]) {
    const out = [];
    for (const stmt of stmts) out.push(await stmt.run());
    return out;
  }
  revsFor(world: string) {
    return [...this.revs.values()].filter((row) => row.world === world).map((row) => row.rev);
  }
  worldRefs(world: string) {
    return [...this.worlds.values()].filter((row) => row.world === world).map((row) => row.alias_ref);
  }
}

function wk(alias: string, world: string) {
  return `${alias}\0${world}`;
}
function ck(alias: string, world: string, key: string) {
  return `${alias}\0${world}\0${key}`;
}

function run(db: Mem, sql: string, args: unknown[], how: "first" | "all" | "run"): unknown {
  if (sql.startsWith("CREATE")) return how === "all" ? [] : null;
  if (sql === BT_SQL.listWorlds) {
    const rows = [...db.worlds.values()].filter((row) => row.alias_ref === args[0]);
    return how === "first" ? (rows[0] ?? null) : rows;
  }
  if (sql === BT_SQL.oneWorld) {
    return db.worlds.get(wk(String(args[0]), String(args[1]))) ?? null;
  }
  if (sql === BT_SQL.chunks) {
    const rows = [...db.chunks.values()].filter((row) => row.alias_ref === args[0] && row.world === args[1]);
    return how === "first" ? (rows[0] ?? null) : rows;
  }
  if (sql === BT_SQL.countWorlds) {
    const n = [...db.worlds.values()].filter((row) => row.alias_ref === args[0]).length;
    return { n };
  }
  if (sql === BT_SQL.revs) {
    const rows = [...db.revs.values()]
      .filter((row) => row.alias_ref === args[0] && row.world === args[1])
      .map((row) => ({ rev: row.rev }));
    return how === "first" ? (rows[0] ?? null) : rows;
  }
  if (sql === BT_SQL.throttle) return db.throttle.get(String(args[0])) ?? null;
  if (sql === BT_SQL.putThrottle) {
    db.throttle.set(String(args[0]), { n: Number(args[1]), exp: Number(args[2]) });
    return null;
  }
  if (sql === BT_SQL.putRev) {
    const row: Rev = {
      alias_ref: String(args[0]),
      world: String(args[1]),
      rev: Number(args[2]),
      head: args[3] as Uint8Array,
      at: Number(args[4]),
      why: String(args[5]),
    };
    db.revs.set(`${row.alias_ref}\0${row.world}\0${row.rev}`, row);
    return null;
  }
  if (sql === BT_SQL.delRev) {
    db.revs.delete(`${args[0]}\0${args[1]}\0${args[2]}`);
    return null;
  }
  if (sql === BT_SQL.putChunk) {
    const row: Chunk = {
      alias_ref: String(args[0]),
      world: String(args[1]),
      ck: String(args[2]),
      hash: String(args[3]),
      rev: Number(args[4]),
      data: String(args[5]),
    };
    db.chunks.set(ck(row.alias_ref, row.world, row.ck), row);
    return null;
  }
  if (sql === BT_SQL.delChunk) {
    db.chunks.delete(ck(String(args[0]), String(args[1]), String(args[2])));
    return null;
  }
  if (sql === BT_SQL.putWorld) {
    const row: World = {
      alias_ref: String(args[0]),
      world: String(args[1]),
      rev: Number(args[2]),
      schema: Number(args[3]),
      app_ver: args[4] == null ? null : String(args[4]),
      head: args[5] as Uint8Array,
      bytes: Number(args[6]),
      updated_at: Number(args[7]),
    };
    db.worlds.set(wk(row.alias_ref, row.world), row);
    return null;
  }
  throw new Error("sql " + sql);
}

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
    assert.equal(db.worlds.size, 0);
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
    assert.equal(db.worlds.size, 0);
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
});

afterEach(() => {
  Date.now = realNow;
});
