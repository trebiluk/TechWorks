import { defineEventHandler, getHeader, getRequestURL, setHeader, setResponseStatus, type H3Event } from "h3";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { hkdfReady, recoveryKey, hmacText, b64url, randomBytes } from "../../../kn-keys";
import { ensureKn } from "../../../kn-db";
import { getStaff, STAFF_COOKIE } from "../../../kn-session";
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

function internal(event: H3Event, err: unknown) {
  const id = b64url(randomBytes(3));
  console.error("staff", id, err);
  setResponseStatus(event, 500);
  return { error: "internal", id };
}

export default defineEventHandler(async (event) => {
  staffCors(event);
  try {
    return await handle(event);
  } catch (err) {
    if (!hkdfReady(event) || !knDb(event)) return notSetUp(event);
    return internal(event, err);
  }
});

async function handle(event: H3Event) {
  const path = getRequestURL(event).pathname.replace(/\/$/, "");
  const method = event.method || "GET";
  if (method === "OPTIONS") return "";
  if (!hkdfReady(event) || !knDb(event)) return notSetUp(event);
  if (method === "POST") {
    const type = (getHeader(event, "content-type") ?? "").toLowerCase();
    if (!type.includes("application/json") || getHeader(event, "x-kn-staff") !== "1") {
      setResponseStatus(event, 403);
      return { error: "csrf" };
    }
  }
  if (path.endsWith("/api/staff/me") && method === "GET") {
    const staff = await getStaff(event);
    if (!staff) {
      setResponseStatus(event, 401);
      return { staff: false };
    }
    return { staff: true, exp: staff.exp, method: staff.method, label: staff.label, mustAddPasskey: staff.mustAddPasskey };
  }
  if (path.endsWith("/api/staff/login/options") && method === "POST") {
    const host = getRequestURL(event).hostname;
    const options = await generateAuthenticationOptions({
      rpID: host === "localhost" || host === "127.0.0.1" ? "localhost" : "kulibert.net",
      userVerification: "required",
    });
    const key = await recoveryKey(event);
    const db = knDb(event);
    if (key && db && (await ensureKn(event))) {
      const h = await hmacText(key, options.challenge);
      await db.prepare("INSERT OR REPLACE INTO kn_onetime (h, kind, body, exp) VALUES (?, 'chal', ?, ?)").bind(h, options.challenge, Date.now() + 5 * 60 * 1000).run();
    }
    return options;
  }
  if (path.endsWith("/api/staff/logout") && method === "POST") {
    setHeader(event, "set-cookie", `${STAFF_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return { ok: true };
  }
  setResponseStatus(event, 404);
  return { error: "missing", id: b64url(randomBytes(3)) };
}
