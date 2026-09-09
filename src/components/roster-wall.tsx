import { useMemo, useState } from "react";
import type { EconomyFile, ScoredStudent } from "@/lib/economy";
import { shopBells } from "@/lib/economy";
import { crewsOf } from "@/lib/crews";
import { abOn, deskBellId } from "@/lib/store";
import { todayIso } from "@/lib/calendar";
import { periodNow } from "@/lib/bells";
import { applySort, byCombo } from "@/lib/rank";
import { titleOf } from "@/lib/flair";
import { CrewBanner, WorkerCard } from "@/components/shop-cards";
import { useShopClock } from "@/lib/use-clock";
import { cn } from "@/lib/utils";

/** Class yearbook. Aliases only. PIN. */
export function RosterWall({
  file,
  list,
  unlocked,
  onOpenId,
  onRecords,
}: {
  file: EconomyFile;
  list: ScoredStudent[];
  unlocked: boolean;
  onOpenId: (id: string) => void;
  onRecords?: () => void;
}) {
  const today = todayIso();
  const letter = abOn(file, today);
  const bells = shopBells(file);
  const live = periodNow(deskBellId(file), useShopClock(deskBellId(file), "beat"));
  const shop = bells.map((b) => b.period);
  const [period, setPeriod] = useState(() => (live != null && shop.includes(live) ? live : (shop[0] ?? 1)));
  const shown = shop.includes(period) ? period : (shop[0] ?? 1);
  const crews = crewsOf(file, shown, today);
  const ranked = useMemo(
    () => applySort(byCombo(file, list.filter((s) => s.period === shown)), "level"),
    [file, list, shown],
  );
  const byId = useMemo(() => new Map(ranked.map((s) => [s.id, s])), [ranked]);
  const leadId = ranked[0]?.id;
  const n = ranked.length;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain pb-3">
      <header className="shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Rosters · {letter} day</p>
        <p className="font-display text-3xl font-bold tracking-tight">P{shown}</p>
        <p className="text-sm text-muted">
          {n ? `${n} on the board` : "No aliases yet."} · tap a card
        </p>
        {unlocked && onRecords ? (
          <button type="button" onClick={onRecords} className="mt-1 text-xs font-semibold text-accent">
            Records · legal names
          </button>
        ) : null}
      </header>

      <nav className="flex flex-wrap gap-1" aria-label="Period">
        {shop.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "tw-tap min-h-11 rounded-full px-3 text-sm font-bold",
              p === shown ? "bg-fg text-bg" : "bg-elevated text-muted",
              live === p ? "ring-2 ring-accent" : "",
            )}
          >
            P{p}
          </button>
        ))}
      </nav>

      {!crews.length ? (
        <p className="tw-gadget p-4 text-sm text-muted">No crews yet. Score today and they show up here.</p>
      ) : (
        crews.map((crew) => {
          const rows = crew.kids
            .map((k) => byId.get(k.id))
            .filter(Boolean)
            .sort((a, b) => (b!.xp - a!.xp) || a!.first.localeCompare(b!.first));
          const first = rows[0];
          return (
            <section key={crew.key} className="space-y-2">
              <CrewBanner
                name={crew.name}
                motto={crew.motto}
                icon={crew.icon}
                color={crew.color}
                logo={crew.logo}
                period={shown}
                n={crew.kids.length}
              />
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {rows.length ? (
                  rows.map((s) => (
                    <li key={s!.id}>
                      <WorkerCard
                        id={s!.id}
                        name={s!.first}
                        icon={s!.icon}
                        title={titleOf(s!.xp, s!.id === leadId ? 1 : undefined)}
                        xp={s!.xp}
                        lead={s!.id === leadId || s!.id === first?.id}
                        onClick={() => onOpenId(s!.id)}
                      />
                    </li>
                  ))
                ) : (
                  <li className="col-span-2 text-sm text-muted">Empty crew.</li>
                )}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
