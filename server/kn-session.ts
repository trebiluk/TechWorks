import { createError, getCookie, getHeader, type H3Event } from "h3";
import { sessionExpiry } from "./who-session";
import { b64url, hmacText, randomBytes, sessionKey, stepupKey } from "./kn-keys";
import { knDb } from "./cf-env";

export const STAFF_COOKIE = "__Host-kn_staff";
export const STAFF_MAX_MS = 10 * 24 * 60 * 60 * 1000;

export function staffExpiry(now: number, shared: boolean): number {
  const cap = now + STAFF_MAX_MS;
  if (!shared) return cap;
  return Math.min(cap, sessionExpiry(now));
}

export type StaffSession = {
  uid: string;
  method: string;
  exp: number;
  sessionHash: string;
  mustAddPasskey: boolean;
  label: string;
};

export async function getStaff(event: H3Event): Promise<StaffSession | null> {
  const raw = getCookie(event, STAFF_COOKIE);
  const key = await sessionKey(event);
  const db = knDb(event);
  if (!raw || !key || !db) return null;
  const sessionHash = await hmacText(key, raw);
  const row = await db
    .prepare("SELECT uid, gen, method, label, exp FROM kn_session WHERE h = ?")
    .bind(sessionHash)
    .first<{ uid: string; gen: number; method: string; label: string | null; exp: number }>();
  if (!row || row.exp <= Date.now()) return null;
  const staff = await db.prepare("SELECT gen, body FROM kn_staff WHERE uid = ?").bind(row.uid).first<{ gen: number; body: string }>();
  if (!staff || staff.gen !== row.gen) return null;
  let must = false;
  try {
    must = Boolean(JSON.parse(staff.body).mustAddPasskey);
  } catch {
    must = false;
  }
  return { uid: row.uid, method: row.method, exp: row.exp, sessionHash, mustAddPasskey: must, label: row.label ?? "" };
}

export async function requireStepup(event: H3Event, action: string) {
  const staff = await getStaff(event);
  const token = getHeader(event, "x-kn-stepup") ?? "";
  const key = await stepupKey(event);
  if (!staff || !key || !token.includes(".")) throw createError({ statusCode: 403, data: { error: "stepup" } });
  const [body, sig] = token.split(".");
  if (!body || sig !== (await hmacText(key, body))) throw createError({ statusCode: 403, data: { error: "stepup" } });
  const json = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(body.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)))) as {
    sessionHash?: string;
    action?: string;
    exp?: number;
  };
  if (json.sessionHash !== staff.sessionHash || json.action !== action || !json.exp || json.exp < Date.now()) {
    throw createError({ statusCode: 403, data: { error: "stepup" } });
  }
}

export async function newStaffId(): Promise<string> {
  return b64url(randomBytes(32));
}
