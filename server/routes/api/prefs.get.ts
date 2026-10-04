import { createError, defineEventHandler, getCookie, getQuery } from "h3";
import { appSlug, loadPrefs, shopCode } from "../../prefs-kv";
import { whoCors } from "../../who-cors";
import { WHO_COOKIE, readSession } from "../../who-session";

const APP = /^[a-z0-9-]{1,24}$/;

export default defineEventHandler(async (event) => {
  whoCors(event);
  const q = getQuery(event);
  const session = await readSession(event, getCookie(event, WHO_COOKIE));
  const code = shopCode(q.code || session?.code || "");
  const app = appSlug(q.app);
  if (!APP.test(app)) throw createError({ statusCode: 400, statusMessage: "app" });
  if (!/^[A-Z2-9]{5}$/.test(code)) throw createError({ statusCode: 400, statusMessage: "code" });
  const { prefs, store } = await loadPrefs(event, code, app);
  if (store === "none") throw createError({ statusCode: 503, statusMessage: "no-store" });
  return { ok: true, store, app, prefs };
});
