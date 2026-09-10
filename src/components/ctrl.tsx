import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { markOf } from "@/lib/nav-marks";
import { cn } from "@/lib/utils";

/** Square HUD control. Icon is the hit. Word is a title, not a wrapping pill. */
export function CtrlHud({
  mark: Icon,
  title,
  on,
  alarm,
  onClick,
  href,
  children,
  className,
}: {
  mark?: LucideIcon;
  title: string;
  on?: boolean;
  alarm?: boolean;
  onClick?: () => void;
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  const cls = cn(
    "tw-hud-btn tw-tap inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
    alarm ? "bg-loss text-accent-fg" : on ? "bg-accent text-accent-fg" : "text-fg hover:bg-elevated",
    className,
  );
  const body = (
    <>
      {Icon ? <Icon className="size-5" strokeWidth={2.2} aria-hidden /> : children}
      <span className="sr-only">{title}</span>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" title={title} aria-label={title} className={cls}>
        {body}
      </a>
    );
  }
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

/** One row. Never wraps. Swipe to the rest. */
export function CtrlRail({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("tw-rail tw-gadget p-1", className)}>
      {children}
    </nav>
  );
}

/** Equal-cell destination. Icon above the word. */
export function CtrlTile({
  id,
  label,
  on,
  onClick,
  mark,
}: {
  id: string;
  label: string;
  on?: boolean;
  onClick: () => void;
  mark?: LucideIcon;
}) {
  const Icon = mark ?? markOf(id);
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      aria-current={on ? "page" : undefined}
      className={cn("tw-tile tw-tap", on ? "bg-accent text-accent-fg" : "bg-elevated text-muted hover:text-fg")}
    >
      {Icon ? <Icon className="size-5 shrink-0" strokeWidth={on ? 2.4 : 2} aria-hidden /> : null}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

export function CtrlPad({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("tw-pad", className)}>{children}</div>;
}

/** Exclusive inner panes. Equal columns. One bar. */
export function CtrlSeg({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tw-seg" role="tablist">
      {items.map((it) => {
        const Icon = markOf(it.id);
        const on = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.id)}
            className={cn(
              "tw-tap inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold",
              on ? "bg-fg text-bg" : "text-muted hover:text-fg",
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
            <span className="truncate">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
