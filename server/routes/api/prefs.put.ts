import { createError, defineEventHandler, getCookie, readBody } from "h3";
import { appSlug, savePrefs, shopCode } from "../../prefs-kv";
import { whoCors } from "../../who-cors";
import { WHO_COOKIE, readSession } from "../../who-session";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const body = (await readBody<{ code?: unknown; app?: unknown; prefs?: unknown }>(event)) ?? {};
  const session = await readSession(getCookie(event, WHO_COOKIE));
  const code = shopCode(body.code || session?.code || "");
  const app = appSlug(body.app);
  const store = await savePrefs(event, code, app, body.prefs);
  if (store === "big") throw createError({ statusCode: 413, statusMessage: "too big" });
  if (store === "shape" || store === "reject") throw createError({ statusCode: 400, statusMessage: store === "shape" ? "prefs" : "code" });
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true, store, app };
});
