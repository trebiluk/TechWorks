import type { EconomyFile } from "./economy.ts";
import { cloneFile } from "./clone.ts";
import { todayIso } from "./calendar.ts";

const GOGGLE = /goggle/i;

export function needsPpe(rules: string[] | undefined): boolean {
  return (rules ?? []).some((r) => GOGGLE.test(r));
}

export function ppeOn(file: EconomyFile, period: number, date = todayIso()): boolean {
  return Boolean(file.meta.dayLog?.[date]?.ppe?.[String(period)]);
}

export function setPpe(file: EconomyFile, period: number, on: boolean, date = todayIso()): EconomyFile {
  const next = cloneFile(file);
  next.meta.dayLog = next.meta.dayLog ?? {};
  const day = (next.meta.dayLog[date] ??= { periodGoals: {}, crewGoals: {} });
  day.ppe = { ...(day.ppe ?? {}), [String(period)]: on };
  return next;
}

/** Goggles on the job close tools until the teacher marks PPE. */
export function toolsOpen(file: EconomyFile, rules: string[] | undefined, period: number, date = todayIso()): boolean {
  if (!needsPpe(rules)) return true;
  return ppeOn(file, period, date);
}
