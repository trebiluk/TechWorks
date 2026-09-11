/** Views the locked projector may keep. Desk destinations map to a wall twin. */
export const PROJECTOR_VIEWS = [
  "overview",
  "week",
  "year",
  "portal",
  "prints",
  "teach",
  "polls",
  "deck",
  "skills",
  "clubwall",
  "hallwall",
] as const;

export function lockView(view: string, crewOn = false): string {
  if (crewOn && view === "crew") return "crew";
  if (view === "club") return "clubwall";
  if (view === "studyhall") return "hallwall";
  if ((PROJECTOR_VIEWS as readonly string[]).includes(view)) return view;
  return "overview";
}
