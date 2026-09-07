import { useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { money, score } from "@/lib/economy";
import { buyShop, hallShopOf, setHallShop, type ShopItem } from "@/lib/store";
import { cn } from "@/lib/utils";

const CATS = ["SNACKS", "SUPPLIES", "QUIET", "PERKS"] as const;

export function HallStore({
  file,
  unlocked,
  kids,
  onNeedPin,
  onChange,
}: {
  file: EconomyFile;
  unlocked: boolean;
  kids: { id: string; first: string }[];
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
}) {
  const wallets = score(file);
  const shop = hallShopOf(file);
  const [id, setId] = useState(kids[0]?.id ?? "");
  const [soak, setSoak] = useState("");
  const me = wallets.find((s) => s.id === id) ?? wallets.find((s) => kids.some((k) => k.id === s.id)) ?? null;
  const groups = [...new Set([...CATS, ...shop.map((x) => x.category)])];

  function gate(): boolean {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function patch(next: ShopItem[]) {
    if (!gate()) return;
    onChange(setHallShop(file, next));
  }

  function buy(item: ShopItem) {
    if (!me || !item.name.trim()) return;
    if (me.quarter < item.price) {
      setSoak(`${me.first} can't afford ${item.name}`);
      return;
    }
    if (!gate()) return;
    onChange(buyShop(file, me.id, item));
    setSoak(`${me.first} bought ${item.name} · hall wallet only`);
  }

  return (
    <section className="rounded-xl bg-surface px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Hall store · not the class store</p>
      <p className="mt-1 text-sm text-muted">Study hall cash only. Tech store items never show here.</p>
      {soak ? <p className={cn("mt-2 rounded-md px-3 py-2 text-sm font-semibold", soak.includes("can't") ? "bg-loss text-accent-fg" : "bg-elevated")}>{soak}</p> : null}
      <label className="mt-2 block">
        <span className="text-xs text-subtle">Who</span>
        <select
          value={me?.id ?? ""}
          onChange={(e) => setId(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-md bg-elevated px-3 text-sm outline-none"
        >
          {kids.map((s) => {
            const w = wallets.find((x) => x.id === s.id);
            return (
              <option key={s.id} value={s.id}>
                {s.first} · {money(w?.quarter ?? 0)}
              </option>
            );
          })}
        </select>
      </label>
      {groups.map((cat) => {
        const rows = shop.map((item, i) => ({ item, i })).filter((x) => x.item.category === cat);
        return (
          <div key={cat} className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">{cat}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {rows.map(({ item, i }) => (
                <button
                  key={`${item.name}-${i}`}
                  type="button"
                  disabled={!me || me.quarter < item.price}
                  onClick={() => buy(item)}
                  className={cn(
                    "min-h-10 rounded-md px-3 text-xs font-semibold disabled:opacity-30",
                    me && me.quarter >= item.price ? "bg-elevated text-fg" : "bg-elevated text-muted",
                  )}
                >
                  {item.name} · {money(item.price)}
                </button>
              ))}
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => patch([...shop, { category: cat, name: "New", price: 5 }])}
                  className="min-h-10 rounded-md px-3 text-xs text-subtle"
                >
                  + {cat}
                </button>
              ) : null}
            </div>
            {unlocked
              ? rows.map(({ item, i }) => (
                  <div key={`e-${i}`} className="mt-1 flex gap-1">
                    <input
                      value={item.name}
                      onChange={(e) => patch(shop.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      className="min-h-9 flex-1 rounded-md bg-elevated px-2 text-xs outline-none"
                    />
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => patch(shop.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) || 0 } : x)))}
                      className="min-h-9 w-16 rounded-md bg-elevated px-2 text-xs outline-none"
                    />
                    <button type="button" onClick={() => patch(shop.filter((_, j) => j !== i))} className="text-xs text-loss">
                      ×
                    </button>
                  </div>
                ))
              : null}
          </div>
        );
      })}
    </section>
  );
}
