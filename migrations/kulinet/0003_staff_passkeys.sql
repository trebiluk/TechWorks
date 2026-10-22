ALTER TABLE kn_staff ADD COLUMN work_email_norm TEXT;
ALTER TABLE kn_staff ADD COLUMN scope TEXT;
ALTER TABLE kn_session ADD COLUMN stepup_at INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS kn_staff_work_email ON kn_staff(work_email_norm);
CREATE TABLE IF NOT EXISTS kn_cred (
  cred_id TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kn_chal (
  h TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  uid TEXT,
  exp INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kn_rcode (
  h TEXT PRIMARY KEY,
  uid TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  used_at INTEGER
);
CREATE INDEX IF NOT EXISTS kn_cred_uid ON kn_cred(uid);
CREATE INDEX IF NOT EXISTS kn_rcode_uid ON kn_rcode(uid);
