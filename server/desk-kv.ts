/** Cloudflare KV when bound as TW_DESK. Preview uses the Vite /api/desk plugin. */

import { deskKv } from "./cf-env";

export type DeskRow = {
  keyHash: string;
  saved: string;
  app: string;
  n: number;
  salt: string;
  iv: string;
  data: string;
};

export async function loadRow(event: unknown): Promise<{ row: DeskRow | null; store: "kv" | "none" }> {
  const kv = deskKv(event);
  if (!kv) return { row: null, store: "none" };
  const raw = await kv.get("desk");
  if (!raw) return { row: null, store: "kv" };
  try {
    return { row: JSON.parse(raw) as DeskRow, store: "kv" };
  } catch {
    return { row: null, store: "kv" };
  }
}

export async function saveRow(event: unknown, row: DeskRow): Promise<"kv" | "none"> {
  const kv = deskKv(event);
  if (!kv) return "none";
  await kv.put("desk", JSON.stringify(row));
  return "kv";
}
