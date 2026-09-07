import { useEffect, useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, money, periodTitle, score, shopBells } from "@/lib/economy";
import { buyShop } from "@/lib/store";
import { QuarterChip } from "@/components/quarter-chip";
import { applySort, decorateRank, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { cn } from "@/lib/utils";

/**
 * Store — shop buy UI only.
 * Wallet still holds $ and pays via buyShop; this surface is the catalog.
 * Laws: wallet ≠ grade ≠ marks (never conflate Perks spend with Skills or Grades).
 */
export function StoreBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
  focusId,
  onFlash,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  focusId?: string | null;
  onFlash?: (msg: string) => void;
}) {
  const bells = shopBells(file);
  const list = useMemo(() => score(file), [file]);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const [sort, setSort] = useState<SortKey>("wallet");
  const kids = applySort(
    decorateRank(
      file,
      list.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName)),
    ),
    sort,
  );
  const [id, setId] = useState(() => {
    if (focusId && list.some((s) => s.id === focusId)) return focusId;
    return kids[0]?.id ?? "";
  });

  // Honor focusId from dossier when it changes / lands on this view.
  useEffect(() => {
    if (!focusId) return;
    const row = list.find((s) => s.id === focusId);
    if (!row) return;
    setPeriod(row.period);
    setId(focusId);
  }, [focusId, list]);

  const me = kids.find((s) => s.id === id) ?? kids[0] ?? null;
  const raw = me ? file.students.find((s) => s.id === me.id) : null;
  const shop = file.meta.shop ?? [];
  const groups = [...new Set(shop.map((x) => x.category))];

  function buy(item: { category: string; name: string; price: number }) {
    if (!me) return;
    if (me.quarter < item.price) {
      onFlash?.(`${me.first} can't afford ${item.name}`);
      return;
    }
    if (!unlocked) {
      onNeedPin();
      return;
    }
    onChange(buyShop(file, me.id, item));
    onFlash?.(`${me.first} bought ${item.name} · wallet only`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">Tech store</h1>
            <QuarterChip />
          </div>
          <p className="mt-1 text-sm text-muted">
            Workshop classes only. Study hall has its own hall store.
          </p>
        </div>
      </header>

      <p className="rounded-md bg-elevated px-3 py-2 text-xs text-muted">
        Spend does not change effort, Skills XP, or Grades. Edit catalog in Desk → Config.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {bells.map((b) => (
          <button
            key={b.period}
            type="button"
            onClick={() => {
              setPeriod(b.period);
              const next = list.filter((s) => s.period === b.period && isLiveStudent(s, file.meta.quarterName));
              setId(next[0]?.id ?? "");
            }}
            className={cn(
              "min-h-11 rounded-lg px-3 text-sm uppercase tracking-wide",
              period === b.period ? "bg-elevated text-fg" : "bg-surface text-muted",
            )}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
        <SortBar value={sort} onChange={setSort} keys={["wallet", "name", "crew", "level"]} />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex min-h-0 flex-col gap-3">
          <label className="block rounded-xl bg-surface p-4">
            <span className="text-sm font-medium uppercase tracking-wider text-subtle">Alias</span>
            <select
              value={me?.id ?? ""}
              onChange={(e) => setId(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg outline-none"
            >
              {kids.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first} · {money(s.quarter)}
                </option>
              ))}
            </select>
          </label>

          {me ? (
            <div className="rounded-xl bg-surface p-5">
              <h2 className="font-display text-3xl font-semibold tracking-tight">{me.first}</h2>
              <p className="mt-1 text-sm text-muted">{me.crewName} · P{me.period}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-elevated p-3">
                  <p className="text-sm text-subtle">Wallet (Perks)</p>
                  <p className={cn("mt-1 font-display text-2xl font-semibold tabular-nums", me.quarter < 0 ? "text-loss" : "text-gain")}>
                    {money(me.quarter)}
                  </p>
                </div>
                <div className="rounded-lg bg-elevated p-3">
                  <p className="text-sm text-subtle">Purchases</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{raw?.purchases?.length ?? 0}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-subtle">Balance lives on the wallet. Buying here deducts Perks only — not a mark.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">No live aliases in this period.</p>
          )}

          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm font-medium uppercase tracking-wider text-subtle">Purchase ledger</p>
            <ul className="mt-2 text-sm">
              {!raw || (raw.purchases ?? []).length === 0 ? (
                <li className="text-muted">None yet.</li>
              ) : (
                (raw.purchases ?? [])
                  .slice()
                  .reverse()
                  .map((p, i) => (
                    <li key={`${p.ts}-${i}`} className="flex justify-between border-t border-border py-2">
                      <span>
                        {p.category} · {p.item}
                      </span>
                      <span className="font-mono text-loss">{money(-p.price)}</span>
                    </li>
                  ))
              )}
            </ul>
          </div>
        </div>

        <aside className="rounded-xl bg-surface p-4">
          <p className="text-sm font-medium uppercase tracking-wider text-subtle">Catalog</p>
          {groups.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No items. Add lists in Desk → Config.</p>
          ) : (
            groups.map((g) => (
              <div key={g} className="mt-3">
                <p className="text-sm text-muted">{g}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {shop
                    .filter((x) => x.category === g)
                    .map((item) => {
                      const broke = !me || me.quarter < item.price;
                      return (
                        <button
                          key={`${item.category}-${item.name}-${item.price}`}
                          type="button"
                          disabled={broke || !me}
                          onClick={() => buy(item)}
                          className={cn(
                            "min-h-11 rounded-md px-3 text-sm uppercase tracking-wide",
                            broke ? "bg-elevated text-subtle line-through" : "bg-elevated",
                          )}
                        >
                          {item.name} · ${item.price}
                          {broke ? " · can't afford" : ""}
                        </button>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
}
