// Runs test/*.workers.test.ts inside workerd with the real Durable Object, real DO SQLite and a local D1
// (needs `npm install` in this folder). The D1 table comes from migrations/0001_live_chunks.sql, applied by
// test/apply-migrations.ts before each test file. The node:test files (join, live, p3) run without any of this:
// npm run test:node
import { fileURLToPath } from "node:url";
import { defineWorkersConfig, readD1Migrations } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrations = await readD1Migrations(fileURLToPath(new URL("./migrations", import.meta.url)));
  return {
    test: {
      include: ["test/*.workers.test.ts"],
      setupFiles: ["./test/apply-migrations.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: { configPath: "./wrangler.test.toml" },
          miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
        },
      },
    },
  };
});
