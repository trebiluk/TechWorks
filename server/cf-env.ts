/** TW_DESK KV. Nitro v3 exposes bindings on event.req.runtime.cloudflare.env. */

export type Kv = {
  get: (k: string) => Promise<string | null>;
  put: (k: string, v: string) => Promise<void>;
};

type Loose = {
  req?: { runtime?: { cloudflare?: { env?: Record<string, unknown> } } };
  context?: Record<string, unknown>;
};

function envOf(event: unknown): Record<string, unknown> | null {
  const e = (event ?? {}) as Loose;
  const ctx = e.context ?? {};
  const cf = ctx.cloudflare as { env?: Record<string, unknown> } | undefined;
  const runtime = ctx.runtime as { cloudflare?: { env?: Record<string, unknown> } } | undefined;
  return (
    e.req?.runtime?.cloudflare?.env ??
    cf?.env ??
    runtime?.cloudflare?.env ??
    (ctx.env as Record<string, unknown> | undefined) ??
    null
  );
}

export function deskKv(event: unknown): Kv | null {
  const ns = envOf(event)?.TW_DESK as Kv | undefined;
  if (ns && typeof ns.get === "function" && typeof ns.put === "function") return ns;
  return null;
}
