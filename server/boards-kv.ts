/** Hub boards. Alias and class code only. No real names. KV when bound. */

import { openKv } from "./cf-env";

export type BoardRow = {
  alias: string;
  classCode: string;
  game: string;
  board: string;
  value: number;
  unit: string;
  higher: boolean;
  kit: string;
  version: string;
  ts: number;
  verified: true;
};

const KEY = "tw-boards-v1";
const MAX = 800;
const GAMES = new Set(["rampfill", "holdit", "berty-run", "catapult", "blocks"]);
const ADJ = ["swift", "bright", "calm", "keen", "bold", "quiet", "rapid", "solid"];
const ANIMAL = ["otter", "robin", "panda", "fox", "whale", "heron", "gopher", "beetle"];
const NUM = ["12", "24", "36", "42"];

function allowed(raw: unknown) {
  const name = String(raw ?? "").replace(/\s+/g, " ").trim();
  const parts = name.toLowerCase().split(" ");
  if (parts.length !== 3) return "";
  if (!ADJ.includes(parts[0]) || !ANIMAL.includes(parts[1]) || !NUM.includes(parts[2])) return "";
  return parts.map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
}

export function sanitizeBoard(src: unknown): BoardRow | null {
  if (!src || typeof src !== "object") return null;
  const row = src as Partial<BoardRow>;
  const alias = allowed(row.alias);
  const game = String(row.game ?? "").slice(0, 24);
  const board = String(row.board ?? "").replace(/[^a-z]/g, "").slice(0, 16);
  const value = Number(row.value);
  if (!alias || !GAMES.has(game) || !board || !Number.isFinite(value) || value < 0 || value > 9999) return null;
  return {
    alias,
    classCode: String(row.classCode ?? "SMS").replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "SMS",
    game,
    board,
    value: Math.round(value * 100) / 100,
    unit: String(row.unit ?? "").slice(0, 8),
    higher: row.higher !== false,
    kit: String(row.kit ?? "").slice(0, 16),
    version: String(row.version ?? "").slice(0, 16),
    ts: Number(row.ts) || Date.now(),
    verified: true,
  };
}

export async function loadBoards(event: unknown): Promise<{ rows: BoardRow[]; store: "kv" | "file" | "none" }> {
  const kv = await openKv(event);
  if (!kv) return { rows: [], store: "none" };
  const raw = await kv.get(KEY);
  const store = process.env.CF_PAGES || process.env.NITRO_PRESET === "cloudflare_pages" ? "kv" : "file";
  if (!raw) return { rows: [], store };
  try {
    const parsed = JSON.parse(raw) as { rows?: unknown[] };
    const rows = (Array.isArray(parsed.rows) ? parsed.rows : []).map(sanitizeBoard).filter((row): row is BoardRow => !!row);
    return { rows: rows.slice(-MAX), store };
  } catch {
    return { rows: [], store };
  }
}

export async function saveBoard(event: unknown, row: BoardRow) {
  const kv = await openKv(event);
  if (!kv) return "none" as const;
  const { rows } = await loadBoards(event);
  rows.push(row);
  await kv.put(KEY, JSON.stringify({ rows: rows.slice(-MAX) }));
  return "kv" as const;
}
