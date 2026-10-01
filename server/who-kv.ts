/** Public alias book. No legal names. The pin stays a hash. */

import { openKv } from "./cf-env";
import { loadMarks } from "./marks-kv";
import { hashStudentPin } from "./pin-hash";
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

/** Stays on the book after a desk save. Not a student. */
const PROVE: WhoRow = {
  id: "mbw-bot",
  alias: "MbwBot",
  avatar: "🐾",
  code: "MBW42",
  pinHash: hashStudentPin("mbw-bot", "4242"),
};

function withProve(rows: WhoRow[]): WhoRow[] {
  const rest = rows.filter((row) => row.code !== PROVE.code && row.id !== PROVE.id);
  return rest.concat(PROVE).slice(0, MAX);
}

function clip(raw: unknown, max: number) {
  return String(raw ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function pinHashOf(id: string, pin: string) {
  return hashStudentPin(id, pin);
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
  const kv = await openKv(event);
  if (!kv) return [PROVE];
  const raw = await kv.get(DATA_KEY);
  let rows: WhoRow[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { people?: unknown[] };
      const incoming = Array.isArray(parsed.people) ? parsed.people : [];
      rows = incoming.map(clean).filter((row): row is WhoRow => !!row).slice(0, MAX);
    } catch {
      rows = [];
    }
  }
  const next = withProve(rows);
  const kept = rows.some((row) => row.id === PROVE.id && row.code === PROVE.code && row.alias === PROVE.alias && row.pinHash === PROVE.pinHash);
  if (!kept) await kv.put(DATA_KEY, JSON.stringify({ v: 1, people: next }));
  return next;
}

export async function codeKnown(event: unknown, code: string): Promise<boolean> {
  const shop = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  if (shop.length !== 5) return false;
  const rows = await read(event);
  if (rows.some((row) => row.code === shop)) return true;
  const { marks } = await loadMarks(event);
  return marks.some((row) => row.code === shop);
}

export async function whoByCode(event: unknown, code: string): Promise<WhoRow | null> {
  const shop = code.toUpperCase().replace(/[^A-Z2-9]/g, "");
  const rows = await read(event);
  return rows.find((row) => row.code === shop) ?? null;
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
  const kv = await openKv(event);
  if (!kv) return "none" as const;
  const people = withProve(incoming.map(clean).filter((item): item is WhoRow => !!item));
  await kv.put(DATA_KEY, JSON.stringify({ v: 1, people }));
  return "kv" as const;
}
