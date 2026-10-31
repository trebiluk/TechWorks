// Missing-binding path in workerd: no LIVE_DB. The world must keep working and nothing may try to reach D1.
//   cd workers/bertopia-live && npm install && npm run test:workerd:nobinding
// Not run when this file was written (the package registry was blocked); RepoCoder / ShipCheck runs it.
import { env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { afterEach, describe, expect, it } from "vitest";
import { closeAll, edit, open, until } from "../workers-helpers.ts";

afterEach(closeAll);

const stub = () => env.BERTOPIA_WORLD.get(env.BERTOPIA_WORLD.idFromName("main"));
const rows = (table: string) => runInDurableObject(stub(), (_i, state) => Number(state.storage.sql.exec(`SELECT COUNT(*) AS n FROM ${table}`).toArray()[0]!.n));

describe("bertopia live without LIVE_DB (workerd)", () => {
  it("the test really has no LIVE_DB", () => {
    expect((env as unknown as Record<string, unknown>).LIVE_DB).toBeUndefined();
  });

  it("join, edit, sync and rev rules all work", async () => {
    const a = await open("main", "Ann");
    await until(() => a.inbox.length >= 1, "hello");
    expect(a.inbox[0]).toMatchObject({ t: "hello", world: "main", you: "Ann" });
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    a.ws.send(JSON.stringify({ t: "sync" }));
    await until(() => a.inbox.some((m) => m.t === "revs"), "revs");
    expect((a.inbox.find((m) => m.t === "revs") as { chunks: Record<string, number> }).chunks).toEqual({ "0,0,0": 1 });
    edit(a, 2, 2, 2, 9, 0); // stale
    await until(() => a.inbox.some((m) => m.t === "reject"), "reject");
  });

  it("fails safe: no copy alarm, no loaded/world marker, nothing to run", async () => {
    const a = await open("main", "Ann");
    await until(() => a.inbox.length >= 1, "hello");
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack"), "ack");
    expect(await runInDurableObject(stub(), (_i, state) => state.storage.getAlarm())).toBeNull();
    expect(await runDurableObjectAlarm(stub())).toBe(false);
    expect(await rows("meta")).toBe(0);
    expect(await rows("chunks")).toBe(1);
  });

  it("a chat alarm still runs cleanly without D1 and leaves the edit marks alone", async () => {
    const a = await open("main", "Ann");
    await until(() => a.inbox.length >= 1, "hello");
    edit(a, 1, 1, 1, 5, 0);
    a.ws.send(JSON.stringify({ t: "chat", text: "hi" }));
    await until(() => a.inbox.some((m) => m.t === "ack") && a.inbox.some((m) => m.t === "chat"), "ack and chat");
    expect(await runDurableObjectAlarm(stub())).toBe(true); // the daily chat purge
    expect(await rows("chat")).toBe(1); // fresh line kept
    expect(await rows("dirty")).toBe(1); // nothing copied, so the mark stays for when a D1 is bound
    expect(await runInDurableObject(stub(), (_i, state) => state.storage.getAlarm())).not.toBeNull(); // chat purge re-armed
    expect(await rows("meta")).toBe(0);
  });
});
