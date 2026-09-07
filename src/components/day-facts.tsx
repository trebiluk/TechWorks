import type { EconomyFile } from "@/lib/economy";
import { bellFor } from "@/lib/economy";
import { cycleGoalFor, happenedOn, periodGoal, setHappened, setPeriodGoal, STAGES } from "@/lib/store";
import { cn } from "@/lib/utils";
import { GoalChips } from "@/components/goal-chips";

export function DayFacts({
  file,
  date,
  period,
  crewKey,
  edit = false,
  unlocked = false,
  onNeedPin,
  onChange,
  className,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  crewKey?: string;
  edit?: boolean;
  unlocked?: boolean;
  onNeedPin?: () => void;
  onChange?: (next: EconomyFile) => void;
  className?: string;
}) {
  const goal = periodGoal(file, date, period) || cycleGoalFor(file, period);
  const happened = happenedOn(file, date, period, crewKey);
  const grade = bellFor(file).find((b) => b.period === period)?.grade ?? 6;

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin?.();
    return false;
  }

  if (!edit) {
    return (
      <div className={cn("min-w-0 text-sm", className)}>
        <p>
          <span className="text-mast uppercase tracking-wider text-subtle">Goal </span>
          <span className="uppercase">{goal || "—"}</span>
        </p>
        {happened ? <p className="mt-0.5 text-muted">{happened}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div>
        <p className="mb-1 text-mast uppercase tracking-wider text-subtle">Daily goal · Grade {grade}</p>
        <GoalChips
          value={STAGES.includes(goal as (typeof STAGES)[number]) ? goal : STAGES[0]}
          onPick={(v) => {
            if (!gate()) return;
            onChange?.(setPeriodGoal(file, date, period, v));
          }}
        />
      </div>
      <label className="block">
        <span className="text-mast uppercase tracking-wider text-subtle">Happened</span>
        <input
          value={happened}
          onFocus={() => {
            if (!unlocked) onNeedPin?.();
          }}
          onChange={(e) => {
            if (!unlocked) return;
            onChange?.(setHappened(file, date, period, e.target.value, crewKey));
          }}
          maxLength={160}
          placeholder="One line"
          className="mt-1 min-h-11 w-full rounded-lg bg-surface px-3 text-sm outline-none"
        />
      </label>
    </div>
  );
}
