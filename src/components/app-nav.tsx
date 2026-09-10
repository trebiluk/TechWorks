import { APP_SECTIONS, type AppSection, type NavTab } from "@/lib/app-nav";
import { markOf } from "@/lib/nav-marks";
import { useLang } from "@/lib/i18n-hook";
import { MarkChip } from "@/components/ui";
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
  const { t } = useLang();
  const shown = APP_SECTIONS.filter((s) => !s.lock || unlocked);
  const row = tabs.filter((tab) => !tab.hidden);
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-0.5", className)}>
      {hideSections ? null : (
      <nav className={cn(ROW, "tw-gadget p-1")} aria-label={t("Place")}>
        {shown.map((s) => (
          <MarkChip key={s.id} mark={markOf(s.id)} on={section === s.id} title={t(s.label)} onClick={() => onSection(s.id)}>
            {t(s.label)}
          </MarkChip>
        ))}
      </nav>
      )}
      {row.length ? (
        <nav className={ROW} aria-label={t("In this section")}>
          {row.map((tab) => (
            <MarkChip key={tab.id} mark={markOf(tab.id)} on={tab.on} title={tab.label} onClick={tab.onClick}>
              {tab.label}
            </MarkChip>
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
