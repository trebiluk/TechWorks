import { avatarOf } from "@/lib/avatars";
import { crewInk, frameOf } from "@/lib/flair";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function Face({
  frame,
  children,
  onClick,
  className,
}: {
  frame: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const cls = cn("tw-card-kid flex w-full flex-col items-center gap-1 rounded-xl px-2 py-3 text-center", `tw-frame-${frame}`, className);
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("tw-tap", cls)}>
        {children}
      </button>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function WorkerCard({
  id,
  name,
  icon,
  title,
  xp,
  lead,
  legal,
  onClick,
}: {
  id: string;
  name: string;
  icon?: string;
  title?: string;
  xp?: number;
  lead?: boolean;
  legal?: string;
  onClick?: () => void;
}) {
  const frame = lead ? "gold" : frameOf(xp ?? 0);
  return (
    <Face frame={frame} onClick={onClick}>
      <span className="tw-card-face grid size-14 place-items-center rounded-full text-3xl" aria-hidden>
        {avatarOf(icon, id)}
      </span>
      <span className="min-w-0 max-w-full truncate font-display text-lg font-bold leading-tight">{name}</span>
      {title ? <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{title}</span> : null}
      {xp != null ? <span className="font-mono text-xs tabular-nums text-gold">{xp} XP</span> : null}
      {legal ? <span className="truncate text-[10px] text-muted">{legal}</span> : null}
    </Face>
  );
}

export function CrewBanner({
  name,
  motto,
  icon,
  color,
  logo,
  period,
  n,
}: {
  name: string;
  motto?: string;
  icon?: string;
  color?: string;
  logo?: string;
  period?: number;
  n?: number;
}) {
  return (
    <article className="tw-crew-banner overflow-hidden rounded-2xl p-3" style={crewInk(color)}>
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-bg/15 text-4xl" aria-hidden>
            {icon || "★"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-70">
            {period != null ? `P${period} crew` : "Our crew"}
            {n != null ? ` · ${n}` : ""}
          </p>
          <p className="font-display text-3xl font-bold leading-none tracking-tight">{name}</p>
          {motto ? <p className="mt-1 text-sm font-semibold opacity-80">{motto}</p> : null}
        </div>
      </div>
    </article>
  );
}
