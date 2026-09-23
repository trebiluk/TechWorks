import type { AdminPane } from "@/components/settings";

/** Five top chips. People adds a class. Room is the shop. Data is backups. */
export const ADMIN_GROUPS = [
  { id: "today", label: "Today", panes: ["today"] as const },
  { id: "people", label: "People", panes: ["roster", "crews", "privacy"] as const },
  { id: "money", label: "Money", panes: ["economy"] as const },
  { id: "room", label: "Room", panes: ["room", "wall", "day", "modules"] as const },
  { id: "data", label: "Data", panes: ["vault", "cloud", "about", "door", "docs"] as const },
] as const;

export type AdminGroupId = (typeof ADMIN_GROUPS)[number]["id"];

export const PANE_LABEL: Record<string, string> = {
  today: "Today",
  vault: "Backups",
  roster: "Roster",
  cloud: "Cloud",
  crews: "Crews",
  privacy: "Privacy",
  wall: "Wall",
  day: "Day",
  room: "Theme",
  economy: "Pay",
  modules: "Modules",
  about: "About",
  docs: "Map",
  door: "Door",
};

export function groupOfPane(pane: string): (typeof ADMIN_GROUPS)[number] {
  return ADMIN_GROUPS.find((g) => (g.panes as readonly string[]).includes(pane)) ?? ADMIN_GROUPS[0];
}

export function defaultPane(groupId: string): AdminPane {
  const g = ADMIN_GROUPS.find((x) => x.id === groupId);
  return (g?.panes[0] ?? "today") as AdminPane;
}

export function paneInGroup(pane: string, groupId: string): boolean {
  const g = ADMIN_GROUPS.find((x) => x.id === groupId);
  return Boolean(g && (g.panes as readonly string[]).includes(pane));
}
