// Bertopia live P3 in workerd: the copy-to-D1 paths against a real Durable Object and a local D1
// (wrangler.test.toml binds LIVE_DB; test/apply-migrations.ts creates bt_live_chunks from migrations/0001).
//   cd workers/bertopia-live && npm install && npm test
// Not run when this file was written (the package registry was blocked); RepoCoder / ShipCheck runs it.
// The "edit lands while D1 is answering" and retry-timing cases are covered by test/p3.test.ts (node), where the
// clock and the D1 stand-in can be controlled; here the runtime's own alarm, storage and D1 are exercised.
import { SELF, env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";
import { type Conn, closeAll, edit, joinHeaders, open, until } from "./workers-helpers.ts";

const stubFor = (world: string) => env.BERTOPIA_WORLD.get(env.BERTOPIA_WORLD.idFromName(world));
const ready = (c: Conn) => until(() => c.inbox.length >= 1, "hello");
const d1Rows = async (world?: string) => {
  const q = world ? env.LIVE_DB.prepare("SELECT world, ck, rev, cells FROM bt_live_chunks WHERE world = ? ORDER BY ck").bind(world) : env.LIVE_DB.prepare("SELECT world, ck, rev, cells FROM bt_live_chunks ORDER BY world, ck");
  return (await q.all()).results as Array<{ world: string; ck: string; rev: number; cells: string }>;
};
const dirtyCount = (world: string) =>
  runInDurableObject(stubFor(world), (_i, state) => Number(state.storage.sql.exec("SELECT COUNT(*) AS n FROM dirty").toArray()[0]!.n));
const putD1 = (world: string, ck: string, rev: number, cells: number[][]) =>
  env.LIVE_DB.prepare("INSERT OR REPLACE INTO bt_live_chunks (world, ck, rev, cells, at) VALUES (?, ?, ?, ?, 1)").bind(world, ck, rev, JSON.stringify(cells)).run();
const recreateTable = async () => {
  for (const q of env.TEST_MIGRATIONS.flatMap((m) => m.queries)) await env.LIVE_DB.prepare(q).run();
};

afterEach(closeAll);

describe("bertopia live P3 (workerd + D1)", () => {
  it("an edit sets an alarm; running it copies the changed chunk to D1 and clears the mark", async () => {
    const a = await open("main", "Ann");
    await ready(a);
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    expect(await runInDurableObject(stubFor("main"), (_i, state) => state.storage.getAlarm())).not.toBeNull();
    expect(await runDurableObjectAlarm(stubFor("main"))).toBe(true);
    const rows = await d1Rows("main");
    expect(rows).toHaveLength(1);
    expect({ ck: rows[0]!.ck, rev: rows[0]!.rev, cells: JSON.parse(rows[0]!.cells) }).toEqual({ ck: "0,0,0", rev: 1, cells: [[1, 1, 1, 5]] });
    expect(await dirtyCount("main")).toBe(0);
    a.ws.close();
  });

  it("only chunks that changed since the last copy are written", async () => {
    const a = await open("main", "Ann");
    await ready(a);
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.filter((m) => m.t === "ack").length === 1, "first ack");
    await runDurableObjectAlarm(stubFor("main"));
    await putD1("main", "0,0,0", 1, [[0, 0, 0, 999]]); // a marker: if chunk 0,0,0 is written again it disappears
    edit(a, 30, 0, 0, 7, 0); // chunk 1,0,0
    await until(() => a.inbox.filter((m) => m.t === "ack").length === 2, "second ack");
    await runDurableObjectAlarm(stubFor("main"));
    const rows = await d1Rows("main");
    expect(rows.map((r) => r.ck)).toEqual(["0,0,0", "1,0,0"]);
    expect(JSON.parse(rows[0]!.cells)).toEqual([[0, 0, 0, 999]]);
    expect(JSON.parse(rows[1]!.cells)).toEqual([[30, 0, 0, 7]]);
    a.ws.close();
  });

  it("D1 never goes back to an older rev", async () => {
    const a = await open("main", "Ann");
    await ready(a);
    await putD1("main", "0,0,0", 9, [[9, 9, 9, 9]]); // newer copy appears after the object loaded
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    await runDurableObjectAlarm(stubFor("main"));
    const rows = await d1Rows("main");
    expect(rows[0]!.rev).toBe(9);
    expect(JSON.parse(rows[0]!.cells)).toEqual([[9, 9, 9, 9]]);
    a.ws.close();
  });

  it("worlds do not mix in D1", async () => {
    const a = await open("main", "Ann");
    const b = await open("game-1", "Bo");
    await ready(a);
    await ready(b);
    edit(a, 0, 0, 0, 1, 0);
    edit(b, 0, 0, 0, 2, 0);
    await until(() => a.inbox.some((m) => m.t === "ack") && b.inbox.some((m) => m.t === "ack"), "acks");
    await runDurableObjectAlarm(stubFor("main"));
    await runDurableObjectAlarm(stubFor("game-1"));
    expect((await d1Rows()).map((r) => [r.world, JSON.parse(r.cells)])).toEqual([["game-1", [[0, 0, 0, 2]]], ["main", [[0, 0, 0, 1]]]]);
    a.ws.close(); b.ws.close();
  });

  it("a D1 failure keeps the chunk marked and sets a retry alarm; when D1 is back the copy goes through", async () => {
    const a = await open("main", "Ann");
    await ready(a);
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    await env.LIVE_DB.prepare("DROP TABLE bt_live_chunks").run(); // D1 "goes down"
    expect(await runDurableObjectAlarm(stubFor("main"))).toBe(true);
    expect(await dirtyCount("main")).toBe(1);
    expect(await runInDurableObject(stubFor("main"), (_i, state) => state.storage.getAlarm())).not.toBeNull();
    await recreateTable();
    expect(await runDurableObjectAlarm(stubFor("main"))).toBe(true);
    expect((await d1Rows("main")).map((r) => r.rev)).toEqual([1]);
    expect(await dirtyCount("main")).toBe(0);
    a.ws.close();
  });

  it("a fresh object refills from D1: sync and chunk requests see it, and edits continue from its rev", async () => {
    await putD1("game-2", "0,0,0", 4, [[1, 1, 1, 5], [2, 2, 2, 6]]);
    await putD1("game-2", "2,0,0", 1, [[50, 1, 1, 9]]);
    await putD1("main", "7,7,7", 3, [[170, 170, 170, 1]]);
    const a = await open("game-2", "Ann");
    await ready(a);
    a.ws.send(JSON.stringify({ t: "sync" }));
    await until(() => a.inbox.some((m) => m.t === "revs"), "revs");
    expect(a.inbox.find((m) => m.t === "revs")).toEqual({ t: "revs", chunks: { "0,0,0": 4, "2,0,0": 1 }, more: false });
    a.ws.send(JSON.stringify({ t: "chunk", chunk: "0,0,0" }));
    await until(() => a.inbox.some((m) => m.t === "cells"), "cells");
    const cells = a.inbox.find((m) => m.t === "cells") as { rev: number; cells: number[][] };
    expect(cells.rev).toBe(4);
    expect(cells.cells.sort((p, q) => p[0]! - q[0]!)).toEqual([[1, 1, 1, 5], [2, 2, 2, 6]]);
    edit(a, 3, 3, 3, 7, 4);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    expect(a.inbox.find((m) => m.t === "ack")).toEqual({ t: "ack", chunk: "0,0,0", rev: 5 });
    expect(await dirtyCount("game-2")).toBe(1); // only the new edit, not the loaded chunks
    a.ws.close();
  });

  it("if D1 cannot be read nobody joins (503 hydrate); the next join works once D1 is back", async () => {
    await env.LIVE_DB.prepare("DROP TABLE bt_live_chunks").run();
    const res = await SELF.fetch("https://live/live?world=main", { headers: joinHeaders("Ann") });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: "hydrate" });
    await recreateTable();
    const a = await open("main", "Ann");
    await ready(a);
    expect(a.inbox[0]).toMatchObject({ t: "hello", world: "main", you: "Ann" });
    a.ws.close();
  });
});
