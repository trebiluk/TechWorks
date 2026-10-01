/** What a kid earned in the apps. Aliases only. */

import { doorName } from "@/lib/hub-doors";
import { DEFAULT_LEVEL_BANDS } from "@/lib/skills";

export type ProgressMark = {
  v?: number;
  app?: string;
  code?: string;
  alias?: string;
  event?: string;
  level?: string;
  stars?: number;
  xp?: number;
  skill?: string;
  ts?: string;
  line?: string;
};

export const PROGRESS_SKILLS = [
  { id: "structures", label: "Structures", apps: ["spancraft", "spire-lab", "holdit", "paperlab"], rubric: "model" },
  { id: "machines", label: "Machines", apps: ["catapult", "sprocket", "drift", "bertybots"], rubric: "tools" },
  { id: "cad", label: "CAD", apps: ["bertycad", "drawin", "visualizer"], rubric: "draw" },
  { id: "code", label: "Code", apps: ["koderized", "bits", "ginger"], rubric: "digital" },
  { id: "music", label: "Music", apps: ["musiclab", "bertybeatz"], rubric: "present" },
  { id: "making", label: "Making", apps: ["baboo", "logolab", "housekit", "berty-run", "throwit"], rubric: "finish" },
] as const;

export function skillOfApp(app: string): (typeof PROGRESS_SKILLS)[number]["id"] | "" {
  return PROGRESS_SKILLS.find((col) => (col.apps as readonly string[]).includes(app))?.id ?? "";
}

export function rubricOfSkill(id: string): string {
  return PROGRESS_SKILLS.find((col) => col.id === id)?.rubric ?? "";
}

export function weekXp(marks: ProgressMark[], now = Date.now()): number {
  const cut = now - 7 * 24 * 60 * 60 * 1000;
  return marks.reduce((sum, row) => {
    const ts = Date.parse(row.ts || "");
    if (!Number.isFinite(ts) || ts < cut) return sum;
    return sum + Math.max(0, Number(row.xp) || 0);
  }, 0);
}

export function levelName(xp: number): string {
  return DEFAULT_LEVEL_BANDS.filter((b) => xp >= b.minXp).at(-1)?.label || "Cub";
}

export type AppBadge = { app: string; name: string; clears: number; stars: number };

export function badgesOf(marks: ProgressMark[]): AppBadge[] {
  const map = new Map<string, AppBadge>();
  for (const row of marks) {
    if (row.event !== "clear" || !row.app) continue;
    const cur = map.get(row.app) ?? { app: row.app, name: doorName(row.app), clears: 0, stars: 0 };
    cur.clears += 1;
    cur.stars = Math.max(cur.stars, Number(row.stars) || 0);
    map.set(row.app, cur);
  }
  return [...map.values()];
}

export function recentClears(marks: ProgressMark[], n = 5): string[] {
  return marks
    .filter((row) => row.event === "clear")
    .slice()
    .sort((a, b) => Date.parse(b.ts || "") - Date.parse(a.ts || ""))
    .slice(0, n)
    .map((row) => `${doorName(row.app || "")} · Clear ${row.level || "a level"} ★${Number(row.stars) || 0}`);
}

export function bestCell(marks: ProgressMark[], alias: string, skill: string): { stars: number; xp: number } {
  const apps = new Set<string>(PROGRESS_SKILLS.find((col) => col.id === skill)?.apps ?? []);
  let stars = 0;
  let xp = 0;
  const cut = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const row of marks) {
    if ((row.alias || "") !== alias || !apps.has(row.app || "")) continue;
    stars = Math.max(stars, Number(row.stars) || 0);
    const ts = Date.parse(row.ts || "");
    if (Number.isFinite(ts) && ts >= cut) xp += Math.max(0, Number(row.xp) || 0);
  }
  return { stars, xp };
}

export function attemptsFor(marks: ProgressMark[], alias: string, skill: string): ProgressMark[] {
  const apps = new Set<string>(PROGRESS_SKILLS.find((col) => col.id === skill)?.apps ?? []);
  return marks.filter((row) => (row.alias || "") === alias && apps.has(row.app || ""));
}

export function progressCsv(marks: ProgressMark[]): string {
  const head = "alias,app,level,stars,xp,ts";
  const lines = marks
    .filter((row) => row.v === 2 || row.event)
    .map((row) => [row.alias, row.app, row.level, row.stars ?? "", row.xp ?? "", row.ts].map((cell) => `"${String(cell ?? "").replace(/"/g, "")}"`).join(","));
  return [head, ...lines].join("\n");
}

export function topAliases(marks: ProgressMark[], n = 10): { alias: string; xp: number }[] {
  const map = new Map<string, number>();
  const cut = Date.now() - 7 * 24 * 60 * 60 * 1000;
  for (const row of marks) {
    const alias = (row.alias || "").trim();
    const ts = Date.parse(row.ts || "");
    if (!alias || !Number.isFinite(ts) || ts < cut) continue;
    map.set(alias, (map.get(alias) || 0) + Math.max(0, Number(row.xp) || 0));
  }
  return [...map.entries()]
    .map(([alias, xp]) => ({ alias, xp }))
    .filter((row) => row.xp > 0)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, n);
}
