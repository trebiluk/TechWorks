/** Creative shop-style alias word bank + uniqueness. Public `first` only — never legal names. */

/** One shared list of handles a kid can answer to. Not people, not a fabric swatch. */
const TAGS = [
  "Nova", "Volt", "Echo", "Flux", "Ember", "Drift", "Pixel", "Orbit", "Spark", "Quill",
  "Rune", "Turbo", "Gyro", "Neon", "Pulse", "Comet", "Prism", "Quest", "Cipher", "Vector",
  "Nitro", "Ozone", "Radar", "Sonic", "Warp", "Byte", "Glitch", "Apex", "Zenith", "Ion",
  "Jolt", "Zig", "Dash", "Bolt", "Chip", "Gear", "Axle", "Motor", "Torque", "Piston",
  "Rivet", "Forge", "Laser", "Plasma", "Photon", "Quark", "Meteor", "Cosmos", "Astro", "Rocket",
  "Boost", "Flash", "Vortex", "Matrix", "Node", "Core", "Grid", "Link", "Sync", "Logic",
  "Cache", "Signal", "Beacon", "Flare", "Cinder", "Magma", "Frost", "Arctic", "Polar", "Cyclone",
  "Vertex", "Proton", "Neutron", "Atom", "Boson", "Pulsar", "Quasar", "Eclipse", "Nadir", "Nebula",
  "Galaxy", "Sprite", "Voxel", "Shader", "Buffer", "Portal", "Hex", "Ping", "Zoom", "Blip",
  "Gizmo", "Widget", "Sprocket", "Cog", "Cam", "Pulley", "Lever", "Crank", "Winch", "Hoist",
  "Clamp", "Lathe", "Drill", "Press", "Clutch", "Throttle", "Battery", "Circuit", "Fuse", "Relay",
  "Switch", "Dial", "Cable", "Plug", "Socket", "Bit", "Hub", "Rover", "Probe", "Lander",
  "Module", "Capsule", "Dock", "Sirius", "Rigel", "Altair", "Deneb", "Cygnus", "Hydra", "Joule",
  "Hertz", "Farad", "Lumen", "Ohm", "Amp", "Kelvin", "Tempo", "Chorus", "Puck", "Visor",
  "Kite", "Glider", "Thruster", "Nozzle", "Intake", "Pylon", "Strut", "Spar", "Rib", "Frame",
] as const;

export const TAG_SPACE = TAGS.length + TAGS.length * (TAGS.length - 1);

export function isTagAlias(name: string): boolean {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return (TAGS as readonly string[]).includes(parts[0] ?? "");
  if (parts.length !== 2 || parts[0] === parts[1]) return false;
  return (TAGS as readonly string[]).includes(parts[0] ?? "") && (TAGS as readonly string[]).includes(parts[1] ?? "");
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

/** A single handle until those run out, then two of them. Unique. Same list for every kid. */
export function generateAlias(seed: string, used: Iterable<string>): string {
  const taken = new Set([...used].map((u) => u.trim().toLowerCase()).filter(Boolean));
  const base = hashSeed(seed || "tw");
  const n = TAGS.length;

  for (let i = 0; i < n; i++) {
    const word = TAGS[(base + i) % n]!;
    if (!taken.has(word.toLowerCase())) return word;
  }

  const span = n * (n - 1);
  for (let i = 0; i < span; i++) {
    const k = (base + i) % span;
    const a = Math.floor(k / (n - 1)) % n;
    let b = k % (n - 1);
    if (b >= a) b += 1;
    const candidate = `${TAGS[a]} ${TAGS[b]}`;
    if (candidate.length > 16) continue;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }

  for (let n2 = 2; n2 < 10000; n2++) {
    const candidate = `Crew ${n2}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `Crew ${Date.now() % 100000}`;
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

export { TAGS as ALIAS_TAGS };
