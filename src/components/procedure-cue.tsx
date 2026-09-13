import { Berty } from "@/components/berty";
import { bertyPose } from "@/lib/berty";
import { useLang } from "@/lib/i18n-hook";
import { DAILY_PROCEDURE, type ProcedureId } from "@/lib/procedure";
import type { LaidSlot } from "@/lib/teach";
import { cn } from "@/lib/utils";

/** Berty points at the daily procedure — cleanup wall owns the coral overlay. */
export function ProcedureCue({
  step,
  slots,
  passing,
  compact,
  bot = true,
  left,
  cleanup,
}: {
  step: ProcedureId;
  slots?: LaidSlot[];
  passing?: boolean;
  compact?: boolean;
  bot?: boolean;
  left?: number;
  cleanup?: boolean;
}) {
  const { t } = useLang();
  const pose = bertyPose({ passing, slot: step, cleanup: step === "clean" });
  const rows =
    slots?.length
      ? slots.map((s, i) => ({
          id: s.kind === "clean" ? "clean" : s.kind === "listen" ? "listen" : s.kind === "work" ? "work" : s.kind === "enter" ? "enter" : s.id,
          n: i + 1,
          title: s.title,
          line: s.line,
        }))
      : DAILY_PROCEDURE.map((s) => ({ id: s.id, n: s.n, title: s.title, line: s.line }));
  return (
    <aside
      data-proc-cue
      className={cn("tw-gadget tw-hud flex items-center gap-3 p-3", compact ? "" : "tw-live tw-fill-wide")}
    >
      {bot ? (
        <span className="berty-seat-pad tw-proc-bot">
          <Berty pose={pose} size={compact ? "sm" : "lg"} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold uppercase tracking-wider text-accent", compact ? "text-[11px]" : "tw-fill-label")}>
          {passing ? t("Between classes") : cleanup ? t("Cleanup") : t("Do this now")}
          {left != null ? <span className="ml-2 font-mono text-fg tabular-nums">{left}m</span> : null}
        </p>
        <ol data-proc-steps={String(Math.min(4, rows.length))} className="mt-1">
          {rows.map((s) => {
            const on = s.id === step || (step === "work" && s.id !== "enter" && s.id !== "listen" && s.id !== "clean");
            return (
              <li
                key={`${s.n}-${s.title}`}
                className={cn("flex min-h-8 items-baseline gap-2", on ? "tw-proc-on font-semibold text-fg" : "text-muted")}
              >
                <span className={cn("tw-proc-n font-mono", on ? "text-accent" : "")}>{s.n}</span>
                <span className="min-w-0">
                  <span className={cn(on && !compact ? "tw-proc-title" : "tw-proc-name")}>{t(s.title)}</span>
                  {s.line ? <span className="tw-proc-line mt-0.5 block font-normal text-muted">{t(s.line)}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}