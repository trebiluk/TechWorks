import type { EconomyFile, RawStudent } from "@/lib/economy";
import { score } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { todayIso } from "@/lib/calendar";

export type PrintSize = "S" | "M" | "L";
export type PrintRarity = "common" | "shiny" | "rare" | "wild";

export type PrintPiece = {
  id: string;
  name: string;
  size: PrintSize;
  rarity: PrintRarity;
  price: number;
  stock: number;
  photo?: string;
  series?: string;
  variant?: string;
  note?: string;
  /** Lifetime printed into the bin. */
  made?: number;
  /** Lifetime released to workers (buy + gift). */
  released?: number;
};

export type PrintEvent = {
  ts: string;
  kind: "print" | "buy" | "trade" | "adjust" | "gift";
  pieceId: string;
  qty: number;
  studentId?: string;
  note?: string;
};

/** 2 rare smalls or 3 shiny smalls = one large from stock. Common smalls stay cash. */
export const TRADE_S_FOR_L: Record<PrintRarity, number> = {
  rare: 2,
  shiny: 3,
  common: 0,
  wild: 0,
};

export const SIZE_LABEL: Record<PrintSize, string> = { S: "Small", M: "Medium", L: "Large" };
export const RARITY_LABEL: Record<PrintRarity, string> = {
  common: "Common",
  shiny: "Shiny",
  rare: "Rare",
  wild: "Wild",
};

function swatch(fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><rect width="160" height="160" rx="28" fill="${fill}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const C = {
  dragon: "#7B2D8E",
  axolotl: "#E889B5",
  snake: "#3D8B5A",
  cheese: "#E8C547",
  custom: "#3B82F6",
  key: "#8B7355",
  gift: "#A855F7",
};

function pid(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24);
}

export const DEFAULT_PRINTS: PrintPiece[] = [
  { id: "dragon-s", name: "Small Dragon", size: "S", rarity: "rare", price: 12, stock: 6, series: "Dragon", photo: swatch(C.dragon) },
  { id: "dragon-m", name: "Medium Dragon", size: "M", rarity: "rare", price: 28, stock: 3, series: "Dragon", photo: swatch(C.dragon) },
  { id: "dragon-l", name: "Large Dragon", size: "L", rarity: "rare", price: 50, stock: 1, series: "Dragon", photo: swatch(C.dragon) },
  { id: "axolotl-s", name: "Small Axolotl", size: "S", rarity: "shiny", price: 8, stock: 8, series: "Axolotl", photo: swatch(C.axolotl) },
  { id: "axolotl-m", name: "Medium Axolotl", size: "M", rarity: "shiny", price: 20, stock: 4, series: "Axolotl", photo: swatch(C.axolotl) },
  { id: "axolotl-l", name: "Large Axolotl", size: "L", rarity: "shiny", price: 40, stock: 2, series: "Axolotl", photo: swatch(C.axolotl) },
  { id: "snake-s", name: "Small Snake", size: "S", rarity: "common", price: 5, stock: 10, series: "Snake", photo: swatch(C.snake) },
  { id: "snake-m", name: "Medium Snake", size: "M", rarity: "common", price: 15, stock: 5, series: "Snake", photo: swatch(C.snake) },
  { id: "snake-l", name: "Large Snake", size: "L", rarity: "common", price: 35, stock: 2, series: "Snake", photo: swatch(C.snake) },
  { id: "cheese-clicker", name: "Cheese Clicker", size: "S", rarity: "shiny", price: 10, stock: 6, series: "Desk", photo: swatch(C.cheese) },
  { id: "keychain", name: "Keychain", size: "S", rarity: "common", price: 4, stock: 12, series: "Desk", photo: swatch(C.key) },
  { id: "custom-s", name: "Custom Choice · Small", size: "S", rarity: "common", price: 10, stock: 0, series: "Custom", photo: swatch(C.custom), note: "They pick the model. Print on request." },
  { id: "custom-m", name: "Custom Choice · Medium", size: "M", rarity: "common", price: 22, stock: 0, series: "Custom", photo: swatch(C.custom), note: "They pick the model. Print on request." },
  { id: "custom-l", name: "Custom Choice · Large", size: "L", rarity: "common", price: 45, stock: 0, series: "Custom", photo: swatch(C.custom), note: "They pick the model. Print on request." },
  { id: "teacher-gift", name: "Custom Teacher Gift", size: "M", rarity: "rare", price: 0, stock: 2, series: "Gift", photo: swatch(C.gift), note: "Not for sale. You grant it." },
];

const OLD_SEED = new Set(["tiny-gear", "hex-token", "bearcat-chip", "bench-buddy", "shiny-paw", "rare-bot", "shop-sign", "legend-totem"]);

