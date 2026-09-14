export const BERTY_LOOK_KEY = "techworks-berty-look-v1";
export const BERTY_LOOK_EVENT = "techworks-berty-look";

export const BERTY_INKS = [
  { id: "cyan", label: "Shop cyan", hue: 0, sat: 1, bright: 1, swatch: "#2ee6ff" },
  { id: "gold", label: "Sunset gold", hue: 195, sat: 1.15, bright: 1.08, swatch: "#FDAE3F" },
  { id: "oswego", label: "Hunter", hue: 95, sat: 0.95, bright: 0.92, swatch: "#235937" },
  { id: "violet", label: "Violet", hue: 250, sat: 1.1, bright: 1, swatch: "#8b6cff" },
  { id: "steel", label: "Steel", hue: 0, sat: 0.12, bright: 1.12, swatch: "#9aa3b5" },
  { id: "cleanup", label: "Cleanup", hue: 330, sat: 1.25, bright: 1.02, swatch: "#f97316" },
  { id: "bearcat", label: "Bearcat", hue: 210, sat: 1.2, bright: 1.05, swatch: "#f59e0b" },
  { id: "mint", label: "Mint", hue: 45, sat: 1.05, bright: 1.06, swatch: "#34d399" },
  { id: "rose", label: "Rose", hue: 285, sat: 1.15, bright: 1.05, swatch: "#fb7185" },
  { id: "night", label: "Night", hue: 200, sat: 0.65, bright: 0.72, swatch: "#1e3a5f" },
] as const;

export const BERTY_KITS = [
  { id: "plain", label: "Plain" },
  { id: "goggles", label: "Goggles" },
  { id: "apron", label: "Shop apron" },
  { id: "vest", label: "Cleanup vest" },
  { id: "sash", label: "Lead sash" },
  { id: "jersey", label: "Club jersey" },
  { id: "cape", label: "Cape" },
] as const;

export const BERTY_HATS = [
  { id: "none", label: "None" },
  { id: "cap", label: "Cap" },
  { id: "hard", label: "Hard hat" },
  { id: "crown", label: "Crown" },
  { id: "beanie", label: "Beanie" },
  { id: "visor", label: "Visor" },
] as const;

export const BERTY_HANDS = [
  { id: "none", label: "Bare" },
  { id: "wrench", label: "Wrench" },
  { id: "broom", label: "Broom" },
  { id: "clip", label: "Clipboard" },
  { id: "flag", label: "Flag" },
] as const;

export const BERTY_FINISH = [
  { id: "metal", label: "Metal" },
  { id: "matte", label: "Matte" },
  { id: "gild", label: "Gilded" },
  { id: "outline", label: "Outline" },
] as const;

export type BertyInkId = (typeof BERTY_INKS)[number]["id"];
export type BertyKitId = (typeof BERTY_KITS)[number]["id"];
export type BertyHatId = (typeof BERTY_HATS)[number]["id"];
export type BertyHandId = (typeof BERTY_HANDS)[number]["id"];
export type BertyFinishId = (typeof BERTY_FINISH)[number]["id"];

export type BertyLook = {
  ink: BertyInkId;
  kit: BertyKitId;
  hat: BertyHatId;
  hand: BertyHandId;
  finish: BertyFinishId;
};

export const DEFAULT_BERTY_LOOK: BertyLook = {
  ink: "cyan",
  kit: "plain",
  hat: "none",
  hand: "none",
  finish: "metal",
};

function pick<T extends { id: string }>(list: readonly T[], id: unknown, fallback: T): T {
  return list.find((x) => x.id === id) ?? fallback;
}

export function hydrateBertyLook(raw: Partial<BertyLook> | null | undefined): BertyLook {
  return {
    ink: pick(BERTY_INKS, raw?.ink, BERTY_INKS[0]).id,
    kit: pick(BERTY_KITS, raw?.kit, BERTY_KITS[0]).id,
    hat: pick(BERTY_HATS, raw?.hat, BERTY_HATS[0]).id,
    hand: pick(BERTY_HANDS, raw?.hand, BERTY_HANDS[0]).id,
    finish: pick(BERTY_FINISH, raw?.finish, BERTY_FINISH[0]).id,
  };
}

export function loadBertyLook(): BertyLook {
  if (typeof window === "undefined") return DEFAULT_BERTY_LOOK;
  try {
    const raw = window.localStorage.getItem(BERTY_LOOK_KEY);
    if (!raw) return DEFAULT_BERTY_LOOK;
    return hydrateBertyLook(JSON.parse(raw) as Partial<BertyLook>);
  } catch {
    return DEFAULT_BERTY_LOOK;
  }
}

export function saveBertyLook(next: BertyLook) {
  const look = hydrateBertyLook(next);
  try {
    window.localStorage.setItem(BERTY_LOOK_KEY, JSON.stringify(look));
  } catch {
    /* */
  }
  window.dispatchEvent(new Event(BERTY_LOOK_EVENT));
}

export function bertyLookVars(look: BertyLook): Record<string, string> {
  const ink = pick(BERTY_INKS, look.ink, BERTY_INKS[0]);
  const body = look.finish === "gild" ? "#FDAE3F" : ink.swatch;
  return {
    "--berty-hue": `${ink.hue}deg`,
    "--berty-sat": String(ink.sat),
    "--berty-bright": String(ink.bright),
    "--berty-body": body,
  };
}

export function bertyBodyHex(look: BertyLook): string {
  if (look.finish === "gild") return "#FDAE3F";
  return pick(BERTY_INKS, look.ink, BERTY_INKS[0]).swatch;
}

export function lookCounts(): { inks: number; kits: number; hats: number; hands: number; finishes: number; combos: number } {
  const inks = BERTY_INKS.length;
  const kits = BERTY_KITS.length;
  const hats = BERTY_HATS.length;
  const hands = BERTY_HANDS.length;
  const finishes = BERTY_FINISH.length;
  return { inks, kits, hats, hands, finishes, combos: inks * kits * hats * hands * finishes };
}
