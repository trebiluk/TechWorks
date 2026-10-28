import { createError, defineEventHandler, getHeader, readBody, setHeader, setResponseStatus } from "h3";
import { wipeTestStudents } from "../../../bt-staff";

export default defineEventHandler(async (event) => {
  setHeader(event, "cache-control", "no-store");
  if (event.method === "OPTIONS") return "";
  const auth = getHeader(event, "authorization") ?? "";
  const body = (await readBody<{ keyHash?: unknown }>(event).catch(() => null)) ?? {};
  const token = ((auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "") || (getHeader(event, "x-tw-desk") ?? "") || String(body?.keyHash ?? "")).trim();
  if (token.length < 16) {
    setResponseStatus(event, 401);
    return { ok: false, error: "deny" };
  }
  const result = await wipeTestStudents(event, token);
  if (!result.ok && result.error === "deny") throw createError({ statusCode: 401, statusMessage: "desk key" });
  if (!result.ok) throw createError({ statusCode: 503, statusMessage: "no-store" });
  return result;
});
