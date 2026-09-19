/** Public school-door links. Same TW_DESK KV, key door-links. Not student data. */

export type DoorLink = {
  id: string;
  name: string;
  href: string;
  icon: string;
};

export type DoorPack = {
  kind: "tech-room-included";
  updated: string;
  links: DoorLink[];
};

const ICONS = new Set([
  "link",
  "globe",
  "bookmark",
  "video",
  "file",
  "game",
  "music",
  "calc",
  "news",
  "school",
]);
const MAX = 24;

type Kv = { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> };

function kvOf(event: { context?: Record<string, unknown> }): Kv | null {
  const ctx = event.context ?? {};
  const cf = ctx.cloudflare as { env?: Record<string, unknown> } | undefined;
  const ns = cf?.env?.TW_DESK as Kv | undefined;
  if (ns && typeof ns.get === "function" && typeof ns.put === "function") return ns;
  return null;
}

function cleanUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.href.length > 2048) return null;
  return url.href;
}

export function sanitizePack(raw: unknown): DoorPack {
  const src = raw && typeof raw === "object" ? (raw as Partial<DoorPack>) : {};
  const links: DoorLink[] = [];
  const seen = new Set<string>();
  const rows = Array.isArray(src.links) ? src.links : [];
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const row = item as Partial<DoorLink>;
    const name = String(row.name ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
    const href = cleanUrl(String(row.href ?? ""));
    if (!name || !href) continue;
    const id =
      typeof row.id === "string" && row.id.startsWith("cut-")
        ? row.id.slice(0, 24)
        : `cut-${links.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const icon = ICONS.has(String(row.icon)) ? String(row.icon) : "link";
    links.push({ id, name, href, icon });
    if (links.length >= MAX) break;
  }
  return {
    kind: "tech-room-included",
    updated: typeof src.updated === "string" ? src.updated.slice(0, 40) : new Date().toISOString(),
    links,
  };
}

export async function loadDoor(event: {
  context?: Record<string, unknown>;
}): Promise<{ pack: DoorPack; store: "kv" | "none" }> {
  const kv = kvOf(event);
  if (!kv) return { pack: sanitizePack({ links: [] }), store: "none" };
  const raw = await kv.get("door-links");
  if (!raw) return { pack: sanitizePack({ links: [] }), store: "kv" };
  try {
    return { pack: sanitizePack(JSON.parse(raw)), store: "kv" };
  } catch {
    return { pack: sanitizePack({ links: [] }), store: "kv" };
  }
}

export async function saveDoor(
  event: { context?: Record<string, unknown> },
  pack: DoorPack,
): Promise<"kv" | "none"> {
  const kv = kvOf(event);
  if (!kv) return "none";
  await kv.put("door-links", JSON.stringify(sanitizePack(pack)));
  return "kv";
}
