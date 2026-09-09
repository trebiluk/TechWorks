import type { AdminPane } from "@/components/settings";

/** Top Admin chips. Records is the gradebook (backups + roster). Modules is its own chip — not buried in Class. */
export const ADMIN_GROUPS = [
  { id: "today", label: "Today", panes: ["today"] as const },
  { id: "records", label: "Records", panes: ["vault", "roster", "cloud"] as const },
  { id: "people", label: "Crews", panes: ["crews"] as const },
  { id: "day", label: "Day", panes: ["day"] as const },
  { id: "class", label: "Class", panes: ["economy"] as const },
  { id: "modules", label: "Modules", panes: ["modules"] as const },
  { id: "look", label: "Theme", panes: ["room"] as const },
  { id: "about", label: "About", panes: ["about"] as const },
] as const;

export type AdminGroupId = (typeof ADMIN_GROUPS)[number]["id"];

export const PANE_LABEL: Record<string, string> = {
  today: "Today",
  vault: "Backups",
  roster: "Roster",
  cloud: "Cloud",
  crews: "Crews",
  day: "Day",
  room: "Theme",
  economy: "Pay",
  modules: "Modules",
  about: "About",
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
