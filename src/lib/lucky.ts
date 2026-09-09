import type { EconomyFile, RawStudent } from "@/lib/economy";
import { score } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { todayIso } from "@/lib/calendar";

/** Stake paid first. Face 1–6 → payout as a multiple of stake. EV ≈ 0.92 (house ~8%). */
export const LUCKY_PAY: Record<number, number> = {
  1: 0,
  2: 0.5,
  3: 0.5,
  4: 1,
  5: 1.5,
  6: 2,
};

export const LUCKY_STAKES = [5, 10, 15] as const;
export const LUCKY_ROLLS_DAY = 3;
export const RAFFLE_PRICE = 5;
export const RAFFLE_TICKETS_DAY = 2;

export type LuckyRoll = { ts: string; date: string; face: number; stake: number; payout: number };

export type LuckyState = {
  pot: number;
  tickets: { id: string; n: number }[];
  lastDraw?: { date: string; alias: string; pot: number };
};

export function luckyOf(file: EconomyFile): LuckyState {
  const raw = file.meta.config?.lucky;
  return {
    pot: Math.max(0, Number(raw?.pot || 0)),
    tickets: (raw?.tickets ?? []).map((t) => ({ id: t.id, n: Math.max(0, Number(t.n || 0)) })).filter((t) => t.n > 0),
    lastDraw: raw?.lastDraw,
  };
}

function putLucky(file: EconomyFile, lucky: LuckyState): EconomyFile {
  const next = cloneFile(file);
  next.meta.config = { ...(next.meta.config ?? {}), lucky };
  return next;
}

function pushLedger(file: EconomyFile, row: { id: string; type: string; amount: number; date: string; note: string }) {
  file.meta.ledger = [...(file.meta.ledger ?? []), { ts: new Date().toISOString(), ...row }].slice(-400);
}

function d6(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return 1 + (buf[0] % 6);
  }
  return 1 + Math.floor(Math.random() * 6);
}

function pickWeighted(tickets: { id: string; n: number }[]): string | null {
  const total = tickets.reduce((n, t) => n + t.n, 0);
  if (total <= 0) return null;
  let r = 0;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    r = buf[0] % total;
  } else {
    r = Math.floor(Math.random() * total);
  }
  let acc = 0;
  for (const t of tickets) {
    acc += t.n;
    if (r < acc) return t.id;
  }
  return tickets[tickets.length - 1]?.id ?? null;
}

export function rollsOf(s: RawStudent | undefined): LuckyRoll[] {
  return (s?.lucky ?? []) as LuckyRoll[];
}

export function rollsToday(s: RawStudent | undefined, date = todayIso()): number {
  return rollsOf(s).filter((r) => r.date === date).length;
}

export function ticketsToday(file: EconomyFile, id: string, date = todayIso()): number {
  return (file.meta.ledger ?? []).filter((x) => x.id === id && x.date === date && x.type === "Raffle").length;
}

export function playLucky(file: EconomyFile, id: string, stake: number): { file: EconomyFile; face: number; payout: number } | null {
  const row = score(file).find((s) => s.id === id);
  const raw = file.students.find((s) => s.id === id);
  if (!row || !raw) return null;
  const bet = LUCKY_STAKES.includes(stake as (typeof LUCKY_STAKES)[number]) ? stake : 0;
  if (!bet || row.quarter < bet) return null;
  if (rollsToday(raw) >= LUCKY_ROLLS_DAY) return null;
  const face = d6();
  const payout = Math.round(bet * LUCKY_PAY[face]);
  const date = todayIso();
  const next = cloneFile(file);
  const roll: LuckyRoll = { ts: new Date().toISOString(), date, face, stake: bet, payout };
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    const lucky = [...rollsOf(s), roll].slice(-16);
    const purchases = [
      ...(s.purchases ?? []),
      { ts: roll.ts, item: `d6=${face}`, category: "LUCKY/ROLL", price: bet - payout },
    ];
    return {
      ...s,
      deduct: Number(s.deduct || 0) + bet,
      bonus: Number(s.bonus || 0) + payout,
      lucky,
      purchases,
    };
  });
  pushLedger(next, {
    id,
    type: "Lucky",
    amount: payout - bet,
    date,
    note: `d6 ${face} · stake $${bet} · back $${payout}`,
  });
  return { file: next, face, payout };
}

export function buyRaffle(file: EconomyFile, id: string): EconomyFile {
  const row = score(file).find((s) => s.id === id);
  if (!row || row.quarter < RAFFLE_PRICE) return file;
  if (ticketsToday(file, id) >= RAFFLE_TICKETS_DAY) return file;
  const date = todayIso();
  const next = putLucky(file, (() => {
    const cur = luckyOf(file);
    const tickets = [...cur.tickets];
    const i = tickets.findIndex((t) => t.id === id);
    if (i >= 0) tickets[i] = { id, n: tickets[i].n + 1 };
    else tickets.push({ id, n: 1 });
    return { ...cur, pot: cur.pot + RAFFLE_PRICE, tickets };
  })());
  next.students = next.students.map((s) => {
    if (s.id !== id) return s;
    return {
      ...s,
      deduct: Number(s.deduct || 0) + RAFFLE_PRICE,
      purchases: [...(s.purchases ?? []), { ts: new Date().toISOString(), item: "Friday pot", category: "LUCKY/RAFFLE", price: RAFFLE_PRICE }],
    };
  });
  pushLedger(next, { id, type: "Raffle", amount: -RAFFLE_PRICE, date, note: "Friday pot ticket" });
  return next;
}

export function drawRaffle(file: EconomyFile): EconomyFile {
  const cur = luckyOf(file);
  if (cur.pot <= 0 || !cur.tickets.length) return file;
  const winner = pickWeighted(cur.tickets);
  if (!winner) return file;
  const kid = file.students.find((s) => s.id === winner);
  const next = putLucky(file, { pot: 0, tickets: [], lastDraw: { date: todayIso(), alias: kid?.first || "worker", pot: cur.pot } });
  next.students = next.students.map((s) => {
    if (s.id !== winner) return s;
    return { ...s, bonus: Number(s.bonus || 0) + cur.pot };
  });
  pushLedger(next, { id: winner, type: "Raffle", amount: cur.pot, date: todayIso(), note: `Friday pot win $${cur.pot}` });
  return next;
}
