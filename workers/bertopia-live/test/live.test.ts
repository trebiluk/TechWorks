// Bertopia live P2 (dark): block edits with chunk revs, rate limits, chat hook. Runs outside workerd:
//   npx tsx --test workers/bertopia-live/test/live.test.ts
// Durable Object storage is real SQLite (node:sqlite); sockets and the object context are fakes (./fakes.ts).
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  BertopiaWorld,
  CHAT_KEEP_MS,
  CHAT_MAX_CHARS,
  CHUNK,
  EDITS_PER_SECOND,
  MAX_MESSAGE_BYTES,
  moderate,
} from "../src/index.ts";
import { FakeCtx, type FakeSocket, join } from "./fakes.ts";

const DAY = 24 * 60 * 60 * 1000;
const realNow = Date.now;
let clock = 0;
let ctx: FakeCtx;
let room: BertopiaWorld;

const send = (ws: FakeSocket, msg: unknown) => room.webSocketMessage(ws, typeof msg === "string" ? msg : JSON.stringify(msg));
const edit = (ws: FakeSocket, x: number, y: number, z: number, block: number, rev: number) => send(ws, { t: "edit", x, y, z, block, rev });
const kinds = (ws: FakeSocket) => ws.msgs().map((m) => m.t);
const last = (ws: FakeSocket) => ws.msgs().at(-1)!;
const count = (table: string) => Number(ctx.storage.rows(`SELECT COUNT(*) AS n FROM ${table}`)[0]!.n);

