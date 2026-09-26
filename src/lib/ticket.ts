import { GLOSSARY } from "@/data/glossary";
import type { EconomyFile } from "@/lib/economy";
import { cloneFile } from "@/lib/clone";
import { crewAt } from "@/lib/crew-desk";

export type DoorTicket = {
  prompt: string;
  term: string;
  choices: string[];
  pick?: string;
  accepted?: boolean;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function ticketKey(period: number, crewKey: string): string {
  return `${period}|${crewKey}`;
}

/** One word for the whole period. The definition is the question. The term is the answer. */
export function doorPrompt(date: string, period: number): { prompt: string; term: string; choices: string[] } {
  const bank = GLOSSARY.filter((g) => g.def && g.term);
  const i = hash(`${date}|${period}`) % bank.length;
  const term = bank[i]!;
  const choices = [term.term];
  let n = 1;
  while (choices.length < 3 && n < bank.length) {
    const other = bank[(i + n) % bank.length]!;
    n += 1;
    if (!choices.includes(other.term)) choices.push(other.term);
  }
  const order = [...choices].sort((a, b) => hash(`${date}|${a}`) - hash(`${date}|${b}`));
  return { prompt: term.def, term: term.term, choices: order };
}

function dayTickets(file: EconomyFile, date: string): Record<string, DoorTicket> {
  return { ...(file.meta.dayLog?.[date]?.ticket ?? {}) };
}

export function readTicket(file: EconomyFile, date: string, period: number, crewKey: string): DoorTicket {
  const saved = dayTickets(file, date)[ticketKey(period, crewKey)];
  const prompt = doorPrompt(date, period);
  if (!saved) return prompt;
  return { ...prompt, pick: saved.pick, accepted: saved.accepted };
}

function writeTicket(file: EconomyFile, date: string, key: string, ticket: DoorTicket): EconomyFile {
  const next = cloneFile(file);
  const log = { ...(next.meta.dayLog ?? {}) };
  const day = { ...(log[date] ?? { periodGoals: {}, crewGoals: {} }) };
  day.ticket = { ...(day.ticket ?? {}), [key]: ticket };
  log[date] = day;
  next.meta.dayLog = log;
  return next;
}

/** Crew answer. One tap. Not XP. */
export function answerTicket(file: EconomyFile, date: string, period: number, crewKey: string, pick: string): EconomyFile {
  const cur = readTicket(file, date, period, crewKey);
  if (cur.pick || cur.accepted) return file;
  if (!cur.choices.includes(pick)) return file;
  return writeTicket(file, date, ticketKey(period, crewKey), { ...cur, pick });
}

/** Teacher says it counted. +1 Gold XP for that crew. Not wallet. Not the grade. */
export function acceptTicket(file: EconomyFile, date: string, period: number, crewKey: string): EconomyFile {
  const cur = readTicket(file, date, period, crewKey);
  if (cur.accepted || !cur.pick || cur.pick !== cur.term) return file;
  let next = writeTicket(file, date, ticketKey(period, crewKey), { ...cur, accepted: true });
  next = cloneFile(next);
  next.students = next.students.map((s) => {
    if (s.period !== period || crewAt(s, date) !== crewKey) return s;
    return { ...s, bonusXp: Number(s.bonusXp || 0) + 1 };
  });
  return next;
}
