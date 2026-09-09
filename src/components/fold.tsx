import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Fold({
  label,
  hint,
  open,
  onToggle,
  dark,
  grow,
  icon: Icon,
  tools,
  className,
  style,
  children,
}: {
  label: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  dark?: boolean;
  grow?: boolean;
  icon?: LucideIcon;
  tools?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <section
      style={style}
      className={cn(
        "flex flex-col rounded-2xl [contain:layout]",
        dark ? "bg-elevated text-fg" : "bg-surface",
        grow && open ? "min-h-0 flex-1" : "shrink-0",
        className,
      )}
    >
      <div className={cn("flex shrink-0 items-center", dark ? "" : "")}>
        <button
          type="button"
          onClick={onToggle}
          title={label}
          aria-expanded={open}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 px-3 py-1 text-left touch-manipulation",
            dark ? "hover:bg-elevated" : "hover:bg-elevated/50",
          )}
        >
          <ChevronDown className={cn("size-3.5 shrink-0 opacity-50 transition-transform duration-150", open ? "" : "-rotate-90")} />
          {Icon ? <Icon className="size-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden /> : null}
          <span className="font-display text-sm font-semibold tracking-tight">{label}</span>
          {hint ? (
            <span className={cn("ml-auto truncate text-xs", dark ? "text-muted" : "text-fg/70")}>{hint}</span>
          ) : null}
        </button>
        {tools ? <div className="flex shrink-0 items-center gap-0.5 pr-2">{tools}</div> : null}
      </div>
      {open ? <div className={cn("min-h-0 px-2.5 pb-2 pt-0.5 [content-visibility:auto]", grow ? "flex-1 overflow-hidden" : "")}>{children}</div> : null}
    </section>
  );
}
