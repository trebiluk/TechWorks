/** Google book contract. Gold headers are locked. Extra columns are yours. */
import type { EconomyFile, RawStudent } from "./economy";
import { bellFor, isLiveStudent, legalFirstOf, legalLastOf, periodTitle, shopBells } from "./economy";
import { cycleNow, cycleRange, daySlot, isSchoolDay, quarterNow, reason, schoolDays, todayIso, yearProgress } from "./calendar";
import { MARKING, SOLVAY_YEAR } from "../data/solvay-2026-27";
import { eachTapeMark } from "./tape";
import { ALL_TRACK, lastStemOf, skillScore, skillXp, skillsOf, stemForScore } from "./skills";
import { STEM_LABEL, stemLettersOf, stemsOf } from "./stems";
import { agendaFor, ensureProjects, projectForCycle, projectsOf } from "./projects";
import { calcProjectGrade, postedFor, gradeSlots, sessionMark } from "./grades";
import { workerCards, logRows, masterRows, MASTER_HEADER, LOG_HEADER } from "./report";
import { CLUB_STATIONS, type ClubFile } from "./club";
import { APP_VERSION } from "./version";
import { publicHandle } from "./live";

export const BOOK_VERSION = 1;
export const EXTRA_N = 8;
export const CYCLE_N = 8;
export const SLOTS = ["D1", "D2", "D3", "D4"] as const;
export const SHOP_SKILLS = ["safety", "measure", "draw", "model", "tools", "finish", "present", "team"] as const;

export const EXTRA_KEYS = Array.from({ length: EXTRA_N }, (_, i) => `extra_${i + 1}`);
export const EXTRA_LABELS = Array.from({ length: EXTRA_N }, (_, i) => `Your field ${i + 1}`);
export const CYCLE_KEYS = Array.from({ length: CYCLE_N }, (_, c) => SLOTS.map((d) => `C${c + 1}${d}`)).flat();

export type BookCell = string | number | null;
export type BookKind = "readme" | "kpis" | "table";

export type BookSheet = {
  name: string;
  kind: BookKind;
  banner?: string;
  warn?: boolean;
  kpis?: { label: string; value: string }[];
  keys: string[];
  labels: string[];
  locked: number;
  rows: BookCell[][];
  note?: string;
};

function padExtras(row: BookCell[], locked: number): BookCell[] {
  return [...row.slice(0, locked), ...Array.from({ length: EXTRA_N }, () => "")];
}

function crewNameOf(file: EconomyFile, s: RawStudent): string {
  return file.crews.find((c) => c.key === s.crewKey)?.name || s.crewKey || "";
}

function cycleSlotMap(s: RawStudent): Record<string, string> {
  const out: Record<string, string> = {};
  function bump(date: string, code: string) {
    if (!code) return;
    const cyc = cycleNow(date);
    const slot = daySlot(date).label;
    if (!slot) return;
    out[`C${cyc}${slot}`] = String(code).toUpperCase();
  }
  for (const [date, code] of Object.entries(s.marks ?? {})) bump(date, code);
  eachTapeMark(s.markTape, bump);
  return out;
}

function thisCycleCodes(s: RawStudent, cycle: number): string[] {
  const map = cycleSlotMap(s);
  return SLOTS.map((d) => map[`C${cycle}${d}`] ?? "");
}

function countsOf(s: RawStudent): Record<string, number> {
  const n: Record<string, number> = { "3": 0, "2": 0, "1": 0, A: 0, E: 0, P: 0 };
  function bump(_d: string, code: string) {
    const k = String(code || "").toUpperCase();
    if (k in n) n[k] += 1;
  }
  for (const [d, c] of Object.entries(s.marks ?? {})) bump(d, c);
  eachTapeMark(s.markTape, bump);
  return n;
}

const CLASS_KEYS = [
  "tw_id",
  "tw_handle",
  "tw_alias",
  "tw_crew",
  "tw_grade",
  "tw_period",
  "tw_unit",
  "tw_prompt",
  "tw_stem",
  "tw_d1",
  "tw_d2",
  "tw_d3",
  "tw_d4",
  "tw_3",
  "tw_2",
  "tw_1",
  "tw_a",
  "tw_e",
  "tw_p",
  "tw_xp",
  "tw_wallet",
  "tw_mark",
  ...SHOP_SKILLS.map((id) => `tw_${id}`),
  "tw_last_stem",
  ...EXTRA_KEYS,
];

