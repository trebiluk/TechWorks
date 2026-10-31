// Bertopia live P2 in workerd: the real Durable Object, real SQLite storage, real hibernating sockets.
//   cd workers/bertopia-live && npm install && npm test
// Not run when this file was written (the package registry was blocked); ShipCheck runs it.
import { SELF, env, runDurableObjectAlarm, runInDurableObject } from "cloudflare:test";
import { describe, expect, it } from "vitest";

type Msg = Record<string, unknown>;
type Conn = { ws: WebSocket; inbox: Msg[]; closed: { code: number; reason: string } | null };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function until(fn: () => boolean, label: string) {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await sleep(10);
  }
  throw new Error("timed out waiting for " + label);
}

async function open(world: string, alias: string): Promise<Conn> {
  const res = await SELF.fetch(`https://live/live?world=${world}`, {
    headers: { Upgrade: "websocket", "x-bt-ref": `ref-${alias}-aaaaaaaaaa`, "x-bt-alias": alias, "x-bt-role": "kid" },
  });
  const ws = (res as unknown as { webSocket: WebSocket }).webSocket;
  ws.accept();
  const conn: Conn = { ws, inbox: [], closed: null };
  ws.addEventListener("message", (e: MessageEvent) => conn.inbox.push(JSON.parse(String(e.data))));
  ws.addEventListener("close", (e: CloseEvent) => { conn.closed = { code: e.code, reason: e.reason }; });
  return conn;
}

const edit = (c: Conn, x: number, y: number, z: number, block: number, rev: number) => c.ws.send(JSON.stringify({ t: "edit", x, y, z, block, rev }));
const stubFor = (world: string) => env.BERTOPIA_WORLD.get(env.BERTOPIA_WORLD.idFromName(world));

describe("bertopia live P2 (workerd)", () => {
  it("rev reject: a stale edit gets {t:'reject', chunk, rev} and nothing is broadcast", async () => {
    const a = await open("main", "Ann");
    const b = await open("main", "Bo");
    await until(() => a.inbox.length >= 1 && b.inbox.length >= 1, "hello");
    edit(a, 1, 1, 1, 5, 0);
    await until(() => a.inbox.some((m) => m.t === "ack") && b.inbox.some((m) => m.t === "edit"), "ack and broadcast");
    expect(a.inbox.find((m) => m.t === "ack")).toEqual({ t: "ack", chunk: "0,0,0", rev: 1 });
    expect(b.inbox.find((m) => m.t === "edit")).toMatchObject({ x: 1, y: 1, z: 1, block: 5, rev: 1, chunk: "0,0,0", from: "Ann" });
    edit(b, 2, 2, 2, 9, 0); // stale
    await until(() => b.inbox.some((m) => m.t === "reject"), "reject");
    expect(b.inbox.find((m) => m.t === "reject")).toEqual({ t: "reject", chunk: "0,0,0", rev: 1 });
    expect(a.inbox.filter((m) => m.t === "edit")).toHaveLength(0);
    a.ws.close(); b.ws.close();
  });

  it("rate limit: three bursts of 25 edits in 60 s close the socket with 4008 'slow down'", async () => {
    const a = await open("main", "Ann");
    await until(() => a.inbox.length >= 1, "hello");
    for (let burst = 0; burst < 3; burst++) {
      for (let i = 0; i < 25; i++) edit(a, 0, 0, 0, 1, 99);
      await sleep(1100);
    }
    await until(() => a.closed !== null, "close");
    expect(a.closed).toEqual({ code: 4008, reason: "slow down" });
    expect(a.inbox.some((m) => m.t === "slow")).toBe(true);
  });

  it("the 31st socket in a world is closed with 4001 'full'", async () => {
    const conns: Conn[] = [];
    for (let i = 0; i < 30; i++) conns.push(await open("game-1", "K" + i));
    await until(() => conns.every((c) => c.inbox.length >= 1), "30 hellos");
    const late = await open("game-1", "Late");
    await until(() => late.closed !== null, "4001");
    expect(late.closed).toEqual({ code: 4001, reason: "full" });
    expect(late.inbox).toHaveLength(0);
    expect(conns.every((c) => c.closed === null)).toBe(true);
    for (const c of conns) c.ws.close();
  });

  it("chat: the row is stored, broadcast, and the 30-day purge alarm removes old rows", async () => {
    const a = await open("main", "Ann");
    const b = await open("main", "Bo");
    await until(() => a.inbox.length >= 1 && b.inbox.length >= 1, "hello");
    a.ws.send(JSON.stringify({ t: "chat", text: "hello world" }));
    await until(() => b.inbox.some((m) => m.t === "chat"), "chat broadcast");
    expect(b.inbox.find((m) => m.t === "chat")).toMatchObject({ alias: "Ann", text: "hello world" });

    const stub = stubFor("main");
    await runInDurableObject(stub, (_instance, state) => {
      const rows = state.storage.sql.exec("SELECT alias, world, text, hidden FROM chat").toArray();
      expect(rows).toEqual([{ alias: "Ann", world: "main", text: "hello world", hidden: 0 }]);
      state.storage.sql.exec("INSERT INTO chat (alias, world, text, at, hidden) VALUES (?, ?, ?, ?, 0)", "Old", "main", "ancient", Date.now() - 31 * 24 * 60 * 60 * 1000);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    await runInDurableObject(stub, (_instance, state) => {
      const left = state.storage.sql.exec("SELECT text FROM chat").toArray().map((r) => r.text);
      expect(left).toEqual(["hello world"]);
    });
    a.ws.close(); b.ws.close();
  });
});
