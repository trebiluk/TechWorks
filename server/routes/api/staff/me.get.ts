import { defineEventHandler, getHeader, setHeader, setResponseStatus, type H3Event } from "h3";
import { b64url, hkdfReady, randomBytes } from "../../../kn-keys";
import { getStaff } from "../../../kn-session";
import { knDb } from "../../../cf-env";

const ALLOW = new Set(["https://apps.kulibert.net", "https://tw.kulibert.net"]);

function staffCors(event: H3Event) {
  const origin = getHeader(event, "origin") ?? "";
  let ok = ALLOW.has(origin);
  if (!ok && origin) {
    try {
      const u = new URL(origin);
      ok = (u.hostname === "localhost" || u.hostname === "127.0.0.1") && (u.protocol === "http:" || u.protocol === "https:");
    } catch {
      ok = false;
    }
  }
  if (ok) {
    setHeader(event, "access-control-allow-origin", origin);
    setHeader(event, "access-control-allow-credentials", "true");
  }
  setHeader(event, "access-control-allow-methods", "GET, POST, OPTIONS");
  setHeader(event, "access-control-allow-headers", "content-type, x-kn-staff, x-kn-stepup, x-tw-desk");
  setHeader(event, "vary", "origin");
  setHeader(event, "cache-control", "no-store");
}

function notSetUp(event: H3Event) {
  setResponseStatus(event, 503);
  return { ok: false, reason: "staff-login-not-set-up" };
}

/** GET /api/staff/me. 503 only when the key or KN_DB is missing. */
export default defineEventHandler(async (event) => {
  staffCors(event);
  try {
    if (!hkdfReady(event) || !knDb(event)) return notSetUp(event);
    const staff = await getStaff(event);
    if (!staff) {
      setResponseStatus(event, 401);
      return { staff: false };
    }
    return { staff: true, exp: staff.exp, method: staff.method, label: staff.label, mustAddPasskey: staff.mustAddPasskey };
  } catch (err) {
    if (!hkdfReady(event) || !knDb(event)) return notSetUp(event);
    const id = b64url(randomBytes(3));
    console.error("staff", id, err);
    setResponseStatus(event, 500);
    return { error: "internal", id };
  }
});
