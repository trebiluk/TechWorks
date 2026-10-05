import { LEGAL_TITLE } from "@/lib/copy";
import { cn } from "@/lib/utils";

/** Brand T. Immune to theme. */
export function TwMark({ className, size = 28 }: { className?: string; size?: number }) {
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

/** Full TECHWORKS lockup. The real plate. Never follows theme. */
export function TwWordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("tw-lockup", compact && "tw-lockup-compact", className)} title={LEGAL_TITLE} aria-label="TechWorks" dir="ltr">
      <img
        src="/brand/techworks.png"
        alt=""
        width={180}
        height={44}
        className="tw-lockup-img"
        draggable={false}
      />
    </span>
  );
}
