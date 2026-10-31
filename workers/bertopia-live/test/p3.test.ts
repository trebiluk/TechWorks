// Bertopia live P3 (dark): sync for joining clients, D1 copy of changed chunks, refill of a fresh object.
//   npx tsx --test workers/bertopia-live/test/p3.test.ts
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { BertopiaWorld, SNAPSHOT_BATCH, SNAPSHOT_DELAY_MS, SNAPSHOT_RETRY_MAX_MS, SNAPSHOT_RETRY_MS } from "../src/index.ts";
import { FakeCtx, FakeD1, type FakeSocket, join, joinRequest } from "./fakes.ts";

const DAY = 24 * 60 * 60 * 1000;
const realNow = Date.now;
let clock = 0;

const send = (room: BertopiaWorld, ws: FakeSocket, msg: unknown) => room.webSocketMessage(ws, JSON.stringify(msg));
const edit = (room: BertopiaWorld, ws: FakeSocket, x: number, y: number, z: number, block: number, rev: number) => send(room, ws, { t: "edit", x, y, z, block, rev });
const last = (ws: FakeSocket) => ws.msgs().at(-1)!;
const tick = () => { clock += 1000; }; // a new rate-limit window
const ctxOf = new WeakMap<BertopiaWorld, FakeCtx>();
const make = (d1?: FakeD1) => {
  const ctx = new FakeCtx();
  const room = new BertopiaWorld(ctx as never, d1 ? { LIVE_DB: d1 } : {});
  ctxOf.set(room, ctx);
  return { ctx, room };
};
/** What the runtime does: the alarm slot is empty while alarm() runs, and alarm() sets the next one. */
const fire = async (room: BertopiaWorld) => {
  ctxOf.get(room)!.storage.alarm = null;
  await room.alarm();
};
const count = (ctx: FakeCtx, table: string) => Number(ctx.storage.rows(`SELECT COUNT(*) AS n FROM ${table}`)[0]!.n);

