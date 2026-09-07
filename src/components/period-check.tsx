import type { EconomyFile } from "@/lib/economy";
import { SCHOOLTOOL_URL } from "@/lib/bells";
import { cleanupOn, exportedThisPeriod, schooltoolDone, setCleanup, setSchooltoolDone, stampLiveExport } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PeriodCheck({
  file,
  date,
  period,
  crewKey,
  onChange,
  onExport,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  crewKey?: string;
  onChange: (next: EconomyFile) => void;
  onExport: () => void;
}) {
  const st = schooltoolDone(file, date, period);
  const clean = crewKey ? cleanupOn(file, date, period, crewKey) : "";
  const sent = exportedThisPeriod(file, date, period);
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg bg-surface px-2 py-1.5">
      <p className="mr-1 text-xs font-semibold uppercase tracking-wider text-subtle">P{period} close</p>
      <a
        href={SCHOOLTOOL_URL}
        target="_blank"
        rel="noreferrer"
        className="min-h-11 rounded-md bg-elevated px-3 text-sm"
      >
        SchoolTool
      </a>
      <button
        type="button"
        onClick={() => onChange(setSchooltoolDone(file, date, period, !st))}
        className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", st ? "bg-gain text-bg" : "bg-elevated")}
      >
        {st ? "✓ Attendance" : "Attendance"}
      </button>
      {crewKey ? (
        <button
          type="button"
          onClick={() => {
            if (clean === "done") return;
            onChange(setCleanup(file, date, period, crewKey, "done"));
          }}
          className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", clean === "done" ? "bg-gain text-bg" : "bg-elevated")}
        >
          {clean === "done" ? "✓ Cleanup" : "Cleanup"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => {
          onChange(stampLiveExport(file, date, period));
          onExport();
        }}
        className={cn("min-h-11 rounded-md px-3 text-sm font-semibold", sent ? "bg-gain text-bg" : "bg-elevated")}
      >
        {sent ? "✓ Export" : "Export"}
      </button>
    </div>
  );
}
