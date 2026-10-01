import { createError, defineEventHandler, getHeader, getQuery } from "h3";
import { loadMarks, marksForCode } from "../../marks-kv";
import { whoCors } from "../../who-cors";

function deskPinOk(header: string | undefined) {
  const pin = String(header ?? "").replace(/\D/g, "");
  const expect = String(process.env.TW_DESK_PIN || "7879").replace(/\D/g, "");
  return pin.length >= 4 && pin === expect;
}

export default defineEventHandler(async (event) => {
  whoCors(event);
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
