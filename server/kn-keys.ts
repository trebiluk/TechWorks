import { knSecret } from "./cf-env";

const hmacKeys = new Map<string, CryptoKey>();
const aesKeys = new Map<string, CryptoKey>();

export function resetKnKeys() {
  hmacKeys.clear();
  aesKeys.clear();
}

export function rootBytes(event?: unknown): Uint8Array | null {
  const raw = knSecret(event, "KN_AUTH_KEY");
  if (!raw) return null;
  try {
    const bin = atob(raw);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.length >= 32 ? out : null;
  } catch {
    return null;
  }
}

async function derive(event: unknown, info: string, usage: "hmac" | "aes"): Promise<CryptoKey | null> {
  const root = rootBytes(event);
  if (!root) return null;
  const bag = usage === "hmac" ? hmacKeys : aesKeys;
  const hit = bag.get(info);
  if (hit) return hit;
  const raw = root.buffer.slice(root.byteOffset, root.byteOffset + root.byteLength) as ArrayBuffer;
  const base = await crypto.subtle.importKey("raw", raw, "HKDF", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: new TextEncoder().encode(info) },
    base,
    usage === "aes" ? { name: "AES-GCM", length: 256 } : { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    usage === "aes" ? ["encrypt", "decrypt"] : ["sign"],
  );
  bag.set(info, key);
  return key;
}

export function hkdfReady(event?: unknown): boolean {
  return rootBytes(event) != null;
}

export const kidSessionKey = (event?: unknown) => derive(event, "tw-who-session-v2", "hmac");
export const sessionKey = (event?: unknown) => derive(event, "kn-session-v1", "hmac");
export const recoveryKey = (event?: unknown) => derive(event, "kn-recovery-v1", "hmac");
export const stepupKey = (event?: unknown) => derive(event, "kn-stepup-v1", "hmac");
export const totpKey = (event?: unknown) => derive(event, "kn-totp-v1", "aes");

export async function hmacText(key: CryptoKey, text: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text));
  return b64url(new Uint8Array(sig));
}

export function b64url(bytes: Uint8Array): string {
  let raw = "";
  for (const b of bytes) raw += String.fromCharCode(b);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  crypto.getRandomValues(out);
  return out;
}
