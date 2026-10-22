import { knDb } from "./cf-env";
import { ensureKn } from "./kn-db";
import { hmacText, recoveryKey } from "./kn-keys";

type Bound = {
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type Sql = {
  prepare: (sql: string) => { bind: (...args: unknown[]) => Bound };
};

/** Stores HMAC(challenge) in kn_chal. The raw challenge is not written. */
export async function saveChallenge(event: unknown, kind: string, challenge: string, ttlMs: number, uid = ""): Promise<void> {
  const key = await recoveryKey(event);
  const db = knDb(event) as Sql | null;
  if (!key || !db || !(await ensureKn(event))) throw new Error("chal");
  const h = await hmacText(key, challenge);
  await db.prepare("INSERT OR REPLACE INTO kn_chal (h, kind, uid, exp) VALUES (?, ?, ?, ?)").bind(h, kind, uid, Date.now() + ttlMs).run();
}

export async function takeChallenge(event: unknown, kind: string, challenge: string): Promise<{ ok: true; uid: string } | { ok: false }> {
  const key = await recoveryKey(event);
  const db = knDb(event) as Sql | null;
  if (!key || !db || !(await ensureKn(event))) return { ok: false };
  const h = await hmacText(key, challenge);
  const row = await db.prepare("SELECT kind, uid, exp FROM kn_chal WHERE h = ?").bind(h).first<{ kind: string; uid: string | null; exp: number }>();
  if (!row || row.kind !== kind || row.exp <= Date.now()) return { ok: false };
  await db.prepare("DELETE FROM kn_chal WHERE h = ?").bind(h).run();
  return { ok: true, uid: row.uid ?? "" };
}
