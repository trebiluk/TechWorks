import { defineEventHandler, getCookie, getQuery } from "h3";
import { searchWho, whoByCode } from "../../who-kv";
import { whoCors } from "../../who-cors";
import { WHO_COOKIE, readSession } from "../../who-session";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const q = String(getQuery(event).q ?? "");
  if (q.trim().length >= 2) return { ok: true, people: await searchWho(event, q) };
  const session = await readSession(event, getCookie(event, WHO_COOKIE));
  if (!session) return { ok: true, signedIn: false, verified: false };
  const row = await whoByCode(event, session.code);
  return {
    alias: session.alias,
    code: session.code,
    verified: true as const,
    ...(session.picture ? { picture: session.picture } : {}),
    ...(row?.test ? { test: true as const } : {}),
  };
});
