import { STAGES } from "@/lib/store";
import { markOf } from "@/lib/nav-marks";
import { cn } from "@/lib/utils";

export function GoalChips({
  value,
  onPick,
}: {
  value: string;
  onPick: (stage: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STAGES.map((s) => {
        const Icon = markOf(s);
        const on = s === value;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className={cn(
              "tw-tap inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
              on ? "bg-gold text-bg" : "bg-elevated text-muted hover:text-fg",
            )}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" strokeWidth={on ? 2.4 : 2} aria-hidden /> : null}
            {s.replace(/ STAGE$/, "")}
          </button>
        );
      })}
    </div>
  );
}

export function GradeGoalChips({
  grades,
  valueOf,
  onPick,
}: {
  grades: readonly number[];
  valueOf: (grade: number) => string;
  onPick: (grade: number, stage: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {grades.map((g) => (
        <div key={g}>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">
            {g === 5 ? "Study hall" : `Grade ${g}`}
          </p>
          <GoalChips value={valueOf(g)} onPick={(s) => onPick(g, s)} />
        </div>
      ))}
    </div>
  );
}