export function printsOf(file: EconomyFile): PrintPiece[] {
  const list = file.meta.config?.prints?.pieces;
  if (!list?.length) return DEFAULT_PRINTS;
  if (list.every((p) => OLD_SEED.has(p.id))) return DEFAULT_PRINTS;
  return list;
}

export function printLogOf(file: EconomyFile): PrintEvent[] {
  return (file.meta.config?.prints?.log ?? []) as PrintEvent[];
}

function putPrints(file: EconomyFile, pieces: PrintPiece[], log: PrintEvent[]): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    prints: { pieces, log: log.slice(-80) },
  };
  return next;
}

function pushLog(log: PrintEvent[], ev: Omit<PrintEvent, "ts">): PrintEvent[] {
  return [...log, { ...ev, ts: new Date().toISOString() }].slice(-80);
}

function pushLedger(file: EconomyFile, row: { id: string; type: string; amount: number; date: string; note: string }) {
  file.meta.ledger = [...(file.meta.ledger ?? []), { ts: new Date().toISOString(), ...row }].slice(-400);
}

export function ownedQty(s: RawStudent | undefined, pieceId: string): number {
  return Number(s?.prints?.[pieceId] || 0);
}

export function collectionOf(s: RawStudent | undefined): Record<string, number> {
  return { ...(s?.prints ?? {}) };
}

export function circulation(file: EconomyFile, pieceId: string): number {
  let n = 0;
  for (const s of file.students) n += ownedQty(s, pieceId);
  return n;
}

export function pieceLabel(p: PrintPiece): string {
  return p.variant ? `${p.name} · ${p.variant}` : p.name;
}

export function fidgetCounts(file: EconomyFile, piece: PrintPiece) {
  const out = circulation(file, piece.id);
  const bin = Math.max(0, Number(piece.stock || 0));
  const released = Math.max(Number(piece.released || 0), out);
  const made = Math.max(Number(piece.made || 0), bin + out);
  return { made, released, out, bin };
}

export function fidgetCensus(file: EconomyFile) {
  return printsOf(file).map((piece) => ({ piece, ...fidgetCounts(file, piece) }));
}

export function smallsOfRarity(file: EconomyFile, studentId: string, rarity: PrintRarity): { piece: PrintPiece; qty: number }[] {
  const s = file.students.find((x) => x.id === studentId);
  const out: { piece: PrintPiece; qty: number }[] = [];
  for (const p of printsOf(file)) {
    if (p.size !== "S" || p.rarity !== rarity) continue;
    const qty = ownedQty(s, p.id);
    if (qty > 0) out.push({ piece: p, qty });
  }
  return out;
}

export function smallCount(file: EconomyFile, studentId: string, rarity: PrintRarity): number {
  return smallsOfRarity(file, studentId, rarity).reduce((n, x) => n + x.qty, 0);
}

export function tradeNeed(rarity: PrintRarity): number {
  return TRADE_S_FOR_L[rarity] || 0;
}

export function largesInStock(file: EconomyFile): PrintPiece[] {
  return printsOf(file).filter((p) => p.size === "L" && p.stock > 0);
}

export function buyPrint(file: EconomyFile, studentId: string, pieceId: string): EconomyFile {
  const piece = printsOf(file).find((p) => p.id === pieceId);
  const row = score(file).find((s) => s.id === studentId);
  if (!piece || !row || piece.stock < 1 || piece.price <= 0 || row.quarter < piece.price) return file;
  const next = putPrints(
    file,
    printsOf(file).map((p) =>
      p.id === pieceId ? { ...p, stock: p.stock - 1, released: Number(p.released || 0) + 1 } : p,
    ),
    pushLog(printLogOf(file), { kind: "buy", pieceId, qty: 1, studentId, note: pieceLabel(piece) }),
  );
  pushLedger(next, {
    id: studentId,
    type: "Print",
    amount: -piece.price,
    date: todayIso(),
    note: `${piece.rarity} ${piece.size}: ${piece.name}`,
  });
  next.students = next.students.map((s) => {
    if (s.id !== studentId) return s;
    const prints = { ...(s.prints ?? {}), [pieceId]: ownedQty(s, pieceId) + 1 };
    const purchases = [
      ...(s.purchases ?? []),
      { ts: new Date().toISOString(), item: piece.name, category: `PRINT/${piece.size}/${piece.rarity}`, price: piece.price },
    ];
    return { ...s, deduct: Number(s.deduct || 0) + piece.price, prints, purchases };
  });
  return next;
}

