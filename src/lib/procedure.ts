/** Kid-facing shop start. Projector. Four steps, every period. */

export const DAILY_PROCEDURE = [
  { id: "enter", n: 1, title: "ENTER", line: "Sit with your crew. Bags down." },
  { id: "listen", n: 2, title: "LISTEN", line: "Directions first. Then questions." },
  { id: "work", n: 3, title: "CREW WORK", line: "Today’s activity. Tools with a purpose." },
  { id: "clean", n: 4, title: "CLEAN UP", line: "Stations reset before the bell." },
] as const;

export type ProcedureId = (typeof DAILY_PROCEDURE)[number]["id"];

export function procedureStep(opts: { live?: boolean; cleanup?: boolean; passing?: boolean; pct?: number }): ProcedureId {
  if (opts.cleanup) return "clean";
  if (!opts.live) return "enter";
  if ((opts.pct ?? 0) < 12) return "listen";
  return "work";
}