const CLASS_LABELS = [
  "Shop ID (locked)",
  "Handle",
  "Alias",
  "Crew",
  "Grade",
  "Period",
  "Unit",
  "Driving question",
  "STEM",
  "This cycle D1",
  "D2",
  "D3",
  "D4",
  "Days 3",
  "Days 2",
  "Days 1",
  "A",
  "E",
  "P",
  "XP",
  "Wallet $",
  "Project mark",
  "Safety 1–4",
  "Measure 1–4",
  "Draw 1–4",
  "Model 1–4",
  "Tools 1–4",
  "Finish 1–4",
  "Present 1–4",
  "Team 1–4",
  "Last evidence stem",
  ...EXTRA_LABELS,
];

function classLocked(): number {
  return CLASS_KEYS.length - EXTRA_N;
}

function classRow(file: EconomyFile, s: RawStudent, cycle: number, wallet: number | ""): BookCell[] {
  const grade = s.grade ?? bellFor(file).find((b) => b.period === s.period)?.grade ?? 6;
  const unit = s.period === 6 ? null : projectForCycle(file, grade, cycle);
  const slots = unit ? gradeSlots(file, grade).filter((x) => x.projectId === unit.id) : [];
  const posted = slots.map((slot) => postedFor(file, s, slot));
  const mark = slots.length ? sessionMark(posted) : unit ? calcProjectGrade(s, unit.id, file).points : null;
  const codes = thisCycleCodes(s, cycle);
  const n = countsOf(s);
  const xp = skillXp(file, s.id);
  const row: BookCell[] = [
    s.id,
    publicHandle(s.id),
    s.first,
    crewNameOf(file, s),
    grade,
    s.period,
    unit?.title ?? "",
    unit?.prompt ?? "",
    (unit?.stem ?? []).join(""),
    codes[0] ?? "",
    codes[1] ?? "",
    codes[2] ?? "",
    codes[3] ?? "",
    n["3"] ?? 0,
    n["2"] ?? 0,
    n["1"] ?? 0,
    n.A ?? 0,
    n.E ?? 0,
    n.P ?? 0,
    xp,
    wallet,
    mark ?? "",
    ...SHOP_SKILLS.map((id) => skillScore(s, id) || ""),
    lastStemOf(s),
  ];
  return padExtras(row, classLocked());
}

function classKpis(file: EconomyFile, kids: RawStudent[], period: number, cycle: number): { label: string; value: string }[] {
  const n = kids.length;
  const seen = kids.filter((s) => SHOP_SKILLS.some((id) => skillScore(s, id) > 0)).length;
  const counts = kids.reduce(
    (acc, s) => {
      const c = countsOf(s);
      acc[3] += c["3"] ?? 0;
      acc[2] += c["2"] ?? 0;
      acc[1] += c["1"] ?? 0;
      acc.blank += thisCycleCodes(s, cycle).filter((x) => !x).length;
      return acc;
    },
    { 3: 0, 2: 0, 1: 0, blank: 0 },
  );
  const marks = kids.flatMap((s) => SHOP_SKILLS.map((id) => skillScore(s, id)).filter((v) => v > 0));
  const mean = marks.length ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : "—";
  const agenda = agendaFor(file, period);
  const q = quarterNow(todayIso());
  return [
    { label: "Year", value: `${SOLVAY_YEAR} · ${q.label} · Cycle ${cycle}` },
    { label: "Unit", value: agenda.title || "—" },
    { label: "Driving question", value: agenda.project?.prompt || "—" },
    { label: "STEM", value: (agenda.project?.stem ?? []).map((L) => STEM_LABEL[L]).join(" · ") || "—" },
    { label: "Today", value: `${agenda.activityName || "—"} · look for a ${agenda.activity?.expect ?? 3}` },
    { label: "Workers", value: String(n) },
    { label: "Skills seen", value: `${seen} / ${n}` },
    { label: "3 / 2 / 1", value: `${counts[3]} / ${counts[2]} / ${counts[1]}` },
    { label: "Blank this cycle", value: String(counts.blank) },
    { label: "Mean 1–4", value: mean },
  ];
}

