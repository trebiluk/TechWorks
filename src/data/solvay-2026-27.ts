/** Solvay UFSD 2026–27. Boxed/shaded = no school for students. Oct 30 is a PreK–8 half day (still school). */

export const SOLVAY_YEAR = "2026-27";
export const FIRST_STUDENT = "2026-09-08";
export const LAST_STUDENT = "2027-06-24";
export const SEMESTER_2 = "2027-02-01";

const RANGES: [string, string][] = [
  ["2026-12-24", "2027-01-01"],
  ["2027-02-15", "2027-02-19"],
  ["2027-04-12", "2027-04-16"],
];

const SINGLES = [
  "2026-09-02",
  "2026-09-07",
  "2026-10-12",
  "2026-11-03",
  "2026-11-11",
  "2026-11-25",
  "2026-11-26",
  "2026-11-27",
  "2027-01-18",
  "2027-01-26",
  "2027-01-27",
  "2027-01-28",
  "2027-01-29",
  "2027-03-09",
  "2027-03-26",
  "2027-05-14",
  "2027-05-31",
  "2027-06-15",
  "2027-06-16",
  "2027-06-17",
  "2027-06-19",
  "2027-06-21",
  "2027-06-22",
  "2027-06-23",
  "2027-06-25",
];

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  for (let t = a.getTime(); t <= b.getTime(); t += 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export const HALF_DAYS = new Set(["2026-10-30"]);

export const NO_SCHOOL = new Set<string>([
  ...SINGLES,
  ...RANGES.flatMap(([a, b]) => daysBetween(a, b)),
]);

export const CLOSED_REASON: Record<string, string> = {
  "2026-09-02": "Staff development",
  "2026-09-07": "Labor Day",
  "2026-10-12": "Columbus / Indigenous Peoples Day",
  "2026-10-30": "Half day PreK–8",
  "2026-11-03": "Staff development",
  "2026-11-11": "Veterans Day",
  "2026-11-25": "Thanksgiving recess",
  "2026-11-26": "Thanksgiving recess",
  "2026-11-27": "Thanksgiving recess",
  "2027-01-18": "Martin Luther King Day",
  "2027-01-26": "Regents",
  "2027-01-27": "Regents",
  "2027-01-28": "Regents",
  "2027-01-29": "Regents",
  "2027-02-01": "Semester 2 begins",
  "2027-03-09": "Staff development",
  "2027-03-26": "Good Friday",
  "2027-05-14": "Staff development",
  "2027-05-31": "Memorial Day",
  "2027-06-18": "Not a Regents day",
  "2027-06-24": "Last day for students",
};

export const SESSION_LABELS = ["S1", "S2", "S3", "S4"] as const;

/** District 5-week checkpoints. Grade only at full quarter (10 / 20 / 30 / 40 wk). */
export const MARKING = [
  { id: "MMP1", label: "MMP1", weeks: 5, end: "2026-10-09", grade: false },
  { id: "MP1", label: "MP1", weeks: 10, end: "2026-11-13", grade: true },
  { id: "MMP2", label: "MMP2", weeks: 15, end: "2026-12-16", grade: false },
  { id: "MP2", label: "MP2", weeks: 20, end: "2027-01-29", grade: true },
  { id: "MMP3", label: "MMP3", weeks: 25, end: "2027-03-12", grade: false },
  { id: "W30", label: "MP3", weeks: 30, end: "2027-04-23", grade: true },
  { id: "W35", label: "MMP4", weeks: 35, end: "2027-05-21", grade: false },
  { id: "W40", label: "MP4", weeks: 40, end: "2027-06-24", grade: true },
] as const;
