import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { loadMarks, sanitizeMark, saveMarks } from "../../marks-kv";

function allowOrigin(origin: string) {
  if (!origin) return "*";
  if (origin.startsWith("https://") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost")) {
    return origin;
  }
  return "https://apps.kulibert.net";
}

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", allowOrigin(origin));
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");

  const body = (await readBody<{ marks?: unknown[]; alias?: unknown; app?: unknown; line?: unknown }>(event)) ?? {};
  const incoming = Array.isArray(body.marks) ? body.marks : [body];
  const clean = incoming.map(sanitizeMark).filter((row) => row);
  if (!clean.length) throw createError({ statusCode: 400, statusMessage: "bad mark" });
  const store = await saveMarks(event, clean);
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  const { marks } = await loadMarks(event);
  return { ok: true, store, n: marks.length };
});