function classSheet(file: EconomyFile, period: number, cycle: number): BookSheet {
  const bells = bellFor(file);
  const grade = bells.find((b) => b.period === period)?.grade ?? 6;
  const kids = file.students.filter((s) => s.period === period && isLiveStudent(s, file.meta.quarterName)).sort((a, b) => a.first.localeCompare(b.first));
  const pay = new Map(workerCards(file).filter((c) => c.period === period).map((c) => [c.id, Math.round(c.quarter)]));
  const name = period === 6 ? "P6 Hall" : `P${period} Gr${grade}`;
  return {
    name,
    kind: "kpis",
    banner: `${periodTitle(period, bells)} · aliases only · gold headers locked`,
    kpis: classKpis(file, kids, period, cycle),
    keys: CLASS_KEYS,
    labels: CLASS_LABELS,
    locked: classLocked(),
    rows: kids.map((s) => classRow(file, s, cycle, pay.get(s.id) ?? "")),
    note: kids.length ? undefined : "No workers in this period yet. Import the roster, then export again.",
  };
}

function readmeSheet(): BookSheet {
  const rows: BookCell[][] = [
    ["What this is", "The 2026–27 TechWorks archive. The desk is the tap pad. This book is the year file."],
    ["No Apps Script", "Nothing runs in the sheet. Formulas are optional. The desk writes values."],
    ["Gold headers", "Keys starting with tw_ or C1D1…C8D4. Do not rename. The next export matches these names."],
    ["Your fields", "extra_1 through extra_8 — rename the label row, type whatever you need. The desk never overwrites those."],
    ["Add more columns", "Add them AFTER extra_8. Keep a copy before you re-export, then paste your extra columns back."],
    ["Do not insert", "Do not insert columns between gold headers. That breaks the lock."],
    ["FERPA", "Class, club, year, skills, master, log = aliases only. VAULT has legal names — do not share that tab."],
    ["Class tabs", "One mini dashboard per period (1, 2, 3, 8, 9, 10) plus study hall and club."],
    ["YEAR MARKS", "Full year D1–D4 for cycles 1–8. Blank is not a zero. Fill as the year happens."],
    ["STEM", "Evidence stems (the 1–4 sentences). Not a second MST score. NY Tech stays on the desk."],
    ["How to export", "Admin → Records → Google book. Download, then File → Import into this sheet or replace it."],
    ["How to lock in Sheets", "Data → Protect sheets and ranges. Protect gold columns. Leave extra_1–extra_8 editable."],
    ["Version", `Desk v${APP_VERSION} · book v${BOOK_VERSION} · ${SOLVAY_YEAR}`],
  ];
  return {
    name: "README",
    kind: "readme",
    keys: ["topic", "note"],
    labels: ["Topic", "Note"],
    locked: 2,
    rows,
  };
}

function lockSheet(sheets: BookSheet[]): BookSheet {
  const rows: BookCell[][] = [];
  for (const sh of sheets) {
    sh.keys.forEach((key, i) => {
      rows.push([sh.name, key, sh.labels[i] ?? key, i < sh.locked ? "LOCK" : "YOURS", i < sh.locked ? "Desk writes this" : "You may rename the label and type freely"]);
    });
  }
  return {
    name: "LOCK",
    kind: "table",
    banner: "Contract the desk reads. Gold = do not rename.",
    keys: ["sheet", "key", "label", "lock", "note"],
    labels: ["Tab", "Key", "Label", "Lock", "Note"],
    locked: 5,
    rows,
  };
}

function yearSheet(file: EconomyFile, club: ClubFile): BookSheet {
  const today = todayIso();
  const yp = yearProgress(today);
  const q = quarterNow(today);
  const cycle = cycleNow(today);
  const bells = bellFor(file);
  const live = file.students.filter((s) => isLiveStudent(s, file.meta.quarterName));
  const shop = live.filter((s) => s.period !== 6);
  const hall = live.filter((s) => s.period === 6);
  const kpis: { label: string; value: string }[] = [
    { label: "Year", value: `${SOLVAY_YEAR} · ${q.label} · Cycle ${cycle}` },
    { label: "Instructional days", value: `${yp.done} / ${yp.total}` },
    { label: "Tech workers", value: String(shop.length) },
    { label: "Study hall", value: String(hall.length) },
    { label: "Club members", value: String(club.members.length) },
    { label: "Club meetings logged", value: String(Object.keys(club.meetings).length) },
  ];
  const keys = ["tw_period", "tw_grade", "tw_course", "tw_workers", "tw_unit", "tw_prompt", "tw_stem", "tw_3", "tw_2", "tw_1", "tw_xp", ...EXTRA_KEYS];
  const labels = ["Period", "Grade", "Course", "Workers", "Unit", "Driving question", "STEM", "Days 3", "Days 2", "Days 1", "XP", ...EXTRA_LABELS];
  const rows = bells.map((b) => {
    const kids = live.filter((s) => s.period === b.period);
    const agenda = agendaFor(file, b.period);
    const n = kids.reduce((acc, s) => {
      const c = countsOf(s);
      acc[3] += c["3"] ?? 0;
      acc[2] += c["2"] ?? 0;
      acc[1] += c["1"] ?? 0;
      acc.xp += skillXp(file, s.id);
      return acc;
    }, { 3: 0, 2: 0, 1: 0, xp: 0 });
    const course = file.meta.sections?.find((x) => x.period === b.period)?.course ?? "";
    return padExtras(
      [b.period, b.grade, course, kids.length, agenda.title, agenda.project?.prompt ?? "", (agenda.project?.stem ?? []).join(""), n[3], n[2], n[1], n.xp],
      keys.length - EXTRA_N,
    );
  });
  return { name: "YEAR", kind: "kpis", banner: "Shop-wide mini dashboard · aliases only", kpis, keys, labels, locked: keys.length - EXTRA_N, rows };
}

