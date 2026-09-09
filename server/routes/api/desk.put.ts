import { createError, defineEventHandler, getHeader, readBody, setHeader } from "h3";
import { loadRow, saveRow, type DeskRow } from "../../desk-kv";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  const auth = getHeader(event, "authorization") ?? "";
  const body = await readBody<Partial<DeskRow> & { keyHash?: string }>(event);
  const token = (
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
    (getHeader(event, "x-tw-desk") ?? "") ||
    String(body?.keyHash ?? "")
  ).trim();
  if (token.length < 16) throw createError({ statusCode: 401, statusMessage: "desk key" });
  if (!body?.salt || !body.iv || !body.data || !body.saved) {
    throw createError({ statusCode: 400, statusMessage: "bad desk" });
  }
  const { row, store } = await loadRow(event);
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  if (row && row.keyHash !== token) throw createError({ statusCode: 401, statusMessage: "desk key" });
  const next: DeskRow = {
    keyHash: token,
    saved: String(body.saved).slice(0, 40),
    app: String(body.app ?? "").slice(0, 16),
    n: Math.max(0, Number(body.n) || 0),
    salt: String(body.salt).slice(0, 80),
    iv: String(body.iv).slice(0, 80),
    data: String(body.data).slice(0, 4_000_000),
  };
  const used = await saveRow(event, next);
  if (used === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true, saved: next.saved, store: used, n: next.n };
});
