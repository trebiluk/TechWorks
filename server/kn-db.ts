import { knDb } from "./cf-env";

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS kn_meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_staff (uid TEXT PRIMARY KEY, body TEXT NOT NULL, gen INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_session (h TEXT PRIMARY KEY, uid TEXT NOT NULL, gen INTEGER NOT NULL, method TEXT NOT NULL, label TEXT, shared INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, exp INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS kn_session_exp ON kn_session(exp)",
  "CREATE TABLE IF NOT EXISTS kn_onetime (h TEXT PRIMARY KEY, kind TEXT NOT NULL, body TEXT, exp INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_throttle (k TEXT PRIMARY KEY, n INTEGER NOT NULL, exp INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT, detail TEXT, undo TEXT)",
  "CREATE INDEX IF NOT EXISTS kn_audit_at ON kn_audit(at)",
  "CREATE TABLE IF NOT EXISTS kn_control (id TEXT PRIMARY KEY, v INTEGER NOT NULL, body TEXT NOT NULL, at INTEGER NOT NULL, actor TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_control_snap (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, actor TEXT NOT NULL, v INTEGER NOT NULL, body TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_status (id TEXT PRIMARY KEY, hash TEXT NOT NULL, body TEXT NOT NULL, at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bt_worlds (alias_ref TEXT, world TEXT, rev INTEGER NOT NULL, schema INTEGER NOT NULL, app_ver TEXT, head BLOB NOT NULL, bytes INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(alias_ref, world))",
  "CREATE TABLE IF NOT EXISTS bt_chunks (alias_ref TEXT, world TEXT, ck TEXT, hash TEXT NOT NULL, rev INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(alias_ref, world, ck))",
  "CREATE TABLE IF NOT EXISTS bt_world_revs (alias_ref TEXT, world TEXT, rev INTEGER, head BLOB, at INTEGER, why TEXT, PRIMARY KEY(alias_ref, world, rev))",
];

let ready: Promise<void> | null = null;

export async function ensureKn(event: unknown): Promise<boolean> {
  const db = knDb(event);
  if (!db) return false;
  if (!ready) {
    ready = (async () => {
      for (const sql of SCHEMA) await db.prepare(sql).bind().run();
      await applySchema3(db);
    })();
  }
  await ready;
  return true;
}

/** Lets a local proof run ensureKn again in the same process. */
export function resetKnReady() {
  ready = null;
}

const SCHEMA3 = [
  "ALTER TABLE kn_staff ADD COLUMN work_email_norm TEXT",
  "ALTER TABLE kn_staff ADD COLUMN scope TEXT",
  "ALTER TABLE kn_session ADD COLUMN stepup_at INTEGER",
  "CREATE UNIQUE INDEX IF NOT EXISTS kn_staff_work_email ON kn_staff(work_email_norm)",
  "CREATE TABLE IF NOT EXISTS kn_cred (cred_id TEXT PRIMARY KEY, uid TEXT NOT NULL, public_key TEXT NOT NULL, counter INTEGER NOT NULL DEFAULT 0, transports TEXT, created_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_chal (h TEXT PRIMARY KEY, kind TEXT NOT NULL, uid TEXT, exp INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS kn_rcode (h TEXT PRIMARY KEY, uid TEXT NOT NULL, created_at INTEGER NOT NULL, used_at INTEGER)",
  "CREATE INDEX IF NOT EXISTS kn_cred_uid ON kn_cred(uid)",
  "CREATE INDEX IF NOT EXISTS kn_rcode_uid ON kn_rcode(uid)",
];

type Sql = NonNullable<ReturnType<typeof knDb>>;

function duplicateColumn(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /duplicate column/i.test(msg);
}

async function applySchema3(db: Sql) {
  const row = await db.prepare("SELECT v FROM kn_meta WHERE k='schema'").bind().first<{ v: string }>();
  if (row && Number(row.v) >= 3) return;
  for (const sql of SCHEMA3) {
    const stmt = db.prepare(sql).bind();
    try {
      if (typeof db.batch === "function") await db.batch([stmt]);
      else await stmt.run();
    } catch (err) {
      if (!duplicateColumn(err)) throw err;
    }
  }
  await db.prepare("INSERT OR REPLACE INTO kn_meta (k,v) VALUES ('schema','3')").bind().run();
}
