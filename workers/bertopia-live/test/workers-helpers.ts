// Shared by the workerd tests. Not a test file (the vitest include is *.workers.test.ts).
import { SELF } from "cloudflare:test";

export type Msg = Record<string, unknown>;
export type Conn = { ws: WebSocket; inbox: Msg[]; closed: { code: number; reason: string } | null };

/** Every socket opened by open(); tests call closeAll() in afterEach so a failed assertion cannot leave one open. */
const opened: Conn[] = [];
export function closeAll() {
  for (const c of opened.splice(0)) {
    try { c.ws.close(); } catch { /* already closed */ }
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function until(fn: () => boolean, label: string) {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await sleep(10);
  }
  throw new Error("timed out waiting for " + label);
}

export function joinHeaders(alias: string) {
  return { Upgrade: "websocket", "x-bt-ref": `ref-${alias}-aaaaaaaaaa`, "x-bt-alias": alias, "x-bt-role": "kid" };
}

export async function open(world: string, alias: string): Promise<Conn> {
  const res = await SELF.fetch(`https://live/live?world=${world}`, { headers: joinHeaders(alias) });
  const ws = (res as unknown as { webSocket: WebSocket }).webSocket;
  ws.accept();
  const conn: Conn = { ws, inbox: [], closed: null };
  ws.addEventListener("message", (e: MessageEvent) => conn.inbox.push(JSON.parse(String(e.data))));
  ws.addEventListener("close", (e: CloseEvent) => { conn.closed = { code: e.code, reason: e.reason }; });
  opened.push(conn);
  return conn;
}

export const edit = (c: Conn, x: number, y: number, z: number, block: number, rev: number) =>
  c.ws.send(JSON.stringify({ t: "edit", x, y, z, block, rev }));
