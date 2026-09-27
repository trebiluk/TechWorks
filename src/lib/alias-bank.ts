/** Creative shop-style alias word bank + uniqueness. Public `first` only — never legal names. */

const WORDS = [
  "Alder", "Anchor", "Anvil", "Apex", "Arbor", "Arch", "Arrow", "Atlas", "Axiom", "Azure",
  "Badge", "Barn", "Basil", "Beacon", "Birch", "Blade", "Bloom", "Bolt", "Brass", "Brick",
  "Brook", "Cabin", "Cedar", "Chalk", "Cinder", "Citrus", "Clay", "Cloud", "Clover", "Cobalt",
  "Comet", "Compass", "Coral", "Crane", "Creek", "Crystal", "Daisy", "Delta", "Drawer", "Dune",
  "Echo", "Elm", "Ember", "Engine", "Fable", "Falcon", "Fern", "Field", "Finch", "Flint",
  "Flora", "Forge", "Frost", "Gale", "Garden", "Gauge", "Gem", "Glen", "Glow", "Grain",
  "Granite", "Grove", "Hammer", "Harbor", "Hazel", "Helix", "Heron", "Holly", "Honey", "Horizon",
  "Indigo", "Ingot", "Iris", "Island", "Ivory", "Jade", "Jasper", "Juniper", "Keen", "Kestrel",
  "Kite", "Ladder", "Lake", "Lark", "Lattice", "Laurel", "Lumen", "Magnet", "Maple", "Marble",
  "Marin", "Meadow", "Mesa", "Mint", "Moss", "Needle", "Nimbus", "North", "Nova", "Oak",
  "Olive", "Onyx", "Opal", "Orbit", "Oriole", "Paddle", "Pebble", "Pine", "Pixel", "Plaza",
  "Plum", "Pond", "Prism", "Quartz", "Quest", "Quill", "Quilt", "Radar", "Rain", "Raven",
  "Reef", "Ridge", "River", "Robin", "Rocket", "Rowan", "Ruby", "Saddle", "Sage", "Sail",
  "Sand", "Scout", "Silver", "Sky", "Slate", "Sparrow", "Spark", "Spruce", "Steel", "Stone",
  "Summit", "Sunny", "Terra", "Tide", "Timber", "Torch", "Trail", "Truss", "Tulip", "Turtle",
  "Vale", "Valley", "Violet", "Volt", "Walnut", "Wave", "Willow", "Window", "Wisp", "Wren",
  "Yarn", "Yarrow", "Zephyr", "Zinc",
] as const;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return h >>> 0;
}

const BANNED =
  /\b(ass|anal|sex|sexy|cum|damn|hell|crap|butt|dick|cock|knob|piss|slut|porn|nazi|rape|kill|fuck|shit|tit|boob|nude|drug|dumb|stupid)\b/i;

export function normalizeAlias(name: string): string {
  return name.trim().replace(/\s+/g, " ").slice(0, 16);
}

/** Public alias. Letters first. No repeats of a banned word. */
export function aliasAllowed(name: string): boolean {
  const clean = normalizeAlias(name);
  if (clean.length < 2 || clean.length > 16) return false;
  if (!/^[A-Za-z][A-Za-z0-9 ]*$/.test(clean)) return false;
  if (BANNED.test(clean)) return false;
  return true;
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
  crewKey?: string;
};

/** Parse clipboard / SchoolTool-ish lines: Last, First, Period */
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
    });
  }
  return rows;
}

export { WORDS as ALIAS_WORDS };
