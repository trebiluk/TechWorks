import { memo, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import type { EconomyFile } from "@/lib/economy";
import { deskBellId } from "@/lib/store";
import { useShopClock } from "@/lib/use-clock";
import { nextJob, type NextJob } from "@/lib/workflow";
import { markOf } from "@/lib/nav-marks";
import { cn } from "@/lib/utils";

export const NextJobChip = memo(function NextJobChip({
  file,
  onGo,
}: {
  file: EconomyFile;
  onGo: (job: NextJob) => void;
}) {
  const now = useShopClock(deskBellId(file), "beat");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const sync = () => setTick((n) => n + 1);
    window.addEventListener("techworks-job", sync);
    window.addEventListener("techworks-cloud", sync);
    return () => {
      window.removeEventListener("techworks-job", sync);
      window.removeEventListener("techworks-cloud", sync);
    };
  }, []);
  const job = useMemo(() => nextJob(file, now), [file, now, tick]);
  const Icon = markOf(job.id) ?? ClipboardList;
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
      className={cn("tw-next-job tw-tap", tone)}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2.3} aria-hidden />
      <span className="min-w-0 text-left">
        <span className="block truncate leading-tight">{job.label}</span>
        <span className="hidden truncate font-mono text-[10px] font-medium normal-case tracking-normal opacity-80 sm:block">{job.hint}</span>
      </span>
    </button>
  );
});
