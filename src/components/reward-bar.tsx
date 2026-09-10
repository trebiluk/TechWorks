import type { EconomyFile } from "@/lib/economy";
import { bellFor } from "@/lib/economy";
import { allPeriodRewards, rewardOf, rewardProgressFor, setPeriodReward, setReward } from "@/lib/reward";
import { featureOn } from "@/lib/features";
import { cn } from "@/lib/utils";

function Meter({ pct, gold }: { pct: number; gold?: boolean }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
      <div
        className={cn("tw-bar h-full rounded-full", gold ? "bg-gold" : "bg-fg")}
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </div>
  );
}

export function PeriodRewardChip({ file, period, className }: { file: EconomyFile; period: number; className?: string }) {
  if (!featureOn(file, "reward")) return null;
  const p = rewardProgressFor(file, period);
  if (!p.on) return null;
  if (p.head < 1) return null;
  if (p.combined < 0.01 && p.xpNow < 1) return null;
  return (
    <div className={cn("min-w-0", className)} title={`${p.title} · ${Math.round(p.combined * 100)}%`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-semibold">{p.earned ? `Earned · ${p.title}` : p.title}</span>
        <span className="shrink-0 font-mono text-xs tabular-nums text-gold">{Math.round(p.combined * 100)}%</span>
      </div>
      <Meter pct={p.combined} gold={p.earned} />
    </div>
  );
}

export function RewardBar({
  file,
  period,
  detail,
}: {
  file: EconomyFile;
  period?: number;
  detail?: boolean;
}) {
  if (!featureOn(file, "reward")) return null;
  const base = rewardOf(file);
  if (!base.on) return null;
  if (period != null) {
    const p = rewardProgressFor(file, period);
    if (p.head < 1 || (p.combined < 0.01 && p.xpNow < 1)) return null;
    return (
      <div className="rounded-lg bg-surface px-3 py-1.5">
        <PeriodRewardChip file={file} period={period} />
        {detail ? (
          <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-subtle">
                XP <span className="font-mono text-gold">{Math.round(p.xpNow)}/{p.xp}</span>
              </p>
              <Meter pct={p.xpPct} gold />
            </div>
            <div>
              <p className="text-subtle">
                Grade <span className="font-mono">{Math.round(p.gradeNow)}/{p.grade}</span>
              </p>
              <Meter pct={p.gradePct} />
            </div>
            <div>
              <p className="text-subtle">
                Effort <span className="font-mono">{Math.round(p.effortNow)}/{p.effort}%</span>
              </p>
              <Meter pct={p.effortPct} />
            </div>
          </div>
        ) : null}
      </div>
    );
  }
  const rows = allPeriodRewards(file);
  return (
    <div className="mt-2 px-0.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-subtle">Class rewards · by period</p>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {rows
          .filter((p) => p.period !== 6)
          .map((p) => (
            <div key={p.period} className="min-w-0" title={`${p.title} · ${Math.round(p.combined * 100)}%`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-semibold">{p.earned ? `Earned · ${p.title}` : p.title}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-gold">{Math.round(p.combined * 100)}%</span>
              </div>
              <Meter pct={p.combined} gold={p.earned} />
            </div>
          ))}
      </div>
    </div>
  );
}

export function RewardEditor({ file, onChange }: { file: EconomyFile; onChange: (next: EconomyFile) => void }) {
  const r = rewardOf(file);
  const bells = bellFor(file);
  return (
    <div className="mt-3 space-y-3">
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" checked={r.on} onChange={(e) => onChange(setReward(file, { on: e.target.checked }))} />
        <span className="text-sm">Show on Dashboard, Desk, Skills</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          <span className="text-subtle">Window</span>
          <select
            value={r.cycles}
            onChange={(e) => onChange(setReward(file, { cycles: Number(e.target.value) as 1 | 2 | 4 }))}
            className="mt-1 min-h-11 w-full rounded-md bg-elevated px-2 text-sm outline-none"
          >
            <option value={1}>1 cycle</option>
            <option value={2}>2 cycles</option>
            <option value={4}>Rest of quarter</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="text-subtle">Starts cycle</span>
          <select
            value={r.startCycle}
            onChange={(e) => onChange(setReward(file, { startCycle: Number(e.target.value) }))}
            className="mt-1 min-h-11 w-full rounded-md bg-elevated px-2 text-sm outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-muted">Each class sets its own treat and bar. Defaults copy from here when a period is blank.</p>
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_4rem_4rem_4rem] gap-1 text-sm">
        <span className="text-subtle">P</span>
        <span className="text-subtle">Treat</span>
        <span className="text-subtle">XP</span>
        <span className="text-subtle">Grade</span>
        <span className="text-subtle">Effort</span>
        {bells.map((b) => {
          const p = rewardProgressFor(file, b.period);
          return (
            <PeriodRewardRow
              key={b.period}
              period={b.period}
              title={p.title}
              xp={p.xp}
              grade={p.grade}
              effort={p.effort}
              onChange={(patch) => onChange(setPeriodReward(file, b.period, patch))}
            />
          );
        })}
      </div>
    </div>
  );
}

function PeriodRewardRow({
  period,
  title,
  xp,
  grade,
  effort,
  onChange,
}: {
  period: number;
  title: string;
  xp: number;
  grade: number;
  effort: number;
  onChange: (patch: { title?: string; xp?: number; grade?: number; effort?: number }) => void;
}) {
  return (
    <>
      <span className="flex min-h-11 items-center font-mono text-sm font-semibold">P{period}</span>
      <input
        value={title}
        onChange={(e) => onChange({ title: e.target.value })}
        className="min-h-11 rounded-md bg-elevated px-2 text-sm outline-none"
      />
      <input
        type="number"
        min={1}
        value={xp}
        onChange={(e) => onChange({ xp: Number(e.target.value) })}
        className="min-h-11 rounded-md bg-elevated px-1 font-mono text-sm outline-none"
      />
      <input
        type="number"
        min={1}
        max={100}
        value={grade}
        onChange={(e) => onChange({ grade: Number(e.target.value) })}
        className="min-h-11 rounded-md bg-elevated px-1 font-mono text-sm outline-none"
      />
      <input
        type="number"
        min={1}
        max={100}
        value={effort}
        onChange={(e) => onChange({ effort: Number(e.target.value) })}
        className="min-h-11 rounded-md bg-elevated px-1 font-mono text-sm outline-none"
      />
    </>
  );
}
