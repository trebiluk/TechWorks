/**
 * Bertopia live server, P1. Dark: nothing kid-facing calls this yet.
 *
 * One Durable Object per world slug (main, game-1, game-2). Sockets use the Hibernation API
 * (ctx.acceptWebSocket), so an idle world costs nothing. Ping/pong is answered by the runtime.
 * Identity arrives from the TechWorks route as three headers over a service binding:
 * x-bt-ref (the same alias_ref the world store uses), x-bt-alias and x-bt-role. This Worker has no
 * public route, so those headers cannot come from a browser. No storage writes, no IPs, no user agents.
 */

export const WORLDS = ["main", "game-1", "game-2"] as const;
export const MAX_SOCKETS = 30;

export type Role = "kid" | "teacher";
export type Attachment = { aliasRef: string; alias: string; role: Role; joinedAt: number };

type Sock = {
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
  serializeAttachment: (value: unknown) => void;
  deserializeAttachment: () => unknown;
};

type Ctx = {
  acceptWebSocket: (ws: Sock) => void;
  getWebSockets: () => Sock[];
  setWebSocketAutoResponse: (pair: unknown) => void;
};

type Stub = { fetch: (request: Request) => Promise<Response> };
type Ns = { idFromName: (name: string) => unknown; get: (id: unknown) => Stub };
export type Env = { BERTOPIA_WORLD: Ns };

declare const WebSocketPair: new () => { 0: Sock; 1: Sock };
declare const WebSocketRequestResponsePair: new (request: string, response: string) => unknown;

function json(status: number, error: string): Response {
  return new Response(JSON.stringify({ ok: false, error }), { status, headers: { "content-type": "application/json" } });
}

export function worldOf(request: Request): string | null {
  const world = new URL(request.url).searchParams.get("world") ?? "";
  return (WORLDS as readonly string[]).includes(world) ? world : null;
}

export function identityOf(request: Request): Attachment | null {
  const aliasRef = (request.headers.get("x-bt-ref") ?? "").trim();
  const alias = (request.headers.get("x-bt-alias") ?? "").trim().slice(0, 16);
  if (!aliasRef || aliasRef.length > 200 || !alias) return null;
  const role: Role = request.headers.get("x-bt-role") === "teacher" ? "teacher" : "kid";
  return { aliasRef, alias, role, joinedAt: Date.now() };
}

function isUpgrade(request: Request): boolean {
  return (request.headers.get("upgrade") ?? "").toLowerCase() === "websocket";
}

export class BertopiaWorld {
  /** The 101 answer. A hook so tests can run outside workerd, where Response cannot carry a socket. */
  static respond: (client: Sock) => Response = (client) =>
    new Response(null, { status: 101, webSocket: client } as ResponseInit & { webSocket: Sock });

  private ctx: Ctx;

  constructor(ctx: Ctx, _env: unknown) {
    this.ctx = ctx;
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    const world = worldOf(request);
    if (!world) return json(400, "world");
    const who = identityOf(request);
    if (!who) return json(401, "signin");
    if (!isUpgrade(request)) return json(426, "upgrade");

    const full = this.ctx.getWebSockets().length >= MAX_SOCKETS;
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    if (full) {
      server.close(4001, "full");
      return BertopiaWorld.respond(client);
    }
    server.serializeAttachment(who);
    server.send(JSON.stringify({ t: "hello", world, tick: 0, you: who.alias }));
    return BertopiaWorld.respond(client);
  }

  /** Players are the open sockets, read from their attachments. Nothing is stored. */
  players(): Attachment[] {
    return this.ctx.getWebSockets().map((ws) => ws.deserializeAttachment() as Attachment | null).filter((a): a is Attachment => !!a);
  }

  // P1 takes no messages. Ping and pong never reach here (auto-response).
  webSocketMessage(_ws: Sock, _message: string | ArrayBuffer): void {}

  webSocketClose(ws: Sock, code: number): void {
    // 1005 and 1006 are not allowed on the wire; answer with a normal close. The player leaves with the socket.
    try { ws.close(code === 1005 || code === 1006 || !code ? 1000 : code, "bye"); } catch { /* already closed */ }
  }

  webSocketError(ws: Sock): void {
    try { ws.close(1011, "error"); } catch { /* already closed */ }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const world = worldOf(request);
    if (!world) return json(400, "world");
    if (!identityOf(request)) return json(401, "signin");
    if (!isUpgrade(request)) return json(426, "upgrade");
    const stub = env.BERTOPIA_WORLD.get(env.BERTOPIA_WORLD.idFromName(world));
    return stub.fetch(request);
  },
};
