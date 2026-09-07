import { quarterNow, todayIso } from "@/lib/calendar";
import { cn } from "@/lib/utils";

export function QuarterChip({ date, className }: { date?: string; className?: string }) {
  const q = quarterNow(date ?? todayIso());
  return (
    <span
      title={`Quarter ${q.n}`}
      className={cn(
        "inline-flex min-h-8 min-w-10 items-center justify-center rounded-full bg-elevated px-3 text-sm font-semibold tabular-nums tracking-wide",
        className,
      )}
    >
      {q.label}
    </span>
  );
}
