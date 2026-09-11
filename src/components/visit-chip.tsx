import { VISIT_STATES, setVisit, setVisitAll, visitOn, type VisitState } from "@/lib/store";
import type { EconomyFile } from "@/lib/economy";
import { cn } from "@/lib/utils";

const TONE: Record<VisitState, string> = {
  OPEN: "bg-gain text-bg",
  MEETING: "bg-period-2 text-accent-fg",
  CLOSED: "bg-elevated text-fg ring-1 ring-fg",
  SUB: "bg-cleanup text-accent-fg",
};

const FALLBACK_BELLS = [
  { period: 1, grade: 6 },
  { period: 2, grade: 8 },
  { period: 3, grade: 7 },
  { period: 6, grade: 5 },
  { period: 8, grade: 7 },
  { period: 9, grade: 8 },
  { period: 10, grade: 6 },
];

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
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={onClick ? `Room ${state}. Tap to change.` : `Room ${state}`}
      className={cn(
        "tw-visit tw-tap inline-flex min-h-10 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-wide disabled:cursor-default",
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
    <div className="tw-visit-desk flex flex-wrap gap-1">
      {VISIT_STATES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-pressed={value === s}
          className={cn(
            "tw-visit tw-tap min-h-10 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
            value === s ? TONE[s] : "bg-elevated text-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export function VisitDesk({
  file,
  date,
  onChange,
}: {
  file: EconomyFile;
  date: string;
  onChange: (next: EconomyFile) => void;
}) {
  const bells = file.meta.bell?.length ? file.meta.bell : FALLBACK_BELLS;
  const allOn = (s: VisitState) => bells.every((b) => visitOn(file, date, b.period) === s);
  return (
    <div className="tw-visit-desk relative z-20" data-visit-pad>
      <p className="text-sm font-medium uppercase tracking-wider text-subtle">Daily schedule · passes</p>
      <p className="mt-1 text-sm text-muted">Can students request a pass and visit this room? OPEN / MEETING / CLOSED / SUB. Today only.</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {VISIT_STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(setVisitAll(file, date, s))}
            onPointerDown={(e) => e.stopPropagation()}
            aria-pressed={allOn(s)}
            className={cn(
              "tw-visit tw-tap min-h-10 rounded-full px-3 text-xs font-semibold uppercase tracking-wide",
              allOn(s) ? TONE[s] : "bg-elevated text-muted",
            )}
          >
            All {s}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-2">
        {bells.map((b) => (
          <li key={b.period} className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-sm font-semibold">P{b.period}</span>
            <VisitPad value={visitOn(file, date, b.period)} onPick={(s) => onChange(setVisit(file, date, b.period, s))} />
          </li>
        ))}
      </ul>
    </div>
  );
}
