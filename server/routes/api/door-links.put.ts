import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { loadRow } from "../../desk-kv";
import { saveDoor, sanitizePack } from "../../door-kv";

const ORIGINS = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

function cors(event: Parameters<typeof setHeader>[0], origin: string) {
  const allow = ORIGINS.has(origin) ? origin : "https://apps.kulibert.net";
  setHeader(event, "access-control-allow-origin", allow);
  setHeader(event, "access-control-allow-methods", "GET, PUT, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, authorization, x-tw-desk");
  setHeader(event, "vary", "origin");
}

export default defineEventHandler(async (event) => {
  cors(event, getHeader(event, "origin") ?? "");
  setHeader(event, "cache-control", "no-store");
  if ((event.node?.req?.method ?? "GET").toUpperCase() === "OPTIONS") return "";

  const auth = getHeader(event, "authorization") ?? "";
  const body = await readBody<{ keyHash?: string; links?: unknown }>(event);
  const token = (
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
    (getHeader(event, "x-tw-desk") ?? "") ||
    String(body?.keyHash ?? "")
  ).trim();
  if (token.length < 16) throw createError({ statusCode: 401, statusMessage: "desk key" });

  const { row, store } = await loadRow(event);
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  if (!row || row.keyHash !== token) {
    throw createError({ statusCode: 401, statusMessage: "desk key" });
  }

  const pack = sanitizePack({
    updated: new Date().toISOString(),
    links: body?.links,
  });
  const used = await saveDoor(event, pack);
  if (used === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true, store: used, n: pack.links.length, updated: pack.updated, links: pack.links };
});
