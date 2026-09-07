import { FolderKanban, LayoutDashboard, Sparkles, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type DockId = "board" | "crew" | "skills" | "projects" | "desk";

export function PhoneDock({
  view,
  pad,
  onBoard,
  onCrew,
  onSkills,
  onProjects,
  onDesk,
}: {
  view: string;
  pad?: "effort" | "skill";
  onBoard: () => void;
  onCrew: () => void;
  onSkills: () => void;
  onProjects: () => void;
  onDesk: () => void;
}) {
  const on: DockId =
    view === "crew"
      ? "crew"
      : view === "projects"
        ? "projects"
        : view === "skills" || view === "grades"
          ? "skills"
          : view === "score" || view === "admin"
              ? "desk"
              : "board";
  const items: { id: DockId; label: string; Icon: typeof Users; go: () => void }[] = [
    { id: "board", label: "Board", Icon: LayoutDashboard, go: onBoard },
    { id: "crew", label: "Crew", Icon: Users, go: onCrew },
    { id: "desk", label: "Desk", Icon: Wrench, go: onDesk },
    { id: "skills", label: "Learn", Icon: Sparkles, go: onSkills },
    { id: "projects", label: "Projects", Icon: FolderKanban, go: onProjects },
  ];
  return (
    <nav className="phone-dock shrink-0 border-t border-border bg-surface" aria-label="Phone">
      <ul className="grid grid-cols-5">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={it.go}
              className={cn(
                "tw-tap flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-bold tracking-wide",
                on === it.id ? "text-accent" : "text-fg/80",
              )}
            >
              <it.Icon className="size-6" strokeWidth={on === it.id ? 2.4 : 2} aria-hidden />
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
