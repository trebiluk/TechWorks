import { knDb, knVar } from "./cf-env";
import { ensureKn } from "./kn-db";
import { b64url, emailKey, hmacText, randomBytes, recoveryKey } from "./kn-keys";

type Bound = {
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type Sql = {
  prepare: (sql: string) => { bind: (...args: unknown[]) => Bound };
};

export function recoveryBlocklist(event: unknown): string {
  return knVar(event, "KN_RECOVERY_EMAIL_BLOCKLIST", "solvayschools.org");
}

export function normalizeRecoveryEmail(raw: string, blocklist: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) return null;
  const domain = email.slice(email.indexOf("@") + 1);
  const blocked = blocklist.split(/[,\s]+/).map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (blocked.some((name) => domain === name || domain.endsWith("." + name))) return null;
  return email;
}

function fromB64url(text: string): Uint8Array {
  const pad = text.length % 4 === 0 ? "" : "=".repeat(4 - (text.length % 4));
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function sealEmail(event: unknown, uid: string, email: string): Promise<string> {
  const key = await emailKey(event);
  if (!key) throw new Error("seal");
  const iv = randomBytes(12);
  const enc = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, additionalData: new TextEncoder().encode(uid) },
    key,
    new TextEncoder().encode(email),
  );
  const packed = new Uint8Array(iv.length + enc.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(enc), iv.length);
  return b64url(packed);
}

export async function openEmail(event: unknown, uid: string, sealed: string): Promise<string | null> {
  const key = await emailKey(event);
  if (!key) return null;
  try {
    const packed = fromB64url(sealed);
    if (packed.length < 13) return null;
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: packed.slice(0, 12) as BufferSource, additionalData: new TextEncoder().encode(uid) },
      key,
      packed.slice(12) as BufferSource,
    );
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function storeRecoveryCode(event: unknown, uid: string, code: string): Promise<void> {
  const key = await recoveryKey(event);
  const db = knDb(event) as Sql | null;
  if (!key || !db || !(await ensureKn(event))) throw new Error("rcode");
  const h = await hmacText(key, `${uid}:${code}`);
  await db.prepare("INSERT OR REPLACE INTO kn_rcode (h, uid, created_at, used_at) VALUES (?, ?, ?, NULL)").bind(h, uid, Date.now()).run();
}

export async function claimRecoveryCode(event: unknown, uid: string, code: string): Promise<"ok" | "bad" | "used"> {
  const key = await recoveryKey(event);
  const db = knDb(event) as Sql | null;
  if (!key || !db || !(await ensureKn(event))) return "bad";
  const h = await hmacText(key, `${uid}:${code}`);
  const row = await db.prepare("SELECT used_at FROM kn_rcode WHERE h = ? AND uid = ?").bind(h, uid).first<{ used_at: number | null }>();
  if (!row) return "bad";
  if (row.used_at) return "used";
  await db.prepare("UPDATE kn_rcode SET used_at = ? WHERE h = ?").bind(Date.now(), h).run();
  return "ok";
}
