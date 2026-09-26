import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { deskSavePending } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/** Quiet proof the gradebook landed on this PC. */
export function SavedChip() {
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => setPending(deskSavePending()), 400);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="hidden min-h-11 items-center font-mono text-[11px] font-semibold text-muted sm:inline-flex" aria-live="polite">
      {pending ? "Saving…" : "Saved"}
    </span>
  );
}

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
