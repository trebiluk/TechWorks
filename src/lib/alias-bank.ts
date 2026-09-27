/** Creative shop-style alias word bank + uniqueness. Public `first` only — never legal names. */

/** Finish or material. Not a person, not a given name. */
const LEFT = [
  "Aqua", "Beige", "Brass", "Brick", "Bronze", "Brown", "Chrome", "Cobalt", "Copper", "Cream",
  "Cyan", "Denim", "Gloss", "Khaki", "Linen", "Maple", "Marble", "Mauve", "Navy", "Neon",
  "Nickel", "Ochre", "Patina", "Pewter", "Quartz", "Russet", "Sepia", "Slate", "Steel", "Taupe",
  "Teal", "Umber", "Zinc", "Alder", "Basalt", "Birch", "Chalk", "Granite", "Ingot", "Alloy",
  "Matte", "Polar", "Solar", "Lunar", "Cocoa", "Mocha", "Crimson", "Maroon", "Canvas", "Twill",
  "Fleece", "Cotton", "Balsa", "Cork", "Jute", "Hemp", "Nylon", "Tweed", "Flax", "Sisal",
  "Bamboo", "Pine", "Spruce", "Walnut", "Teak", "Oak", "Elm", "Fir", "Glass", "Resin",
  "Epoxy", "Putty", "Grout", "Mortar", "Stucco", "Plaster", "Gypsum", "Gravel", "Shale", "Loam",
] as const;

/** Form or place. Same list for every student, so nobody is sorted into a gendered set. */
const RIGHT = [
  "Angle", "Apex", "Arc", "Arch", "Beam", "Bend", "Block", "Bolt", "Brace", "Cleat",
  "Cone", "Cube", "Curve", "Disc", "Dome", "Edge", "Gauge", "Gear", "Glide", "Groove",
  "Hinge", "Joint", "Kerf", "Latch", "Level", "Miter", "Notch", "Plane", "Plumb", "Point",
  "Prism", "Ridge", "Riser", "Round", "Scale", "Shear", "Slope", "Slot", "Span", "Spoke",
  "Stack", "Tread", "Truss", "Wedge", "Wheel", "Bench", "Dock", "Gate", "Hull", "Keel",
  "Mast", "Pier", "Ramp", "Shed", "Sill", "Slab", "Stair", "Step", "Tower", "Vault",
  "Axis", "Knoll", "Mesa", "Dune", "Shoal", "Ledge", "Cove", "Gulf", "Isle", "Peak",
  "Pond", "Reef", "Vale", "Basin", "Bluff", "Butte", "Delta", "Fault", "Gorge", "Marsh",
  "Canyon", "Summit", "Valley", "Meadow", "Prairie", "Tundra", "Fjord", "Atoll", "Lagoon", "Harbor",
] as const;

export const PAIR_SPACE = LEFT.length * RIGHT.length;

export function isPairAlias(name: string): boolean {
  const parts = name.trim().split(" ");
  if (parts.length !== 2) return false;
  return (LEFT as readonly string[]).includes(parts[0] ?? "") && (RIGHT as readonly string[]).includes(parts[1] ?? "");
}

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

/** Two shop words, unique against `used`. Not a person and not assigned by gender. */
export function generateAlias(seed: string, used: Iterable<string>): string {
  const taken = new Set([...used].map((u) => u.trim().toLowerCase()).filter(Boolean));
  const base = hashSeed(seed || "tw");
  const n = PAIR_SPACE;
  const rightN = RIGHT.length;

  for (let i = 0; i < n; i++) {
    const k = (base + i) % n;
    const candidate = `${LEFT[Math.floor(k / rightN)]!} ${RIGHT[k % rightN]!}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  for (let n2 = 2; n2 < 10000; n2++) {
    const candidate = `Shop ${n2}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `Shop ${Date.now() % 100000}`;
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

export { LEFT as ALIAS_LEFT, RIGHT as ALIAS_RIGHT };
