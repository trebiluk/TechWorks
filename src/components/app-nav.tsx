import { APP_SECTIONS, type AppSection, type NavTab } from "@/lib/app-nav";
import { cn } from "@/lib/utils";

const ROW =
  "pointer-events-auto flex w-full min-w-0 flex-wrap items-center gap-1 overflow-x-hidden";

export function AppNav({
  section,
  onSection,
  tabs,
  unlocked,
  className,
  hideSections,
}: {
  section: AppSection;
  onSection: (s: AppSection) => void;
  tabs: NavTab[];
  unlocked: boolean;
  className?: string;
  hideSections?: boolean;
}) {
  const shown = APP_SECTIONS.filter((s) => !s.lock || unlocked);
  const row = tabs.filter((t) => !t.hidden);
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}>
      {hideSections ? null : (
      <nav className={cn(ROW, "tw-gadget p-1")} aria-label="Section">
        {shown.map((s) => (
          <button
            key={s.id}
            type="button"
            title={s.label}
            onClick={() => onSection(s.id)}
            className={cn(
              "tw-tap min-h-11 min-w-0 flex-[1_1_30%] rounded-lg px-2 text-[11px] font-bold uppercase tracking-[0.12em] sm:min-h-10 sm:flex-none sm:px-4 sm:text-xs",
              section === s.id ? "bg-accent text-accent-fg" : "text-muted hover:bg-elevated hover:text-fg",
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
      )}
      {row.length ? (
        <nav className={ROW} aria-label="In this section">
          {row.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.label}
              onClick={t.onClick}
              className={cn(
                "inline-flex min-h-11 min-w-0 flex-[1_1_30%] items-center justify-center rounded-lg px-2 text-sm font-semibold sm:min-h-8 sm:flex-none sm:px-3 sm:text-xs",
                t.on ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function NavToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      title={on ? "Ribbon · Dash Learn Crew Admin" : "Classic · Dash Learn Crew Admin"}
      onClick={() => onChange(!on)}
      className={cn("tw-tap min-h-9 shrink-0 rounded-full px-3 text-[11px] font-bold uppercase tracking-wide", on ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
    >
      {on ? "New menu" : "Classic"}
    </button>
  );
}
