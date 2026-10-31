// Runs test/*.workers.test.ts inside workerd with the real Durable Object (needs `npm install` in this folder).
// The node:test files (join.test.ts, live.test.ts) run without it: npm run test:node
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: ["test/*.workers.test.ts"],
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: { configPath: "./wrangler.toml" },
      },
    },
  },
});
