import { money } from "@/lib/economy";
import { cn } from "@/lib/utils";

export const LV: Record<number, string> = {
  1: "bg-subtle",
  2: "bg-period-4",
  3: "bg-period-2",
  4: "bg-period-1",
  5: "bg-gold",
  6: "bg-accent",
  7: "bg-period-5",
  8: "bg-fg",
};

export function XpBit({
  xp,
  level,
  title,
  hot,
  className,
}: {
  xp: number;
  level?: number;
  title?: string;
  hot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded px-1 font-mono text-xs tabular-nums text-gold", hot ? "bg-gold/20" : "", className)}
      title={title}
    >
      {level != null ? <span className={cn("size-2 shrink-0 rounded-full", LV[level] ?? "bg-muted")} /> : null}
      <span aria-hidden>◆</span>
      {xp}
    </span>
  );
}

export function PerkBit({ n, hot, className }: { n: number; hot?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-12 justify-end rounded px-1 font-mono text-xs tabular-nums",
        hot ? "bg-elevated text-fg" : n < 0 ? "text-loss" : "text-muted",
        className,
      )}
    >
      {money(n)}
    </span>
  );
}
