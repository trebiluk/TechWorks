import type { EconomyFile, RawStudent } from "@/lib/economy";
import { isLiveStudent, padFirst } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { todayIso } from "@/lib/calendar";
import { setTeachMaterials, teachDay } from "@/lib/teach";

export const INV_KINDS = ["ppe", "tool", "machine", "consumable", "material", "kit"] as const;
export type InvKind = (typeof INV_KINDS)[number];

export const KIND_LABEL: Record<InvKind, string> = {
  ppe: "PPE",
  tool: "Tool",
  machine: "Machine",
  consumable: "Consumable",
  material: "Material",
  kit: "Kit",
};

export type InvItem = {
  id: string;
  name: string;
  kind: InvKind;
  qty: number;
  par?: number;
  bin?: string;
  station?: string;
  unit?: string;
  note?: string;
  broken?: boolean;
};

export type InvHold = {
  id: string;
  itemId: string;
  qty: number;
  /** Alias, crew letter, or station. Never a legal name. */
  who: string;
  whoKind: "alias" | "crew" | "station";
  studentId?: string;
  crewKey?: string;
  period?: number;
  outAt: string;
  note?: string;
};

export type InvEvent = {
  ts: string;
  kind: "in" | "out" | "take" | "adjust" | "add" | "drop" | "fix";
  itemId: string;
  qty: number;
  who?: string;
  note?: string;
};

export type CribFile = {
  items: InvItem[];
  holds: InvHold[];
  log: InvEvent[];
};

function row(id: string, name: string, kind: InvKind, qty: number, par: number, bin: string, extra: Partial<InvItem> = {}): InvItem {
  return { id, name, kind, qty, par, bin, unit: extra.unit ?? "ea", station: extra.station, note: extra.note };
}

/** Middle-school shop kit. First open only — an empty crib you saved stays empty. */
export const FACTORY_CRIB: InvItem[] = [
  row("safety-glasses", "Safety glasses", "ppe", 32, 28, "Crib", { station: "Enter" }),
  row("push-stick", "Push stick", "ppe", 6, 4, "Saw", { station: "Saw" }),
  row("apron", "Apron", "ppe", 12, 10, "Crib"),
  row("ear-muffs", "Ear muffs", "ppe", 8, 6, "Crib"),
  row("try-square", "Try square", "tool", 16, 12, "Measure", { station: "Measure" }),
  row("rule", "Rule", "tool", 20, 16, "Measure", { station: "Measure" }),
  row("clamp", "Clamp", "tool", 24, 16, "Glue", { station: "Glue" }),
  row("caliper", "Caliper", "tool", 4, 3, "Measure", { station: "Measure" }),
  row("backsaw", "Backsaw", "tool", 8, 6, "Saw", { station: "Saw" }),
  row("coping-saw", "Coping saw", "tool", 6, 4, "Saw", { station: "Saw" }),
  row("file", "File", "tool", 12, 8, "Bench"),
  row("rasp", "Rasp", "tool", 8, 4, "Bench"),
  row("chisel", "Chisel", "tool", 8, 6, "Bench"),
  row("mallet", "Mallet", "tool", 6, 4, "Bench"),
  row("drill", "Drill", "tool", 4, 2, "Drill", { station: "Drill" }),
  row("bit-set", "Bit set", "tool", 3, 2, "Drill", { station: "Drill" }),
  row("glue-gun", "Hot glue gun", "tool", 8, 6, "Glue", { station: "Glue" }),
  row("vise", "Vise", "tool", 6, 6, "Bench", { station: "Bench" }),
  row("band-saw", "Band saw", "machine", 1, 1, "Machine", { station: "Saw" }),
  row("disk-sander", "Disk sander", "machine", 1, 1, "Machine", { station: "Sand" }),
  row("drill-press", "Drill press", "machine", 1, 1, "Machine", { station: "Drill" }),
  row("scroll-saw", "Scroll saw", "machine", 1, 1, "Machine", { station: "Saw" }),
  row("grit-80", "Sandpaper 80", "consumable", 20, 8, "Finish", { unit: "sheets", station: "Sand" }),
  row("grit-120", "Sandpaper 120", "consumable", 20, 8, "Finish", { unit: "sheets", station: "Sand" }),
  row("grit-180", "Sandpaper 180", "consumable", 16, 6, "Finish", { unit: "sheets", station: "Sand" }),
  row("wood-glue", "Wood glue", "consumable", 6, 2, "Glue", { unit: "bottles", station: "Glue" }),
  row("glue-sticks", "Glue sticks", "consumable", 40, 12, "Glue", { unit: "sticks", station: "Glue" }),
  row("pencils", "Pencils", "consumable", 48, 20, "Measure", { station: "Measure" }),
  row("painter-tape", "Painter tape", "consumable", 6, 2, "Finish", { unit: "rolls" }),
  row("brads", "Brads", "consumable", 4, 1, "Bench", { unit: "boxes" }),
  row("screws", "Screws", "consumable", 4, 1, "Bench", { unit: "boxes" }),
  row("finish", "Finish", "consumable", 3, 1, "Finish", { unit: "cans" }),
  row("pine-stock", "Pine stock", "material", 20, 8, "Rack", { unit: "boards" }),
  row("plywood", "Plywood", "material", 8, 3, "Rack", { unit: "sheets" }),
  row("mdf", "MDF", "material", 4, 2, "Rack", { unit: "sheets" }),
  row("dowel", "Dowel", "material", 20, 8, "Rack", { unit: "sticks" }),
  row("acrylic", "Acrylic scrap", "material", 10, 4, "Rack", { unit: "scraps" }),
  row("measure-kit", "Measure kit", "kit", 6, 4, "Measure", { station: "Measure", note: "Rule + try square" }),
];

