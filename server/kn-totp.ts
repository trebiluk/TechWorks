/** RFC 6238 HMAC-SHA1. No extra dependency. */
export async function hotp(secret: Uint8Array, counter: number, digits = 6): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  const hi = Math.floor(counter / 2 ** 32);
  const lo = counter >>> 0;
  view.setUint32(0, hi);
  view.setUint32(4, lo);
  const raw = secret.buffer.slice(secret.byteOffset, secret.byteOffset + secret.byteLength) as ArrayBuffer;
  const key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const off = sig[sig.length - 1]! & 0x0f;
  const bin = ((sig[off]! & 0x7f) << 24) | (sig[off + 1]! << 16) | (sig[off + 2]! << 8) | sig[off + 3]!;
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export async function totpAt(secret: Uint8Array, unixSec: number, digits = 6): Promise<string> {
  return hotp(secret, Math.floor(unixSec / 30), digits);
}

export function totpDecision(lastStep: number, step: number, matches: boolean): "ok" | "reuse" | "bad" {
  if (step <= lastStep) return "reuse";
  if (!matches) return "bad";
  return "ok";
}

export function throttleHit(count: number): { locked: boolean; until?: number } {
  if (count >= 5) return { locked: true, until: Date.now() + 15 * 60 * 1000 };
  return { locked: false };
}

export function base32(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
