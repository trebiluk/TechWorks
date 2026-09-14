import { useEffect, useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, money, periodTitle, score, shopBells } from "@/lib/economy";
import { buyShop, catalogOf, setHallShop, setShop, type ShopItem } from "@/lib/store";
import { QuarterChip } from "@/components/quarter-chip";
import { applySort, decorateRank, type SortKey } from "@/lib/rank";
import { SortBar } from "@/components/sort-bar";
import { cn } from "@/lib/utils";
import { featureOn } from "@/lib/features";

/** Rewards — wallet perks. Not the grade. Not a student-facing shop. */
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
  const [draft, setDraft] = useState<ShopItem>({ category: "Perk", name: "", price: 5 });

  useEffect(() => {
    if (!focusId) return;
    const row = list.find((s) => s.id === focusId);
    if (!row) return;
    setPeriod(row.period);
    setId(focusId);
  }, [focusId, list]);

  const me = kids.find((s) => s.id === id) ?? kids[0] ?? null;
  const raw = me ? file.students.find((s) => s.id === me.id) : null;
  const hall = period === 6;
  const shop = catalogOf(file, period);
  const groups = [...new Set(shop.map((x) => x.category))];

  function buy(item: ShopItem) {
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
    onFlash?.(`${me.first} got ${item.name} · wallet only`);
  }

  function saveCatalog(next: ShopItem[]) {
    onChange(hall ? setHallShop(file, next) : setShop(file, next));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{hall ? "Hall perks" : "Rewards"}</h1>
            <QuarterChip />
          </div>
          <p className="mt-1 text-sm text-muted">
            Keep the lead. Wallet only — not effort, not skills, not the grade.
            {featureOn(file, "prints") ? " 3D pieces live on Prints → Hold." : ""}
          </p>
        </div>
      </header>

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
              "tw-tap min-h-11 rounded-full px-3 text-sm font-semibold",
              period === b.period ? "bg-fg text-bg" : "bg-elevated text-muted",
            )}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
        <SortBar value={sort} onChange={setSort} keys={["wallet", "name", "crew", "level"]} />
      </div>

      <div className="flex flex-wrap gap-1">
        {kids.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setId(s.id)}
            className={cn("tw-tap min-h-12 rounded-full px-4 text-sm font-semibold", s.id === me?.id ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            {s.first}
            <span className="ml-1 font-mono text-xs">{money(s.quarter)}</span>
          </button>
        ))}
      </div>

      {me ? (
        <section className="tw-gadget p-4">
          <h2 className="font-display text-2xl font-semibold tracking-tight">{me.first}</h2>
          <p className="text-sm text-muted">{me.crewName} · P{me.period}</p>
          <p className={cn("mt-2 font-display text-3xl font-semibold tabular-nums", me.quarter < 0 ? "text-loss" : "text-gain")}>
            {money(me.quarter)}
          </p>
        </section>
      ) : (
        <p className="text-sm text-muted">No live aliases in this period.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shop.map((item) => {
          const broke = !me || me.quarter < item.price;
          return (
            <button
              key={`${item.category}-${item.name}-${item.price}`}
              type="button"
              disabled={broke || !me}
              onClick={() => buy(item)}
              className={cn(
                "tw-gadget tw-tap min-h-24 flex flex-col items-start p-4 text-left",
                broke ? "opacity-40" : "hover:ring-1 hover:ring-gold",
              )}
            >
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{item.category}</span>
              <span className="font-display text-xl font-semibold">{item.name}</span>
              <span className="mt-auto font-mono text-sm">{money(item.price)}</span>
            </button>
          );
        })}
      </div>

      {me ? (
        <section className="tw-gadget p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">This wallet</p>
          <ul className="mt-1 text-sm">
            {(raw?.purchases ?? []).length === 0 ? (
              <li className="text-muted">Nothing bought yet.</li>
            ) : (
              (raw?.purchases ?? [])
                .slice()
                .reverse()
                .slice(0, 12)
                .map((p, i) => (
                  <li key={`${p.ts}-${i}`} className="flex justify-between border-t border-border py-2">
                    <span>
                      {p.item}
                    </span>
                    <span className="font-mono text-loss">{money(-p.price)}</span>
                  </li>
                ))
            )}
          </ul>
        </section>
      ) : null}

      {unlocked ? (
        <form
          className="tw-gadget grid gap-2 p-3 sm:grid-cols-[1fr_1fr_6rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.name.trim()) return;
            saveCatalog([...shop, { ...draft, name: draft.name.trim(), category: draft.category.trim() || "Perk", price: Math.max(1, Math.round(draft.price)) }]);
            setDraft({ category: draft.category || "Perk", name: "", price: draft.price });
            onFlash?.("Perk added");
          }}
        >
          <p className="sm:col-span-4 text-xs font-bold uppercase tracking-wide text-muted">Add a perk</p>
          <input className="tw-field min-h-11 text-sm" placeholder="Category" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <input className="tw-field min-h-11 text-sm" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input type="number" className="tw-field min-h-11 text-sm" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) || 0 })} />
          <button type="submit" className="tw-tap min-h-11 rounded-full bg-gold px-4 text-sm font-semibold text-bg">
            Add
          </button>
          {groups.length ? (
            <ul className="sm:col-span-4 flex flex-wrap gap-1 text-xs">
              {shop.map((item) => (
                <li key={`${item.category}-${item.name}`}>
                  <button
                    type="button"
                    className="tw-tap min-h-8 rounded-full bg-elevated px-2 text-muted"
                    onClick={() => saveCatalog(shop.filter((x) => x !== item))}
                  >
                    {item.name} · take off
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sm:col-span-4 text-sm text-muted">No perks yet. Add one above.</p>
          )}
        </form>
      ) : null}
    </div>
  );
}
