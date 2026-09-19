import type { EconomyFile } from "@/lib/economy";
import { score } from "@/lib/economy";
import { applySort, byCombo } from "@/lib/rank";
import { hourAgendaDraft } from "@/lib/hour-flow";
import { teachDay, teachJob } from "@/lib/teach";

export type LiveBoardTab = "teach" | "job" | "guide" | "prove" | "beats";

export const LIVE_BOARD_TABS: { id: LiveBoardTab; label: string }[] = [
  { id: "teach", label: "TEACH" },
  { id: "job", label: "Job" },
  { id: "guide", label: "Guide" },
  { id: "prove", label: "Prove" },
  { id: "beats", label: "Beats" },
];

export const LIVE_BEATS = [
  { id: "now" as const, label: "Enter", tone: "enter" },
  { id: "goal" as const, label: "Listen", tone: "listen" },
  { id: "next" as const, label: "Crew", tone: "crew" },
  { id: "behave" as const, label: "Clean", tone: "clean" },
];

export const TOOL_MAP = [
  { id: "plan", label: "Plan", tab: "guide" as LiveBoardTab },
  { id: "build", label: "Build", tab: "job" as LiveBoardTab },
  { id: "ship", label: "Ship", tab: "prove" as LiveBoardTab },
  { id: "check", label: "Check", tab: "beats" as LiveBoardTab },
];

export type LiveAliasRow = {
  id: string;
  alias: string;
  period: number;
  xp: number;
  money: number;
};

export type LiveBoardRanks = {
  topXp: LiveAliasRow | null;
  topMoney: LiveAliasRow | null;
  list: LiveAliasRow[];
};

function rowOf(s: { id: string; first: string; period: number; xp: number; quarter: number }): LiveAliasRow {
  return { id: s.id, alias: s.first, period: s.period, xp: s.xp, money: Math.round(s.quarter) };
}

/** Gilded Top XP / Top $ plus the classic alias list. Shop only. Never legal names. */
export function liveBoardRanks(file: EconomyFile): LiveBoardRanks {
  const shop = score(file).filter((s) => s.period !== 6);
  const ranked = byCombo(file, shop);
  const xp = applySort(ranked, "level");
  const money = applySort(ranked, "wallet");
  return {
    topXp: xp[0] ? rowOf(xp[0]) : null,
    topMoney: money[0] ? rowOf(money[0]) : null,
    list: xp.slice(0, 8).map(rowOf),
  };
}

export function liveBoardSpine(file: EconomyFile, date: string, period: number) {
  const day = teachDay(file, date, period);
  const job = teachJob(file, period, date);
  const beats = hourAgendaDraft(file, date, period);
  return {
    job: (job.today || day.do || "").trim(),
    ask: (job.question || day.ask || "").trim(),
    prove: (day.objective || job.done || "").trim(),
    beats,
    tasksDone: beats.filter((b) => b.body.trim()).length,
  };
}
