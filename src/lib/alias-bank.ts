/** Creative shop-style alias word bank + uniqueness. Public `first` only — never legal names. */

const WORDS = [
  "Nova", "Bolt", "Echo", "Flux", "Jade", "Kite", "Lumen", "Mesa", "Nyx", "Orbit",
  "Pixel", "Quill", "Rivet", "Spark", "Torch", "Ultra", "Vex", "Wren", "Axiom", "Blaze",
  "Cipher", "Drift", "Ember", "Forge", "Glitch", "Helix", "Ion", "Jolt", "Karma", "Loom",
  "Magnet", "Nimbus", "Onyx", "Prism", "Quark", "Radar", "Sable", "Tide", "Umbra", "Volt",
  "Wisp", "Xenon", "Yonder", "Zephyr", "Arc", "Beacon", "Comet", "Delta", "Eclipse", "Frost",
  "Gizmo", "Harbor", "Ink", "Jet", "Knack", "Lark", "Mirage", "Nest", "Oxide", "Pulse",
  "Quest", "Rune", "Sprocket", "Truss", "Vector", "Warp", "Yield", "Zinc", "Atlas", "Bramble",
  "Canyon", "Dune", "Elm", "Falcon", "Grove", "Hawk", "Iris", "Juniper", "Keen", "Lotus",
  "Maple", "North", "Oak", "Pine", "Quartz", "Ridge", "Summit", "Thorn", "Vale", "Willow",
] as const;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function normalizeAlias(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 24);
}

function truthyFlag(v: string | undefined): boolean {
  const t = String(v ?? "").trim().toLowerCase();
  return t === "y" || t === "yes" || t === "1" || t === "true" || t === "iep" || t === "504";
}

/** Pick a creative alias unique against `used` (case-insensitive). */
export function generateAlias(seed: string, used: Iterable<string>): string {
  const taken = new Set([...used].map((u) => u.trim().toLowerCase()).filter(Boolean));
  const base = hashSeed(seed || "tw");
  const n = WORDS.length;

  for (let i = 0; i < n * 3; i++) {
    const word = WORDS[(base + i * 17) % n];
    const candidate = i < n ? word : `${word}${((base + i) % 90) + 10}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  for (let n2 = 10; n2 < 10000; n2++) {
    const candidate = `Shop${n2}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `Shop${Date.now() % 100000}`;
}

export function generateUniqueAliases(seeds: string[], alreadyUsed: Iterable<string> = []): string[] {
  const used = [...alreadyUsed];
  const out: string[] = [];
  for (const seed of seeds) {
    const alias = generateAlias(seed, used);
    out.push(alias);
    used.push(alias);
  }
  return out;
}

export type LegalRosterRow = {
  legalLast: string;
  legalFirst: string;
  period: number;
  iep?: boolean;
  plan504?: boolean;
  crewKey?: string;
};

/** Parse clipboard / SchoolTool-ish lines: Last, First, Period[, IEP][, 504] */
export function parseLegalRosterText(raw: string): LegalRosterRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: LegalRosterRow[] = [];
  for (const line of lines) {
    if (/^(last|legal)/i.test(line) && /first/i.test(line)) continue;
    const parts = line.includes("\t")
      ? line.split("\t").map((p) => p.trim())
      : line.split(/[,;|]/).map((p) => p.trim());
    if (parts.length < 2) continue;
    const legalLast = parts[0] ?? "";
    const legalFirst = parts[1] ?? "";
    const period = Number(String(parts[2] ?? "").replace(/[^0-9]/g, ""));
    if (!legalLast || !legalFirst) continue;
    rows.push({
      legalLast: legalLast.slice(0, 40),
      legalFirst: legalFirst.slice(0, 40),
      period: Number.isFinite(period) && period >= 1 ? Math.round(period) : 0,
      iep: truthyFlag(parts[3]),
      plan504: truthyFlag(parts[4]),
    });
  }
  return rows;
}

export { WORDS as ALIAS_WORDS };
