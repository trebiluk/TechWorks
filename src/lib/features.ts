import type { EconomyFile } from "@/lib/economy";

export const FEATURES = [
  { id: "weather", label: "Weather", group: "Wall", hint: "Sky · °F · word on the wall frame" },
  { id: "berty", label: "BertyBot", group: "Wall", hint: "Mascot on the wall and pad" },
  { id: "teach", label: "Teach", group: "Wall", hint: "Do this now · lesson slots" },
  { id: "polls", label: "Polls", group: "Wall", hint: "Live class vote · bars on the wall" },
  { id: "reward", label: "Class reward", group: "Wall", hint: "XP · grade · effort bar" },
  { id: "tips", label: "Screen guide", group: "Wall", hint: "Describe under the header" },
  { id: "contrast", label: "High contrast", group: "Wall", hint: "Harder edges for the wall" },
  { id: "crews", label: "Crew manager", group: "Crew", hint: "Size, deal, look, crown. Dropped crew comes back with + Crew A. Roster seats them too." },
  { id: "grades", label: "Grades export", group: "Learn", hint: "Classroom CSV" },
  { id: "nytech", label: "NY Tech", group: "Learn", hint: "Standard 5 project 1–4" },
  { id: "projects", label: "Projects", group: "Learn", hint: "Build drives agenda, XP, grades" },
  { id: "vocab", label: "Word games", group: "Learn", hint: "Heat · Match · Flash · Spell · Words" },
  { id: "picker", label: "Name picker", group: "Tools", hint: "Draw an alias from a period · Dash" },
  { id: "timer", label: "Focus timer", group: "Tools", hint: "3 / 5 / 10 min sand clock · Dash" },
  { id: "ambient", label: "Ambient Chaos", group: "Tools", hint: "neal.fun workshop-noise tab" },
  { id: "club", label: "Tech Club", group: "After school", hint: "IN pays $10 + 2 XP once a day. Not class effort." },
  { id: "studyhall", label: "Study Hall", group: "After school", hint: "P6 projector. Not in Tech effort." },
  { id: "store", label: "Rewards", group: "Games", hint: "Perk cards. Wallet still exists." },
  { id: "prints", label: "Prints", group: "Games", hint: "3D print collections, trades, gallery" },
  { id: "stocks", label: "Stocks", group: "Games", hint: "Market minigame" },
  { id: "lucky", label: "Lucky Bench", group: "Games", hint: "Die + Friday pot. Class cash only." },
  { id: "portal", label: "Family web", group: "Games", hint: "Web button · ?web=1. Off is fine — Web still opens it." },
  { id: "achievements", label: "Achievements", group: "Extra", hint: "Crew-lead XP lines" },
  { id: "debug", label: "Fake data", group: "Extra", hint: "Paints every crew board. Not saved." },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];
export type FeatureGroup = (typeof FEATURES)[number]["group"];

/** Off until you tap them. Must match the real chrome (guide, contrast, games). New ids: add here, default off if it is a game. Never rename an old id. */
const DEFAULT_OFF: FeatureId[] = ["contrast", "portal", "store", "stocks", "nytech", "ambient", "debug", "lucky", "tips"];

export function featureOn(file: EconomyFile, id: FeatureId): boolean {
  const v = file.meta.config?.modules?.[id];
  if (v === false) return false;
  if (v === true) return true;
  return !DEFAULT_OFF.includes(id);
}

export function setFeature(file: EconomyFile, id: FeatureId, on: boolean): EconomyFile {
  const next = { ...file, meta: { ...file.meta, config: { ...(file.meta.config ?? {}) } } };
  next.meta.config = {
    ...(file.meta.config ?? {}),
    modules: { ...(file.meta.config?.modules ?? {}), [id]: on },
  };
  return next;
}

export const FEATURE_GROUPS: FeatureGroup[] = ["Wall", "Crew", "Learn", "Tools", "After school", "Games", "Extra"];

/** Where Off actually hides something. Tests fail if a card is a no-op. */
export const FEATURE_HIDES: Record<FeatureId, string> = {
  weather: "WallFrame",
  berty: "BertyBot",
  teach: "Teach tab",
  polls: "Poll wall plate",
  reward: "RewardBar",
  tips: "Screen guide",
  contrast: "High contrast paint",
  crews: "Crew manager card",
  grades: "Grades export card",
  nytech: "NY Tech path",
  projects: "Projects card",
  vocab: "Word games",
  picker: "Name picker",
  timer: "Focus timer",
  ambient: "Ambient Chaos",
  club: "Club tab",
  studyhall: "Hall tab",
  store: "Store tab",
  prints: "Prints tab",
  stocks: "Stocks tab",
  lucky: "Lucky tab",
  portal: "Worker portal",
  achievements: "Profile XP lines",
  debug: "Fake data overlay",
};
