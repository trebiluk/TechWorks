// Types for the workerd tests (not part of the root typecheck).
declare module "cloudflare:test" {
  interface ProvidedEnv {
    BERTOPIA_WORLD: DurableObjectNamespace;
    LIVE_DB: D1Database;
    TEST_MIGRATIONS: Array<{ name: string; queries: string[] }>;
  }
}
