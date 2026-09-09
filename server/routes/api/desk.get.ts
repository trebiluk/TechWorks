import { createError, defineEventHandler, getHeader, getQuery, setHeader } from "h3";
import { loadRow } from "../../desk-kv";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  const auth = getHeader(event, "authorization") ?? "";
  const q = getQuery(event);
  const token = (
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") ||
    (getHeader(event, "x-tw-desk") ?? "") ||
    String(q.k ?? "")
  ).trim();
  if (!token) throw createError({ statusCode: 401, statusMessage: "desk key" });
  const { row, store } = await loadRow(event);
  if (store === "none") {
    throw createError({ statusCode: 503, statusMessage: "no-store" });
  }
  if (!row) {
    return { empty: true, store };
  }
  if (row.keyHash !== token) throw createError({ statusCode: 401, statusMessage: "desk key" });
  return { saved: row.saved, app: row.app, n: row.n, salt: row.salt, iv: row.iv, data: row.data, store };
});
