/** Frames kids actually want. Gold is earned. */
export function frameOf(xp: number): "plain" | "gain" | "accent" | "gold" {
  if (xp >= 36) return "gold";
  if (xp >= 24) return "accent";
  if (xp >= 12) return "gain";
  return "plain";
}

const BANDS: { minXp: number; label: string }[] = [
  { minXp: 0, label: "Cub" },
  { minXp: 6, label: "Rookie" },
  { minXp: 12, label: "Scout" },
  { minXp: 18, label: "Builder" },
  { minXp: 24, label: "Crafter" },
  { minXp: 30, label: "Lead" },
  { minXp: 36, label: "Ace" },
  { minXp: 42, label: "Legend" },
];

export function titleOf(xp: number, rankPeriod?: number): string {
  if (rankPeriod === 1) return "Shop lead";
  return BANDS.filter((b) => xp >= b.minXp).at(-1)?.label || "Cub";
}

export function crewInk(color?: string): { background?: string; color?: string } {
  if (!color) return {};
  return { background: color, color: "var(--color-bg)" };
}
