import { VISIT_STATES, type VisitState } from "@/lib/store";
import { cn } from "@/lib/utils";

const TONE: Record<VisitState, string> = {
  OPEN: "bg-gain text-white",
  MEETING: "bg-period-2 text-white",
  CLOSED: "bg-white text-fg ring-1 ring-fg",
  SUB: "bg-cleanup text-white",
};

export function VisitChip({
  state,
  onClick,
  className,
}: {
  state: VisitState;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide disabled:cursor-default",
        TONE[state],
        className,
      )}
    >
      {state}
    </button>
  );
}

export function VisitPad({
  value,
  onPick,
}: {
  value: VisitState;
  onPick: (s: VisitState) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {VISIT_STATES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className={cn(
            "min-h-10 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
            value === s ? TONE[s] : "bg-elevated text-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
