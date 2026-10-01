/** The Tech Room doors. Names match the Hub. */

export const HUB_DOORS = [
  ["techworks", "TechWorks"],
  ["baboo", "Baboo"],
  ["koderized", "Koderized"],
  ["bertycad", "BertyCAD"],
  ["bertybots", "Berty's Botz"],
  ["berty-run", "Berty's Run"],
  ["paperlab", "PaperLab"],
  ["logolab", "LogoLab"],
  ["sprocket", "Sprocket"],
  ["den", "Bearcat Den"],
  ["bistro", "Bearcat Bistro"],
  ["housekit", "HouseKit"],
  ["drift", "Drift"],
  ["spancraft", "SpanCraft"],
  ["spire-lab", "Spire Lab"],
  ["holdit", "HoldIt"],
  ["ginger", "Ginger"],
  ["visualizer", "Visualizer"],
  ["bits", "Bits"],
  ["drawin", "Draw In"],
  ["catapult", "Catapult"],
  ["musiclab", "Music Lab"],
  ["bertybeatz", "Berty Beatz"],
  ["throwit", "ThrowIt"],
] as const;

export function doorName(app: string): string {
  return HUB_DOORS.find((row) => row[0] === app)?.[1] ?? app;
}