describe("bertopia live P3 (dark)", () => {
  beforeEach(() => {
    clock = Date.parse("2026-10-31T12:00:00Z");
    Date.now = () => clock;
  });
  afterEach(() => {
    Date.now = realNow;
  });

  describe("sync for joining clients", () => {
    it("{t:'sync'} lists the rev of every edited chunk; {t:'chunk'} gives the edited cells of one", async () => {
      const { room } = make();
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      await edit(room, a, 2, 1, 1, 6, 1);
      await edit(room, a, 30, 0, 0, 7, 0);
      const b = await join(room, "main", "Bo");
      await send(room, b, { t: "sync" });
      assert.deepEqual(last(b), { t: "revs", chunks: { "0,0,0": 2, "1,0,0": 1 }, more: false });
      tick();
      await send(room, b, { t: "chunk", chunk: "0,0,0" });
      const m = last(b);
      assert.equal(m.t, "cells");
      assert.equal(m.chunk, "0,0,0");
      assert.equal(m.rev, 2);
      assert.deepEqual((m.cells as number[][]).sort((p, q) => p[0]! - q[0]!), [[1, 1, 1, 5], [2, 1, 1, 6]]);
    });

    it("an untouched chunk is rev 0 with no cells; a bad chunk id is an error", async () => {
      const { room } = make();
      const a = await join(room, "main", "Ann");
      await send(room, a, { t: "chunk", chunk: "9,9,9" });
      assert.deepEqual(last(a), { t: "cells", chunk: "9,9,9", rev: 0, cells: [] });
      for (const chunk of ["x", "1,2", "1,2,3,4", "1;2;3", 5, "--1,0,0", "1,0,0 OR 1=1"]) {
        tick();
        await send(room, a, { t: "chunk", chunk });
        assert.deepEqual(last(a), { t: "error", code: "bad" }, JSON.stringify(chunk));
      }
    });

    it("a client that applies revs and cells can edit with the rev it was given", async () => {
      const { room } = make();
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      const b = await join(room, "main", "Bo");
      await send(room, b, { t: "chunk", chunk: "0,0,0" });
      const rev = last(b).rev as number;
      tick();
      await edit(room, b, 2, 2, 2, 8, rev);
      assert.deepEqual(last(b), { t: "ack", chunk: "0,0,0", rev: 2 });
    });
  });

  describe("dark without LIVE_DB", () => {
    it("no D1: no alarm, no meta rows, edits still work", async () => {
      const { ctx, room } = make();
      const a = await join(room, "main", "Ann");
      await edit(room, a, 0, 0, 0, 1, 0);
      assert.equal(ctx.storage.alarm, null);
      assert.equal(count(ctx, "meta"), 0);
      await fire(room);
      assert.equal(ctx.storage.alarm, null);
    });
  });

  describe("copy to D1", () => {
    it("the first edit sets an alarm 5 minutes out; the alarm copies the changed chunk and clears it", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      assert.equal(ctx.storage.alarm, null, "joining sets no alarm");
      await edit(room, a, 1, 1, 1, 5, 0);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_DELAY_MS);
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      const rows = d1.rows("main");
      assert.equal(rows.length, 1);
      assert.deepEqual({ world: rows[0]!.world, ck: rows[0]!.ck, rev: rows[0]!.rev, cells: JSON.parse(String(rows[0]!.cells)) }, { world: "main", ck: "0,0,0", rev: 1, cells: [[1, 1, 1, 5]] });
      assert.equal(count(ctx, "dirty"), 0);
      assert.equal(ctx.storage.alarm, null, "nothing left to do, no alarm");
    });

    it("only chunks that changed since the last copy are written", async () => {
      const d1 = new FakeD1();
      const { room } = make(d1);
      const a = await join(room, "main", "Ann");
      await edit(room, a, 0, 0, 0, 1, 0);
      await edit(room, a, 30, 0, 0, 1, 0);
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.deepEqual(d1.batches, [["0,0,0", "1,0,0"]]);
      tick();
      await edit(room, a, 31, 0, 0, 2, 1);
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.deepEqual(d1.batches.at(-1), ["1,0,0"]);
      assert.equal(Number(d1.rows("main").find((r) => r.ck === "1,0,0")!.rev), 2);
    });

    it("a batch is capped; the rest follows on the next alarm", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      for (let i = 0; i < SNAPSHOT_BATCH + 5; i++) {
        if (i % 15 === 0) tick();
        await edit(room, a, i * 24, 0, 0, 1, 0);
      }
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(d1.batches[0]!.length, SNAPSHOT_BATCH);
      assert.equal(count(ctx, "dirty"), 5);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_DELAY_MS);
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(d1.batches[1]!.length, 5);
      assert.equal(count(ctx, "dirty"), 0);
    });

    it("a D1 failure keeps the edits marked and retries 30 s, 60 s ... then clears", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      await edit(room, a, 0, 0, 0, 1, 0);
      d1.failBatches = 3;
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(count(ctx, "dirty"), 1);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_RETRY_MS);
      clock += SNAPSHOT_RETRY_MS;
      await fire(room);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_RETRY_MS * 2);
      clock += SNAPSHOT_RETRY_MS * 2;
      await fire(room);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_RETRY_MS * 4);
      clock += SNAPSHOT_RETRY_MS * 4;
      await fire(room);
      assert.equal(d1.rows("main").length, 1, "copied once D1 is back");
      assert.equal(count(ctx, "dirty"), 0);
      assert.equal(ctx.storage.alarm, null);
    });

    it("the retry wait stops growing at 15 minutes", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      await edit(room, a, 0, 0, 0, 1, 0);
      d1.failBatches = 99;
      for (let i = 0; i < 12; i++) { clock = Math.max(clock, ctx.storage.alarm ?? clock); await fire(room); }
      assert.equal((ctx.storage.alarm ?? 0) - clock, SNAPSHOT_RETRY_MAX_MS);
    });

    it("an edit that lands while D1 is answering stays marked and is copied next time", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      d1.onBatch = () => { void edit(room, a, 2, 2, 2, 6, 1); }; // second edit, same chunk, during the copy
      tick();
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(Number(d1.rows("main")[0]!.rev), 1, "D1 has the rev that was copied");
      assert.equal(count(ctx, "dirty"), 1, "rev 2 is not in D1 yet, so the chunk is still marked");
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_DELAY_MS);
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(Number(d1.rows("main")[0]!.rev), 2);
      assert.equal(count(ctx, "dirty"), 0);
    });

    it("D1 never goes back to an older rev", async () => {
      const d1 = new FakeD1();
      const { room } = make(d1);
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      d1.put("main", "0,0,0", 9, [[9, 9, 9, 9]]); // something newer already there
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(Number(d1.rows("main")[0]!.rev), 9);
      assert.deepEqual(JSON.parse(String(d1.rows("main")[0]!.cells)), [[9, 9, 9, 9]]);
    });

    it("worlds do not mix in D1", async () => {
      const d1 = new FakeD1();
      const one = make(d1);
      const two = make(d1);
      const a = await join(one.room, "main", "Ann");
      const b = await join(two.room, "game-1", "Bo");
      await edit(one.room, a, 0, 0, 0, 1, 0);
      await edit(two.room, b, 0, 0, 0, 2, 0);
      clock += SNAPSHOT_DELAY_MS;
      await fire(one.room);
      await fire(two.room);
      assert.deepEqual(d1.rows().map((r) => [r.world, JSON.parse(String(r.cells))]), [["game-1", [[0, 0, 0, 2]]], ["main", [[0, 0, 0, 1]]]]);
    });

    it("chat's daily alarm and the copy share one alarm slot, earliest first", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      await send(room, a, { t: "chat", text: "hi" });
      assert.equal(ctx.storage.alarm, clock + DAY);
      await edit(room, a, 0, 0, 0, 1, 0);
      assert.equal(ctx.storage.alarm, clock + SNAPSHOT_DELAY_MS, "the copy comes first");
      clock += SNAPSHOT_DELAY_MS;
      await fire(room);
      assert.equal(d1.rows("main").length, 1);
      assert.equal(ctx.storage.alarm, clock + DAY, "then the chat purge is next");
    });
  });

  describe("a fresh object refills from D1", () => {
    it("first join loads the stored chunks; sync and edits continue from their revs", async () => {
      const d1 = new FakeD1();
      d1.put("main", "0,0,0", 4, [[1, 1, 1, 5], [2, 2, 2, 6]]);
      d1.put("main", "2,0,0", 1, [[50, 1, 1, 9]]);
      d1.put("game-1", "7,7,7", 3, [[170, 170, 170, 1]]);
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      await send(room, a, { t: "sync" });
      assert.deepEqual(last(a), { t: "revs", chunks: { "0,0,0": 4, "2,0,0": 1 }, more: false });
      tick();
      await send(room, a, { t: "chunk", chunk: "0,0,0" });
      assert.equal(last(a).rev, 4);
      tick();
      await edit(room, a, 3, 3, 3, 7, 4);
      assert.deepEqual(last(a), { t: "ack", chunk: "0,0,0", rev: 5 });
      assert.equal(count(ctx, "dirty"), 1, "only the new edit needs copying back, not the loaded chunks");
    });

    it("it loads once, not on every join", async () => {
      const d1 = new FakeD1();
      d1.put("main", "0,0,0", 1, [[1, 1, 1, 5]]);
      const { room } = make(d1);
      await join(room, "main", "Ann");
      await join(room, "main", "Bo");
      await join(room, "main", "Cy");
      assert.equal(d1.reads, 1);
    });

    it("a second object instance on the same storage does not load again (it woke from hibernation)", async () => {
      const d1 = new FakeD1();
      d1.put("main", "0,0,0", 1, [[1, 1, 1, 5]]);
      const { ctx, room } = make(d1);
      await join(room, "main", "Ann");
      const woke = new BertopiaWorld(ctx as never, { LIVE_DB: d1 });
      await join(woke, "main", "Bo");
      assert.equal(d1.reads, 1);
    });

    it("if D1 cannot be read nobody joins (503), and the next try loads it", async () => {
      const d1 = new FakeD1();
      d1.put("main", "0,0,0", 1, [[1, 1, 1, 5]]);
      d1.failReads = true;
      const { room } = make(d1);
      const res = (await room.fetch(joinRequest("main", "Ann"))) as Response;
      assert.equal(res.status, 503);
      assert.deepEqual(await res.json(), { ok: false, error: "hydrate" });
      d1.failReads = false;
      const a = await join(room, "main", "Ann");
      await send(room, a, { t: "sync" });
      assert.deepEqual(last(a).chunks, { "0,0,0": 1 });
    });

    it("an empty D1 is fine: the world starts empty and the object marks itself loaded", async () => {
      const d1 = new FakeD1();
      const { ctx, room } = make(d1);
      const a = await join(room, "main", "Ann");
      assert.equal(a.closed, null);
      assert.equal(String(ctx.storage.rows("SELECT v FROM meta WHERE k = 'hydrated'")[0]!.v), "1");
    });
  });
  describe("the same scenarios as the workerd suite (so its expected values are checked here too)", () => {
    it("round trip: snapshot rows moved to a never-used world are restored exactly", async () => {
      const d1 = new FakeD1();
      const one = make(d1);
      const a = await join(one.room, "main", "Ann");
      await edit(one.room, a, 1, 1, 1, 5, 0);
      await edit(one.room, a, 2, 1, 1, 6, 1);
      await edit(one.room, a, 30, 0, 0, 7, 0);
      await fire(one.room);
      d1.db.prepare("UPDATE bt_live_chunks SET world = ? WHERE world = ?").run("game-2", "main");
      const two = make(d1);
      const b = await join(two.room, "game-2", "Bo");
      await send(two.room, b, { t: "sync" });
      assert.deepEqual(last(b), { t: "revs", chunks: { "0,0,0": 2, "1,0,0": 1 }, more: false });
      await send(two.room, b, { t: "chunk", chunk: "0,0,0" });
      const m = last(b);
      assert.equal(m.rev, 2);
      assert.deepEqual((m.cells as number[][]).sort((p, q) => p[0]! - q[0]!), [[1, 1, 1, 5], [2, 1, 1, 6]]);
      await send(two.room, b, { t: "chunk", chunk: "1,0,0" });
      assert.deepEqual(last(b), { t: "cells", chunk: "1,0,0", rev: 1, cells: [[30, 0, 0, 7]] });
      await edit(two.room, b, 3, 3, 3, 8, 2);
      assert.deepEqual(last(b), { t: "ack", chunk: "0,0,0", rev: 3 });
    });

    it("rev conflict: reject, refetch the chunk, edit again with the new rev; the other editor hears only the good edit", async () => {
      const { room } = make();
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      const b = await join(room, "main", "Bo");
      await send(room, b, { t: "sync" });
      assert.deepEqual(last(b).chunks, { "0,0,0": 1 });
      await edit(room, b, 2, 2, 2, 9, 0);
      assert.deepEqual(last(b), { t: "reject", chunk: "0,0,0", rev: 1 });
      await send(room, b, { t: "chunk", chunk: "0,0,0" });
      assert.deepEqual(last(b), { t: "cells", chunk: "0,0,0", rev: 1, cells: [[1, 1, 1, 5]] });
      await edit(room, b, 2, 2, 2, 9, 1);
      assert.deepEqual(last(b), { t: "ack", chunk: "0,0,0", rev: 2 });
      assert.deepEqual(a.msgs().filter((m) => m.t === "edit"), [{ t: "edit", x: 2, y: 2, z: 2, block: 9, rev: 2, chunk: "0,0,0", from: "Bo" }]);
    });

    it("no LIVE_DB: edit leaves no alarm and no meta; a chat alarm runs and the edit mark stays", async () => {
      const { ctx, room } = make();
      const a = await join(room, "main", "Ann");
      await edit(room, a, 1, 1, 1, 5, 0);
      assert.equal(ctx.storage.alarm, null);
      await send(room, a, { t: "chat", text: "hi" });
      assert.notEqual(ctx.storage.alarm, null);
      await fire(room);
      assert.equal(count(ctx, "chat"), 1);
      assert.equal(count(ctx, "dirty"), 1);
      assert.equal(count(ctx, "meta"), 0);
      assert.notEqual(ctx.storage.alarm, null);
    });
  });
});
