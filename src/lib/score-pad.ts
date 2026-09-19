/** Crew Score · 40s — effort marks only. A/E/P stay off this pad. */

export const EFFORT_MARKS = ["3", "2", "1"] as const;
export type EffortMark = (typeof EFFORT_MARKS)[number];

/** Hex badge pictogram from the crew name. Lucide ids, never emoji. */
export type CrewGlyphId = "flame" | "zap" | "wrench" | "cog" | "cpu" | "users";

export function crewGlyphId(name: string): CrewGlyphId {
  const t = name.toLowerCase();
  if (/forge|flame|fire|heat/.test(t)) return "flame";
  if (/spark|volt|flux|zap|bolt/.test(t)) return "zap";
  if (/rivet|wrench|fix/.test(t)) return "wrench";
  if (/sprocket|gear|cog/.test(t)) return "cog";
  if (/bit|chip|cpu|circuit/.test(t)) return "cpu";
  return "users";
}

const AWAY = new Set(["A", "E", "P"]);

export function isAwayMark(code: string): boolean {
  return AWAY.has(code);
}

export function isEffortMark(code: string): code is EffortMark {
  return code === "3" || code === "2" || code === "1";
}

/** Shared 3/2/1 among present kids. Mixed or blank → none selected. */
export function crewEffortMark(marks: readonly string[]): EffortMark | "" {
  const present = marks.filter((m) => !isAwayMark(m));
  if (!present.length) return "";
  const first = present[0] ?? "";
  if (!isEffortMark(first)) return "";
  return present.every((m) => m === first) ? first : "";
}

export const SCORE_OWN_CREW_KEY = "techworks-crew-own";

export function readOwnCrew(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(SCORE_OWN_CREW_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeOwnCrew(key: string) {
  if (typeof window === "undefined") return;
  try {
    if (key) window.sessionStorage.setItem(SCORE_OWN_CREW_KEY, key);
    else window.sessionStorage.removeItem(SCORE_OWN_CREW_KEY);
  } catch {
    /* */
  }
}
