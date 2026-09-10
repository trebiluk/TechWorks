import type { EconomyFile } from "@/lib/economy";

export const FEATURES = [
  { id: "weather", label: "Weather", group: "Wall", hint: "Icon + °F on Dashboard" },
  { id: "berty", label: "BertyBot", group: "Wall", hint: "Mascot on the wall and pad" },
  { id: "teach", label: "Teach", group: "Wall", hint: "Do this now · lesson slots" },
  { id: "polls", label: "Polls", group: "Wall", hint: "Live class vote · bars on the wall" },
  { id: "reward", label: "Class reward", group: "Wall", hint: "XP · grade · effort bar" },
  { id: "tips", label: "Screen guide", group: "Wall", hint: "Describe under the header" },
  { id: "contrast", label: "High contrast", group: "Wall", hint: "Harder edges for the wall" },
  { id: "crews", label: "Crew manager", group: "Crew", hint: "Seating, color, logo — Separate is on Roster" },
  { id: "grades", label: "Grades export", group: "Learn", hint: "Classroom CSV" },
  { id: "nytech", label: "NY Tech", group: "Learn", hint: "Standard 5 project 1–4" },
  { id: "projects", label: "Projects", group: "Learn", hint: "Build drives agenda, XP, grades" },
  { id: "picker", label: "Name picker", group: "Tools", hint: "Draw an alias from a period · Dash" },
  { id: "timer", label: "Focus timer", group: "Tools", hint: "3 / 5 / 10 min sand clock · Dash" },
  { id: "ambient", label: "Ambient Chaos", group: "Tools", hint: "neal.fun workshop-noise tab" },
  { id: "club", label: "Tech Club", group: "After school", hint: "IN pays $10 + 2 XP once a day. Not class effort." },
  { id: "studyhall", label: "Study Hall", group: "After school", hint: "P6 projector. Not in Tech effort." },
  { id: "store", label: "Store", group: "Games", hint: "Store chips. Wallet still exists." },
  { id: "prints", label: "Prints", group: "Games", hint: "3D print collections, trades, gallery" },
  { id: "stocks", label: "Stocks", group: "Games", hint: "Market minigame" },
  { id: "lucky", label: "Lucky Bench", group: "Games", hint: "Die + Friday pot. Class cash only." },
  { id: "portal", label: "Worker portal", group: "Games", hint: "Off. Wall is the FERPA view." },
  { id: "achievements", label: "Achievements", group: "Extra", hint: "Crew-lead XP lines" },
  { id: "debug", label: "Fake data", group: "Extra", hint: "Paints graphs only. Not saved." },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];
export type FeatureGroup = (typeof FEATURES)[number]["group"];

const DEFAULT_OFF: FeatureId[] = ["contrast", "portal", "store", "stocks", "nytech", "ambient", "debug", "lucky"];

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
