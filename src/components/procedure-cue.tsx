import { Berty } from "@/components/berty";
import { bertyPose } from "@/lib/berty";
import { DAILY_PROCEDURE, type ProcedureId } from "@/lib/procedure";
import { cn } from "@/lib/utils";

/** Berty points at the daily procedure — cleanup wall owns the coral overlay. */
export function ProcedureCue({
  step,
  passing,
  compact,
}: {
  step: ProcedureId;
  passing?: boolean;
  compact?: boolean;
}) {
  const pose = bertyPose({ passing, slot: step, cleanup: step === "clean" });
  return (
    <aside className={cn("tw-gadget tw-hud flex items-center gap-3 p-3", compact ? "" : "tw-live")}>
      <Berty pose={pose} size={compact ? "sm" : "md"} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
          {passing ? "Between classes" : "Do this now"}
        </p>
        <ol className={cn("mt-1", compact ? "grid grid-cols-2 gap-x-3 gap-y-0.5" : "space-y-0.5")}>
          {DAILY_PROCEDURE.map((s) => {
            const on = s.id === step;
            return (
              <li
                key={s.id}
                className={cn("flex min-h-8 items-baseline gap-2 text-sm", on ? "font-semibold text-fg" : "text-muted")}
              >
                <span className={cn("font-mono text-xs", on ? "text-accent" : "")}>{s.n}</span>
                <span>
                  {s.title}
                  {on && !compact ? <span className="ml-1 font-normal text-muted">· {s.line}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
