import { defineEventHandler, readBody, setCookie, setResponseStatus } from "h3";
import { enterWho } from "../../who-kv";
import { schoolHost, whoCors } from "../../who-cors";
import { WHO_COOKIE, mintSession, sessionExpiry } from "../../who-session";

export default defineEventHandler(async (event) => {
  whoCors(event);
  const body = (await readBody<{ alias?: unknown; code?: unknown; pin?: unknown }>(event)) ?? {};
  const result = await enterWho(event, String(body.alias ?? ""), String(body.code ?? ""), String(body.pin ?? ""));
  if (result.ok) {
    let token = "";
    try {
      token = await mintSession(event, { alias: result.alias, code: result.code, picture: result.picture });
    } catch {
      setResponseStatus(event, 503);
      return { ok: false, error: "server-key" };
    }
    const maxAge = Math.max(60, Math.round((sessionExpiry() - Date.now()) / 1000));
    const school = schoolHost(event);
    setCookie(event, WHO_COOKIE, token, {
      httpOnly: true,
      secure: school,
      sameSite: school ? "none" : "lax",
      domain: school ? ".kulibert.net" : undefined,
      path: "/",
      maxAge,
    });
  }
  return result;
});
