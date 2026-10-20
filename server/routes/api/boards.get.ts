import { defineEventHandler, getQuery } from "h3";
import { loadBoards } from "../../boards-kv";
import { whoCors } from "../../who-cors";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const q = getQuery(event);
  const cls = String(q.class ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase();
  const { rows, store } = await loadBoards(event);
  const out = cls ? rows.filter((row) => row.classCode === cls) : rows;
  return { ok: true, store, rows: out.slice(-200) };
});
