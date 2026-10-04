import { defineEventHandler, getHeader, getRequestURL, readBody, setHeader, setResponseStatus, type H3Event } from "h3";
import { hkdfReady, recoveryKey, hmacText, randomBytes, b64url } from "../../../kn-keys";
import { ensureKn } from "../../../kn-db";
import { getStaff, STAFF_COOKIE, staffExpiry } from "../../../kn-session";
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

export default defineEventHandler(async (event) => {
  staffCors(event);
  try {
    return await handle(event);
  } catch {
    return notSetUp(event);
  }
});

function deny(event: H3Event, status: number, error: string) {
  setResponseStatus(event, status);
  return { error };
}

async function handle(event: H3Event) {
  const path = getRequestURL(event).pathname.replace(/\/$/, "");
  const method = event.method || "GET";
  if (method === "OPTIONS") return "";
  if (!hkdfReady(event)) return notSetUp(event);
  if (method === "POST") {
    const type = (getHeader(event, "content-type") ?? "").toLowerCase();
    if (!type.includes("application/json") || getHeader(event, "x-kn-staff") !== "1") return deny(event, 403, "csrf");
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
    const { generateAuthenticationOptions } = await import("@simplewebauthn/server");
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
  if (path.endsWith("/api/staff/login/totp") && method === "POST") {
    const db = knDb(event);
    if (!db || !(await ensureKn(event))) return deny(event, 503, "server-not-ready");
    const body = (await readBody<{ shared?: boolean }>(event)) ?? {};
    const staff = await db.prepare("SELECT body FROM kn_staff WHERE uid = 'staff'").bind().first<{ body: string }>();
    if (!staff) return deny(event, 401, "code");
    return { staff: false, exp: staffExpiry(Date.now(), Boolean(body.shared)) };
  }
  if (path.endsWith("/api/staff/logout") && method === "POST") {
    setHeader(event, "set-cookie", `${STAFF_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return { ok: true };
  }
  if (path.endsWith("/api/staff/setup-code") && method === "POST") {
    const db = knDb(event);
    if (!db || !(await ensureKn(event))) return deny(event, 503, "server-not-ready");
    const row = await db.prepare("SELECT uid FROM kn_staff WHERE uid = 'staff'").bind().first();
    if (row) return deny(event, 409, "already set up");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (const b of randomBytes(10)) code += alphabet[b % alphabet.length];
    const key = await recoveryKey(event);
    if (!key) return deny(event, 503, "server-not-ready");
    const h = await hmacText(key, code);
    await db.prepare("INSERT INTO kn_onetime (h, kind, body, exp) VALUES (?, 'setup', '', ?)").bind(h, Date.now() + 15 * 60 * 1000).run();
    return { code };
  }
  setResponseStatus(event, 404);
  return { error: "missing", id: b64url(randomBytes(3)) };
}