/** No cash. Teacher grant (Custom Teacher Gift, or any $0 piece). */
export function giftPrint(file: EconomyFile, studentId: string, pieceId: string): EconomyFile {
  const piece = printsOf(file).find((p) => p.id === pieceId);
  const row = file.students.find((s) => s.id === studentId);
  if (!piece || !row || piece.stock < 1) return file;
  const next = putPrints(
    file,
    printsOf(file).map((p) =>
      p.id === pieceId ? { ...p, stock: p.stock - 1, released: Number(p.released || 0) + 1 } : p,
    ),
    pushLog(printLogOf(file), { kind: "gift", pieceId, qty: 1, studentId, note: pieceLabel(piece) }),
  );
  next.students = next.students.map((s) => {
    if (s.id !== studentId) return s;
    const prints = { ...(s.prints ?? {}), [pieceId]: ownedQty(s, pieceId) + 1 };
    return { ...s, prints };
  });
  return next;
}

/** Spend N smalls of a rarity, take one large from stock. Wallet unchanged. */
export function tradePrints(file: EconomyFile, studentId: string, rarity: PrintRarity, largeId: string): EconomyFile {
  const need = tradeNeed(rarity);
  const large = printsOf(file).find((p) => p.id === largeId);
  if (need <= 0 || !large || large.size !== "L" || large.stock < 1) return file;
  if (smallCount(file, studentId, rarity) < need) return file;
  const bag = smallsOfRarity(file, studentId, rarity);
  const take: Record<string, number> = {};
  let left = need;
  for (const row of bag) {
    const n = Math.min(row.qty, left);
    take[row.piece.id] = n;
    left -= n;
    if (left <= 0) break;
  }
  const next = putPrints(
    file,
    printsOf(file).map((p) => {
      if (p.id === largeId) return { ...p, stock: p.stock - 1, released: Number(p.released || 0) + 1 };
      const back = take[p.id] || 0;
      return back ? { ...p, stock: p.stock + back } : p;
    }),
    pushLog(printLogOf(file), {
      kind: "trade",
      pieceId: largeId,
      qty: 1,
      studentId,
      note: `${need} ${rarity} S → ${large.name}`,
    }),
  );
  next.students = next.students.map((s) => {
    if (s.id !== studentId) return s;
    const prints = { ...(s.prints ?? {}) };
    for (const [id, n] of Object.entries(take)) {
      prints[id] = Math.max(0, ownedQty(s, id) - n);
      if (!prints[id]) delete prints[id];
    }
    prints[largeId] = ownedQty(s, largeId) + 1;
    return { ...s, prints };
  });
  return next;
}

export function logPrintRun(file: EconomyFile, pieceId: string, qty: number, note?: string): EconomyFile {
  const n = Math.round(qty);
  if (!n) return file;
  const piece = printsOf(file).find((p) => p.id === pieceId);
  if (!piece) return file;
  return putPrints(
    file,
    printsOf(file).map((p) =>
      p.id === pieceId
        ? {
            ...p,
            stock: Math.max(0, p.stock + n),
            made: n > 0 ? Number(p.made || 0) + n : Number(p.made || 0),
          }
        : p,
    ),
    pushLog(printLogOf(file), { kind: n > 0 ? "print" : "adjust", pieceId, qty: n, note: note || pieceLabel(piece) }),
  );
}

export function upsertPiece(file: EconomyFile, piece: PrintPiece): EconomyFile {
  const list = printsOf(file);
  const id = piece.id || pid([piece.series, piece.name, piece.variant, piece.size, piece.rarity].filter(Boolean).join("-"));
  const row: PrintPiece = {
    ...piece,
    id,
    name: piece.name.trim() || "Print",
    variant: piece.variant?.trim() || undefined,
    price: Math.max(0, Math.round(piece.price)),
    stock: Math.max(0, Math.round(piece.stock)),
    made: Math.max(0, Math.round(piece.made || 0)),
    released: Math.max(0, Math.round(piece.released || 0)),
  };
  const i = list.findIndex((p) => p.id === id);
  const pieces = i >= 0 ? list.map((p, idx) => (idx === i ? row : p)) : [...list, row];
  return putPrints(file, pieces, printLogOf(file));
}

export function dropPiece(file: EconomyFile, pieceId: string): EconomyFile {
  return putPrints(
    file,
    printsOf(file).filter((p) => p.id !== pieceId),
    printLogOf(file),
  );
}

export function duplicateVariant(file: EconomyFile, pieceId: string, variant: string): EconomyFile {
  const src = printsOf(file).find((p) => p.id === pieceId);
  const v = variant.trim();
  if (!src || !v) return file;
  const id = pid(`${src.id}-${v}`);
  if (printsOf(file).some((p) => p.id === id)) return file;
  return upsertPiece(file, {
    ...src,
    id,
    variant: v,
    stock: 0,
    made: 0,
    released: 0,
    note: src.note,
  });
}

export function resetPrintCatalog(file: EconomyFile): EconomyFile {
  return putPrints(file, DEFAULT_PRINTS, printLogOf(file));
}

export async function compressPrintPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const w = 320;
  const h = Math.max(1, Math.round((bmp.height / bmp.width) * w));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return c.toDataURL("image/jpeg", 0.72);
}
