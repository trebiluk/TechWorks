import { createError, defineEventHandler, getHeader, getQuery, setHeader } from "h3";
import { loadMarks, marksForCode } from "../../marks-kv";

function deskPinOk(header: string | undefined) {
  const pin = String(header ?? "").replace(/\D/g, "");
  const expect = String(process.env.TW_DESK_PIN || "7879").replace(/\D/g, "");
  return pin.length >= 4 && pin === expect;
}

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, "origin") ?? "";
  setHeader(event, "access-control-allow-origin", origin || "*");
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, x-tw-pin");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
  const q = getQuery(event);
  const code = String(q.code ?? "");
  const period = String(q.period ?? "");
  const { marks, store } = await loadMarks(event);
  if (code) return { ok: true, store, marks: marksForCode(marks, code) };
  if (period) {
    if (!deskPinOk(getHeader(event, "x-tw-pin"))) throw createError({ statusCode: 401, statusMessage: "desk pin" });
    return { ok: true, store, marks };
  }
  return { ok: true, store, marks: [] };
});
