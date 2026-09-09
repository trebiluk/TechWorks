import { SettingsBody, type SettingsTab } from "@/components/settings";
import type { EconomyFile } from "@/lib/economy";
import { cn } from "@/lib/utils";

export function gearTabFor(view: string): SettingsTab {
  if (view === "overview" || view === "week" || view === "year" || view === "teach" || view === "polls" || view === "data" || view === "clubwall" || view === "hallwall")
    return "day";
  if (view === "skills" || view === "projects" || view === "grades") return "economy";
  if (view === "score" || view === "crew") return "day";
  if (view === "club" || view === "studyhall" || view === "prints" || view === "wallet" || view === "lucky" || view === "store")
    return "modules";
  return "day";
}

export function AdminDrawer({
  open,
  onToggle,
  view,
  file,
  onChange,
  onExportNames,
  onExport,
  onSave,
  onTips,
}: {
  open: boolean;
  onToggle: () => void;
  view: string;
  file: EconomyFile;
  onChange: (next: EconomyFile) => void;
  onExportNames: () => void;
  onExport?: () => void;
  onSave?: () => void;
  onTips?: (on: boolean) => void;
}) {
  return (
    <div className="tw-gadget mb-2 p-1.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn("tw-tap min-h-9 w-full rounded-md px-3 text-left text-[11px] font-bold uppercase tracking-[0.16em]", open ? "bg-accent text-accent-fg" : "bg-elevated text-muted")}
      >
        {open ? "Hide settings" : "Settings"}
      </button>
      {open ? (
        <div className="mt-1 max-h-[40vh] overflow-y-auto">
          <SettingsBody
            file={file}
            tab={gearTabFor(view)}
            onChange={onChange}
            onExportNames={onExportNames}
            onExport={onExport}
            onSave={onSave}
            onTips={onTips}
          />
        </div>
      ) : null}
    </div>
  );
}
