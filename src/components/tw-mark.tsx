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

/** T + TECHWORKS. Navy plate is the lockup — not a PNG dropped in a second box. */
export function TwWordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("tw-lockup", compact && "tw-lockup-compact", className)} title={LEGAL_TITLE} aria-label="TechWorks">
      <TwMark size={28} />
      <span className="tw-lockup-word">
        <span className="tw-lockup-tech">TECH</span>
        <span className="tw-lockup-works">WORKS</span>
      </span>
    </span>
  );
}
