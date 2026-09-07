import { bellFor, isLiveStudent, score, type EconomyFile } from "@/lib/economy";
import { gradeSlots, postedFor, sessionMark } from "@/lib/grades";
import { skillXp } from "@/lib/skills";

export type RewardGoal = {
  on: boolean;
  title: string;
  cycles: 1 | 2 | 4;
  startCycle: number;
  xp: number;
  grade: number;
  effort: number;
};

const FALLBACK: RewardGoal = {
  on: true,
  title: "Class pizza",
  cycles: 2,
  startCycle: 1,
  xp: 20,
  grade: 85,
  effort: 80,
};

export function rewardOf(file: EconomyFile): RewardGoal {
  const r = file.meta.config?.reward;
  const cycles = r?.cycles === 2 || r?.cycles === 4 ? r.cycles : 1;
  return {
    on: r?.on ?? FALLBACK.on,
    title: (r?.title ?? FALLBACK.title).trim() || FALLBACK.title,
    cycles,
    startCycle: Math.max(1, Math.min(8, r?.startCycle ?? file.meta.config?.currentCycle ?? 1)),
    xp: Math.max(1, Math.round(r?.xp ?? FALLBACK.xp)),
    grade: Math.max(1, Math.min(100, Math.round(r?.grade ?? FALLBACK.grade))),
    effort: Math.max(1, Math.min(100, Math.round(r?.effort ?? FALLBACK.effort))),
  };
}

export function periodRewardOf(file: EconomyFile, period: number): RewardGoal {
  const base = rewardOf(file);
  const over = file.meta.config?.periodRewards?.[String(period)];
  return {
    ...base,
    title: (over?.title ?? `P${period} · ${base.title}`).trim(),
    xp: Math.max(1, Math.round(over?.xp ?? base.xp)),
    grade: Math.max(1, Math.min(100, Math.round(over?.grade ?? base.grade))),
    effort: Math.max(1, Math.min(100, Math.round(over?.effort ?? base.effort))),
  };
}

export function setReward(file: EconomyFile, patch: Partial<RewardGoal>): EconomyFile {
  const next = JSON.parse(JSON.stringify(file)) as EconomyFile;
  const cur = rewardOf(file);
  next.meta.config = { ...(next.meta.config ?? {}), reward: { ...cur, ...patch } };
  return next;
}

export function setPeriodReward(
  file: EconomyFile,
  period: number,
  patch: Partial<Pick<RewardGoal, "title" | "xp" | "grade" | "effort">>,
): EconomyFile {
  const next = JSON.parse(JSON.stringify(file)) as EconomyFile;
  const cur = periodRewardOf(file, period);
  next.meta.config = {
    ...(next.meta.config ?? {}),
    periodRewards: {
      ...(next.meta.config?.periodRewards ?? {}),
      [String(period)]: {
        title: patch.title ?? cur.title,
        xp: patch.xp ?? cur.xp,
        grade: patch.grade ?? cur.grade,
        effort: patch.effort ?? cur.effort,
      },
    },
  };
  return next;
}

function mean(ns: number[]): number {
  if (!ns.length) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

export type RewardPulse = RewardGoal & {
  period?: number;
  nowCycle: number;
  endCycle: number;
  xpNow: number;
  gradeNow: number;
  effortNow: number;
  xpPct: number;
  gradePct: number;
  effortPct: number;
  combined: number;
  earned: boolean;
  head: number;
};

function pulseFor(file: EconomyFile, goal: RewardGoal, kids: ReturnType<typeof score>, period?: number): RewardPulse {
  const nowCycle = file.meta.config?.currentCycle ?? file.meta.currentWeek ?? 1;
  const endCycle = Math.min(8, goal.startCycle + goal.cycles - 1);
  const xpNow = mean(kids.map((s) => skillXp(file, s.id)));
  const effortNow = mean(kids.map((s) => s.effortPct).filter((n): n is number => n != null));
  const gradeNow = mean(
    kids
      .map((s) => {
        const raw = file.students.find((x) => x.id === s.id);
        if (!raw) return null;
        return sessionMark(gradeSlots(file, raw.grade ?? 6).map((slot) => postedFor(file, raw, slot)));
      })
      .filter((n): n is number => n != null),
  );
  const xpPct = Math.min(1, xpNow / goal.xp);
  const gradePct = Math.min(1, gradeNow / goal.grade);
  const effortPct = Math.min(1, effortNow / goal.effort);
  const combined = (xpPct + gradePct + effortPct) / 3;
  return {
    ...goal,
    period,
    nowCycle,
    endCycle,
    xpNow,
    gradeNow,
    effortNow,
    xpPct,
    gradePct,
    effortPct,
    combined,
    earned: kids.length > 0 && xpPct >= 1 && gradePct >= 1 && effortPct >= 1,
    head: kids.length,
  };
}

export function rewardProgress(file: EconomyFile): RewardPulse {
  const live = score(file).filter((s) => isLiveStudent(s, file.meta.quarterName));
  return pulseFor(file, rewardOf(file), live);
}

export function rewardProgressFor(file: EconomyFile, period: number): RewardPulse {
  const live = score(file).filter((s) => isLiveStudent(s, file.meta.quarterName) && s.period === period);
  return pulseFor(file, periodRewardOf(file, period), live, period);
}

export function allPeriodRewards(file: EconomyFile): RewardPulse[] {
  return bellFor(file).map((b) => rewardProgressFor(file, b.period));
}