export function holdsKind(kind: InvKind): boolean {
  return kind === "tool" || kind === "ppe" || kind === "kit" || kind === "machine";
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 28) || "item";
}

function nowIso(): string {
  return new Date().toISOString();
}

function hid(itemId: string): string {
  return `h-${itemId}-${Date.now().toString(36)}${Math.floor(Math.random() * 36).toString(36)}`;
}

export function cribOf(file: EconomyFile): CribFile {
  const raw = file.meta.config?.crib;
  if (!raw) return { items: FACTORY_CRIB.map((x) => ({ ...x })), holds: [], log: [] };
  return {
    items: Array.isArray(raw.items) ? raw.items.map((x) => ({ ...x })) : [],
    holds: Array.isArray(raw.holds) ? raw.holds.map((x) => ({ ...x })) : [],
    log: Array.isArray(raw.log) ? (raw.log as InvEvent[]) : [],
  };
}

function putCrib(file: EconomyFile, crib: CribFile): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    crib: {
      items: crib.items,
      holds: crib.holds,
      log: crib.log.slice(-80),
    },
  };
  return next;
}

function pushLog(log: InvEvent[], ev: Omit<InvEvent, "ts">): InvEvent[] {
  return [...log, { ...ev, ts: nowIso() }].slice(-80);
}

export function outQty(holds: InvHold[], itemId: string): number {
  return holds.filter((h) => h.itemId === itemId).reduce((n, h) => n + h.qty, 0);
}

export function onHand(item: InvItem, holds: InvHold[]): number {
  return Math.max(0, item.qty - outQty(holds, item.id));
}

export function isLow(item: InvItem, holds: InvHold[]): boolean {
  if (item.broken) return true;
  const par = Number(item.par || 0);
  if (par <= 0) return false;
  return onHand(item, holds) < par;
}

export function lowItems(file: EconomyFile): InvItem[] {
  const crib = cribOf(file);
  return crib.items.filter((it) => isLow(it, crib.holds));
}

export function holdsOfItem(file: EconomyFile, itemId: string): InvHold[] {
  return cribOf(file).holds.filter((h) => h.itemId === itemId);
}

export function seedCrib(file: EconomyFile): EconomyFile {
  const cur = file.meta.config?.crib;
  if (cur?.items?.length) return file;
  const crib = cribOf(file);
  return putCrib(file, {
    items: FACTORY_CRIB.map((x) => ({ ...x })),
    holds: crib.holds,
    log: pushLog(crib.log, { kind: "add", itemId: "*", qty: FACTORY_CRIB.length, note: "Shop kit" }),
  });
}

export function upsertItem(file: EconomyFile, item: InvItem): EconomyFile {
  const crib = cribOf(file);
  const id = item.id.trim() || slug(item.name);
  const next: InvItem = {
    ...item,
    id,
    name: item.name.trim().slice(0, 40),
    qty: Math.max(0, Math.round(Number(item.qty) || 0)),
    par: item.par != null ? Math.max(0, Math.round(Number(item.par) || 0)) : undefined,
    bin: item.bin?.trim().slice(0, 24) || undefined,
    station: item.station?.trim().slice(0, 24) || undefined,
    unit: item.unit?.trim().slice(0, 16) || "ea",
    note: item.note?.trim().slice(0, 80) || undefined,
  };
  if (!next.name) return file;
  const exists = crib.items.some((x) => x.id === id);
  const items = exists ? crib.items.map((x) => (x.id === id ? { ...x, ...next } : x)) : [...crib.items, next];
  return putCrib(file, {
    items,
    holds: crib.holds,
    log: pushLog(crib.log, { kind: exists ? "adjust" : "add", itemId: id, qty: next.qty, note: next.name }),
  });
}

export function dropItem(file: EconomyFile, itemId: string): EconomyFile {
  const crib = cribOf(file);
  const hit = crib.items.find((x) => x.id === itemId);
  if (!hit) return file;
  return putCrib(file, {
    items: crib.items.filter((x) => x.id !== itemId),
    holds: crib.holds.filter((h) => h.itemId !== itemId),
    log: pushLog(crib.log, { kind: "drop", itemId, qty: hit.qty, note: hit.name }),
  });
}

