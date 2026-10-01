import { createError, defineEventHandler, readBody } from "h3";
import { loadMarks, sanitizeV1, sanitizeV2, saveMarks } from "../../marks-kv";
import { whoCors } from "../../who-cors";

export default defineEventHandler(async (event) => {
  whoCors(event);

  const body = (await readBody<{ marks?: unknown[]; alias?: unknown; app?: unknown; line?: unknown; v?: unknown }>(event)) ?? {};
  const incoming = Array.isArray(body.marks) ? body.marks : [body];
  const parsed = incoming.filter((row) => sanitizeV2(row) || sanitizeV1(row));
  if (!parsed.length) throw createError({ statusCode: 400, statusMessage: "bad mark" });
  const store = await saveMarks(event, parsed);
  if (store === "reject") throw createError({ statusCode: 400, statusMessage: "code" });
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  const { marks } = await loadMarks(event);
  return { ok: true, store, n: marks.length };
});
