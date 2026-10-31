/**
 * Bertopia live play, P1 (dark). WebSocket upgrade for a world, handed to the bertopia-live Worker
 * over the BT_LIVE service binding. Only three identity headers cross; every other header
 * (cookie, user agent, forwarded addresses) is dropped here. Nothing in the app calls this yet.
 */
import { defineEventHandler, getCookie, getHeader, setResponseStatus } from "h3";
import { aliasRefOf } from "../../../bt-world";
import { envOf } from "../../../cf-env";
import { readSession, WHO_COOKIE } from "../../../who-session";

const WORLDS = new Set(["main", "game-1", "game-2"]);

type Binding = { fetch: (request: Request) => Promise<Response> };

export default defineEventHandler(async (event) => {
  const session = await readSession(event, getCookie(event, WHO_COOKIE));
  if (!session) {
    setResponseStatus(event, 401);
    return { ok: false, error: "signin" };
  }
  const world = event.url.searchParams.get("world") ?? "";
  if (!WORLDS.has(world)) {
    setResponseStatus(event, 400);
    return { ok: false, error: "world" };
  }
  if ((getHeader(event, "upgrade") ?? "").toLowerCase() !== "websocket") {
    setResponseStatus(event, 426);
    return { ok: false, error: "upgrade" };
  }
  const ref = await aliasRefOf(event, session.code);
  if (!ref) {
    setResponseStatus(event, 503);
    return { ok: false, error: "server-key" };
  }
  const bound = envOf(event)?.BT_LIVE as Binding | undefined;
  if (!bound || typeof bound.fetch !== "function") {
    setResponseStatus(event, 503);
    return { ok: false, error: "live-off" };
  }
  const headers = new Headers();
  headers.set("upgrade", "websocket");
  headers.set("x-bt-ref", ref);
  headers.set("x-bt-alias", session.alias);
  headers.set("x-bt-role", "kid"); // teacher join comes later, from a staff session
  return bound.fetch(new Request("https://bertopia-live/live?world=" + encodeURIComponent(world), { method: "GET", headers }));
});
