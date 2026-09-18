import type { EconomyFile } from "@/lib/economy";
import { hourAgendaDraft, hourAgendaWall, saveAgendaLine, type AgendaCard } from "@/lib/hour-flow";
import { DraftField } from "@/components/draft-field";
import { Berty } from "@/components/berty";
import { cn } from "@/lib/utils";
import type { ProcedureId } from "@/lib/procedure";

const STEP_CARD: Record<ProcedureId, AgendaCard["id"]> = {
  enter: "now",
  listen: "goal",
  work: "next",
  clean: "behave",
};

export function KitChip({ kit }: { kit: string }) {
  if (!kit.trim()) return null;
  return (
    <p className="tw-kit shrink-0 truncate" data-kit>
      <span>Need</span> {kit}
    </p>
  );
}

export function AgendaWall({
  file,
  date,
  period,
  unlocked,
  editing,
  onChange,
  active,
}: {
  file: EconomyFile;
  date: string;
  period: number;
  unlocked?: boolean;
  editing?: boolean;
  onChange?: (next: EconomyFile) => void;
  active?: ProcedureId;
}) {
  const write = Boolean(unlocked && editing && onChange);
  const shown: AgendaCard[] = write ? hourAgendaDraft(file, date, period) : hourAgendaWall(file, date, period);
  const onId = active ? STEP_CARD[active] : undefined;

  return (
    <ol className="tw-agenda grid min-h-0 flex-1 gap-2" data-agenda data-n="4">
      {shown.map((c) => (
        <li key={c.id} data-on={c.id === onId ? "on" : undefined} className={cn("tw-agenda-card tw-chamfer flex min-h-0 items-start gap-3 px-3 py-3", c.id === onId && "tw-agenda-on")}>
          <span className="tw-agenda-n grid size-11 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-accent-fg">
            {Number(c.n)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">{c.kicker}</p>
            {write ? (
              <DraftField
                value={c.body}
                editing
                multiline={c.id !== "now"}
                onCommit={(v) => onChange!(saveAgendaLine(file, date, period, c.id, v))}
                placeholder={c.id === "now" ? "Sit at a regular table." : c.id === "goal" ? "The make for this hour." : c.id === "next" ? "Second move · peer help" : "Choose → work → focus → cleanup."}
                className="mt-1 min-h-11 w-full rounded-xl bg-bg px-2 py-1 text-base font-semibold"
              />
            ) : (
              <p className="tw-agenda-body mt-0.5 font-display font-semibold leading-snug">{c.body}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EnterWall({
  line,
  next,
  coming,
  kit,
}: {
  line: string;
  next?: string;
  coming?: string;
  kit?: string;
}) {
  return (
    <div className="tw-enter flex min-h-0 flex-1 items-center gap-4" data-enter>
      <Berty pose="waving" size="xl" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Enter</p>
        <p className="tw-fill-hero mt-1 font-display font-semibold tracking-tight">Sit. Crew. Eyes up.</p>
        <ul className="tw-enter-list mt-3 grid gap-1.5">
          <li>
            <span>01</span>
            {line || "Sit with your crew. Directions first."}
          </li>
          {kit ? (
            <li>
              <span>02</span>
              Need · {kit}
            </li>
          ) : null}
          {coming ? (
            <li>
              <span>{kit ? "03" : "02"}</span>
              In a minute · {coming}
            </li>
          ) : null}
        </ul>
        {next ? <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-muted">{next}</p> : null}
      </div>
    </div>
  );
}
