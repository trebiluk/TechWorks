import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

/** Lives in chrome, not over TOP 3 / goals. */
export function VersionChip({ className, peek }: { className?: string; peek?: boolean }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-gold sm:text-[11px]", className)}
      title={COPYRIGHT_LINE}
    >
      {peek ? <BertyPeek pose="icon" /> : null}
      {VERSION_LABEL}
    </span>
  );
}
