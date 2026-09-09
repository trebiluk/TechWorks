import { BookOpen, ClipboardList, LayoutDashboard, MoreHorizontal, Presentation, Users, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionOf, type AppSection } from "@/lib/app-nav";
import { useLang } from "@/lib/i18n-hook";

type DockId = "board" | "crew" | "skills" | "projects" | "desk";

export function PhoneDock({
  view,
  pad: _pad,
  onBoard,
  onCrew,
  onSkills,
  onProjects,
  onDesk,
  navV2,
  onTeach: _onTeach,
  onOther,
  onRoster,
}: {
  view: string;
  pad?: "effort" | "skill";
  onBoard: () => void;
  onCrew: () => void;
  onSkills: () => void;
  onProjects: () => void;
  onDesk: () => void;
  navV2?: boolean;
  onTeach?: () => void;
  onOther?: () => void;
  onRoster?: () => void;
}) {
  const { t } = useLang();
  if (navV2) {
    const sec = sectionOf(view);
    const items: { id: AppSection; label: string; Icon: typeof LayoutDashboard; go: () => void }[] = [
      { id: "dash", label: t("Dash"), Icon: LayoutDashboard, go: onBoard },
      { id: "learn", label: t("Learn"), Icon: BookOpen, go: onSkills },
      { id: "crew", label: t("Crew"), Icon: Users, go: onCrew },
      { id: "roster", label: t("Rosters"), Icon: ClipboardList, go: onRoster ?? onOther ?? onDesk },
      { id: "admin", label: t("Admin"), Icon: MoreHorizontal, go: onOther ?? onDesk },
    ];
    const on = sec;
    return (
      <nav className="phone-dock shrink-0 border-t border-border bg-surface" aria-label={t("Place")}>
        <ul className="mx-auto grid w-full max-w-lg grid-cols-5">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={it.go}
                aria-current={on === it.id ? "page" : undefined}
                className={cn(
                  "tw-tap relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-bold tracking-wide",
                  on === it.id ? "text-accent" : "text-muted",
                )}
              >
                <span className={cn("dock-mark absolute top-1 h-0.5 w-6 rounded-full", on === it.id ? "bg-accent" : "bg-transparent")} aria-hidden />
                <it.Icon className="size-6" strokeWidth={on === it.id ? 2.4 : 2} aria-hidden />
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  const on: DockId =
    view === "crew"
      ? "crew"
      : view === "projects"
        ? "projects"
        : view === "skills" || view === "grades"
          ? "skills"
          : view === "teach" || view === "week" || view === "year" || view === "overview" || view === "polls" || view === "deck"
            ? "board"
          : view === "score" || view === "admin"
              ? "desk"
              : "board";
  const items: { id: DockId; label: string; Icon: typeof LayoutDashboard; go: () => void }[] = [
    { id: "board", label: t("Board"), Icon: LayoutDashboard, go: onBoard },
    { id: "crew", label: t("Crew"), Icon: Users, go: onCrew },
    { id: "desk", label: t("Desk"), Icon: Wrench, go: onDesk },
    { id: "skills", label: t("Learn"), Icon: BookOpen, go: onSkills },
    { id: "projects", label: t("Projects"), Icon: Presentation, go: onProjects },
  ];
  return (
    <nav className="phone-dock shrink-0 border-t border-border bg-surface" aria-label="Phone">
      <ul className="grid grid-cols-5">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={it.go}
              aria-current={on === it.id ? "page" : undefined}
              className={cn(
                "tw-tap relative flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-bold tracking-wide",
                on === it.id ? "text-accent" : "text-muted",
              )}
            >
              <span className={cn("dock-mark absolute top-1 h-0.5 w-6 rounded-full", on === it.id ? "bg-accent" : "bg-transparent")} aria-hidden />
              <it.Icon className="size-6" strokeWidth={on === it.id ? 2.4 : 2} aria-hidden />
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
