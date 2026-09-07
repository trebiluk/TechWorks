import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Gold fill = on. Use for periods, stages, filters. */
export function Chip({
  on,
  children,
  onClick,
  disabled,
  className,
}: {
  on?: boolean;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 touch-manipulation items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide disabled:opacity-40",
        on ? "bg-gold text-bg" : "bg-elevated text-muted hover:bg-surface hover:text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:brightness-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Gold = primary action. Elevated = secondary. */
export function Btn({
  kind = "do",
  children,
  onClick,
  disabled,
  className,
}: {
  kind?: "do" | "quiet" | "warn";
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 touch-manipulation items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold disabled:opacity-40",
        kind === "do" && "bg-gold text-bg hover:brightness-110",
        kind === "quiet" && "bg-elevated text-muted hover:bg-surface hover:text-fg",
        kind === "warn" && "bg-loss text-accent-fg hover:brightness-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold active:brightness-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TogglePair<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full bg-elevated p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "min-h-10 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
            value === o.id ? "bg-gold text-bg" : "text-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Dot({ on, className }: { on?: boolean; className?: string }) {
  return <span className={cn("inline-block size-2.5 rounded-full", on ? "bg-gold" : "bg-elevated", className)} />;
}
