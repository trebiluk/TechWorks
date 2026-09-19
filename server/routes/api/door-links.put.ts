import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { allowDoorWrite, claimDoorWrite, sanitizePack, saveDoor } from "../../door-kv";

const ORIGINS = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  const allow = ORIGINS.has(origin) ? origin : "https://apps.kulibert.net";
  setHeader(event, "access-control-allow-origin", allow);
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");

  const auth = getHeader(event, "authorization") ?? "";
  const body = await readBody<{ keyHash?: string; links?: unknown }>(event);
  const token = (
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
    (getHeader(event, "x-tw-desk") ?? "") ||
    String(body?.keyHash ?? "")
  ).trim();

  const gate = await allowDoorWrite(event, token);
  if (gate === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  if (gate === "deny") throw createError({ statusCode: 401, statusMessage: "desk key" });

  const pack = sanitizePack({
    updated: new Date().toISOString(),
    links: body?.links,
  });
  const used = await saveDoor(event, pack);
  if (used === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  await claimDoorWrite(event, token);
  return { ok: true, store: used, n: pack.links.length, updated: pack.updated, links: pack.links };
});
