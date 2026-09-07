export const DESCRIBE_KEY = "techworks-describe";

export type DescribeCard = {
  title: string;
  purpose: string;
  links: { label: string; href: string }[];
};

const SCHOOLTOOL = "https://cnyric08.schooltool.com/solvay/";
const LUNCH = "https://www.solvayschools.org/districtpage.cfm?pageid=1934";
const DRIVE = "https://drive.google.com/drive/folders/1VkpNrE525UmRrPkOGdhnBY95TKFasF7I";
const SITE = "https://www.solvayschools.org/";

const CARDS: Record<string, DescribeCard> = {
  overview: {
    title: "Dashboard",
    purpose: "Public wall. Rankings use skill XP first, then wallet. Aliases only.",
    links: [{ label: "Help", href: "#help" }, { label: "District", href: SITE }],
  },
  week: {
    title: "Week",
    purpose: "Every worker this cycle, morning or afternoon. SUB days print SUB.",
    links: [{ label: "Help", href: "#help" }],
  },
  year: {
    title: "Year",
    purpose: "Four Tech sessions in the school year. Study hall is year-long.",
    links: [{ label: "Calendar", href: DRIVE }, { label: "Help", href: "#help" }],
  },
  data: {
    title: "Data",
    purpose: "Charts and the Sheets paste (LOG / MASTER / Ledger). Aliases only.",
    links: [{ label: "Help", href: "#help" }],
  },
  store: {
    title: "Store",
    purpose: "Catalog. Purchases debit the wallet only.",
    links: [{ label: "Help", href: "#help" }],
  },
  crew: {
    title: "Crew",
    purpose: "Live period only. 3 / 2 / 1 or Absent, Excused, Personal.",
    links: [{ label: "Help", href: "#help" }],
  },
  score: {
    title: "Desk",
    purpose: "Verify marks, invest, cleanup, and pay. Attendance is SchoolTool.",
    links: [{ label: "SchoolTool", href: SCHOOLTOOL }, { label: "Help", href: "#help" }],
  },
  schedule: {
    title: "Bells",
    purpose: "Delay, A/B, and lunch. The clock drives cleanup.",
    links: [{ label: "Menu", href: LUNCH }, { label: "SchoolTool", href: SCHOOLTOOL }],
  },
  config: {
    title: "Admin",
    purpose: "Roster, goals, store, and modules. Not the public wall.",
    links: [{ label: "Help", href: "#help" }],
  },
  wallet: {
    title: "Stocks",
    purpose: "Optional market. Rankings on the wall ignore this.",
    links: [{ label: "Help", href: "#help" }],
  },
  portal: {
    title: "Portal",
    purpose: "Off by default. FERPA view is the wall.",
    links: [{ label: "Help", href: "#help" }],
  },
  skills: {
    title: "Learn",
    purpose: "Evaluate = Score pad + grade book. Skills and projects sit next to it. XP first.",
    links: [{ label: "Help", href: "#help" }, { label: "SchoolTool", href: SCHOOLTOOL }],
  },
  studyhall: {
    title: "Study Hall",
    purpose: "P6 pad. Productive or peaceful. Helper of the week. Not Tech pay.",
    links: [{ label: "Help", href: "#help" }],
  },
  club: {
    title: "Tech Club",
    purpose: "After 10th. Calendar by week. Sign in, stations, late bus, 3:00 cleanup. Not class XP.",
    links: [{ label: "Help", href: "#help" }],
  },
  clubwall: {
    title: "Club wall",
    purpose: "Projector for club: stations and late-bus names. Aliases only.",
    links: [{ label: "Help", href: "#help" }],
  },
  hallwall: {
    title: "Hall wall",
    purpose: "Study hall projector. Open any time from the menu, P6 on the strip, or See wall.",
    links: [{ label: "Help", href: "#help" }],
  },
  projects: {
    title: "Projects",
    purpose: "Activities + plan book. Today’s activity hits the dashboard and the gradebook.",
    links: [{ label: "Help", href: "#help" }],
  },
  admin: {
    title: "Admin",
    purpose: "Teacher home. Learn holds Evaluate. Lock returns the wall.",
    links: [{ label: "Help", href: "#help" }],
  },
  grades: {
    title: "Evaluate",
    purpose: "Score pad and the book. Blank is not a zero. CSV for Classroom.",
    links: [{ label: "Help", href: "#help" }],
  },
};

export function describeCard(view: string, panel?: string): DescribeCard {
  if (view === "score" && panel && CARDS[panel]) return CARDS[panel];
  return CARDS[view] ?? CARDS.overview;
}

export function storedDescribe(): boolean {
  try {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(DESCRIBE_KEY) === "1";
  } catch {
    return false;
  }
}

export function commitDescribe(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DESCRIBE_KEY, on ? "1" : "0");
}
