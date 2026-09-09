import { Berty } from "@/components/berty";
import { bertyPose } from "@/lib/berty";
import { useLang } from "@/lib/i18n-hook";
import { DAILY_PROCEDURE, type ProcedureId } from "@/lib/procedure";
import { cn } from "@/lib/utils";

/** Berty points at the daily procedure — cleanup wall owns the coral overlay. */
export function ProcedureCue({
  step,
  passing,
  compact,
  bot = true,
}: {
  step: ProcedureId;
  passing?: boolean;
  compact?: boolean;
  bot?: boolean;
}) {
  const { t } = useLang();
  const pose = bertyPose({ passing, slot: step, cleanup: step === "clean" });
  return (
    <aside
      data-proc-cue
      className={cn("tw-gadget tw-hud flex items-center gap-3 p-3", compact ? "" : "tw-live tw-fill-wide")}
    >
      {bot ? <Berty pose={pose} size={compact ? "sm" : "lg"} className="tw-proc-bot shrink-0" /> : null}
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold uppercase tracking-wider text-accent", compact ? "text-[11px]" : "tw-fill-label")}>
          {passing ? t("Between classes") : t("Do this now")}
        </p>
        <ol data-proc-steps={compact ? "2" : "4"} className="mt-1">
          {DAILY_PROCEDURE.map((s) => {
            const on = s.id === step;
            return (
              <li
                key={s.id}
                className={cn("flex min-h-8 items-baseline gap-2", on ? "tw-proc-on font-semibold text-fg" : "text-muted")}
              >
                <span className={cn("tw-proc-n font-mono", on ? "text-accent" : "")}>{s.n}</span>
                <span className="min-w-0">
                  <span className={cn(on && !compact ? "tw-proc-title" : "tw-proc-name")}>{t(s.title)}</span>
                  {on && !compact ? <span className="tw-proc-line mt-0.5 block font-normal text-muted">{t(s.line)}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
