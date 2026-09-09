import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { cn } from "@/lib/utils";

/** Lives in chrome, not over TOP 3 / goals. */
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
      {onMrk ? (
        <button type="button" title="Mr. K’s profile" onClick={onMrk} className="tw-tap rounded-md">
          {VERSION_LABEL}
        </button>
      ) : (
        VERSION_LABEL
      )}
    </span>
  );
}
