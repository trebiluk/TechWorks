/**
 * Diego: Profile → Achievements (crew leads, line-leader days, streaks).
 * Teacher dossier shows full counts; alias-safe labels for student-facing surfaces.
 * Aligns with roles.ts: confirmed + xp (Skills XP only — never wallet).
 */
import type { EconomyFile } from "@/lib/economy";
import { leadSkillsXp, roleHistoryOf, type RoleHistoryEntry } from "@/lib/roles";

export type AchievementBadge = {
  id: string;
  label: string;
  detail: string;
  count: number;
};

export type StudentAchievements = {
  timesLedCrew: number;
  cyclesAsCrewLeader: number;
  lineLeaderDays: number;
  lineLeaderStreak: number;
  /** Consecutive confirmed crew-lead days. */
  crewLeadStreak: number;
  confirmedLeadDays: number;
  leadXpEarned: number;
  /** Alias used by dossier teacher Stat. */
  leadSkillsXp: number;
  badges: AchievementBadge[];
  history: RoleHistoryEntry[];
};

/** @deprecated prefer StudentAchievements */
export type WorkerAchievements = StudentAchievements;

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates.filter(Boolean))].sort();
}

/** Longest consecutive-day streak in an ISO date list (calendar adjacency). */
export function longestDateStreak(dates: string[]): number {
  const sorted = uniqueSortedDates(dates);
  if (!sorted.length) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T12:00:00Z`).getTime();
    const cur = new Date(`${sorted[i]}T12:00:00Z`).getTime();
    if (cur - prev === 86400000) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

/** Streak ending at the latest date. */
export function currentDateStreak(dates: string[]): number {
  const sorted = uniqueSortedDates(dates);
  if (!sorted.length) return 0;
  let run = 1;
  for (let i = sorted.length - 1; i >= 1; i--) {
    const prev = new Date(`${sorted[i - 1]}T12:00:00Z`).getTime();
    const cur = new Date(`${sorted[i]}T12:00:00Z`).getTime();
    if (cur - prev === 86400000) run += 1;
    else break;
  }
  return run;
}

export function achievementsFor(file: EconomyFile, studentId: string): StudentAchievements {
  const history = roleHistoryOf(file).filter((e) => e.studentId === studentId);
  const crewRows = history.filter((e) => e.role === "crew_leader");
  // Confirmed = feedback saved; xp may be 0 when Settings bonus is 0.
  const confirmed = crewRows.filter((e) => e.confirmed);
  const lineDays = history.filter((e) => e.role === "line_leader");

  const cycleCrewKeys = new Set(
    crewRows.map((e) => `${e.cycle}|${e.period ?? ""}|${e.crewKey ?? ""}`),
  );
  const cyclesAsCrewLeader = new Set(crewRows.map((e) => e.cycle)).size;
  const lineDates = uniqueSortedDates(lineDays.map((e) => e.date));
  const confirmedDates = uniqueSortedDates(confirmed.map((e) => e.date));
  const lineLeaderStreak = currentDateStreak(lineDates);
  const crewLeadStreak = longestDateStreak(confirmedDates);
  const confirmedLeadDays = confirmedDates.length;
  const leadXpEarned = leadSkillsXp(file, studentId);

  let timesLedCrew = confirmedLeadDays || cycleCrewKeys.size;
  if (!timesLedCrew) {
    timesLedCrew = Object.values(file.meta.config?.crewRoles ?? {}).filter((id) => id === studentId).length;
  }

  const lineLeaderDays = lineDates.length;

  const badges: AchievementBadge[] = [];
  if (timesLedCrew) {
    badges.push({
      id: "crew_lead",
      label: "Crew leader",
      detail: `${timesLedCrew} crew·cycle`,
      count: timesLedCrew,
    });
  }
  if (confirmedLeadDays) {
    badges.push({
      id: "confirmed_lead",
      label: "Confirmed leads",
      detail: `${confirmedLeadDays} day${confirmedLeadDays === 1 ? "" : "s"} · +${leadXpEarned} Skills XP`,
      count: confirmedLeadDays,
    });
  }
  if (lineLeaderDays) {
    badges.push({
      id: "line_leader",
      label: "Line leader",
      detail: `${lineLeaderDays} day${lineLeaderDays === 1 ? "" : "s"}${
        lineLeaderStreak > 1 ? ` · streak ${lineLeaderStreak}` : ""
      }`,
      count: lineLeaderDays,
    });
  }
  if (crewLeadStreak >= 2) {
    badges.push({
      id: "crew_streak",
      label: "Lead streak",
      detail: `${crewLeadStreak} confirmed days in a row`,
      count: crewLeadStreak,
    });
  }
  if (lineLeaderStreak >= 3) {
    badges.push({
      id: "line_streak",
      label: "Line streak",
      detail: `${lineLeaderStreak} days in a row`,
      count: lineLeaderStreak,
    });
  }

  return {
    timesLedCrew,
    cyclesAsCrewLeader: cyclesAsCrewLeader || (timesLedCrew ? 1 : 0),
    lineLeaderDays,
    lineLeaderStreak,
    crewLeadStreak,
    confirmedLeadDays,
    leadXpEarned,
    leadSkillsXp: leadXpEarned,
    badges,
    history,
  };
}

/** Short lines for teacher profile (and optional student slice). */
export function achievementLines(
  ach: StudentAchievements,
  opts?: { teacher?: boolean },
): string[] {
  const lines: string[] = [
    `Times led crew: ${ach.timesLedCrew}`,
    `Line leader days: ${ach.lineLeaderDays}`,
    `Crew-lead streak: ${ach.crewLeadStreak}`,
  ];
  if (opts?.teacher) {
    lines.push(`Cycles as crew leader: ${ach.cyclesAsCrewLeader}`);
    lines.push(`Lead Skills XP: +${ach.leadSkillsXp}`);
  }
  if (ach.confirmedLeadDays) {
    lines.push(
      `Confirmed lead ${ach.confirmedLeadDays} day(s) · +${ach.leadSkillsXp} Skills XP (not wallet)`,
    );
  }
  if (ach.lineLeaderDays && ach.lineLeaderStreak > 1) {
    lines.push(`Line-leader streak ${ach.lineLeaderStreak} days`);
  }
  if (opts?.teacher && ach.history.length) {
    const recent = [...ach.history].reverse().slice(0, 8);
    for (const h of recent) {
      const bits = [
        h.role.replace(/_/g, " "),
        `C${h.cycle}`,
        h.date,
        h.period != null ? `P${h.period}` : "",
        h.crewKey ?? "",
        h.confirmed && Number(h.xp || 0) > 0 ? `+${h.xp} XP` : h.confirmed ? "ok" : "",
      ].filter(Boolean);
      lines.push(bits.join(" · "));
    }
  }
  if (!ach.timesLedCrew && !ach.lineLeaderDays && !ach.confirmedLeadDays) {
    return ["No role badges yet — crown a leader and save feedback."];
  }
  return lines;
}
