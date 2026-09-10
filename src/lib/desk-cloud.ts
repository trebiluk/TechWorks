import { APP_VERSION } from "@/lib/version";
import { packVault, unpackVault, persistVault, applyVaultClub, type VaultBundle } from "@/lib/vault";
import { loadDeck, saveDeck, type DeckPack } from "@/lib/deck-store";
import type { EconomyFile } from "@/lib/economy";
import { isDemoStudentId, stripFakeDemo } from "@/lib/demo";

const KEY = "techworks-desk-key";
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PREFIX = "techworks-desk-v1:";

export type CloudStatus = "off" | "this-pc" | "saving" | "saved" | "behind" | "error" | "need-key";

export type CloudPack = {
  kind: "techworks-cloud";
  v: 1;
  saved: string;
  app: string;
  vault: VaultBundle;
  deck: DeckPack;
};

export type CloudMeta = {
  ok: boolean;
  saved?: string;
  n?: number;
  app?: string;
  store?: "kv" | "file" | "none";
};

let status: CloudStatus = "off";
let lastSaved = "";
let lastError = "";

export function cloudStatus(): CloudStatus {
  return status;
}
export function cloudSavedAt(): string {
  return lastSaved;
}
export function cloudError(): string {
  return lastError;
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("techworks-cloud"));
}

function setStatus(next: CloudStatus, err = "") {
  status = next;
  lastError = err;
  emit();
}

export function formatDeskKey(raw: string): string {
  const k = raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
  if (k.length <= 4) return k;
  return `${k.slice(0, 4)}-${k.slice(4, 8)}${k.length > 8 ? `-${k.slice(8, 12)}` : ""}`;
}

export function storedDeskKey(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(KEY) ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function saveDeskKey(raw: string) {
  if (typeof window === "undefined") return;
  const k = raw.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 12);
  if (k.length < 8) return;
  window.localStorage.setItem(KEY, k);
  emit();
}

export function forgetDeskKey() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  setStatus("need-key");
}

export function mintDeskKey(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHA[b & 31];
  saveDeskKey(out);
  return out;
}

export function ensureDeskKey(): string {
  return storedDeskKey() || mintDeskKey();
}

async function shaHex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function deskToken(key = storedDeskKey()): Promise<string> {
  if (!key) return "";
  return shaHex(PREFIX + key);
}

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]!);
  return btoa(s);
}

function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

async function aesKey(pass: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 80_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptPack(pack: CloudPack, pass: string): Promise<{ salt: string; iv: string; data: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(pass, salt);
  const plain = new TextEncoder().encode(JSON.stringify(pack));
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, plain);
  return { salt: b64(salt), iv: b64(iv), data: b64(data) };
}

async function decryptPack(salt: string, iv: string, data: string, pass: string): Promise<CloudPack | null> {
  try {
    const key = await aesKey(pass, unb64(salt));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: unb64(iv) as BufferSource },
      key,
      unb64(data) as BufferSource,
    );
    const pack = JSON.parse(new TextDecoder().decode(plain)) as CloudPack;
    if (pack?.kind !== "techworks-cloud" || !pack.vault) return null;
    return pack;
  } catch {
    return null;
  }
}

function headers(): HeadersInit {
  return { "content-type": "application/json" };
}

export function cloudPackCount(pack: CloudPack): number {
  return pack.vault?.students ?? pack.vault?.desk?.file?.students?.length ?? 0;
}

export function buildCloudPack(file: EconomyFile): CloudPack {
  const real = stripFakeDemo(file);
  return {
    kind: "techworks-cloud",
    v: 1,
    saved: new Date().toISOString(),
    app: APP_VERSION,
    vault: packVault(real, "Cloud desk"),
    deck: loadDeck(),
  };
}

export async function pushCloud(file: EconomyFile): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const pass = ensureDeskKey();
  const token = await deskToken(pass);
  const real = stripFakeDemo(file);
  const pack = buildCloudPack(real);
  setStatus("saving");
  try {
    const enc = await encryptPack(pack, pass);
    const body = {
      saved: pack.saved,
      app: pack.app,
      n: real.students.length,
      ...enc,
    };
    const res = await fetch("/api/desk", { method: "PUT", headers: headers(), body: JSON.stringify({ ...body, keyHash: token }) });
    if (res.status === 503) {
      setStatus("this-pc");
      return false;
    }
    if (!res.ok) {
      setStatus("error", `save ${res.status}`);
      return false;
    }
    lastSaved = pack.saved;
    setStatus("saved");
    return true;
  } catch {
    setStatus("error", "offline");
    return false;
  }
}

export async function pullCloud(): Promise<CloudPack | null> {
  if (typeof window === "undefined") return null;
  const pass = storedDeskKey();
  if (!pass) {
    setStatus("need-key");
    return null;
  }
  const token = await deskToken(pass);
  try {
    const res = await fetch(`/api/desk?k=${encodeURIComponent(token)}`);
    if (res.status === 404) {
      setStatus("saved");
      return null;
    }
    if (res.status === 401) {
      setStatus("need-key");
      return null;
    }
    if (res.status === 503) {
      setStatus("this-pc");
      return null;
    }
    if (!res.ok) {
      setStatus("error", `load ${res.status}`);
      return null;
    }
    const row = (await res.json()) as { salt?: string; iv?: string; data?: string; saved?: string; store?: CloudMeta["store"] };
    if (!row.salt || !row.iv || !row.data) {
      setStatus("this-pc");
      return null;
    }
    const pack = await decryptPack(row.salt, row.iv, row.data, pass);
    if (!pack) {
      setStatus("need-key");
      return null;
    }
    lastSaved = pack.saved;
    setStatus("saved");
    return pack;
  } catch {
    setStatus("error", "offline");
    return null;
  }
}

export async function applyCloudPack(pack: CloudPack): Promise<EconomyFile | null> {
  const opened = unpackVault(pack.vault);
  if (!opened?.file) return null;
  applyVaultClub(opened.club);
  if (pack.deck?.slides?.length) saveDeck(pack.deck);
  await persistVault(opened.file);
  return opened.file;
}

export function localIsNewer(file: EconomyFile, cloudSaved: string): boolean {
  const local = file.meta.savedAt ?? "";
  return Boolean(local && cloudSaved && local > cloudSaved);
}

/** Who wins when this PC and the cloud disagree. Never auto-push an empty desk over names. */
export function cloudSyncPlan(localN: number, cloudN: number, localNewer: boolean, sameStamp: boolean): "push" | "pull" | "keep" {
  if (localN === 0 && cloudN > 0) return "pull";
  if (cloudN === 0 && localN > 0) return "push";
  if (localN === 0 && cloudN === 0) return "keep";
  if (sameStamp) return "keep";
  if (localNewer) return "push";
  return "pull";
}

function realCount(file: EconomyFile): number {
  return file.students.filter((s) => !isDemoStudentId(s.id)).length;
}

let pushTimer = 0;
export function scheduleCloudPush(file: EconomyFile) {
  if (typeof window === "undefined") return;
  if (realCount(file) === 0) return;
  if (pushTimer) window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    pushTimer = 0;
    void pushCloud(file);
  }, 1200);
}
