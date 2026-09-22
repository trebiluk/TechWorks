import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { allowDoorWrite, claimDoorWrite, loadDoor, sanitizePack, saveDoor } from "../../door-kv";

function allowOrigin(origin: string) {
  if (!origin) return "*";
  if (
    origin.startsWith("https://") ||
    origin.startsWith("http://127.0.0.1") ||
    origin.startsWith("http://localhost")
  ) {
    return origin;
  }
  return "https://apps.kulibert.net";
}

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", allowOrigin(origin));
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");

  const auth = getHeader(event, "authorization") ?? "";
  const body = (await readBody<Record<string, unknown>>(event)) ?? {};
  const token = (
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
    (getHeader(event, "x-tw-desk") ?? "") ||
    String(body.keyHash ?? "")
  ).trim();

  const gate = await allowDoorWrite(event, token);
  if (gate === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  if (gate === "deny") throw createError({ statusCode: 401, statusMessage: "desk key" });

  const { pack: current } = await loadDoor(event);
  const pack = sanitizePack({
    ...current,
    ...body,
    updated: new Date().toISOString(),
    links: body.links !== undefined ? body.links : current.links,
    note: body.note !== undefined ? body.note : current.note,
  });
  const used = await saveDoor(event, pack);
  if (used === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  await claimDoorWrite(event, token);
  return { ok: true, store: used, n: pack.links.length, ...pack };
});
