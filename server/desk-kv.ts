/** Cloudflare KV when bound as TW_DESK. Preview uses the Vite /api/desk plugin. */

export type DeskRow = {
  keyHash: string;
  saved: string;
  app: string;
  n: number;
  salt: string;
  iv: string;
  data: string;
};

type Kv = { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> };

function kvOf(event: { context?: Record<string, unknown> }): Kv | null {
  const ctx = event.context ?? {};
  const cf = ctx.cloudflare as { env?: Record<string, unknown> } | undefined;
  const ns = cf?.env?.TW_DESK as Kv | undefined;
  if (ns && typeof ns.get === "function" && typeof ns.put === "function") return ns;
  return null;
}

export async function loadRow(event: { context?: Record<string, unknown> }): Promise<{ row: DeskRow | null; store: "kv" | "none" }> {
  const kv = kvOf(event);
  if (!kv) return { row: null, store: "none" };
  const raw = await kv.get("desk");
  if (!raw) return { row: null, store: "kv" };
  try {
    return { row: JSON.parse(raw) as DeskRow, store: "kv" };
  } catch {
    return { row: null, store: "kv" };
  }
}

export async function saveRow(event: { context?: Record<string, unknown> }, row: DeskRow): Promise<"kv" | "none"> {
  const kv = kvOf(event);
  if (!kv) return "none";
  await kv.put("desk", JSON.stringify(row));
  return "kv";
}
