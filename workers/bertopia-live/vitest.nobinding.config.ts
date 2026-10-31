// workerd run WITHOUT a LIVE_DB binding: npm run test:workerd:nobinding (npm test runs it after the D1 run).
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: ["test/nobinding/*.test.ts"],
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: { configPath: "./wrangler.nobinding.test.toml" },
      },
    },
  },
});
