import { VERSION_LABEL } from "@/lib/version";
import { COPYRIGHT_LINE } from "@/lib/copy";
import { BertyPeek } from "@/components/berty";
import { cloudStatus, type CloudStatus } from "@/lib/desk-cloud";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

/** Quiet proof the gradebook landed on this PC. */
export function SavedChip() {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const sync = () => {
      const st: CloudStatus = cloudStatus();
      if (st === "saving") setLabel("Saving…");
      else if (st === "saved") setLabel("Saved");
      else if (st === "error" || st === "this-pc") setLabel("Not saved");
      else setLabel("");
    };
    sync();
    window.addEventListener("techworks-cloud", sync);
    const t = window.setInterval(sync, 400);
    return () => {
      window.removeEventListener("techworks-cloud", sync);
      window.clearInterval(t);
    };
  }, []);
  if (!label) return null;
  return (
    <span className="hidden min-h-11 items-center font-mono text-[11px] font-semibold text-muted sm:inline-flex" aria-live="polite">
      {label}
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
    <button type="button" title="Mr. K’s profile" onClick={onMrk} className="tw-tap rounded-md">
      {VERSION_LABEL}
    </button>
  ) : (
    <span>{VERSION_LABEL}</span>
  );
  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-gold sm:text-[11px]", className)} title={COPYRIGHT_LINE}>
      {peek ? (
        onBerty ? (
          <button type="button" title="Berty" aria-label="Berty" onClick={onBerty} className="tw-tap inline-flex min-h-11 min-w-11 items-center gap-1 rounded-md px-2 text-sm font-semibold">
            <BertyPeek pose="icon" />
            <span>Berty</span>
          </button>
        ) : (
          <BertyPeek pose="icon" />
        )
      ) : null}
      {label}
    </span>
  );
}
