// Setup file for the workerd tests: create the D1 table from the real migration.
import { applyD1Migrations, env } from "cloudflare:test";

await applyD1Migrations(env.LIVE_DB, env.TEST_MIGRATIONS);
