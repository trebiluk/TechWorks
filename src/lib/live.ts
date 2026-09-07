import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent } from "@/lib/economy";
import { isSchoolDay, todayIso, weekOn } from "@/lib/calendar";
import { isSubDay, markOn, abOn, onAbRoster } from "@/lib/store";

/** Frozen names-vault schema. Private download only. Never live export. */
export const VAULT_FIELDS = [
  "alias",
  "legalFirst",
  "last",
  "period",
  "section",
  "iep",
  "plan504",
  "ell",
  "dhh",
] as const;

export type NamesVaultRow = {
  alias: string;
  last: string;
  legalFirst?: string;
  period: number;
  section?: number;
  iep: boolean;
  plan504: boolean;
  ell?: boolean;
  dhh?: boolean;
};

export function vaultRowOf(s: {
  first: string;
  last?: string;
  legalFirst?: string;
  legalLast?: string;
  period: number;
  section?: number;
  flags?: { iep?: boolean; plan504?: boolean; ell?: boolean; dhh?: boolean };
}): NamesVaultRow {
  return {
    alias: s.first,
    last: s.legalLast ?? s.last ?? "",
    legalFirst: s.legalFirst,
    period: s.period,
    section: s.section,
    iep: Boolean(s.flags?.iep),
    plan504: Boolean(s.flags?.plan504),
    ell: Boolean(s.flags?.ell),
    dhh: Boolean(s.flags?.dhh),
  };
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function publicHandle(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  let out = "";
  for (let i = 0; i < 5; i++) out += ALPHA[(h >>> (i * 5)) & 31];
  return out;
}

export function periodScoring(file: EconomyFile, period: number, today = todayIso()) {
  return periodPulses(file, today)[period] ?? { due: 0, overdue: 0, head: 0 };
}

/** One pass over the roster for every period. */
export function periodPulses(file: EconomyFile, today = todayIso()) {
  const days = (weekOn(today)?.days ?? []).filter((d) => isSchoolDay(d) && d <= today && !isSubDay(file, d));
  const letters = days.map((d) => abOn(file, d));
  const q = file.meta.quarterName;
  const out: Record<number, { due: number; overdue: number; head: number }> = {};
  for (const s of file.students) {
    if (!isLiveStudent(s, q)) continue;
    const row = (out[s.period] ??= { due: 0, overdue: 0, head: 0 });
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (!onAbRoster(s, letters[i]) || markOn(s, d)) continue;
      if (d < today) row.overdue += 1;
      else row.due += 1;
    }
  }
  return out;
}

export function splitExport(file: EconomyFile) {
  const names: Record<string, NamesVaultRow> = {};
  const students = file.students.map((s) => {
    const code = publicHandle(s.id);
    names[code] = vaultRowOf(s);
    return {
      code,
      period: s.period,
      crewKey: s.crewKey,
      section: s.section,
      course: s.course,
      sem: s.sem,
      days: s.days,
      markTape: s.markTape,
      investDays: s.investDays,
      bonus: s.bonus,
      deduct: s.deduct,
      clutch: s.clutch,
      opening: s.opening,
      skills: s.skills ?? {},
      picks: s.picks ?? [],
    };
  });
  const live = {
    v: 2,
    ts: new Date().toISOString(),
    meta: {
      title: file.meta.title,
      quarterName: file.meta.quarterName,
      currentWeek: file.meta.currentWeek,
      codes: file.meta.codes,
      bell: file.meta.bell,
      market: file.meta.market,
      config: {
        activities: file.meta.config?.activities,
        classGoals: file.meta.config?.classGoals,
        currentCycle: file.meta.config?.currentCycle,
      },
    },
    crews: file.crews,
    students,
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(live))));
  return { encoded, names, live };
}

export async function publishLive(encoded: string): Promise<boolean> {
  try {
    const res = await fetch("/api/live", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: encoded,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function downloadText(name: string, body: string, type = "application/json") {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
