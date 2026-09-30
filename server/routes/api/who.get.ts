import { defineEventHandler, getCookie, getQuery, setResponseStatus } from "h3";
import { searchWho } from "../../who-kv";
import { whoCors } from "../../who-cors";
import { WHO_COOKIE, readSession } from "../../who-session";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const q = String(getQuery(event).q ?? "");
  if (q.trim().length >= 2) return { ok: true, people: await searchWho(event, q) };
  const session = await readSession(getCookie(event, WHO_COOKIE));
  if (!session) {
    setResponseStatus(event, 401);
    return { verified: false };
  }
  return {
    alias: session.alias,
    code: session.code,
    verified: true as const,
    ...(session.picture ? { picture: session.picture } : {}),
  };
});
