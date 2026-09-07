import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function LevelMark({
  level,
  xp,
  className,
}: {
  level: number;
  xp: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-mono tabular-nums text-gold", className)} title={`${xp} XP`}>
      <Coins className="size-3.5 shrink-0" aria-hidden />
      <span>Lv {level}</span>
      <span className="opacity-80">{xp}</span>
    </span>
  );
}
