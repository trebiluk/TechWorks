-- D1 copy of the shared Bertopia worlds (main, game-1, game-2). Dark: not applied anywhere yet.
-- One row per chunk that has live edits. cells is JSON [[x,y,z,block], ...]. Aliases and game data only.
CREATE TABLE IF NOT EXISTS bt_live_chunks (
  world TEXT NOT NULL,
  ck TEXT NOT NULL,
  rev INTEGER NOT NULL,
  cells TEXT NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (world, ck)
);
