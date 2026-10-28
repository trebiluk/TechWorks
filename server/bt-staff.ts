import { knDb } from "./cf-env";
import { BT_SQL, restoreRev, aliasRefOf, deleteAliasSaves } from "./bt-world";
import { listTestWho, dropTestWho, read as readWho } from "./who-kv";
import { loadRow } from "./desk-kv";

type WorldRow = { alias_ref: string; world: string; rev: number; bytes: number; updated_at: number };

async function aliasMap(event: unknown): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const rows = await readWho(event);
    // Note: full HMAC reverse requires the same aliasKey as bt-world; for staff list we show alias when we can match code.
    // Unmapped show "unknown alias". Real mapping uses the same HMAC(session.code) as kid gate.
    for (const row of rows) {
      map.set(row.code, row.alias);
    }
  } catch {}
  return map;
}

export async function listStaffWorlds(event: unknown) {
  const db = knDb(event);
  if (!db) return [];
  const listed = await db.prepare(BT_SQL.staffWorlds).all<WorldRow>();
  const rows = listed.results ?? [];
  const codes = await aliasMap(event);
  return rows.map((row) => ({
    alias: codes.get(row.alias_ref.slice(0, 5)) || "unknown alias",
    world: row.world,
    rev: row.rev,
    bytes: row.bytes,
    updatedAt: row.updated_at,
    alias_ref: row.alias_ref,
  }));
}

export async function listStaffRevs(event: unknown, aliasRef: string, world: string) {
  const db = knDb(event);
  if (!db) return [];
  const listed = await db.prepare(BT_SQL.staffRevs).bind(aliasRef, world).all<{ rev: number; at: number; why: string }>();
  return (listed.results ?? []).map((row) => ({ rev: row.rev, at: row.at, why: row.why }));
}

export async function restoreStaffRev(event: unknown, aliasRef: string, world: string, rev: number, ifMatch: string) {
  return restoreRev(event, aliasRef, world, rev, ifMatch);
}

/** Desk key required. Deletes test alias rows and their Bertopia saves. Nothing else. */
export async function wipeTestStudents(event: unknown, token: string): Promise<
  { ok: true; n: number; aliases: string[]; saves: number } | { ok: false; error: "deny" | "none" }
> {
  const { row } = await loadRow(event);
  if (!row || row.keyHash !== token) return { ok: false, error: "deny" };
  const gone = await listTestWho(event);
  let saves = 0;
  for (const person of gone) {
    const ref = await aliasRefOf(event, person.code);
    if (!ref) continue;
    saves += await deleteAliasSaves(event, ref);
  }
  const dropped = await dropTestWho(event);
  if (dropped === "none") return { ok: false, error: "none" };
  return { ok: true, n: dropped.n, aliases: dropped.aliases, saves };
}
