import { APP_VERSION } from "@/lib/version";
import { COPYRIGHT_LONG } from "@/lib/copy";

export type HelpArticle = {
  id: string;
  category: string;
  title: string;
  tags: string[];
  body: string;
};

export const HELP_CATEGORIES = [
  "Start",
  "Dashboard",
  "Admin",
  "Crew",
  "Score",
  "Skills",
  "Grades",
  "Stocks",
  "Money",
  "Schedule",
  "Study Hall",
  "Club",
  "Profiles",
  "Privacy",
  "Export",
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "copyright",
    category: "Start",
    title: "Copyright",
    tags: ["copyright", "license", "kulibert"],
    body: COPYRIGHT_LONG,
  },
  {
    id: "admin-home",
    category: "Admin",
    title: "Unlock is Admin",
    tags: ["admin", "pin", "lock", "score", "unlock"],
    body: "Lock stays top-right. Unlock (PIN) opens Admin — Today, Class, Games, System. Score is the clipboard. Settings is Look, Day, Roster, Money, Skills, Modules. Lock returns the projector to the wall. Kids never see Admin.",
  },
  {
    id: "pins",
    category: "Start",
    title: "PINs and who can tap what",
    tags: ["pin", "1111", "2222", "lock", "unlock", "teacher", "crew"],
    body: "Teacher PIN 1111 unlocks Desk, scoring edits, Store, bonuses, Skills edit, roster import, and legal names on profiles. Crew override PIN 2222 opens other periods on the crew pad. Worker portal PIN 2627 (Settings). Locked chrome: Board family, Crew, Stocks, Skills (view), Store (browse), Help. Embed ?embed=1 is Board only.",
  },
  {
    id: "nav",
    category: "Start",
    title: "Menu map",
    tags: ["menu", "dashboard", "crew", "stocks", "skills", "desk", "data"],
    body: "Icons: Board, Crew, Skills, Stocks, Desk (PIN). ⋯ More = Weekly, Yearly, Data, Store, Portal, Grades, Schedule, Config, Settings, Save, Export, Tips, Help. Board family strip: Board / Week / Year / Data. Active icon shows its word. Store is More, not a sixth icon.",
  },
  {
    id: "rank",
    category: "Dashboard",
    title: "Skills board vs Perks board",
    tags: ["rank", "xp", "perks", "wallet", "leaderboard"],
    body: "The wall has two boards. Skills (default) ranks by workshop XP. Perks ranks by wallet $. Stocks are a separate game on the Stocks tab and do not level anyone. Period cards show top 3; chevron expands the whole class. School list is top 5, also expandable.",
  },
  {
    id: "dash-public",
    category: "Dashboard",
    title: "Projector / Google Site",
    tags: ["embed", "google site", "iframe", "overview", "cleanup"],
    body: "Settings → Show embed copies an iframe with ?embed=1. That load is Dashboard only: aliases and XP or perks. Coral CLEANUP TIME in the last 5 minutes of a live period. No Crew, no Desk, no last names, no IEP.",
  },
  {
    id: "crew-pad",
    category: "Crew",
    title: "Crew leader pad",
    tags: ["crew", "3", "2", "1", "absent", "excused", "personal", "invest"],
    body: "Teal screen. Only the live period unless you enter 2222. 2×2 kid cells: 3 / 2 / 1 and ABSENT / EXCUSED / PERSONAL. INVEST? only after a 3/2/1. Faces and notes do not change pay. A sub never uses this pad.",
  },
  {
    id: "effort",
    category: "Score",
    title: "Effort vs money",
    tags: ["effort", "3", "2", "1", "grade", "pay"],
    body: "Crew effort is only 3, 2, or 1. A / E / P are pay codes, not effort. Store, personal-day docks, and invest do not change the effort average. Pay: 3=$25, 2=$20, 1=$15, A=$0, E=$0, P=−$25. Cleanup miss is −$10 on the wallet only.",
  },
  {
    id: "score-desk",
    category: "Score",
    title: "Teacher Verify / Score",
    tags: ["score", "verify", "bonus", "deduct", "clutch", "sub", "assist"],
    body: "Red ring on fields = you are editing. Date, A/B, cycle day, lunch, SchoolTool + ST. Daily goal → Observed → Happened. Period chips show crews scored. Dashboard period tap opens this class.",
  },
  {
    id: "schooltool",
    category: "Score",
    title: "Attendance is SchoolTool",
    tags: ["schooltool", "attendance", "p1", "8:15"],
    body: "Attendance lives in SchoolTool, not here. Dashboard shows a dashed SCHOOLTOOL OPEN banner until you tap ST in. After 8:15 (or the delay attend-by) it pulses red so the class can remind you. The wall beeps during P1. Link opens SchoolTool. Desk ST chip still works.",
  },
  {
    id: "watch",
    category: "Skills",
    title: "Watch one skill",
    tags: ["watch", "emerging", "practicing", "applying", "e", "p", "a"],
    body: "Watch one skill that matches today’s daily goal. Same crew order as Desk. E needs a demo. P works with a check-in. A can help a classmate. Blank is not a zero. Other skill is one extra tap. Conference (PIN) is the full skill grid. Standard 5 is a separate grid (S1–S7, scores 1–4) and is not pay.",
  },
  {
    id: "mst",
    category: "Skills",
    title: "Standard 5",
    tags: ["mst", "standard 5", "s1", "s2", "design", "tools", "1-4"],
    body: "Skills → Standard 5. NY MST Standard 5 Technology. Seven skills S1–S7. Scores 1 Beginning, 2 Developing, 3 Proficient, 4 Advanced. One score per student × project × skill. Export CSV. This is not wallet and not the parent grade until you say so.",
  },
  {
    id: "projects",
    category: "Skills",
    title: "Projects",
    tags: ["project", "agenda", "activity", "plan book", "cycle", "gradebook"],
    body: "Learn → Projects. Each project has Activities (Brainstorming, Technical Drawing, Modeling, Finishing, Presentation, Reflection). The plan book maps Cycle × Day 1–4 to one activity — a 4-day cycle can be four different days. Dashboard shows today’s activity. Gradebook columns are those activities. Skills stay 1–4 XP. PIN to edit.",
  },
  {
    id: "studyhall",
    category: "Score",
    title: "Study Hall pad",
    tags: ["study hall", "p6", "a day", "b day", "cleanup"],
    body: "Admin → Hall Mgr, or tap P6 on the wall (unlocked). Phone: Hall next to Admin. Check-in pad (HERE / NURSE / …). Tap a name for the drawer (ready, on-task, note). Wall is projector-only. Habits ≠ Tech XP. Data → Mix is the only building rank.",
  },
  {
    id: "club",
    category: "Club",
    title: "Technology Club",
    tags: ["club", "late bus", "minecraft", "robotics", "workshop", "computer", "3:00", "minutes"],
    body: "Admin → Club. Calendar (top): tap Mon–Fri for the usual meeting day (Tuesday on). This week: CLUB / SKIP / OFF per day, overlay 1–8, a note for snow / party / logo deadline. Half days stay off unless you turn that date on. Sign in (first name + last initial), pick Minecraft / Robotics / Workshop / Computer Time, mark late bus / pickup / walker. Cleanup is 3:00, door 3:05. Dashboard shows Tech Club Today / now / Next club — tap it to open the pad. Club does not touch class XP or rankings. Wall is the projector view.",
  },
  {
    id: "version",
    category: "Start",
    title: "Version",
    tags: ["version", "chip", "footer", "techworks"],
    body: `The floating chip is v${APP_VERSION}. Same string as About, Help, and the changelog header. Product name TECHWORKS™. Workshop zips labeled 1.0 or 2.1.0 are not live.`,
  },
  {
    id: "grades",
    category: "Grades",
    title: "Parent-facing grades",
    tags: ["grades", "report card", "classroom", "export", "participation"],
    body: "More → Grades (PIN). Up to 10 columns: Class participation (from 3/2/1 that cycle) and Skill (from E/P/A). 100 = full, 85 = steady, 70 = starting. Blank = not enough evidence, not a zero. Wallet, stock, store, and personal days are not in the mark. Numbers are calculated; type only to override, then Revert. Assignment names + Classroom CSV. Full report card is on the worker profile.",
  },
  {
    id: "xp",
    category: "Skills",
    title: "XP",
    tags: ["xp", "level", "6"],
    body: "E=1 P=2 A=3 XP. Every 6 XP is the next internal level (max 8). The Dashboard Skills board shows the XP number, not a level name, until you turn on Level labels in Settings. XP never changes wallet, stock, store, or effort.",
  },
  {
    id: "stocks",
    category: "Stocks",
    title: "Stocks are a separate game",
    tags: ["stock", "invest", "djia", "dow", "market", "picks"],
    body: "Crew taps INVEST? after a 3/2/1. You approve on Score (PIN). That day's pay leaves the wallet and becomes principal. Pick 3 of 12 names. DJIA weekly average moves the basket. Rankings on the wall ignore stock on purpose.",
  },
  {
    id: "store-buy",
    category: "Money",
    title: "Store and can't afford",
    tags: ["store", "snacks", "chores", "spend", "wallet", "perks"],
    body: "Perks = wallet. ⋯ More → Store is the catalog. Buy needs PIN. Profile chips also deduct. If the price is bigger than the wallet, the chip is struck. Teacher deducts can still go negative (penalty, not a purchase). The store never changes effort or grades.",
  },
  {
    id: "schedule",
    category: "Schedule",
    title: "Bells, delay, A/B, SUB, lunch",
    tags: ["bell", "delay", "a day", "b day", "sub", "lunch", "snow"],
    body: "Desk → Schedule: Regular / 1-hour / 2-hour / half. A/B chip is the live letter; next school day infers the other. Snow · reset A/B (PIN). SUB voids that date and does not rewind the cycle.",
  },
  {
    id: "cleanup",
    category: "Schedule",
    title: "Cleanup time",
    tags: ["cleanup", "coral", "bell", "5 minutes"],
    body: "Last minutes of a live period: a coral full-screen CLEANUP card replaces the wall. Workshop jobs vs classroom tidy. Study hall has its own list. Teacher (unlocked) taps a name for +$5 wallet when they catch extra cleanup in any space (max 2/day). Not XP. Desk button hides the card until the next period. Cleanup miss is still −$10 wallet, not effort.",
  },
  {
    id: "profile",
    category: "Profiles",
    title: "Worker profile",
    tags: ["profile", "alias", "iep", "504"],
    body: "Open from Dashboard, Data, Skills, or Find worker. Public handle + alias. Arrow reveals legal name, course, IEP/504 (read-only from roster). Store and money steps need PIN.",
  },
  {
    id: "portal",
    category: "Privacy",
    title: "Worker portal PIN",
    tags: ["portal", "student", "pin", "2627", "class id"],
    body: "Students open the class with a class PIN (default 2627, change in Settings). Then they tap their alias. The badge shows XP, perks, week codes, and a Class ID — not a legal name. Google Site page: same URL with ?portal=1. This is a privacy gate and a bit of theater: names were already off the wall.",
  },
  {
    id: "ferpa",
    category: "Privacy",
    title: "FERPA / what gets published",
    tags: ["ferpa", "alias", "names", "iep", "export"],
    body: "Live export is encoded and has no last names. Names vault is a separate private download (alias, last, period, IEP/504). IEP is a blue deco dot and 504 orange, only inside Show full info, mixed with fake dots. Google Site embed never gets the vault.",
  },
  {
    id: "export",
    category: "Export",
    title: "Save, live export, Friday",
    tags: ["save", "export", "friday", "vault"],
    body: "Save stores the desk on this device. Export downloads techworks-LIVE.enc.txt (codes, not names). Names vault is Settings → Export names vault. Export at least once each live period — a banner sits on the desk until you do. Friday still asks if you have not exported today.",
  },
  {
    id: "year",
    category: "Schedule",
    title: "Yearly / sessions",
    tags: ["year", "session", "quarter", "archive", "study hall"],
    body: "Four Tech sessions (S1–S4), about 8 weeks each. End session archives XP and $ for that cohort. Names stay so you can load the next roster. Study hall (P6) is year-long. You grade at the full quarter (MP), not at MMP checkpoints. Year $ is cohort vs cohort, not one student’s career.",
  },
  {
    id: "tips",
    category: "Start",
    title: "Describe mode / tips",
    tags: ["tips", "describe", "lightbulb", "links"],
    body: "Lightbulb in the top bar, or Settings → Describe mode. When on, a strip under the header names the screen, why it exists, a tip, and links (SchoolTool, lunch, Drive, Help). Hidden when off so the projector stays clean.",
  },
  {
    id: "layout",
    category: "Start",
    title: "Web vs Mobile",
    tags: ["web", "mobile", "ipad", "projector", "layout"],
    body: "Settings → Screen, or the monitor / phone buttons in the top bar. Web = projector wall (wide period grid). Mobile = iPad desk (one column, bigger taps). First visit guesses from screen size. Add ?layout=mobile or ?layout=web to a Google Site URL to force it.",
  },
  {
    id: "themes",
    category: "Start",
    title: "Stylesheets",
    tags: ["theme", "bearcat", "night", "holiday", "contrast"],
    body: "Admin → Look (PIN). Default is THEME-PURPLE-BLUE: cyan #22D3EE CTA, royal #3B82F6, indigo, violet. Paw orange is Bearcat only. Paper and Projector stay options. Cleanup coral. Due red.",
  },
  {
    id: "legal",
    category: "Start",
    title: "Copyright and trademark",
    tags: ["copyright", "trademark", "kulibert", "license", "legal"],
    body: "© 2026 Richard Kulibert. All rights reserved. TECHWORKS™ is a trademark of Richard Kulibert. You may use this copy in your own classroom. Do not sell, sublicense, or republish the source without written permission. ™ is a claim of trademark; ® would require a registration. Hover the version chip or the logo for the notice.",
  },
];

export function helpMarkdown(): string {
  const groups = HELP_CATEGORIES.map((cat) => {
    const bits = HELP_ARTICLES.filter((a) => a.category === cat)
      .map((a) => `### ${a.title}\n\n${a.body}`)
      .join("\n\n");
    return `## ${cat}\n\n${bits}`;
  }).join("\n\n");
  return `# TechWorks Help · v${APP_VERSION}\n\n${COPYRIGHT_LONG}\n\nSearch in the app Help panel. Categories below.\n\n${groups}\n`;
}

export function searchHelp(q: string): HelpArticle[] {
  const n = q.trim().toLowerCase();
  if (!n) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((a) => {
    const blob = `${a.category} ${a.title} ${a.body} ${a.tags.join(" ")}`.toLowerCase();
    return n.split(/\s+/).every((w) => blob.includes(w));
  });
}
