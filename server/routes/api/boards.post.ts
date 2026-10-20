import { createError, defineEventHandler, readBody } from "h3";
import { sanitizeBoard, saveBoard } from "../../boards-kv";
import { whoCors } from "../../who-cors";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const body = (await readBody(event)) ?? {};
  const row = sanitizeBoard(body);
  if (!row) throw createError({ statusCode: 400, statusMessage: "bad board" });
  const store = await saveBoard(event, row);
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true, store };
});
