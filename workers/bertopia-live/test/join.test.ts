// Bertopia live P1 (dark). Runs outside workerd with fakes for the socket pair and the Durable Object context:
//   npx tsx --test workers/bertopia-live/test/join.test.ts
// Chain under test: route live.get.ts -> BT_LIVE service binding -> Worker fetch -> BertopiaWorld DO -> socket.
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { mockEvent, type H3Event } from "h3";
import worker, { BertopiaWorld, MAX_SOCKETS } from "../src/index.ts";
import { FakeCtx, FakeSocket, clientsFor } from "./fakes.ts";
import liveGet from "../../../server/routes/api/bertopia/live.get.ts";
import { aliasRefOf } from "../../../server/bt-world.ts";
import { resetKnKeys } from "../../../server/kn-keys.ts";
import { WHO_COOKIE, mintSession } from "../../../server/who-session.ts";

const g = globalThis as Record<string, unknown>;
void g;

const KEY = Buffer.alloc(32, 7).toString("base64");
let ctxs: Record<string, FakeCtx>;
let dos: Record<string, BertopiaWorld>;
let seenByBinding: Request[];

function env() {
  return {
    BERTOPIA_WORLD: {
      idFromName: (name: string) => name,
      get: (id: unknown) => {
        const name = String(id);
        ctxs[name] ||= new FakeCtx();
        dos[name] ||= new BertopiaWorld(ctxs[name] as never, {});
        return { fetch: (request: Request) => dos[name]!.fetch(request) };
      },
    },
  };
}

const binding = {
  fetch: (request: Request) => {
    seenByBinding.push(request);
    return worker.fetch(request, env() as never);
  },
};

function attach(event: H3Event, withBinding = true) {
  const e: Record<string, unknown> = { KN_AUTH_KEY: KEY };
  if (withBinding) e.BT_LIVE = binding;
  (event as unknown as { context: { env: Record<string, unknown> } }).context = { env: e };
  return event;
}

async function connect(opts: { world?: string | null; code?: string | null; alias?: string; upgrade?: boolean; binding?: boolean } = {}) {
  const headers: Record<string, string> = {
    "user-agent": "Mozilla/5.0 (test)",
    "x-forwarded-for": "203.0.113.9",
    "cf-connecting-ip": "203.0.113.9",
    origin: "https://tw.kulibert.net",
    "x-tw-pin": "1234",
  };
  if (opts.upgrade !== false) headers.upgrade = "websocket";
  if (opts.code !== null) {
    const token = await mintSession({}, { alias: opts.alias ?? "Kid", code: opts.code ?? "AB23C" });
    headers.cookie = `${WHO_COOKIE}=${token}; other=secret`;
  }
  const q = opts.world === null ? "" : `?world=${encodeURIComponent(opts.world ?? "main")}`;
  const event = attach(mockEvent(`http://127.0.0.1/api/bertopia/live${q}`, { headers }), opts.binding !== false);
  const res = (await liveGet(event)) as unknown;
  return { status: event.res.status || (res as { status?: number })?.status || 200, res, event };
}

const clientSocket = (res: unknown) => (res as { webSocket: FakeSocket }).webSocket;
const serverSocket = (res: unknown) => clientsFor.get(clientSocket(res))!;

