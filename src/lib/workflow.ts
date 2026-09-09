import type { EconomyFile } from "@/lib/economy";
import { isLiveStudent, shopBells } from "@/lib/economy";
import { attendOn, deskBellId, exportedThisPeriod, isSubDay, lineLeaderOn, outNow, schooltoolDone } from "@/lib/store";
import { crewDone, crewsOf, dueCrews, scoredToday } from "@/lib/crews";
import { todayIso } from "@/lib/calendar";
import { printLogOf } from "@/lib/prints";
import { attendLate, formatBell, periodClock, periodNext, periodNow } from "@/lib/bells";

export type RoleId = "teacher" | "crew" | "worker" | "hall" | "club" | "family" | "sub";

export const ROLE_PATHS: {
  id: RoleId;
  title: string;
  who: string;
  steps: string[];
  writes: string;
}[] = [
  {
    id: "teacher",
    title: "Teacher",
    who: "Unlock desk · PIN 1111",
    steps: [
      "Projector on the wall",
      "SchoolTool by 8:15",
      "Today's goal from the project",
      "Verify each crew after the lead",
      "Nurse / cleanup / store / lucky (PIN)",
      "Export / save once a period",
    ],
    writes: "marks, attend, passes, ledger, skills, grades, vault",
  },
  {
    id: "crew",
    title: "Crew lead",
    who: "Kiosk · PIN 2222 · this period only",
    steps: [
      "See Hi, Team Leader {name}",
      "Tap 3 / 2 / 1 or Absent / Excused / Personal",
      "Optional INVEST? on a 3/2/1",
      "Next crew auto-advances",
    ],
    writes: "effort marks + invest ask. Never wallet, bonus, or grades.",
  },
  {
    id: "worker",
    title: "Worker",
    who: "Wall + profile · aliases",
    steps: [
      "Read XP (gold) and $ (perks)",
      "Open alias → family report (project mark)",
      "Crew work → cleanup when coral",
    ],
    writes: "Nothing. They don't type money.",
  },
  {
    id: "hall",
    title: "Study hall",
    who: "Hall Manager · not Tech effort",
    steps: [
      "HERE or NURSE / LIBRARY / TEACHER (clocked)",
      "Line leader for the week",
      "Productive or peaceful · hall store",
    ],
    writes: "attend + passes. Wallet only on cleanup miss.",
  },
  {
    id: "club",
    title: "Tech Club",
    who: "After school",
    steps: ["IN once a day", "Activity cards", "Separate from class effort"],
    writes: "clubDays · +$10 · +2 XP once/date",
  },
  {
    id: "family",
    title: "Family",
    who: "Profile → Family",
    steps: ["One project grade", "Skills in plain words", "No wallet / stock / lucky"],
    writes: "Read-only",
  },
  {
    id: "sub",
    title: "Sub day",
    who: "You tap SUB. A sub never opens this app.",
    steps: ["SUB voids the date", "Cycle does not rewind", "Next class day is the next cycle day"],
    writes: "dayLog.sub",
  },
];

export type TraceItem = {
  role: RoleId;
  label: string;
  state: "ok" | "due" | "off";
  detail: string;
};

