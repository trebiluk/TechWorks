// Fakes for running the live Worker outside workerd (node:test). Real SQLite stands in for Durable Object storage.
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
