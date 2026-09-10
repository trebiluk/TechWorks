import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

/** Lives in chrome, not over TOP 3 / goals. Phone: paw only. */
export function VersionChip({
  className,
  peek,
  onBerty,
  onMrk,
}: {
  className?: string;
  peek?: boolean;
  onBerty?: () => void;
  onMrk?: () => void;
}) {
  const label = onMrk ? (
    <button type="button" title="Mr. K’s profile" onClick={onMrk} className="tw-tap hidden rounded-md sm:inline">
      {VERSION_LABEL}
    </button>
  ) : (
    <span className="hidden sm:inline">{VERSION_LABEL}</span>
  );
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-gold sm:text-[11px]", className)} title={COPYRIGHT_LINE}>
      {peek ? (
        onBerty ? (
          <button type="button" title="Berty’s profile" onClick={onBerty} className="tw-tap rounded-md">
            <BertyPeek pose="icon" />
          </button>
        ) : (
          <BertyPeek pose="icon" />
        )
      ) : null}
      {label}
    </span>
  );
}
