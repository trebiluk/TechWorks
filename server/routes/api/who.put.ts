import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { saveWho } from "../../who-kv";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  const auth = getHeader(event, "authorization") ?? "";
  const body = (await readBody<{ keyHash?: unknown; people?: unknown[] }>(event)) ?? {};
  const token = ((auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") || (getHeader(event, "x-tw-desk") ?? "") || String(body.keyHash ?? "")).trim();
  if (token.length < 16) throw createError({ statusCode: 401, statusMessage: "desk key" });
  const used = await saveWho(event, token, Array.isArray(body.people) ? body.people : []);
  if (used === "deny") throw createError({ statusCode: 401, statusMessage: "desk key" });
  if (used === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true };
});
