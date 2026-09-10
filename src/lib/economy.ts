import { todayIso, weekOn } from "@/lib/calendar";
import { basketFactor } from "@/lib/tickers";
import { tapeMark } from "@/lib/tape";

export type DayCode = "3" | "2" | "1" | "A" | "E" | "P" | "Assist" | "";

export type RawStudent = {
  id: string;
  /** Public wall name (alias only). */
  first: string;
  last: string;
  /** Vault-only. Never Board / embed / portal. */
  legalFirst?: string;
  legalLast?: string;
  period: number;
  grade?: number;
  crewKey: string;
  /** Cycle → crew key if they switch crews mid-session. */
  crewByCycle?: Record<string, string>;
  /** Date → crew key. Sparse history; last date ≤ today wins. */
  crewDays?: Record<string, string>;
  section?: number;
  course?: string;
  sem?: string;
  days: string[];
  /** Packed school-year marks. Prefer this over `marks`. */
  markTape?: string;
  marks?: Record<string, string>;
  investDays?: Record<string, number>;
  investAsk?: Record<string, boolean>;
  bonus: number;
  deduct: number;
  clutch: number;
  opening: number;
  flags?: {
    iep?: boolean;
    plan504?: boolean;
    ell?: boolean;
    preferSeating?: boolean;
    extendedTime?: boolean;
    dhh?: boolean;
    ta?: boolean;
    hp?: boolean;
  };
  quietNotes?: string;
  purchases?: { ts: string; item: string; category: string; price: number }[];
  /** 3D print collection: piece id → count. */
  prints?: Record<string, number>;
  abDay?: "A" | "B" | "BOTH";
  attend?: Record<string, string>;
  /** Timed out-of-room log (nurse, library…). */
  passes?: { date: string; where: string; out: string; in?: string; period: number }[];
  affect?: Record<string, string>;
  notes?: Record<string, string>;
  readyDays?: Record<string, string>;
  trackDays?: Record<string, string>;
  cleanupDays?: Record<string, "done" | "miss">;
  assistDays?: Record<string, boolean>;
  clubDays?: Record<string, boolean>;
  cleanupCatchDays?: Record<string, number>;
  skills?: Record<string, number>;
  /** Marks over years. Crew and source do not own the skill. */
  skillLog?: { date: string; skillId: string; n: number; year: string; source?: string; crewKey?: string; projectId?: string; stem?: string }[];
  /** Year groups outside the live quarter class. Club skills stay on this id. */
  groups?: { club?: boolean; hall?: boolean };
  bonusXp?: number;
  picks?: string[];
  icon?: string;
  gradeOverrides?: Record<string, number>;
  lucky?: { ts: string; date: string; face: number; stake: number; payout: number }[];
};

export function legalLastOf(s: Pick<RawStudent, "legalLast" | "last">): string {
  return String(s.legalLast ?? s.last ?? "").trim();
}

export function legalFirstOf(s: Pick<RawStudent, "legalFirst">): string {
  return String(s.legalFirst ?? "").trim();
}

export type Bell = { period: number; grade: number };

export type Market = {
  source: "DOW" | "TEACHER";
  index: number;
  baseline: number;
  shock: number;
  factor: number;
};

