/** Offline minigame: 12 names, baked weekly % so school does not need a live feed. */

export const TICKERS = [
  { id: "AAPL", name: "Apple" },
  { id: "MSFT", name: "Microsoft" },
  { id: "NVDA", name: "Nvidia" },
  { id: "AMZN", name: "Amazon" },
  { id: "GOOGL", name: "Alphabet" },
  { id: "META", name: "Meta" },
  { id: "TSLA", name: "Tesla" },
  { id: "JPM", name: "JPMorgan" },
  { id: "V", name: "Visa" },
  { id: "XOM", name: "Exxon" },
  { id: "HD", name: "Home Depot" },
  { id: "DIS", name: "Disney" },
] as const;

export type TickerId = (typeof TICKERS)[number]["id"];

const IDS = new Set<string>(TICKERS.map((t) => t.id));

/** Weekly percent moves, year-to-date-ish. Last value is "now". */
const MOVES: Record<string, number[]> = {
  AAPL: [1.2, -0.4, 0.8, 1.1, -0.6, 0.9, 0.3, 0.5, 0.4, -0.3, 0.7, 0.2, 0.6],
  MSFT: [0.9, 0.6, -0.3, 0.7, 0.4, -0.5, 0.8, 0.2, 0.5, 0.1, -0.2, 0.4, 0.3],
  NVDA: [2.4, -1.8, 1.6, 2.1, -1.2, 1.4, 0.6, 1.1, -0.8, 1.5, 0.4, -0.6, 0.9],
  AMZN: [0.7, 0.9, -0.8, 0.5, 1.0, -0.4, 0.6, 0.3, 0.5, -0.3, 0.8, 0.2, 0.4],
  GOOGL: [0.8, -0.5, 0.9, 0.4, -0.3, 0.7, 0.2, 0.6, 0.3, 0.5, -0.2, 0.4, 0.5],
  META: [1.4, -1.1, 0.8, 1.2, -0.7, 0.9, 0.4, 0.5, 0.6, -0.4, 0.8, 0.2, 0.5],
  TSLA: [2.1, -2.4, 1.8, -1.5, 2.2, -1.0, 1.3, -0.6, 1.6, -1.2, 0.9, -0.8, 1.1],
  JPM: [0.4, 0.3, 0.5, -0.2, 0.4, 0.1, 0.3, 0.2, 0.3, 0.2, 0.4, 0.1, 0.2],
  V: [0.5, 0.4, -0.2, 0.6, 0.3, 0.2, 0.4, 0.1, 0.3, 0.2, 0.4, 0.2, 0.3],
  XOM: [-0.3, 0.8, 0.6, -0.5, 0.7, -0.2, 0.4, 0.3, -0.3, 0.5, 0.2, 0.4, 0.1],
  HD: [0.3, -0.4, 0.5, 0.2, -0.3, 0.6, 0.1, 0.4, 0.2, -0.2, 0.5, 0.3, 0.2],
  DIS: [-0.6, 0.5, -0.4, 0.8, 0.3, -0.5, 0.7, 0.2, 0.4, -0.3, 0.6, 0.1, 0.3],
};

export function cleanPicks(raw: string[] | undefined): TickerId[] {
  const out: TickerId[] = [];
  for (const id of raw ?? []) {
    if (!IDS.has(id) || out.includes(id as TickerId)) continue;
    out.push(id as TickerId);
    if (out.length === 3) break;
  }
  return out;
}

export function tickerPath(id: string): number[] {
  const moves = MOVES[id] ?? [0, 0, 0, 0, 0, 0, 0, 0];
  let v = 1;
  return moves.map((pct) => {
    v *= 1 + pct / 100;
    return v;
  });
}

export function tickerFactor(id: string): number {
  const path = tickerPath(id);
  return path[path.length - 1] ?? 1;
}

export function basketFactor(picks: string[] | undefined, djiaFactor: number): number {
  const three = cleanPicks(picks);
  if (three.length !== 3) return djiaFactor;
  return three.reduce((n, id) => n + tickerFactor(id), 0) / 3;
}

export function basketPath(picks: string[] | undefined, principal: number, djiaFactor: number): { i: number; value: number }[] {
  const three = cleanPicks(picks);
  const weeks = 8;
  const rows: { i: number; value: number }[] = [];
  for (let i = 0; i < weeks; i++) {
    let f = djiaFactor;
    if (three.length === 3) {
      f = three.reduce((n, id) => n + (tickerPath(id)[i] ?? 1), 0) / 3;
    }
    rows.push({ i: i + 1, value: Math.round(principal * f) });
  }
  return rows;
}

export function tickerOf(id: string) {
  return TICKERS.find((t) => t.id === id);
}