export function traceToday(file: EconomyFile, date = todayIso()): TraceItem[] {
  const hits = scoredToday(file, date);
  const st = schooltoolDone(file, date, 1);
  const livePeriod = shopBells(file)[0]?.period ?? 1;
  const sent = exportedThisPeriod(file, date, livePeriod);
  const away = outNow(file, date).filter((x) => !x.pass?.in);
  const sub = isSubDay(file, date);
  const p6 = file.students.filter((s) => s.period === 6 && isLiveStudent(s, file.meta.quarterName));
  const p6Here = p6.filter((s) => !attendOn(s, date)).length;
  const p6Out = p6.length - p6Here;
  const clubIn = file.students.filter((s) => s.clubDays?.[date]).length;
  const luckyN = (file.meta.ledger ?? []).filter((x) => x.date === date && x.type === "Lucky").length;
  const shopN = (file.meta.ledger ?? []).filter((x) => x.date === date && String(x.type).includes("Purchase")).length;
  const printN = printLogOf(file).filter((e) => e.ts.slice(0, 10) === date && (e.kind === "buy" || e.kind === "gift")).length;
  const lead = lineLeaderOn(file, date);
  const leadName = file.students.find((s) => s.id === lead)?.first ?? "—";

  if (sub) {
    return [{ role: "sub", label: "SUB day", state: "ok", detail: "No scores. Next class is the next cycle day." }];
  }

  const out: TraceItem[] = [
    { role: "teacher", label: "SchoolTool", state: st ? "ok" : "due", detail: st ? "P1 marked in" : "Open SchoolTool by 8:15" },
    {
      role: "crew",
      label: "Crew scores",
      state: hits.hit === hits.n && hits.n ? "ok" : "due",
      detail: `${hits.hit}/${hits.n} workers marked`,
    },
    {
      role: "teacher",
      label: "Save / export",
      state: sent ? "ok" : "due",
      detail: sent ? "This period saved" : "Export once this period",
    },
    {
      role: "teacher",
      label: "Out of room",
      state: away.length ? "due" : "ok",
      detail: away.length ? away.map((x) => `${x.student.first} ${x.where} ${x.pass?.out ?? ""}`.trim()).join(" · ") : "Everyone in",
    },
    {
      role: "hall",
      label: "Study hall",
      state: p6.length ? "ok" : "off",
      detail: p6.length ? `${p6Here} here · ${p6Out} out · leader ${leadName}` : "No P6 roster",
    },
    {
      role: "club",
      label: "Club IN",
      state: clubIn ? "ok" : "off",
      detail: clubIn ? `${clubIn} checked in` : "No club check-ins yet",
    },
    {
      role: "worker",
      label: "Cash today",
      state: luckyN || shopN || printN ? "ok" : "off",
      detail: `${shopN} store · ${printN} prints · ${luckyN} lucky`,
    },
    {
      role: "family",
      label: "Family sheet",
      state: "ok",
      detail: "Profile → Family. Project mark only.",
    },
  ];
  return out.filter((t) => t.state !== "off" && t.label !== "Family sheet");
}

export type NextJob = {
  id: string;
  label: string;
  hint: string;
  tone: "ok" | "due" | "warn" | "now";
  go: "score" | "schooltool" | "export" | "overview" | "teach" | "admin" | "hall";
  period?: number;
  crew?: string;
  date?: string;
};

/** One thing to do right now. SchoolTool only nags in P1. Scoring beats export during class. */
export function nextJob(file: EconomyFile, now = new Date()): NextJob {
  const date = todayIso();
  if (isSubDay(file, date)) {
    return { id: "sub", label: "SUB day", hint: "No scores", tone: "ok", go: "overview" };
  }
  const bellsId = deskBellId(file, date);
  const live = periodNow(bellsId, now);
  const clock = live != null ? periodClock(live, bellsId, now) : null;
  const nxt = periodNext(bellsId, now);
  const due = dueCrews(file, date);
  const st = schooltoolDone(file, date, 1);

  if (!st && (live === 1 || (live == null && attendLate(1, bellsId, now)))) {
    return { id: "st", label: "SchoolTool", hint: "by 8:15", tone: "due", go: "schooltool" };
  }

  if (clock?.cleanup && live && live !== 6) {
    return { id: "clean", label: "Cleanup", hint: `${Math.max(0, Math.ceil(clock.left))}m`, tone: "warn", go: "overview" };
  }

  if (live && live !== 6) {
    const crews = crewsOf(file, live, date);
    const open = crews.find((c) => !crewDone(c.kids, date));
    if (open) {
      const left = crews.filter((c) => !crewDone(c.kids, date)).length;
      return {
        id: "score",
        label: `Score ${open.name}`,
        hint: `P${live} · ${left} left`,
        tone: "now",
        go: "score",
        period: live,
        crew: open.key,
        date,
      };
    }
    if (!exportedThisPeriod(file, date, live)) {
      return { id: "export", label: `Save P${live}`, hint: "once this period", tone: "due", go: "export", period: live };
    }
  }

  const late = due.find((d) => d.kind === "late");
  if (late) {
    return {
      id: "late",
      label: `Catch up ${late.name}`,
      hint: `P${late.period}`,
      tone: "due",
      go: "score",
      period: late.period,
      crew: late.key,
      date: late.date,
    };
  }

  if (live === 6) {
    return { id: "hall", label: "Study hall", hint: "Hall wall", tone: "now", go: "hall" };
  }

  const todayDue = due.find((d) => d.kind === "due");
  if (todayDue) {
    return {
      id: "due",
      label: `Score ${todayDue.name}`,
      hint: `P${todayDue.period}`,
      tone: "due",
      go: "score",
      period: todayDue.period,
      crew: todayDue.key,
      date: todayDue.date,
    };
  }

  if (!st) {
    return { id: "st", label: "SchoolTool", hint: "still open", tone: "due", go: "schooltool" };
  }

  if (nxt) {
    return { id: "wait", label: `P${nxt.period} next`, hint: formatBell(nxt.start), tone: "ok", go: "teach" };
  }

  return { id: "clear", label: "You're clear", hint: "Wall up", tone: "ok", go: "overview" };
}

