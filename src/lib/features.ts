import type { EconomyFile } from "@/lib/economy";

export const FEATURES = [
  { id: "weather", label: "Weather", group: "Projector", hint: "Icon + °F on Dashboard" },
  { id: "berty", label: "BertyBot", group: "Projector", hint: "Mascot on the wall and pad" },
  { id: "reward", label: "Class reward", group: "Projector", hint: "XP · grade · effort bar" },
  { id: "tips", label: "Screen guide", group: "Projector", hint: "Describe under the header" },
  { id: "contrast", label: "High contrast", group: "Projector", hint: "Harder edges for the wall" },
  { id: "ambient", label: "Ambient Chaos", group: "Desk", hint: "neal.fun workshop-noise tab" },
  { id: "picker", label: "Name picker", group: "Desk", hint: "Draw an alias from a period" },
  { id: "timer", label: "Focus timer", group: "Desk", hint: "3 / 5 / 10 min sand clock" },
  { id: "grades", label: "Grades export", group: "Desk", hint: "Classroom CSV" },
  { id: "store", label: "Store", group: "Games", hint: "Store chips. Wallet still exists." },
  { id: "stocks", label: "Stocks", group: "Games", hint: "Market minigame" },
  { id: "studyhall", label: "Study Hall wall", group: "Games", hint: "P6 projector. Not in Tech effort." },
  { id: "club", label: "Tech Club", group: "Games", hint: "After school. Sign-in · stations · late bus. Not class XP." },
  { id: "portal", label: "Worker portal", group: "Games", hint: "Off. Wall is the FERPA view." },
  { id: "achievements", label: "Achievements", group: "Profile", hint: "Crew-lead XP lines" },
  { id: "nytech", label: "NY Tech", group: "Skills", hint: "Standard 5 project 1–4" },
  { id: "projects", label: "Projects", group: "Skills", hint: "Build drives agenda, XP, grades" },
  { id: "debug", label: "Fake data", group: "Debug", hint: "Paints graphs only. Not saved." },
] as const;

export type FeatureId = (typeof FEATURES)[number]["id"];
export type FeatureGroup = (typeof FEATURES)[number]["group"];

const DEFAULT_OFF: FeatureId[] = ["contrast", "portal", "store", "stocks", "nytech", "ambient", "debug"];

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

export const FEATURE_GROUPS: FeatureGroup[] = ["Projector", "Desk", "Games", "Profile", "Skills", "Debug"];
