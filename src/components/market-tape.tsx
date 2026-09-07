import type { DjiaQuote } from "@/lib/djia";
import { money, type ScoredStudent } from "@/lib/economy";
import { cn } from "@/lib/utils";

function fmt(n: number, digits = 0) {
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function MarketTape({
  quote,
  cash,
  cap,
}: {
  quote: DjiaQuote | null;
  cash: number;
  cap: number;
}) {
  if (!quote) {
    return (
      <div className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">Loading DJIA weekly average…</div>
    );
  }
  const wow = quote.wowPct;
  const vsYear = (quote.factor - 1) * 100;
  const max = Math.max(...quote.spark.map((b) => b.close), 1);
  const min = Math.min(...quote.spark.map((b) => b.close), max);
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_1fr]">
      <div className="rounded-xl bg-surface p-4">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">DJIA · Friday print is the week average</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">{fmt(quote.last)}</p>
          <p className="text-sm text-muted">
            Week avg {fmt(quote.weekAvg)}
            <span className="mx-2 text-subtle">·</span>
            vs last week{" "}
            <span className={wow < 0 ? "text-loss" : wow > 0 ? "text-gain" : "text-muted"}>
              {wow >= 0 ? "+" : ""}
              {wow.toFixed(2)}%
            </span>
          </p>
          <p className="text-sm text-muted">
            vs year open{" "}
            <span className={vsYear < 0 ? "text-loss" : vsYear > 0 ? "text-gain" : "text-muted"}>
              {vsYear >= 0 ? "+" : ""}
              {vsYear.toFixed(2)}%
            </span>
          </p>
        </div>
        <div className="mt-4 flex h-12 items-end gap-1">
          {quote.spark.map((b) => {
            const h = max === min ? 50 : ((b.close - min) / (max - min)) * 100;
            const inWeek = quote.weekBars.some((w) => w.date === b.date);
            return (
              <span
                key={b.date}
                title={`${b.date} ${fmt(b.close)}`}
                className={cn("min-w-0 flex-1 rounded-sm", inWeek ? "bg-fg" : "bg-elevated")}
                style={{ height: `${Math.max(12, h)}%` }}
              />
            );
          })}
        </div>
      </div>
      <div className="rounded-xl bg-surface p-4">
        <p className="text-sm font-medium uppercase tracking-wider text-subtle">Balances after the print</p>
        <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
          <span className="text-muted">{money(cash)}</span>
          <span className="mx-2 text-subtle">→</span>
          <span className={cap < cash ? "text-loss" : "text-gain"}>{money(cap)}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Stock $ = invested × {quote.factor.toFixed(4)}. Wallet cash does not ride the DJIA.
        </p>
      </div>
    </section>
  );
}

export function ShakeList({ list }: { list: ScoredStudent[] }) {
  const rows = [...list]
    .filter((s) => s.principal > 0)
    .sort((a, b) => Math.abs(b.stock - b.principal) - Math.abs(a.stock - a.principal))
    .slice(0, 8);
  if (!rows.length) {
    return <p className="text-sm text-muted">No one has invested yet. Stock only moves money they parked.</p>;
  }
  return (
    <ol className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {rows.map((s) => {
        const delta = s.stock - s.principal;
        return (
          <li key={s.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-t border-border py-2">
            <span className="truncate font-medium">{s.first}</span>
            <span className="font-mono text-sm tabular-nums text-muted">{money(s.principal)}</span>
            <span className={cn("font-mono text-sm tabular-nums", delta < 0 ? "text-loss" : "text-gain")}>
              {money(delta)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