describe("bertopia live P2 (dark)", () => {
  beforeEach(() => {
    clock = Date.parse("2026-10-31T12:00:00Z");
    Date.now = () => clock;
    ctx = new FakeCtx();
    room = new BertopiaWorld(ctx as never, {});
  });
  afterEach(() => {
    Date.now = realNow;
  });

  describe("block edits", () => {
    it("applies an edit, bumps the chunk rev, acks the sender and tells the others", async () => {
      const a = await join(room, "main", "Ann");
      const b = await join(room, "main", "Bo");
      const c = await join(room, "main", "Cy");
      await edit(a, 25, 3, -1, 7, 0);
      const chunk = `${Math.floor(25 / CHUNK)},0,${Math.floor(-1 / CHUNK)}`;
      assert.equal(chunk, "1,0,-1");
      assert.deepEqual(last(a), { t: "ack", chunk, rev: 1 });
      for (const other of [b, c]) {
        assert.deepEqual(last(other), { t: "edit", x: 25, y: 3, z: -1, block: 7, rev: 1, chunk, from: "Ann" });
      }
      assert.deepEqual(kinds(a), ["hello", "ack"], "the sender gets an ack, not its own edit");
      assert.equal(Number(ctx.storage.rows("SELECT rev FROM chunks WHERE ck = ?", chunk)[0]!.rev), 1);
      assert.equal(Number(ctx.storage.rows("SELECT block FROM blocks WHERE x = 25 AND y = 3 AND z = -1")[0]!.block), 7);
    });

    it("a stale rev is rejected with the current rev, nothing is written or broadcast", async () => {
      const a = await join(room, "main", "Ann");
      const b = await join(room, "main", "Bo");
      await edit(a, 1, 1, 1, 5, 0);
      const before = b.sent.length;
      await edit(b, 2, 2, 2, 9, 0); // same chunk 0,0,0, but Bo still thinks rev 0
      assert.deepEqual(last(b), { t: "reject", chunk: "0,0,0", rev: 1 });
      assert.equal(b.sent.length, before + 1, "only the reject");
      assert.equal(count("blocks"), 1, "Bo's edit was not applied");
      assert.equal(Number(ctx.storage.rows("SELECT rev FROM chunks")[0]!.rev), 1);
      assert.deepEqual(kinds(a), ["hello", "ack"], "Ann heard nothing about the rejected edit");
      // with the rev from the reject it works
      await edit(b, 2, 2, 2, 9, 1);
      assert.deepEqual(last(b), { t: "ack", chunk: "0,0,0", rev: 2 });
      assert.deepEqual(last(a), { t: "edit", x: 2, y: 2, z: 2, block: 9, rev: 2, chunk: "0,0,0", from: "Bo" });
    });

    it("a rev from the future is rejected too (a new chunk is rev 0)", async () => {
      const a = await join(room, "main", "Ann");
      await edit(a, 0, 0, 0, 1, 5);
      assert.deepEqual(last(a), { t: "reject", chunk: "0,0,0", rev: 0 });
      assert.equal(count("blocks"), 0);
      assert.equal(count("chunks"), 0);
    });

    it("chunks have their own revs", async () => {
      const a = await join(room, "main", "Ann");
      await edit(a, 0, 0, 0, 1, 0);
      await edit(a, CHUNK, 0, 0, 1, 0);
      assert.deepEqual(a.msgs().filter((m) => m.t === "ack").map((m) => m.chunk), ["0,0,0", "1,0,0"]);
      await edit(a, 1, 0, 0, 2, 1);
      assert.equal(last(a).rev, 2);
      assert.equal(count("chunks"), 2);
    });

    it("the same cell edited again keeps one row with the newest block", async () => {
      const a = await join(room, "main", "Ann");
      await edit(a, 4, 4, 4, 1, 0);
      await edit(a, 4, 4, 4, 2, 1);
      assert.equal(count("blocks"), 1);
      assert.equal(Number(ctx.storage.rows("SELECT block FROM blocks")[0]!.block), 2);
    });

    it("bad fields are errors and write nothing", async () => {
      const a = await join(room, "main", "Ann");
      const bad = [
        { t: "edit", x: 1.5, y: 0, z: 0, block: 1, rev: 0 },
        { t: "edit", x: "1", y: 0, z: 0, block: 1, rev: 0 },
        { t: "edit", x: 0, y: 0, z: 0, block: -1, rev: 0 },
        { t: "edit", x: 0, y: 0, z: 0, block: 70000, rev: 0 },
        { t: "edit", x: 0, y: 99999, z: 0, block: 1, rev: 0 },
        { t: "edit", x: 0, y: 0, z: 0, block: 1, rev: -1 },
        { t: "edit", x: 0, y: 0, z: 0, block: 1 },
      ];
      for (const m of bad) {
        clock += 1000; // keep the rate limiter out of this test
        await send(a, m);
        assert.deepEqual(last(a), { t: "error", code: "bad" }, JSON.stringify(m));
      }
      assert.equal(count("blocks"), 0);
      assert.equal(count("chunks"), 0);
    });

    it("unknown types, junk and binary frames get an error and nothing else", async () => {
      const a = await join(room, "main", "Ann");
      await send(a, { t: "teleport" });
      assert.deepEqual(last(a), { t: "error", code: "type" });
      clock += 1000;
      await send(a, "not json");
      assert.deepEqual(last(a), { t: "error", code: "bad" });
      clock += 1000;
      await room.webSocketMessage(a, new ArrayBuffer(8));
      assert.deepEqual(last(a), { t: "error", code: "binary" });
    });

    it("a world is its own room: another Durable Object hears nothing", async () => {
      const other = new BertopiaWorld(new FakeCtx() as never, {});
      const a = await join(room, "main", "Ann");
      const z = await join(other, "game-1", "Zed");
      await edit(a, 0, 0, 0, 1, 0);
      assert.deepEqual(kinds(z), ["hello"]);
    });

    it("a closed socket is not messaged", async () => {
      const a = await join(room, "main", "Ann");
      const b = await join(room, "main", "Bo");
      room.webSocketClose(b, 1000);
      const n = b.sent.length;
      await edit(a, 0, 0, 0, 1, 0);
      assert.equal(b.sent.length, n);
    });
  });

  describe("limits", () => {
    const burst = async (ws: FakeSocket, n: number) => {
      for (let i = 0; i < n; i++) await send(ws, { t: "edit", x: 0, y: 0, z: 0, block: 1, rev: 99 }); // cheap stale edits
    };

    it("21st edit inside one second is dropped with one {t:'slow'}, and the socket stays open", async () => {
      const a = await join(room, "main", "Ann");
      await burst(a, EDITS_PER_SECOND);
      assert.equal(a.msgs().filter((m) => m.t === "slow").length, 0);
      await burst(a, 6);
      assert.equal(a.msgs().filter((m) => m.t === "slow").length, 1, "one slow per violating second, not one per dropped message");
      assert.equal(a.msgs().filter((m) => m.t === "reject").length, 20, "dropped edits are not processed");
      assert.equal(a.closed, null);
      clock += 1000;
      await burst(a, 1);
      assert.equal(last(a).t, "reject", "the next second starts clean");
    });

    it("3 strikes in 60 s close the socket with 4008 'slow down'", async () => {
      const a = await join(room, "main", "Ann");
      for (let i = 0; i < 3; i++) {
        assert.equal(a.closed, null, "still open before strike " + (i + 1));
        await burst(a, EDITS_PER_SECOND + 1);
        clock += 1000;
      }
      assert.deepEqual(a.closed, { code: 4008, reason: "slow down" });
    });

    it("strikes older than 60 s do not count", async () => {
      const a = await join(room, "main", "Ann");
      await burst(a, EDITS_PER_SECOND + 1);
      clock += 1000;
      await burst(a, EDITS_PER_SECOND + 1);
      clock += 61_000;
      await burst(a, EDITS_PER_SECOND + 1);
      assert.equal(a.closed, null);
      assert.equal(a.msgs().filter((m) => m.t === "slow").length, 3);
    });

    it("a slow socket does not slow its neighbours", async () => {
      const a = await join(room, "main", "Ann");
      const b = await join(room, "main", "Bo");
      await burst(a, 60);
      await send(b, { t: "edit", x: 0, y: 0, z: 0, block: 1, rev: 0 });
      assert.deepEqual(last(b), { t: "ack", chunk: "0,0,0", rev: 1 });
    });

    it("chat is limited to 2 lines a second, per socket", async () => {
      const a = await join(room, "main", "Ann");
      for (const text of ["one", "two", "three"]) await send(a, { t: "chat", text });
      assert.equal(count("chat"), 2);
      assert.equal(last(a).t, "slow");
      clock += 1000;
      await send(a, { t: "chat", text: "four" });
      assert.equal(count("chat"), 3);
    });

    it("a message over 2 KB is dropped with a strike; exactly 2 KB is fine", async () => {
      const a = await join(room, "main", "Ann");
      const body = { t: "edit", x: 0, y: 0, z: 0, block: 1, rev: 0, pad: "" };
      const empty = JSON.stringify(body).length;
      body.pad = "p".repeat(MAX_MESSAGE_BYTES - empty);
      assert.equal(new TextEncoder().encode(JSON.stringify(body)).byteLength, MAX_MESSAGE_BYTES);
      await send(a, JSON.stringify(body));
      assert.deepEqual(last(a), { t: "ack", chunk: "0,0,0", rev: 1 });
      body.pad += "p";
      await send(a, JSON.stringify(body));
      assert.deepEqual(last(a), { t: "slow" });
      assert.equal(count("blocks"), 1, "the oversize edit was not applied");
      // bytes, not characters: 1000 two-byte characters plus the frame is over the cap
      await send(a, JSON.stringify({ t: "chat", text: "é".repeat(1100) }));
      assert.equal(count("chat"), 0);
      assert.equal(last(a).t, "slow");
    });
  });

  describe("chat hook", () => {
    it("stores the line (alias, world, text, at, hidden=0) and sends it to everyone, sender included", async () => {
      const a = await join(room, "main", "Ann");
      const b = await join(room, "main", "Bo");
      await send(a, { t: "chat", text: "  hello  world  " });
      const rows = ctx.storage.rows("SELECT alias, world, text, at, hidden FROM chat");
      assert.equal(rows.length, 1);
      assert.deepEqual({ ...rows[0] }, { alias: "Ann", world: "main", text: "hello  world", at: clock, hidden: 0 });
      const expect = { t: "chat", alias: "Ann", text: "hello  world", at: clock };
      assert.deepEqual(last(a), expect);
      assert.deepEqual(last(b), expect);
    });

    it("aliases only: the table has no ref or other identity column", async () => {
      const cols = ctx.storage.rows("PRAGMA table_info(chat)").map((r) => r.name);
      assert.deepEqual(cols, ["id", "alias", "world", "text", "at", "hidden"]);
    });

    it("control characters become spaces; empty and over-long lines are errors and are not stored", async () => {
      const a = await join(room, "main", "Ann");
      await send(a, { t: "chat", text: "a\u0000b\nc" });
      assert.equal(String(ctx.storage.rows("SELECT text FROM chat")[0]!.text), "a b c");
      clock += 1000;
      await send(a, { t: "chat", text: "   " });
      assert.deepEqual(last(a), { t: "error", code: "chat" });
      clock += 1000;
      await send(a, { t: "chat", text: "x".repeat(CHAT_MAX_CHARS + 1) });
      assert.deepEqual(last(a), { t: "error", code: "chat" });
      clock += 1000;
      await send(a, { t: "chat", text: 42 });
      assert.deepEqual(last(a), { t: "error", code: "bad" });
      assert.equal(count("chat"), 1);
    });

    it("moderate() is a stub that allows everything for now", () => {
      assert.equal(moderate("anything at all"), "allow");
    });

    it("the first line sets a purge alarm 24 h out; later lines leave it alone", async () => {
      const a = await join(room, "main", "Ann");
      assert.equal(ctx.storage.alarm, null);
      await send(a, { t: "chat", text: "one" });
      assert.equal(ctx.storage.alarm, clock + DAY);
      const first = ctx.storage.alarm;
      clock += 5000;
      await send(a, { t: "chat", text: "two" });
      assert.equal(ctx.storage.alarm, first);
    });

    it("the alarm purges lines older than 30 days and keeps the rest", async () => {
      const a = await join(room, "main", "Ann");
      await send(a, { t: "chat", text: "old one" });
      clock += CHAT_KEEP_MS - DAY; // 29 days later: still kept
      await room.alarm();
      assert.equal(count("chat"), 1);
      assert.equal(ctx.storage.alarm, clock + DAY, "looks again tomorrow while rows remain");
      clock += 2 * DAY; // 31 days since the line
      await send(a, { t: "chat", text: "fresh" });
      await room.alarm();
      const left = ctx.storage.rows("SELECT text FROM chat").map((r) => r.text);
      assert.deepEqual(left, ["fresh"]);
    });

    it("when nothing is left the alarm stops re-arming", async () => {
      const a = await join(room, "main", "Ann");
      await send(a, { t: "chat", text: "only one" });
      clock += CHAT_KEEP_MS + DAY;
      ctx.storage.alarm = null; // the runtime clears the alarm when it fires
      await room.alarm();
      assert.equal(count("chat"), 0);
      assert.equal(ctx.storage.alarm, null);
    });
  });

  it("edits and chat do not need a socket to have been 'hello'd': a socket without identity is closed", async () => {
    const stray = new (await import("./fakes.ts")).FakeSocket();
    await room.webSocketMessage(stray, JSON.stringify({ t: "chat", text: "hi" }));
    assert.equal(stray.closed?.code, 1008);
    assert.equal(count("chat"), 0);
  });
});
