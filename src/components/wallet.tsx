import { useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, money, periodTitle, score, shopBells } from "@/lib/economy";
import { MarketTape } from "@/components/market-tape";
import { QuarterChip } from "@/components/quarter-chip";
import type { DjiaQuote } from "@/lib/djia";
import { TICKERS, basketPath, cleanPicks, tickerFactor, type TickerId } from "@/lib/tickers";
import { applySort, decorateRank, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { fillBlankPicks, setCrewPicks, setPicks } from "@/lib/store";
import { Chip, Btn } from "@/components/ui";
import { cn } from "@/lib/utils";

export function WalletBoard({
  file,
  quote,
  unlocked,
  onNeedPin,
  onChange,
}: {
  file: EconomyFile;
  quote: DjiaQuote | null;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
}) {
  const bells = shopBells(file);
  const list = useMemo(() => score(file), [file]);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [sort, setSort] = useState<SortKey>("stock");
  const [openId, setOpenId] = useState<string | null>(null);
  const kids = applySort(
    decorateRank(
      file,
      list.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName)),
    ),
    sort,
  );
  const house = cleanPicks(file.meta.config?.housePicks);
  const me = kids.find((s) => s.id === openId) ?? kids[0] ?? null;
  const picks = cleanPicks(me?.picks);
  const invested = me?.principal ?? 0;
  const total = me?.stock ?? 0;
  const earn = total - invested;
  const trend = basketPath(picks, invested, quote?.factor ?? 1);

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function tap(id: string, sym: TickerId) {
    if (!gate()) return;
    const raw = file.students.find((s) => s.id === id);
    const cur = cleanPicks(raw?.picks);
    const next = cur.includes(sym) ? cur.filter((x) => x !== sym) : cur.length < 3 ? [...cur, sym] : cur;
    onChange(setPicks(file, id, next));
  }

  function draw() {
    if (!gate()) return;
    const pool = [...TICKERS].sort(() => Math.random() - 0.5).slice(0, 3).map((t) => t.id);
    onChange(fillBlankPicks(file, period, pool));
  }

  function crewSame(crewKey: string) {
    if (!gate() || !me) return;
    const p = cleanPicks(file.students.find((s) => s.id === me.id)?.picks);
    if (p.length !== 3) return;
    onChange(setCrewPicks(file, period, crewKey, p));
  }

  const crews = [...new Set(kids.map((s) => s.crewName || s.crewKey))];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">STOCK</h1>
        <QuarterChip />
        <div className="flex flex-wrap gap-1">
          {bells.map((b) => (
            <Chip key={b.period} on={period === b.period} onClick={() => { setPeriod(b.period); setOpenId(null); }}>
              {periodTitle(b.period, bells)}
            </Chip>
          ))}
        </div>
        {unlocked ? (
          <div className="flex flex-wrap gap-1">
            <Btn kind="quiet" onClick={draw}>Draw blanks</Btn>
            {house.length === 3 ? (
              <Btn kind="quiet" onClick={() => gate() && onChange(fillBlankPicks(file, period, house))}>House 3</Btn>
            ) : null}
          </div>
        ) : null}
        <SortBar value={sort} onChange={setSort} keys={["stock", "wallet", "name", "crew"]} />
      </header>
      <MarketTape quote={quote} cash={me?.quarter ?? 0} cap={me?.worth ?? 0} />
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <ul className="min-h-0 overflow-auto rounded-xl bg-surface">
          {kids.map((s) => {
            const p = cleanPicks(s.picks);
            const open = openId === s.id;
            return (
              <li key={s.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 text-left"
                >
                  <span className="min-w-0 truncate font-semibold">{s.first}
                    <span className="ml-2 text-xs font-normal text-subtle">{s.crewName}</span>
                  </span>
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className={cn(
                          "inline-flex min-h-8 min-w-12 items-center justify-center rounded-full px-2 font-mono text-[11px] font-semibold",
                          p[i] ? "bg-gold text-bg" : "bg-elevated text-subtle",
                        )}
                      >
                        {p[i] ?? "—"}
                      </span>
                    ))}
                  </span>
                </button>
                {open ? (
                  <div className="px-3 pb-3">
                    <div className="flex flex-wrap gap-1">
                      {TICKERS.map((t) => (
                        <Chip key={t.id} on={p.includes(t.id)} onClick={() => tap(s.id, t.id)}>
                          {t.id}
                        </Chip>
                      ))}
                    </div>
                    {unlocked && p.length === 3 ? (
                      <button type="button" onClick={() => crewSame(s.crewKey)} className="mt-2 text-sm text-muted underline-offset-4 hover:underline">
                        Same 3 for {s.crewName}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        <aside className="rounded-xl bg-surface px-4 py-3">
          {me ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{me.first}</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{money(total)}</p>
              <p className="text-sm text-muted">In {money(invested)} · {earn >= 0 ? "+" : ""}{money(earn)}</p>
              <div className="mt-3 h-36">
                {invested <= 0 ? (
                  <p className="text-sm text-muted">Pick 3. Invest from Score when they want shares.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="i" stroke="#71717a" fontSize={11} tickFormatter={(n) => `W${n}`} />
                      <YAxis stroke="#71717a" fontSize={11} width={40} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No live aliases in this period.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