export type EconomyFile = {
  meta: {
    title: string;
    quarterName: string;
    currentWeek: number;
    schoolYear?: string;
    schema?: number;
    savedAt?: string;
    clearedAt?: string;
    codes: Record<string, number>;
    bell?: Bell[];
    market?: Market;
    sessions?: { n: number; label: string; start: string; end: string; cash: number; xp?: number; headcount: number }[];
    sections?: { course: string; period: number; section: number; days: string; room: string; sem: string }[];
    shop?: { category: string; name: string; price: number }[];
    config?: {
      classGoals?: string[];
      activities?: string[];
      currentCycle?: number;
      seed?: string;
      cycleGoals?: Record<string, string>;
      bellTimes?: { period: number; start: string; end: string; attendBy: string }[];
      schedule?: string;
      bellPacks?: { id: string; label: string; times: { period: number; start: string; end: string; attendBy: string }[] }[];
      cleanupMins?: number;
      cleanupSound?: string;
      cleanupFee?: number;
      crewRoles?: Record<string, string>;
      skills?: { id: string; name: string }[];
      levels?: { colorOn?: boolean; bands?: { minXp: number; label: string; swatch: string }[] };
      lastLiveExport?: string;
      liveExportPeriods?: Record<string, number[]>;
      roleHistory?: {
        studentId: string;
        role: "crew_leader" | "line_leader" | string;
        cycle: number;
        date: string;
        period?: number;
        crewKey?: string;
        confirmed?: boolean;
        xp?: number;
        flags?: Record<string, boolean | string | number>;
      }[];
      leadXpBonus?: number;
      reward?: {
        on?: boolean;
        title?: string;
        cycles?: 1 | 2 | 4;
        startCycle?: number;
        xp?: number;
        grade?: number;
        effort?: number;
      };
      periodRewards?: Record<string, { title?: string; xp?: number; grade?: number; effort?: number }>;
      housePicks?: string[];
      boardCards?: { title: string; body: string }[];
      meetings?: { title: string; date?: string; dow?: number; time?: string }[];
      crewBans?: { a: string; b: string; note?: string; by?: string; since?: string }[];
      crewExceptions?: { a: string; b: string; date: string; note: string }[];
      teachPack?: string;
      teachDays?: Record<string, Record<string, { pack?: string; objective?: string; pin?: string; notes?: string }>>;
      lessons?: { id: string; title: string; cat: string; grade?: number; pack?: string; objective?: string; notes?: string; used?: { date: string; period: number; q?: string }[] }[];
      studyHall?: {
        showNotes?: boolean;
        showOwes?: boolean;
        notes?: string[];
        owes?: { id: string; item: string }[];
        shop?: { category: string; name: string; price: number }[];
      };
      lineLeaders?: Record<string, string>;
      projectByGrade?: Record<string, string>;
      /** Cycle · period · crew → project id. Empty = grade default for that cycle. */
      crewProjects?: { cycle: number; period: number; crewKey: string; projectId: string }[];
      /** Period → ordered active project slots. Empty = grade live unit. */
      periodProjects?: Record<string, string[]>;
      projects?: {
        id: string;
        title: string;
        kind?: string;
        grades: number[];
        skills: string[];
        stages: { cycle: number; slot: "D1" | "D2" | "D3" | "D4"; goal: string; skillId: string; activityId?: string }[];
        activities?: {
          id: string;
          name: string;
          skillId: string;
          goal: string;
          expect?: 1 | 2 | 3 | 4;
          today?: string;
          done?: string;
          lookFor?: string;
        }[];
        start?: string;
        end?: string;
        constraints?: string[];
        cycleStart?: number;
        cycleLen?: number;
        pathVer?: number;
        prompt?: string;
        stem?: ("S" | "T" | "E" | "M")[];
        stemLine?: string;
      }[];
      modules?: Record<string, boolean>;
      lucky?: {
        pot?: number;
        tickets?: { id: string; n: number }[];
        lastDraw?: { date: string; alias: string; pot: number };
      };
      prints?: {
        pieces: {
          id: string;
          name: string;
          size: "S" | "M" | "L";
          rarity: "common" | "shiny" | "rare" | "wild";
          price: number;
          stock: number;
          photo?: string;
          series?: string;
          variant?: string;
          note?: string;
          made?: number;
          released?: number;
        }[];
        log: { ts: string; kind: string; pieceId: string; qty: number; studentId?: string; note?: string }[];
      };
    };
    mst?: {
      standard?: string;
      version?: string;
      class_default_level: "elementary" | "intermediate" | "commencement";
      lock_level_to_class?: boolean;
      current_project_id?: string;
      projects: {
        id: string;
        title: string;
        started: string;
        skills_in_scope?: ("S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7")[];
      }[];
      records: {
        id: string;
        student_id: string;
        project_id: string;
        date: string;
        skill_id: "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";
        level: "elementary" | "intermediate" | "commencement";
        score: 1 | 2 | 3 | 4;
        evidence?: string;
        next_action?: string;
        scored_by?: string;
        updated_at?: string;
      }[];
      records_history?: unknown[];
    };
    abAnchor?: { date: string; letter: "A" | "B" };
    ledger?: { ts: string; id: string; type: string; amount: number; date: string; note: string }[];
    polls?: {
      live?: {
        id: string;
        prompt: string;
        kind: "yesno" | "abcd" | "scale" | "emoji" | "custom";
        options: { id: string; label: string }[];
        period: number;
        date: string;
        open: boolean;
        votes: Record<string, string>;
        closedAt?: string;
      } | null;
      archive?: {
        id: string;
        prompt: string;
        kind: "yesno" | "abcd" | "scale" | "emoji" | "custom";
        options: { id: string; label: string }[];
        period: number;
        date: string;
        open: boolean;
        votes: Record<string, string>;
        closedAt?: string;
      }[];
      bank?: { id: string; prompt: string; kind: "yesno" | "abcd" | "scale" | "emoji" | "custom"; options?: string[] }[];
    };
    dayLog?: Record<
      string,
      {
        periodGoals: Record<string, string>;
        crewGoals: Record<string, string>;
        periodActivity?: Record<string, string>;
        crewActivity?: Record<string, string>;
        paintCheck?: Record<string, { current: string; path: string[] }>;
        sub?: boolean;
        agenda?: Record<string, string>;
        cleanup?: Record<string, "done" | "miss">;
        schooltool?: Record<string, boolean>;
        lunch?: string;
        happened?: Record<string, string>;
        visits?: Record<string, string>;
        crewPhase?: Record<string, string>;
        goalPhase?: Record<string, string>;
        ppe?: Record<string, boolean>;
        bell?: string;
        special?: { title: string; who?: string; place?: string; start?: string; end?: string; period?: number };
        specials?: { title: string; who?: string; place?: string; start?: string; end?: string; period?: number }[];
        cards?: { title: string; body: string }[];
        verify?: Record<string, boolean>;
      }
    >;
  };
  crews: { period: number; key: string; name: string; motto?: string; icon?: string; color?: string; logo?: string }[];
  students: RawStudent[];
};