function clubSheet(file: EconomyFile, club: ClubFile): BookSheet {
  const meetings = Object.values(club.meetings).sort((a, b) => a.date.localeCompare(b.date));
  const last = meetings.at(-1);
  const stationN = Object.fromEntries(CLUB_STATIONS.map((s) => [s.id, club.members.filter((m) => m.station === s.id).length]));
  const kpis = [
    { label: "Members", value: String(club.members.length) },
    { label: "Meetings", value: String(meetings.length) },
    { label: "Usual day", value: (club.weekdays ?? [2]).map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ") },
    { label: "Last meeting", value: last?.date ?? "—" },
    { label: "Stations", value: CLUB_STATIONS.map((s) => `${s.label} ${stationN[s.id] ?? 0}`).join(" · ") },
  ];
  const keys = ["tw_club_id", "tw_name", "tw_station", "tw_dismiss", "tw_student", "tw_alias", "tw_meetings", ...EXTRA_KEYS];
  const labels = ["Club id (locked)", "Sign-in name", "Station", "Dismiss", "Shop ID", "Alias", "Meetings in", ...EXTRA_LABELS];
  const rows = club.members.map((m) => {
    const alias = m.studentId ? file.students.find((s) => s.id === m.studentId)?.first ?? "" : "";
    const n = meetings.filter((meet) => meet.rows.some((r) => r.id === m.id && r.in)).length;
    return padExtras([m.id, m.name, m.station, m.dismiss, m.studentId ?? "", alias, n], keys.length - EXTRA_N);
  });
  return {
    name: "CLUB",
    kind: "kpis",
    banner: "Technology Club · sign-in names · aliases if matched · not class effort",
    kpis,
    keys,
    labels,
    locked: keys.length - EXTRA_N,
    rows,
    note: club.members.length ? undefined : "No club members yet. Sign-ins land here on the next export.",
  };
}

function unitsSheet(file: EconomyFile): BookSheet {
  const list = projectsOf(file);
  const keys = ["tw_unit_id", "tw_title", "tw_kind", "tw_grades", "tw_prompt", "tw_stem", "tw_skills", "tw_start", "tw_end", "tw_expect", ...EXTRA_KEYS];
  const labels = ["Unit id (locked)", "Title", "Kind", "Grades", "Driving question", "STEM", "Skills", "Start", "End", "Activity expect", ...EXTRA_LABELS];
  const rows = list.map((p) =>
    padExtras(
      [
        p.id,
        p.title,
        p.kind ?? "build",
        p.grades.join(", "),
        p.prompt ?? "",
        (p.stem ?? []).join(""),
        p.skills.join(", "),
        p.start ?? "",
        p.end ?? "",
        (p.activities ?? []).map((a) => `${a.name}:${a.expect ?? 3}`).join("; "),
      ],
      keys.length - EXTRA_N,
    ),
  );
  return { name: "UNITS", kind: "table", banner: "STEM units · driving question + S/T/E/M · not a second MST score", keys, labels, locked: keys.length - EXTRA_N, rows };
}

function stemSheet(): BookSheet {
  const keys = ["tw_skill", "tw_name", "tw_family", "tw_stem", "tw_1", "tw_2", "tw_3", "tw_4"];
  const labels = ["Skill id (locked)", "Name", "Family", "STEM", "1 Beginning", "2 Developing", "3 Proficient", "4 Distinguished"];
  const rows = ALL_TRACK.map((s) => {
    const ladder = stemsOf(s.id);
    return [s.id, s.name, s.family, stemLettersOf(s.id).join(""), ladder[0]?.text ?? "", ladder[1]?.text ?? "", ladder[2]?.text ?? "", ladder[3]?.text ?? ""];
  });
  return { name: "STEM", kind: "table", banner: "Observable 1–4 sentences. Watch stores these. NY Tech (S1–S7) stays on the desk.", keys, labels, locked: 8, rows };
}

function skillsSheet(file: EconomyFile): BookSheet {
  const keys = ["tw_id", "tw_alias", "tw_period", "tw_skill", "tw_n", "tw_stem", "tw_date", "tw_source", "tw_unit", ...EXTRA_KEYS];
  const labels = ["Shop ID (locked)", "Alias", "Period", "Skill", "1–4", "Evidence stem", "Date", "Source", "Unit", ...EXTRA_LABELS];
  const rows: BookCell[][] = [];
  for (const s of file.students) {
    const log = [...(s.skillLog ?? [])];
    const seen = new Set<string>();
    for (const row of log) {
      if (!row.n) continue;
      seen.add(row.skillId);
      rows.push(
        padExtras(
          [s.id, s.first, s.period, row.skillId, row.n, row.stem || stemForScore(s, row.skillId), row.date, row.source ?? "", row.projectId ?? ""],
          keys.length - EXTRA_N,
        ),
      );
    }
    for (const sk of skillsOf(file)) {
      const n = skillScore(s, sk.id);
      if (!n || seen.has(sk.id)) continue;
      rows.push(padExtras([s.id, s.first, s.period, sk.id, n, stemForScore(s, sk.id), "", "", ""], keys.length - EXTRA_N));
    }
  }
  return { name: "SKILLS", kind: "table", banner: "One row per mark. Stem is the sentence you saw.", keys, labels, locked: keys.length - EXTRA_N, rows };
}

function yearMarksSheet(file: EconomyFile): BookSheet {
  const keys = ["tw_id", "tw_alias", "tw_period", "tw_crew", ...CYCLE_KEYS, ...EXTRA_KEYS];
  const labels = ["Shop ID (locked)", "Alias", "Period", "Crew", ...CYCLE_KEYS, ...EXTRA_LABELS];
  const rows = file.students
    .filter((s) => s.period !== 6)
    .sort((a, b) => a.period - b.period || a.first.localeCompare(b.first))
    .map((s) => {
      const map = cycleSlotMap(s);
      return padExtras([s.id, s.first, s.period, crewNameOf(file, s), ...CYCLE_KEYS.map((k) => map[k] ?? "")], keys.length - EXTRA_N);
    });
  return {
    name: "YEAR MARKS",
    kind: "table",
    banner: "Full year 3/2/1/A/E/P · C1D1 through C8D4 · blank is not a zero",
    keys,
    labels,
    locked: keys.length - EXTRA_N,
    rows,
  };
}

function logSheet(file: EconomyFile): BookSheet {
  const keys = LOG_HEADER.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  const rows = logRows(file, true);
  return { name: "LOG", kind: "table", banner: "Daily effort log · aliases · paste-compatible with the old LOG tab", keys, labels: [...LOG_HEADER], locked: LOG_HEADER.length, rows };
}

function masterSheet(file: EconomyFile): BookSheet {
  const keys = MASTER_HEADER.map((h) => `tw_${h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`);
  const rows = masterRows(file, true);
  return { name: "MASTER", kind: "table", banner: "One row per worker · aliases · wallet vs market · not the parent grade", keys, labels: [...MASTER_HEADER], locked: MASTER_HEADER.length, rows };
}

function ledgerSheet(file: EconomyFile): BookSheet {
  const keys = ["tw_ts", "tw_id", "tw_type", "tw_amount", "tw_date", "tw_note", ...EXTRA_KEYS];
  const labels = ["Timestamp", "Shop ID", "Type", "Amount", "Date", "Note", ...EXTRA_LABELS];
  const rows = (file.meta.ledger ?? []).map((r) => padExtras([r.ts, r.id, r.type, r.amount, r.date, r.note], keys.length - EXTRA_N));
  return { name: "LEDGER", kind: "table", banner: "Pay events · not the skill grade", keys, labels, locked: keys.length - EXTRA_N, rows };
}

function vaultSheet(file: EconomyFile): BookSheet {
  const keys = ["tw_id", "tw_alias", "tw_legal_last", "tw_legal_first", "tw_period", "tw_iep", "tw_504", "tw_ell", "tw_dhh", "tw_extended", "tw_quiet", ...EXTRA_KEYS];
  const labels = ["Shop ID (locked)", "Alias", "Legal last", "Legal first", "Period", "IEP", "504", "ELL", "DHH", "Extended time", "Quiet notes", ...EXTRA_LABELS];
  const rows = file.students
    .slice()
    .sort((a, b) => a.period - b.period || legalLastOf(a).localeCompare(legalLastOf(b)))
    .map((s) =>
      padExtras(
        [
          s.id,
          s.first,
          legalLastOf(s),
          legalFirstOf(s),
          s.period,
          s.flags?.iep ? "Y" : "",
          s.flags?.plan504 ? "Y" : "",
          s.flags?.ell ? "Y" : "",
          s.flags?.dhh ? "Y" : "",
          s.flags?.extendedTime ? "Y" : "",
          s.quietNotes ?? "",
        ],
        keys.length - EXTRA_N,
      ),
    );
  return {
    name: "VAULT",
    kind: "table",
    banner: "FERPA · legal names · do not share · do not project",
    warn: true,
    keys,
    labels,
    locked: keys.length - EXTRA_N,
    rows,
  };
}

function calendarSheet(): BookSheet {
  const keys = ["tw_date", "tw_cycle", "tw_slot", "tw_school", "tw_note"];
  const labels = ["Date (locked)", "Cycle", "Slot", "School", "Note"];
  const start = cycleRange(1).start;
  const rows: BookCell[][] = [];
  const days = schoolDays();
  const first = days[0]?.date ?? start;
  const last = days.at(-1)?.date ?? first;
  for (let t = Date.parse(`${first}T12:00:00`); t <= Date.parse(`${last}T12:00:00`); t += 86400000) {
    const iso = new Date(t).toISOString().slice(0, 10);
    const school = isSchoolDay(iso);
    const slot = daySlot(iso);
    rows.push([iso, school ? cycleNow(iso) : "", slot.label ?? "", school ? "Y" : "", reason(iso) ?? ""]);
  }
  return { name: "CALENDAR", kind: "table", banner: `${SOLVAY_YEAR} instructional calendar · ${days.length} school days`, keys, labels, locked: 5, rows };
}

function configSheet(file: EconomyFile): BookSheet {
  const codes = file.meta.codes ?? {};
  const rows: BookCell[][] = [
    ["app", APP_VERSION, "Desk version"],
    ["book", String(BOOK_VERSION), "Book contract"],
    ["year", SOLVAY_YEAR, "School year"],
    ["quarter", file.meta.quarterName ?? "Q1", "Live quarter"],
    ["cycle", String(cycleNow(todayIso())), "Live cycle"],
    ...Object.entries(codes).map(([k, v]) => [`code_${k}`, String(v), "Pay for that effort code"]),
    ...MARKING.map((m) => [`mark_${m.id}`, m.end, `${m.label} · ${m.weeks} wk${m.grade ? " · grade" : ""}`]),
    ...bellFor(file).map((b) => [`bell_p${b.period}`, String(b.grade), `Period ${b.period} grade`]),
  ];
  return {
    name: "CONFIG",
    kind: "table",
    banner: "Locked facts the desk needs. Do not rename keys.",
    keys: ["key", "value", "note"],
    labels: ["Key (locked)", "Value", "Note"],
    locked: 3,
    rows,
  };
}

export function buildBook(file: EconomyFile, club: ClubFile): BookSheet[] {
  const desk = ensureProjects(file);
  const cycle = Math.max(1, Math.min(CYCLE_N, desk.meta.config?.currentCycle ?? desk.meta.currentWeek ?? cycleNow(todayIso())));
  const classes = shopBells(desk).map((b) => classSheet(desk, b.period, cycle));
  const hall = classSheet(desk, 6, cycle);
  const core = [
    readmeSheet(),
    yearSheet(desk, club),
    ...classes,
    hall,
    clubSheet(desk, club),
    unitsSheet(desk),
    stemSheet(),
    skillsSheet(desk),
    yearMarksSheet(desk),
    logSheet(desk),
    masterSheet(desk),
    ledgerSheet(desk),
    vaultSheet(desk),
    calendarSheet(),
    configSheet(desk),
  ];
  return [core[0]!, lockSheet(core), ...core.slice(1)];
}

export function bookFileName(when = todayIso()): string {
  return `TechWorks-${SOLVAY_YEAR}-Book-${when}.xlsx`;
}
