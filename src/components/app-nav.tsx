import { APP_SECTIONS, type AppSection, type NavTab } from "@/lib/app-nav";
import { markOf } from "@/lib/nav-marks";
import { useLang } from "@/lib/i18n-hook";
import { CtrlRail } from "@/components/ctrl";
import { MarkChip } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  if (hideSections && !row.length) return null;
  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-1", className)}>
      {hideSections ? null : (
      <CtrlRail label={t("Place")}>
        {shown.map((s) => (
          <MarkChip key={s.id} mark={markOf(s.id)} on={section === s.id} title={t(s.label)} onClick={() => onSection(s.id)}>
            {t(s.label)}
          </MarkChip>
        ))}
      </CtrlRail>
      )}
      {row.length ? (
        <CtrlRail label={t("In this section")}>
          {row.map((tab) => (
            <MarkChip key={tab.id} mark={markOf(tab.id)} on={tab.on} title={tab.label} onClick={tab.onClick}>
              {tab.label}
            </MarkChip>
          ))}
        </CtrlRail>
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
      className={cn("tw-tap min-h-9 shrink-0 rounded-xl px-3 text-[11px] font-bold uppercase tracking-wide", on ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
    >
      {on ? "New menu" : "Classic"}
    </button>
  );
}