describe("bertopia live join (P1, dark)", () => {
  beforeEach(() => {
    process.env.KN_AUTH_KEY = KEY;
    resetKnKeys();
    ctxs = {};
    dos = {};
    seenByBinding = [];
  });
  afterEach(() => {
    delete process.env.KN_AUTH_KEY;
  });

  it("no cookie is 401 and nothing reaches the Worker", async () => {
    const out = await connect({ code: null });
    assert.equal(out.status, 401);
    assert.deepEqual(out.res, { ok: false, error: "signin" });
    assert.equal(seenByBinding.length, 0);
  });

  it("a forged cookie is 401", async () => {
    const event = attach(mockEvent("http://127.0.0.1/api/bertopia/live?world=main", { headers: { upgrade: "websocket", cookie: `${WHO_COOKIE}=abc.def` } }));
    await liveGet(event);
    assert.equal(event.res.status, 401);
    assert.equal(seenByBinding.length, 0);
  });

  it("signed in with world=main: hello carries your alias", async () => {
    const out = await connect({ world: "main", alias: "Pixel" });
    assert.equal(out.status, 101);
    const server = serverSocket(out.res);
    assert.deepEqual(server.sent.map((m) => JSON.parse(m)), [{ t: "hello", world: "main", tick: 0, you: "Pixel" }]);
  });

  it("game-1 and game-2 are accepted and each world has its own room", async () => {
    for (const world of ["game-1", "game-2"]) {
      const out = await connect({ world });
      assert.equal(out.status, 101, world);
      assert.equal(JSON.parse(serverSocket(out.res).sent[0]!).world, world);
    }
    assert.deepEqual(Object.keys(ctxs).sort(), ["game-1", "game-2"]);
  });

  it("any other world slug is 400, and so is a missing one", async () => {
    for (const world of ["evil", "Main", "game-3", "main/../x", "", "main "]) {
      const out = await connect({ world });
      assert.equal(out.status, 400, JSON.stringify(world));
      assert.deepEqual(out.res, { ok: false, error: "world" });
    }
    const none = await connect({ world: null });
    assert.equal(none.status, 400);
    assert.equal(seenByBinding.length, 0);
  });

  it("only x-bt-ref, x-bt-alias and x-bt-role cross, plus the upgrade itself", async () => {
    const out = await connect({ world: "main", alias: "Pixel", code: "AB23C" });
    assert.equal(out.status, 101);
    assert.equal(seenByBinding.length, 1);
    const sent = seenByBinding[0]!;
    assert.deepEqual([...sent.headers.keys()].sort(), ["upgrade", "x-bt-alias", "x-bt-ref", "x-bt-role"]);
    assert.equal(sent.headers.get("x-bt-alias"), "Pixel");
    assert.equal(sent.headers.get("x-bt-role"), "kid");
    const event = attach(mockEvent("http://127.0.0.1/x"));
    const want = await aliasRefOf(event, "AB23C");
    assert.equal(sent.headers.get("x-bt-ref"), want);
    assert.notEqual(sent.headers.get("x-bt-ref"), "AB23C", "the shop code itself never leaves");
    assert.equal(sent.url, "https://bertopia-live/live?world=main");
  });

  it("the socket attachment is {aliasRef, alias, role, joinedAt, world} and nothing else", async () => {
    const out = await connect({ world: "main", alias: "Pixel" });
    const att = serverSocket(out.res).attachment as Record<string, unknown>;
    assert.deepEqual(Object.keys(att).sort(), ["alias", "aliasRef", "joinedAt", "role", "world"]);
    assert.equal(att.world, "main");
    assert.equal(att.alias, "Pixel");
    assert.equal(att.role, "kid");
    assert.equal(typeof att.joinedAt, "number");
    assert.ok(String(att.aliasRef).length > 10);
  });

  it("the 31st socket gets close 4001 'full'; the first 30 stay open", async () => {
    const opened: FakeSocket[] = [];
    for (let i = 0; i < MAX_SOCKETS; i++) {
      const out = await connect({ world: "main", alias: "K" + i });
      opened.push(serverSocket(out.res));
    }
    assert.ok(opened.every((s) => !s.closed), "30 sockets open");
    assert.equal(ctxs.main!.getWebSockets().length, 30);
    const late = await connect({ world: "main", alias: "Late" });
    assert.equal(late.status, 101, "the handshake completes, then the socket is closed");
    const server = serverSocket(late.res);
    assert.deepEqual(server.closed, { code: 4001, reason: "full" });
    assert.deepEqual(server.sent, [], "no hello for a refused socket");
    assert.equal(ctxs.main!.getWebSockets().length, 30);
    // another world is not full
    const other = await connect({ world: "game-1" });
    assert.equal(serverSocket(other.res).closed, null);
  });

  it("a freed seat can be taken again", async () => {
    const opened: FakeSocket[] = [];
    for (let i = 0; i < MAX_SOCKETS; i++) opened.push(serverSocket((await connect({ world: "main", alias: "K" + i })).res));
    dos.main!.webSocketClose(opened[0]!, 1000);
    const again = await connect({ world: "main", alias: "Again" });
    assert.equal(serverSocket(again.res).closed, null);
    assert.equal(JSON.parse(serverSocket(again.res).sent[0]!).you, "Again");
  });

  it("closing removes the player", async () => {
    const a = serverSocket((await connect({ world: "main", alias: "Ann" })).res);
    serverSocket((await connect({ world: "main", alias: "Bo" })).res);
    assert.deepEqual(dos.main!.players().map((p) => p.alias).sort(), ["Ann", "Bo"]);
    dos.main!.webSocketClose(a, 1001);
    assert.deepEqual(dos.main!.players().map((p) => p.alias), ["Bo"]);
    assert.equal(a.closed?.code, 1001);
  });

  it("a wire-illegal close code is answered with a normal close; errors close the socket", async () => {
    const a = serverSocket((await connect({ world: "main" })).res);
    dos.main!.webSocketClose(a, 1006);
    assert.equal(a.closed?.code, 1000);
    const b = serverSocket((await connect({ world: "main", alias: "B" })).res);
    dos.main!.webSocketError(b);
    assert.equal(b.closed?.code, 1011);
  });

  it("ping and pong are answered by the runtime, and joining writes nothing", async () => {
    await connect({ world: "main" });
    const pair = ctxs.main!.autoResponse as { request: string; response: string };
    assert.deepEqual({ request: pair.request, response: pair.response }, { request: "ping", response: "pong" });
    for (const table of ["chunks", "blocks", "chat"]) assert.equal(Number(ctxs.main!.storage.rows(`SELECT COUNT(*) AS n FROM ${table}`)[0]!.n), 0, table);
    assert.equal(ctxs.main!.storage.alarm, null);
  });

  it("not an upgrade is 426; no binding is 503", async () => {
    const plain = await connect({ world: "main", upgrade: false });
    assert.equal(plain.status, 426);
    const off = await connect({ world: "main", binding: false });
    assert.equal(off.status, 503);
    assert.deepEqual(off.res, { ok: false, error: "live-off" });
  });

  it("the Worker itself refuses a forged world, missing identity or a plain request", async () => {
    const ok = { upgrade: "websocket", "x-bt-ref": "r".repeat(20), "x-bt-alias": "Pixel", "x-bt-role": "kid" };
    const call = (url: string, headers: Record<string, string>) => worker.fetch(new Request(url, { headers }), env() as never);
    assert.equal((await call("https://x/live?world=evil", ok)).status, 400);
    assert.equal((await call("https://x/live?world=main", { upgrade: "websocket" })).status, 401);
    assert.equal((await call("https://x/live?world=main", { ...ok, "x-bt-alias": " " })).status, 401);
    assert.equal((await call("https://x/live?world=main", { ...ok, upgrade: "" })).status, 426);
  });

  it("an unknown role is a kid; the alias is cut to 16 characters", async () => {
    const res = await worker.fetch(
      new Request("https://x/live?world=main", { headers: { upgrade: "websocket", "x-bt-ref": "r".repeat(20), "x-bt-alias": "A".repeat(40), "x-bt-role": "admin" } }),
      env() as never,
    );
    const att = serverSocket(res).attachment as { role: string; alias: string };
    assert.equal(att.role, "kid");
    assert.equal(att.alias.length, 16);
  });
});
