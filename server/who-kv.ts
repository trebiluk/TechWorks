/** Public alias book. No legal names. The pin stays a hash. */

import { deskKv } from "./cf-env";
import { loadRow } from "./desk-kv";

export type WhoRow = {
  id: string;
  alias: string;
  avatar: string;
  code: string;
  pinHash: string;
};

const DATA_KEY = "tw-who-v1";
const MAX = 400;

function clip(raw: unknown, max: number) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function pinHashOf(id: string, pin: string) {
  let h1 = 2166136261;
  let h2 = 2166136261 ^ 0x9e3779b9;
  const s = `${id}|${pin}|tw-pin`;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ s.charCodeAt(s.length - 1 - i), 2246822519);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
}

function clean(src: unknown): WhoRow | null {
  if (!src || typeof src !== "object") return null;
  const row = src as { id?: unknown; alias?: unknown; avatar?: unknown; code?: unknown; pinHash?: unknown };
  const id = clip(row.id, 40);
  const alias = clip(row.alias, 16);
  const avatar = clip(row.avatar, 8);
  const code = clip(row.code, 5).toUpperCase().replace(/[^A-Z2-9]/g, "");
  const pinHash = clip(row.pinHash, 16);
  if (!id || alias.length < 2 || code.length !== 5) return null;
  if (pinHash && !/^[0-9a-f]{16}$/.test(pinHash)) return null;
  return { id, alias, avatar: avatar || "🐾", code, pinHash };
}

async function read(event: unknown): Promise<WhoRow[]> {
  const kv = deskKv(event);
  if (!kv) return [];
  const raw = await kv.get(DATA_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { people?: unknown[] };
    const rows = Array.isArray(parsed.people) ? parsed.people : [];
    return rows.map(clean).filter((row): row is WhoRow => !!row).slice(0, MAX);
  } catch {
    return [];
  }
}

export async function searchWho(event: unknown, q: string) {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const rows = await read(event);
  return rows
    .filter((row) => row.alias.toLowerCase().includes(needle))
    .slice(0, 8)
    .map((row) => ({ alias: row.alias, avatar: row.avatar }));
}

export async function enterWho(event: unknown, alias: string, code: string, pin: string) {
  const name = alias.trim().toLowerCase();
  const shop = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  const digits = pin.replace(/\D/g, "");
  if (shop.length !== 5 || digits.length !== 4) return { ok: false as const, error: "Need the 5-character code and the PIN." };
  const rows = (await read(event)).filter((row) => row.code === shop);
  const hit = name.length >= 2 ? rows.find((row) => row.alias.toLowerCase() === name) : rows.length === 1 ? rows[0] : undefined;
  if (!hit) return { ok: false as const, error: name.length >= 2 ? "That name and code do not match." : "That code is not on the list." };
  if (!hit.pinHash) return { ok: false as const, error: "Ask your teacher to set your PIN in TechWorks." };
  if (pinHashOf(hit.id, digits) !== hit.pinHash) return { ok: false as const, error: "That PIN does not match." };
  return { ok: true as const, alias: hit.alias, code: hit.code, verified: true as const, picture: hit.avatar };
}

export async function saveWho(event: unknown, token: string, incoming: unknown[]) {
  const { row } = await loadRow(event);
  if (!row || row.keyHash !== token) return "deny" as const;
  const kv = deskKv(event);
  if (!kv) return "none" as const;
  const people = incoming.map(clean).filter((item): item is WhoRow => !!item).slice(0, MAX);
  await kv.put(DATA_KEY, JSON.stringify({ v: 1, people }));
  return "kv" as const;
}
