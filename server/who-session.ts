/** Kid session for the Hub. Alias and shop code only. Never a PIN or a real name. */

import { b64url, hmacText, kidSessionKey } from "./kn-keys";

export const WHO_COOKIE = "tw_session";

export type WhoSession = {
  alias: string;
  code: string;
  picture?: string;
  exp: number;
};

function fromB64url(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** End of the school day (3:00pm America/New_York) or 8 hours, whichever is sooner. */
export function sessionExpiry(now = Date.now()): number {
  const eight = now + 8 * 60 * 60 * 1000;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(now));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const left = 15 * 60 - (hour * 60 + minute);
  if (left <= 0) return eight;
  return Math.min(eight, now + left * 60 * 1000);
}

export async function mintSession(
  event: unknown,
  row: { alias: string; code: string; picture?: string },
  now = Date.now(),
): Promise<string> {
  const key = await kidSessionKey(event);
  if (!key) {
    const err = new Error("server-key");
    throw err;
  }
  const body: WhoSession = {
    alias: row.alias.slice(0, 16),
    code: row.code.slice(0, 5),
    picture: row.picture?.slice(0, 8) || undefined,
    exp: sessionExpiry(now),
  };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(body)));
  return `${payload}.${await hmacText(key, payload)}`;
}

export async function readSession(event: unknown, token: string | undefined, now = Date.now()): Promise<WhoSession | null> {
  const key = await kidSessionKey(event);
  if (!key || !token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig || sig !== (await hmacText(key, payload))) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as WhoSession;
    if (!body.alias || !body.code || !body.exp || body.exp <= now) return null;
    return body;
  } catch {
    return null;
  }
}