export type ScoredStudent = RawStudent & {
  crewName: string;
  weekPay: number;
  net: number;
  quarter: number;
  principal: number;
  invests: number;
  stock: number;
  worth: number;
  effortAvg: number | null;
  effortPct: number | null;
};

export const DEFAULT_BELL: Bell[] = [
  { period: 1, grade: 6 },
  { period: 2, grade: 8 },
  { period: 3, grade: 7 },
  { period: 6, grade: 5 },
  { period: 8, grade: 7 },
  { period: 9, grade: 8 },
  { period: 10, grade: 6 },
];

export function bellFor(file: EconomyFile): Bell[] {
  return file.meta.bell?.length ? file.meta.bell : DEFAULT_BELL;
}

export function isShopPeriod(period: number): boolean {
  return period !== 6;
}

export function shopBells(file: EconomyFile): Bell[] {
  return bellFor(file).filter((b) => isShopPeriod(b.period));
}

export function periodTitle(period: number, bells: Bell[]): string {
  if (period === 6) return "Period 6 · Study Hall";
  const g = bells.find((b) => b.period === period)?.grade;
  return g ? `Period ${period} · Gr ${g}` : `Period ${period}`;
}

export function sessionCode(quarterName: string | undefined): string {
  const n = String(quarterName ?? "S1").toUpperCase();
  if (n.includes("4") || n === "Q4") return "Q4";
  if (n.includes("3") || n === "Q3") return "Q3";
  if (n.includes("2") || n === "Q2") return "Q2";
  return "Q1";
}

export function isLiveStudent(s: RawStudent, quarterName?: string): boolean {
  const sem = String(s.sem ?? "Q1").toUpperCase();
  if (sem === "YEAR" || (sem.includes("Q1") && sem.includes("Q4"))) return true;
  return sem === sessionCode(quarterName);
}

export function dayPay(code: string, rates: Record<string, number>): number {
  const key = String(code ?? "").trim().toUpperCase();
  if (!key) return 0;
  return Number(rates[key] ?? 0);
}

export function effortFromDays(days: string[]): { avg: number | null; pct: number | null } {
  const marks = (days ?? [])
    .map((d) => String(d ?? "").trim())
    .filter((d) => d === "1" || d === "2" || d === "3")
    .map(Number);
  if (!marks.length) return { avg: null, pct: null };
  const avg = marks.reduce((s, n) => s + n, 0) / marks.length;
  const pct = 70 + (avg - 1) * 15;
  return { avg, pct };
}

export function principalOf(s: { investDays?: Record<string, number> }): number {
  return Object.values(s.investDays ?? {}).reduce((n, v) => n + Number(v || 0), 0);
}

