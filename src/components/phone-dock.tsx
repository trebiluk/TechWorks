import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { sectionOf, type AppSection } from "@/lib/app-nav";
import { markOf } from "@/lib/nav-marks";
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
    const items: { id: AppSection; label: string; go: () => void }[] = [
      { id: "dash", label: t("Dash"), go: onBoard },
      { id: "learn", label: t("Learn"), go: onSkills },
      { id: "crew", label: t("Crew"), go: onCrew },
      { id: "roster", label: t("Rosters"), go: onRoster ?? onOther ?? onDesk },
      { id: "admin", label: t("Admin"), go: onOther ?? onDesk },
    ];
    const on = sec;
    return (
      <nav className="phone-dock shrink-0 border-t border-border bg-surface" aria-label={t("Place")}>
        <ul className="mx-auto grid w-full max-w-lg grid-cols-5">
          {items.map((it) => {
            const Icon = markOf(it.id) ?? LayoutDashboard;
            return (
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
                <Icon className="size-6" strokeWidth={on === it.id ? 2.4 : 2} aria-hidden />
                {it.label}
              </button>
            </li>
            );
          })}
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
  const items: { id: DockId; mark: string; label: string; go: () => void }[] = [
    { id: "board", mark: "dash", label: t("Board"), go: onBoard },
    { id: "crew", mark: "crew", label: t("Crew"), go: onCrew },
    { id: "desk", mark: "admin", label: t("Desk"), go: onDesk },
    { id: "skills", mark: "learn", label: t("Learn"), go: onSkills },
    { id: "projects", mark: "projects", label: t("Projects"), go: onProjects },
  ];
  return (
    <nav className="phone-dock shrink-0 border-t border-border bg-surface" aria-label="Phone">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = markOf(it.mark) ?? LayoutDashboard;
          return (
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
              <Icon className="size-6" strokeWidth={on === it.id ? 2.4 : 2} aria-hidden />
              {it.label}
            </button>
          </li>
          );
        })}
      </ul>
    </nav>
  );
}
