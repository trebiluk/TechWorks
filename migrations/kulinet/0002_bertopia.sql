CREATE TABLE IF NOT EXISTS bt_worlds (alias_ref TEXT, world TEXT, rev INTEGER NOT NULL, schema INTEGER NOT NULL, app_ver TEXT, head BLOB NOT NULL, bytes INTEGER NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(alias_ref, world));
CREATE TABLE IF NOT EXISTS bt_chunks (alias_ref TEXT, world TEXT, ck TEXT, hash TEXT NOT NULL, rev INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(alias_ref, world, ck));
CREATE TABLE IF NOT EXISTS bt_world_revs (alias_ref TEXT, world TEXT, rev INTEGER, head BLOB, at INTEGER, why TEXT, PRIMARY KEY(alias_ref, world, rev));
