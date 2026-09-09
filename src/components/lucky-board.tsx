import { useMemo, useState } from "react";
import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, money, periodTitle, score, shopBells } from "@/lib/economy";
import {
  buyRaffle,
  drawRaffle,
  LUCKY_PAY,
  LUCKY_ROLLS_DAY,
  LUCKY_STAKES,
  luckyOf,
  playLucky,
  RAFFLE_PRICE,
  RAFFLE_TICKETS_DAY,
  rollsOf,
  rollsToday,
  ticketsToday,
} from "@/lib/lucky";
import { cn } from "@/lib/utils";

const FACE = ["", "1", "2", "3", "4", "5", "6"];

export function LuckyBoard({
  file,
  unlocked,
  onNeedPin,
  onChange,
  onFlash,
}: {
  file: EconomyFile;
  unlocked: boolean;
  onNeedPin: () => void;
  onChange: (next: EconomyFile) => void;
  onFlash?: (msg: string) => void;
}) {
  const bells = shopBells(file);
  const list = useMemo(() => score(file), [file]);
  const [period, setPeriod] = useState(bells[0]?.period ?? 1);
  const kids = list.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName));
  const [id, setId] = useState(kids[0]?.id ?? "");
  const me = kids.find((s) => s.id === id) ?? kids[0];
  const raw = me ? file.students.find((s) => s.id === me.id) : undefined;
  const house = luckyOf(file);
  const [face, setFace] = useState<number | null>(null);
  const used = rollsToday(raw);
  const tickets = me ? ticketsToday(file, me.id) : 0;

  function gate() {
    if (unlocked) return true;
    onNeedPin();
    return false;
  }

  function roll(stake: number) {
    if (!me || !gate()) return;
    const hit = playLucky(file, me.id, stake);
    if (!hit) {
      onFlash?.(used >= LUCKY_ROLLS_DAY ? "3 rolls today" : `${me.first} needs $${stake}`);
      return;
    }
    setFace(hit.face);
    onChange(hit.file);
    const net = hit.payout - stake;
    onFlash?.(net > 0 ? `${me.first} d${hit.face} · +$${net}` : net < 0 ? `${me.first} d${hit.face} · −$${Math.abs(net)}` : `${me.first} d${hit.face} · push`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Lucky Bench</h1>
          <p className="text-sm text-muted">Class cash only. Not XP, not grades. House edge ~8% — saving usually wins.</p>
        </div>
        <p className="font-display text-2xl font-semibold tabular-nums">{money(house.pot)} <span className="text-sm font-medium text-muted">Friday pot</span></p>
      </header>

      <section className="tw-gadget grid grid-cols-6 gap-1 p-3 text-center">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className={cn("rounded-lg py-2", face === n ? "bg-accent text-accent-fg" : "bg-elevated")}>
            <p className="font-display text-xl font-semibold">{n}</p>
            <p className="text-[10px] font-bold uppercase text-muted">{LUCKY_PAY[n] === 0 ? "bust" : `×${LUCKY_PAY[n]}`}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-1">
        {bells.map((b) => (
          <button
            key={b.period}
            type="button"
            onClick={() => {
              setPeriod(b.period);
              const next = list.find((s) => s.period === b.period);
              if (next) setId(next.id);
            }}
            className={cn("tw-tap min-h-10 rounded-full px-3 text-sm font-semibold", period === b.period ? "bg-fg text-bg" : "bg-elevated")}
          >
            {periodTitle(b.period, bells)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {kids.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setId(s.id)}
            className={cn("tw-tap min-h-10 rounded-full px-3 text-sm", s.id === me?.id ? "bg-accent text-accent-fg" : "bg-elevated")}
          >
            {s.first}
            <span className="ml-1 font-mono text-xs">{money(s.quarter)}</span>
          </button>
        ))}
      </div>

      {me ? (
        <section className="tw-gadget flex flex-col gap-3 p-3">
          <p className="text-sm text-muted">
            {me.first} · {used}/{LUCKY_ROLLS_DAY} rolls · {tickets}/{RAFFLE_TICKETS_DAY} tickets
          </p>
          <div className="flex items-center gap-4">
            <p className="font-display text-6xl font-semibold tabular-nums">{face ? FACE[face] : "·"}</p>
            <div className="flex flex-wrap gap-1">
              {LUCKY_STAKES.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={!me || me.quarter < n || used >= LUCKY_ROLLS_DAY}
                  onClick={() => roll(n)}
                  className="tw-tap min-h-12 rounded-full bg-elevated px-4 text-sm font-semibold disabled:opacity-40"
                >
                  Roll ${n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!me || me.quarter < RAFFLE_PRICE || tickets >= RAFFLE_TICKETS_DAY}
              onClick={() => {
                if (!me || !gate()) return;
                onChange(buyRaffle(file, me.id));
                onFlash?.(`${me.first} bought a Friday ticket`);
              }}
              className="tw-tap min-h-11 rounded-full bg-gold px-4 text-sm font-semibold text-bg disabled:opacity-40"
            >
              Ticket ${RAFFLE_PRICE}
            </button>
            <button
              type="button"
              disabled={!house.pot}
              onClick={() => {
                if (!gate()) return;
                onChange(drawRaffle(file));
                onFlash?.("Friday pot drawn");
              }}
              className="tw-tap min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-40"
            >
              Draw pot
            </button>
          </div>
          {house.lastDraw ? (
            <p className="text-sm text-muted">
              Last draw · {house.lastDraw.alias} won {money(house.lastDraw.pot)}
            </p>
          ) : null}
          <ul className="text-xs text-muted">
            {rollsOf(raw)
              .slice()
              .reverse()
              .slice(0, 8)
              .map((r) => (
                <li key={r.ts}>
                  d{r.face} · ${r.stake} → ${r.payout}
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