export function setBroken(file: EconomyFile, itemId: string, broken: boolean): EconomyFile {
  const crib = cribOf(file);
  if (!crib.items.some((x) => x.id === itemId)) return file;
  return putCrib(file, {
    items: crib.items.map((x) => (x.id === itemId ? { ...x, broken } : x)),
    holds: crib.holds,
    log: pushLog(crib.log, { kind: "fix", itemId, qty: broken ? 0 : 1, note: broken ? "Out of service" : "Back in" }),
  });
}

export function adjustQty(file: EconomyFile, itemId: string, delta: number, note?: string): EconomyFile {
  const crib = cribOf(file);
  const hit = crib.items.find((x) => x.id === itemId);
  if (!hit || !delta) return file;
  const qty = Math.max(0, hit.qty + Math.round(delta));
  const out = outQty(crib.holds, itemId);
  const nextQty = Math.max(out, qty);
  return putCrib(file, {
    items: crib.items.map((x) => (x.id === itemId ? { ...x, qty: nextQty } : x)),
    holds: crib.holds,
    log: pushLog(crib.log, { kind: "adjust", itemId, qty: nextQty - hit.qty, note: note?.slice(0, 80) || hit.name }),
  });
}

/** Consumable / material: count down, no hold. */
export function takeStock(file: EconomyFile, itemId: string, qty: number, who?: string): EconomyFile {
  const crib = cribOf(file);
  const hit = crib.items.find((x) => x.id === itemId);
  const n = Math.max(1, Math.round(qty));
  if (!hit) return file;
  if (holdsKind(hit.kind) || hit.broken) return file;
  const hand = onHand(hit, crib.holds);
  if (n > hand) return file;
  return putCrib(file, {
    items: crib.items.map((x) => (x.id === itemId ? { ...x, qty: x.qty - n } : x)),
    holds: crib.holds,
    log: pushLog(crib.log, { kind: "take", itemId, qty: n, who: who?.slice(0, 32), note: hit.name }),
  });
}

export function checkOut(
  file: EconomyFile,
  itemId: string,
  qty: number,
  who: { label: string; kind: InvHold["whoKind"]; studentId?: string; crewKey?: string; period?: number },
): EconomyFile {
  const crib = cribOf(file);
  const hit = crib.items.find((x) => x.id === itemId);
  const n = Math.max(1, Math.round(qty));
  const label = who.label.trim().slice(0, 32);
  if (!hit || hit.broken || !holdsKind(hit.kind) || !label) return file;
  if (n > onHand(hit, crib.holds)) return file;
  const hold: InvHold = {
    id: hid(itemId),
    itemId,
    qty: n,
    who: label,
    whoKind: who.kind,
    studentId: who.studentId,
    crewKey: who.crewKey,
    period: who.period,
    outAt: nowIso(),
  };
  return putCrib(file, {
    items: crib.items,
    holds: [...crib.holds, hold],
    log: pushLog(crib.log, { kind: "out", itemId, qty: n, who: label, note: hit.name }),
  });
}

export function checkIn(file: EconomyFile, holdId: string): EconomyFile {
  const crib = cribOf(file);
  const hold = crib.holds.find((h) => h.id === holdId);
  if (!hold) return file;
  const hit = crib.items.find((x) => x.id === hold.itemId);
  return putCrib(file, {
    items: crib.items,
    holds: crib.holds.filter((h) => h.id !== holdId),
    log: pushLog(crib.log, { kind: "in", itemId: hold.itemId, qty: hold.qty, who: hold.who, note: hit?.name || hold.itemId }),
  });
}

export function checkInItem(file: EconomyFile, itemId: string): EconomyFile {
  const crib = cribOf(file);
  const holds = crib.holds.filter((h) => h.itemId === itemId);
  if (!holds.length) return file;
  let next = file;
  for (const h of holds) next = checkIn(next, h.id);
  return next;
}

/** Alias on the hold — never legalFirst / legalLast. */
export function aliasWho(s: Pick<RawStudent, "first" | "legalFirst" | "id">): string {
  return padFirst(s).trim().slice(0, 32);
}

export function liveAliases(file: EconomyFile, period: number): { id: string; alias: string; crewKey: string }[] {
  return file.students
    .filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName))
    .map((s) => ({ id: s.id, alias: aliasWho(s), crewKey: s.crewKey }))
    .filter((s) => s.alias);
}

export function needThisHour(file: EconomyFile, date: string, period: number, name: string): EconomyFile {
  const day = teachDay(file, date || todayIso(), period);
  const add = name.trim();
  if (!add) return file;
  const cur = day.materials?.trim() ?? "";
  if (cur.toLowerCase().split(/[·,]/).some((b) => b.trim().toLowerCase() === add.toLowerCase())) return file;
  const next = cur ? `${cur} · ${add}` : add;
  return setTeachMaterials(file, date || todayIso(), period, next.slice(0, 200));
}
