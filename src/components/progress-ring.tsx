import { cn } from "@/lib/utils";

export function ProgressRing({
  pct,
  label,
  sub,
  tone = "accent",
  size = "sm",
}: {
  pct: number;
  label: string;
  sub?: string;
  tone?: "accent" | "gold" | "gain" | "warn";
  size?: "sm" | "md";
}) {
  const p = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn("tw-ring", size === "md" ? "tw-ring-md" : "", `tw-ring-${tone}`)}
        style={{ ["--pct" as string]: p }}
        role="img"
        aria-label={`${sub ?? ""} ${Math.round(p)} percent`}
      >
        <i>
          <span className="tw-readout text-[11px] font-bold leading-none">{label}</span>
        </i>
      </div>
      {sub ? <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{sub}</span> : null}
    </div>
  );
}

export function ProgressTrio({
  cycle,
  quarter,
  year,
}: {
  cycle: { done: number; total: number };
  quarter: { done: number; total: number };
  year: { done: number; total: number };
}) {
  const row = [
    { sub: "Cycle", ...cycle, tone: "accent" as const },
    { sub: "Quarter", ...quarter, tone: "gold" as const },
    { sub: "Year", ...year, tone: "gain" as const },
  ];
  return (
    <div className="flex justify-around gap-1">
      {row.map((r) => (
        <ProgressRing
          key={r.sub}
          pct={r.total ? (r.done / r.total) * 100 : 0}
          label={`${r.done}`}
          sub={r.sub}
          tone={r.tone}
        />
      ))}
    </div>
  );
}