export function investCount(s: { investDays?: Record<string, number> }): number {
  return Object.values(s.investDays ?? {}).filter((v) => Number(v) > 0).length;
}

export function weekInvested(
  s: { investDays?: Record<string, number> },
  dates: string[],
): number {
  return dates.reduce((n, d) => n + Number(s.investDays?.[d] || 0), 0);
}

export function marketFactor(file: EconomyFile): number {
  const f = Number(file.meta.market?.factor);
  return Number.isFinite(f) && f > 0 ? f : 1;
}

let scoreFile: EconomyFile | null = null;
let scoreRows: ScoredStudent[] | null = null;

export function score(file: EconomyFile): ScoredStudent[] {
  if (scoreFile === file && scoreRows) return scoreRows;
  const rates = file.meta.codes;
  const crews = file.crews;
  const factor = marketFactor(file);
  const weekDates = weekOn(todayIso())?.days ?? [];
  const voidDates = new Set(weekDates.filter((d) => Boolean(file.meta.dayLog?.[d]?.sub)));
  const rows = file.students.filter((s) => isLiveStudent(s, file.meta.quarterName)).map((s) => {
    const codes = weekDates.map((iso, i) => (voidDates.has(iso) ? "" : tapeMark(s.markTape, iso) || s.marks?.[iso] || s.days?.[i] || ""));
    const assistPay = weekDates.reduce(
      (n, d) => n + (voidDates.has(d) ? 0 : s.assistDays?.[d] ? Number(rates.Assist ?? 10) : 0),
      0,
    );
    const weekPay = codes.reduce((sum, d) => sum + dayPay(d, rates), 0) + assistPay;
    const net = weekPay + Number(s.bonus || 0) - Number(s.deduct || 0) + Number(s.clutch || 0);
    const weekInv = weekDates.reduce((n, d) => n + (voidDates.has(d) ? 0 : Number(s.investDays?.[d] || 0)), 0);
    const principal = Object.entries(s.investDays ?? {}).reduce(
      (n, [d, v]) => n + (voidDates.has(d) ? 0 : Number(v || 0)),
      0,
    );
    const cash = Number(s.opening || 0) + net - weekInv;
    const stock = principal * basketFactor(s.picks, factor);
    const crewName =
      crews.find((c) => c.period === s.period && c.key === s.crewKey)?.name ?? s.crewKey;
    const { avg, pct } = effortFromDays(codes);
    return {
      ...s,
      crewName,
      weekPay,
      net,
      quarter: cash,
      principal,
      invests: investCount(s),
      stock,
      worth: cash + stock,
      effortAvg: avg,
      effortPct: pct,
    };
  });
  scoreFile = file;
  scoreRows = rows;
  return rows;
}

export function money(n: number): string {
  const abs = Math.abs(Math.round(n));
  const body = abs.toLocaleString("en-US");
  if (n < 0) return `($${body})`;
  return `$${body}`;
}

export function topN(list: ScoredStudent[], n: number, field: "worth" | "stock" | "quarter" = "worth"): ScoredStudent[] {
  return [...list].sort((a, b) => b[field] - a[field] || a.first.localeCompare(b.first)).slice(0, n);
}

export function topByPeriod(list: ScoredStudent[], period: number, n = 3, field: "worth" | "stock" | "quarter" = "worth"): ScoredStudent[] {
  return topN(
    list.filter((s) => s.period === period),
    n,
    field,
  );
}

export function bestCrew(
  list: ScoredStudent[],
  field: "worth" | "stock" | "quarter" = "worth",
): { name: string; period: number; total: number } | null {
  const map = new Map<string, { name: string; period: number; total: number }>();
  for (const s of list) {
    const k = `${s.period}|${s.crewName}`;
    const cur = map.get(k) ?? { name: s.crewName, period: s.period, total: 0 };
    cur.total += s[field];
    map.set(k, cur);
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  return rows[0] ?? null;
}

export function kpis(list: ScoredStudent[]) {
  const days = list.flatMap((s) => s.days.map((d) => String(d).toUpperCase()));
  return {
    fullDays: days.filter((d) => d === "3").length,
    personal: days.filter((d) => d === "P").length,
    absences: days.filter((d) => d === "A").length,
    excused: days.filter((d) => d === "E").length,
    bonuses: list.reduce((sum, s) => sum + Number(s.bonus || 0), 0),
  };
}
