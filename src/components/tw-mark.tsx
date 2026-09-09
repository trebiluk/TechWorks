import { LEGAL_TITLE } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Brand T. Immune to theme. */
export function TwMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src="/mark.png"
      alt=""
      width={size}
      height={size}
      className={cn("tw-lockup-mark shrink-0 object-contain", className)}
      draggable={false}
    />
  );
}

/** Full TECHWORKS lockup. Navy / cyan / violet plate. Never follows theme. */
export function TwWordmark({ className }: { className?: string; mark?: number; compact?: boolean }) {
  return (
    <span className={cn("tw-lockup", className)} title={LEGAL_TITLE} aria-label="TechWorks">
      <img
        src="/brand/techworks.png"
        alt="TechWorks"
        width={180}
        height={44}
        className="tw-lockup-img"
        style={{ height: 44, width: "auto", maxWidth: 220, display: "block" }}
        draggable={false}
      />
    </span>
  );
}
