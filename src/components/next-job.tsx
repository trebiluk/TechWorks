import { memo, useMemo } from "react";
import type { EconomyFile } from "@/lib/economy";
import { deskBellId } from "@/lib/store";
import { useShopClock } from "@/lib/use-clock";
import { nextJob, type NextJob } from "@/lib/workflow";
import { cn } from "@/lib/utils";

export const NextJobChip = memo(function NextJobChip({
  file,
  onGo,
}: {
  file: EconomyFile;
  onGo: (job: NextJob) => void;
}) {
  const now = useShopClock(deskBellId(file), "beat");
  const job = useMemo(() => nextJob(file, now), [file, now]);
  const tone =
    job.tone === "now"
      ? "bg-accent text-accent-fg"
      : job.tone === "warn"
        ? "bg-cleanup text-accent-fg"
        : job.tone === "due"
          ? "bg-loss text-accent-fg"
          : "bg-elevated text-muted";
  return (
    <button
      type="button"
      title={`${job.label} · ${job.hint}`}
      onClick={() => onGo(job)}
      className={cn("tw-tap flex min-h-11 max-w-[14rem] shrink-0 items-center gap-1.5 rounded-md px-2.5 sm:min-h-9", tone)}
    >
      <span className="truncate text-xs font-bold uppercase tracking-wide">{job.label}</span>
      <span className="hidden truncate font-mono text-[10px] opacity-80 sm:inline">{job.hint}</span>
    </button>
  );
});
