import { APP_VERSION } from "@/lib/version";
import { COPYRIGHT_LONG } from "@/lib/copy";

export type HelpArticle = {
  id: string;
  category: string;
  title: string;
  tags: string[];
  body: string;
  wall?: boolean;
};

export const HELP_JUMPS = [
  { q: "web", label: "Web" },
  { q: "theme", label: "Theme" },
  { q: "store", label: "Store" },
  { q: "study hall", label: "Study Hall" },
  { q: "club", label: "Club" },
  { q: "cleanup", label: "Cleanup" },
  { q: "settings", label: "Settings" },
  { q: "PIN", label: "PIN" },
  { q: "score", label: "Score" },
  { q: "jobs", label: "Jobs" },
  { q: "translate", label: "Translate" },
  { q: "chips", label: "Chips" },
] as const;

const HELP_SYNONYMS: Record<string, string[]> = {
  stylesheet: ["theme"],
  stylesheets: ["theme"],
  dice: ["roll", "theme"],
  holiday: ["theme", "holly"],
  holidays: ["theme", "holly"],
  cog: ["settings"],
  globe: ["translate", "language"],
  rewards: ["store"],
  look: ["theme", "wall"],
  looks: ["theme", "wall"],
};

export function highlightPieces(text: string, q: string): { t: string; hit: boolean }[] {
  const words = q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (!words.length) return [{ t: text, hit: false }];
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${esc.join("|")})`, "ig");
  const out: { t: string; hit: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: text.slice(last, i), hit: false });
    out.push({ t: m[0], hit: true });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), hit: false });
  return out.length ? out : [{ t: text, hit: false }];
}

export const HELP_CATEGORIES = [
  "Welcome",
  "Wall",
  "Start",
  "Roles",
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
  "Data privacy",
  "Export",
] as const;

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "welcome-what",
    category: "Welcome",
    title: "What is TechWorks?",
    tags: ["welcome", "intro", "what", "techworks", "class", "kids", "family"],
    wall: true,
    body: "TechWorks is Mr. Kulibert’s shop class. You work in a small crew. You practice real skills: measure, cut, finish, share. Gold XP means you got better at the work. That is the point. Class cash is a perk game. It is not your grade. Names on the wall are shop aliases, not legal names.",
  },
  {
    id: "welcome-day",
    category: "Welcome",
    title: "A class period in four beats",
    tags: ["welcome", "enter", "listen", "work", "cleanup", "berty"],
    wall: true,
    body: "1) Enter and sit with your crew. 2) Listen to the day’s goal — ask a real question. 3) Crew work time: build, draw, sand, plan. 4) Cleanup: tools, scraps, seats. When the board turns coral, that last step is now. Berty points at the jobs. Caught helping extra can earn a perk — not XP.",
  },
  {
    id: "welcome-numbers",
    category: "Welcome",
    title: "What the numbers mean",
    tags: ["welcome", "xp", "gold", "cash", "grade", "3", "2", "1"],
    wall: true,
    body: "Gold = skill XP. Getting better at the craft. $ = class perks, a game you can spend in the store or on prints. Crew leads tap 3 (on the job), 2 (needs a nudge), or 1 (not with the crew). Your family report is the project grade in plain words. Wallet and Lucky Bench never go on that sheet.",
  },
  {
    id: "welcome-people",
    category: "Welcome",
    title: "Who does what",
    tags: ["welcome", "crew", "teacher", "family"],
    wall: true,
    body: "You: build, clean, help a crewmate. Crew lead: scores the team 3 / 2 / 1 for this period only. Teacher: the real grades, the skills, the store. Family: open a name → Family for the report card. Nobody’s legal name belongs on the projector.",
  },
  {
    id: "welcome-help",
    category: "Welcome",
    title: "Who this Help is for",
    tags: ["help", "family", "crew", "teacher", "sub", "student", "search"],
    wall: true,
    body: "Students: Welcome and Wall. Crew leads: Roles → Crew lead. Families: tap an alias → Family, or type Family in the search box. Teacher: Start, Teach, Deck, Score, Admin. Sub: do not open this app. Type a word in the search box. Teachers can Download help file for the whole book.",
  },
  {
    id: "wall-read",
    category: "Wall",
    title: "How to read this board",
    tags: ["wall", "projector", "xp", "alias", "cleanup"],
    wall: true,
    body: "This is the class wall. Names here are shop aliases, not legal names. Gold numbers are skill XP. $ is classroom perks, a game. The ring is minutes left. Coral means cleanup — tools away, seats, floor.",
  },
  {
    id: "wall-job",
    category: "Wall",
    title: "Job card on the wall",
    tags: ["wall", "question", "rules", "today", "done", "look-for", "stem", "projector"],
    wall: true,
    body: "The Goals plate is the job, not the filing system. Five lines: the driving question, the rules (One tool at a time. Goggles on.), today, done, and look-for a 3. Tap Goggles (PIN) before tools open. One STEM sentence sits under the question — not SCIENCE · TECHNOLOGY · ENGINEERING · MATH. Lucky Bench, pizza, polls, and Top 3 stay off until someone has a score. Edit the words in Learn → Projects. Empty browsers say this desk lives on the shop PC.",
  },
  {
    id: "wall-menu",
    category: "Wall",
    title: "Menu (Dash · Learn · Crew · Admin)",
    tags: ["menu", "nav", "tabs", "classic"],
    wall: true,
    body: "Bottom dock: Dash · Learn · Crew · Rosters · Admin. Dash strip: Wall · Teach · Deck · Week · Club · Hall. Teach is the lesson. Deck plays that lesson. After class, Wall is the projector. Top chrome: Lock, Cog (Settings), Help, Web (family), language globe, NOW clock. Arrange wall / Arrange plates live on those pages.",
  },
  {
    id: "wall-polls",
    category: "Wall",
    title: "Live polls",
    tags: ["poll", "vote", "exit ticket", "crew"],
    wall: true,
    body: "Teacher opens a poll (Yes/No, A–D, 1–4, emoji, or custom). The wall shows bars only — no names. Crew pad is where each worker taps. Close & save keeps a history. Polls never change grades, XP, or cash.",
  },
  {
    id: "wall-xp",
    category: "Wall",
    title: "XP vs perks vs stock",
    tags: ["xp", "perks", "stock", "grade"],
    wall: true,
    body: "XP comes from workshop skills (Beginning → Distinguished). Perks $ come from showing up and doing the job, minus the store. Stock is optional invest — a separate game. The family report card is the project grade, not your wallet.",
  },
  {
    id: "wall-effort",
    category: "Wall",
    title: "3, 2, 1 — what crew leads tap",
    tags: ["3", "2", "1", "crew", "effort"],
    wall: true,
    body: "3 = working the job. 2 = needs a nudge. 1 = not with the crew. Absent / Excused / Personal are for not being here — they are not a skill grade. A 4 (Distinguished) is a teacher mark, not a crew-lead tap.",
  },
  {
    id: "wall-week",
    category: "Wall",
    title: "Week race",
    tags: ["week", "race", "crew", "class", "yesterday", "project", "activity"],
    wall: true,
    body: "Dash → Week. Classes and crews race on earned vs possible as of yesterday — today is still being scored, so it stays off the board. A 3 is a full share. A/E do not count against you. The gold class is shop lead; the gold crew is first in the shop. Hold it. Chase rows say how far back you are. Today’s strip is project, activity, and the Classroom assignment (project · cycle), plus what to look for (usually a 3). Classes and Roster still list every alias.",
  },
  {
    id: "wall-skills",
    category: "Wall",
    title: "Skill words",
    tags: ["beginning", "developing", "proficient", "distinguished"],
    wall: true,
    body: "1 Beginning — needs a demo. 2 Developing — can do it with a check-in. 3 Proficient — independent, meets the standard. 4 Distinguished — can teach a crewmate.",
  },
  {
    id: "wall-family",
    category: "Wall",
    title: "Family report",
    tags: ["parent", "family", "report", "grade"],
    wall: true,
    body: "Open a worker (tap a name) → Family. One project mark. Skills in plain words. Time in class is listed but not averaged into the grade. Perks and stock stay off that sheet.",
  },
  {
    id: "wall-berty",
    category: "Wall",
    title: "BertyBot",
    tags: ["berty", "pose", "cleanup", "teach"],
    wall: true,
    body: "Berty is the workshop mascot. On the wall he takes the hour corner. He waves at ENTER, thinks at LISTEN, stands for CREW WORK, points at CLEAN UP and between classes, and celebrates SHARE / class reward. HAND LAW: both claws stay on every pose — Bare means no tool, not no hands. Color chips paint the metal (each Berty gets its own paint so two on screen cannot steal cyan). Cleanup and passing always show him. Open Berty from the version chip.",
  },
  {
    id: "wall-looks",
    category: "Wall",
    title: "Wall looks",
    tags: ["theme", "scale", "preset", "projector", "arrange", "look", "holiday", "dice"],
    wall: true,
    body: "Show wall fills Hour as a 2×2. Empty cells keep Enter / Listen / Crew work / Clean up — no empty Now slivers, no second Do this now plate. Looks change the wall paint. Oswego stays hunter + sunset gold. Shop wall is the usual navy. Back row is bigger type so the back of the room can read it. Holiday looks are for fun days. Your scores stay. Gold is still XP. Coral is still cleanup. The top buttons (Help, Lock, Web) still work.",
  },
  {
    id: "wall-jobs",
    category: "Wall",
    title: "Jobs on the wall",
    tags: ["jobs", "agenda", "cleanup", "need", "goggles", "do this"],
    wall: true,
    body: "Two job lists. Agenda (Do this now) is the hour’s work — Teach writes it, Deck plays it, Wall hangs it. Cleanup jobs are the coral list (workshop tools vs classroom seats). Need (goggles / stock) is a Teach line kids see at Enter. Edit cleanup jobs on Teach (PIN). Extra tidy catch is teacher-only on Teach — not on the student Cleanup wall.",
  },
  {
    id: "dash-teach",
    category: "Dashboard",
    title: "Teach mode",
    tags: ["teach", "lesson", "now", "slots", "objective", "demo"],
    wall: true,
    body: "Dash → Teach. Live board for this period (Job · Guiding Q · Prove · beats, navy plates, cyan LCARS). Gold stays on the Job crown, CLEAN, and Top XP / Top $ race — never a yellow field wash. Green dots + “n of 8 hours set” mean that hour is planned. Tools (PlanIt · Deck · Projector · Hang · Arrange · Print) live in the left Edge Pocket — one thin period row, no right ribbon. Mid-class edits write back. Deck plays TEACH. Projector is the kid wall. No names on Teach.",
  },
  {
    id: "dash-plan",
    category: "Dashboard",
    title: "PlanIt",
    tags: ["plan", "planit", "planbook", "week", "copy", "materials", "homework", "closure", "sub", "objective"],
    body: "Learn → PlanIt is the week timetable. Periods down, days across. Click a block and type Job · Guiding Q · Prove · beats in the hour inspector — that write fills Teach, Wall, and Deck. Teach is the live board (Hang, Top XP / Top $). Tap Week for the full grid. Tap up to three skills — Watch opens on the first. Send this hour copies onto empty cells only. Arrow keys move. Print week.",
  },
  {
    id: "dash-loop",
    category: "Dashboard",
    title: "The class loop",
    tags: ["agenda", "enter", "cleanup", "teach", "wall", "hang", "crew", "bell"],
    body: "Arrive → Teach to run the hour PlanIt wrote. Green dots + “n of 8 hours set” mean that hour is planned. Type Job · Guiding Q · Prove · beats on PlanIt — it is the Wall and the Deck. Paste a Drive or Canva link on Hang — it plays on the Wall under Agenda. See wall is next to Deck. Send this hour on PlanIt copies onto other empty periods or days you pick — never a week blast. Wall hour plate shows Job, Guiding Q, and Prove from that same teachDays row, then Agenda 2×2 beats. Enter is sit / need / in a minute. Coral Cleanup in the last minutes. After the last bell the Agenda stays. Crew lead PIN: today’s make, last marks, Buy if the catalog has perks.",
  },
  {
    id: "admin-crews",
    category: "Admin",
    title: "Crew manager",
    tags: ["crew", "group", "separate", "roster", "history"],
    body: "Admin → Crews (desk PIN). Size pack first (pairs / 3–4 / tables). Deal even seats the period. Look is name, color, mark, motto, logo — Copy look paints every period. Crown a lead on the card. Tap a worker, tap Here. Each move is dated. Separate rules live on Roster. Never on the wall.",
  },
  {
    id: "admin-backup",
    category: "Admin",
    title: "Do not lose Monday’s roster",
    tags: ["backup", "cloud", "drive", "google", "vault", "roster", "csv", "key"],
    body: "Three copies, not one. 1) This PC is the gradebook (localStorage + a daily snapshot on the device). 2) Records → Cloud: mint a desk key, write it in your planner, Save. That is the shop-PC copy — encrypted, not Google Drive. Same key on the other room. An empty browser will not overwrite a cloud roster. 3) Records → Download Google book, then File → Open in Drive as a Sheet. Also download a JSON desk backup into a private Drive folder. Before you import names: Fake data Off, snapshot, then paste Last, First, Period. The same legal name keeps the alias. PIN is not the cloud key.",
  },
  {
    id: "admin-fake",
    category: "Admin",
    title: "Fake data",
    tags: ["fake", "demo", "messy", "debug", "graph"],
    body: "Admin → Modules → Fake data, then Off / One week / One cycle / Messy cycle. That paints Wall, Week, Year, Score, Crews, Learn, Wallet, Rosters, Cleanup, and Data. Taps on those boards do not write to the saved roster. Gold chip says Fake data · not saved. Off before you import real names. Messy on an empty desk shows a throwaway Forge/Volt shop so you can see every board.",
  },
  {
    id: "roles-teacher",
    category: "Roles",
    title: "Teacher path",
    tags: ["teacher", "workflow", "pin", "export"],
    body: "Wall on. SchoolTool by 8:15 — open the site, then tap I'm in. Goal from the project. Unlock with the PIN you set. After the last crew, Looks good (10s check) then Save, which names the cloud. Nurse stamps time. Cleanup coral. Store / prints / lucky need PIN. Writes: marks, attend, passes, ledger, skills, grades, vault.",
  },
  {
    id: "roles-crew",
    category: "Roles",
    title: "Crew lead path",
    tags: ["crew", "kiosk", "2222", "3", "2", "1"],
    wall: true,
    body: "PIN 2222, this period only unless you need another class. Hi, Team Leader. Tap 3 / 2 / 1 or Absent / Excused / Personal. Optional INVEST? after a 3/2/1. Next crew auto-advances. Our crew: name, mark, and motto — not seats. You cannot touch wallet, bonus, or grades.",
  },
  {
    id: "roles-worker",
    category: "Roles",
    title: "Worker path",
    tags: ["student", "wall", "xp"],
    wall: true,
    body: "Read the wall: gold is XP, $ is perks. Tap your alias for the family sheet (project mark). Coral = cleanup. You don't type money.",
  },
  {
    id: "roles-hall",
    category: "Roles",
    title: "Study hall path",
    tags: ["hall", "nurse", "line leader"],
    body: "HERE or NURSE / LIBRARY / TEACHER (clocked). Line leader is weekly. Productive or peaceful. Hall store is separate. Not Tech effort.",
  },
  {
    id: "roles-club",
    category: "Roles",
    title: "Tech Club path",
    tags: ["club", "check-in"],
    body: "IN once a day = +$10 and +2 XP. Activities on the club board. Never mixes into class effort grades.",
  },
  {
    id: "roles-family",
    category: "Roles",
    title: "Family path",
    tags: ["parent", "family"],
    wall: true,
    body: "Web on the HUD, or ?web=1. Parents, crew leaders, and students enter with the class web code (Settings → Worker portal PIN, default 2627 — not the teacher PIN). Aliases only. Charts are skills in words. Family sheet has the project mark. Wallet and Lucky stay off. Copy link from that page.",
  },
  {
    id: "roles-sub",
    category: "Roles",
    title: "Sub day",
    tags: ["sub", "cycle"],
    body: "A sub never opens this app. You tap SUB. That date is void. The cycle does not rewind. Next class day is the next cycle day. Leave the wall on for the sub: the job card and the hours. No scores.",
  },
  {
    id: "wall-cleanup",
    category: "Wall",
    title: "Cleanup",
    tags: ["cleanup", "coral", "tools", "berty"],
    wall: true,
    body: "Last five minutes: coral screen. One leftover clock. Berty points at jobs. Workshop: tools, scraps, stations. Classroom: seats and aisles. Extra tidy catch is on Teach (PIN), not the student Cleanup wall. Between classes Berty points at ENTER → LISTEN → CREW WORK → CLEAN UP.",
  },
  {
    id: "wall-lang",
    category: "Wall",
    title: "English, Ukrainian, Russian",
    tags: ["language", "translate", "ukrainian", "russian", "english", "globe", "words", "help"],
    wall: true,
    body: "Globe next to Help. This quarter the class languages are English, Ukrainian, and Russian. Pick one. Help and Words switch to grade-6 reading. Shop words (kerf, grit, XP) stay English so you can learn them. Admin → Theme → Language still has Cubano, Arabic, and Farsi if you need them.",
  },
  {
    id: "copyright",
    category: "Start",
    title: "Copyright",
    tags: ["copyright", "license", "kulibert"],
    wall: true,
    body: COPYRIGHT_LONG,
  },
  {
    id: "admin-home",
    category: "Admin",
    title: "Unlock is Admin",
    tags: ["admin", "pin", "lock", "score", "unlock"],
    body: "The cog is Settings — it opens Admin (Today, Day, Records, Crews, Theme). Unlock with the PIN you set. Arrange the projector from Wall → Arrange wall, or Teach → Arrange plates. Kids never see Admin.",
  },
  {
    id: "admin-year",
    category: "Admin",
    title: "Year plan and copy a quarter",
    tags: ["year", "plan", "day", "copy", "quarter", "deck", "projects", "june"],
    body: "Admin → Day. Pick the date. Sub and bells are for that day. Lunch and two wall cards sit next to it. Copy this day onto the next school day, the rest of the quarter, or June. Q1 → Q2 (also Q2 → Q3, Q3 → Q4) copies projects, planned days, and the Deck. Shop defaults (usual bells, cycle, cleanup, A/B, Teach pack) stay folded under that. Passes stay on Admin → Today. Units live on Learn → Projects → Plan.",
  },
  {
    id: "pins",
    category: "Start",
    title: "PINs and who can tap what",
    tags: ["pin", "1111", "2222", "lock", "unlock", "teacher", "crew"],
    body: "Factory desk PIN is 7879 (not printed on the student wall). 1111 is rejected. It unlocks scoring, Store, and roster. Crew override 2222 opens other periods on the crew pad only. Locked chrome: Wall, Teach, Deck, Week, Club, Hall, Learn Words, Help. Embed ?embed=1 is Wall only.",
  },
  {
    id: "nav",
    category: "Start",
    title: "Menu map",
    tags: ["menu", "dashboard", "crew", "stocks", "skills", "desk", "data"],
    body: "Bottom dock: Dash · Learn · Crew · Rosters · Admin (PIN on the last three). Dash strip: Wall · Teach · Deck · Week · Club · Hall. Year and Data sit on Week. Polls sit on Teach and on the wall when a vote is live. Cog is Settings (Admin). Arrange wall is on Wall. Arrange plates is on Teach. Edit slides is on Deck. Dash Club is the projector. Admin Club is the desk.",
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
    body: "Settings → Show embed copies an iframe with ?embed=1. That load is Dashboard only: shop names and XP or perks. Coral CLEANUP TIME in the last 5 minutes of a live period. No Crew, no Desk, no last names.",
    wall: true,
  },
  {
    id: "dash-tools",
    category: "Dashboard",
    title: "Tools on the wall",
    tags: ["timer", "dice", "random", "picker", "ambient"],
    wall: true,
    body: "Admin → Wall. If Tools is hidden, tap Show · Tools. Timer, draw a worker (alias), draw a crew for this period. Ambient Chaos only if that module is on. Names are aliases.",
  },
  {
    id: "crew-pad",
    category: "Crew",
    title: "Crew leader pad",
    tags: ["crew", "3", "2", "1", "absent", "excused", "personal", "invest"],
    body: "Teal screen. Live period only unless you enter 2222. 3 / 2 / 1 and ABSENT / EXCUSED / PERSONAL. INVEST? only after a 3/2/1. Faces and notes do not change pay. A sub never uses this pad. Teacher Score is a different page: name + 3/2/1 on one row.",
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
    body: "Name sits next to 3 / 2 / 1 on one row — tap the alias for the profile. Codes (Abs / Exc / PTO / Nurse) sit on a slim row. More is Assist / Clean / cash. Period chips show crews scored.",
  },
  {
    id: "schooltool",
    category: "Score",
    title: "Attendance is SchoolTool",
    tags: ["schooltool", "attendance", "p1", "8:15"],
    body: "Attendance lives in SchoolTool, not here. Dashboard shows a dashed SCHOOLTOOL OPEN banner until you tap ST in. After 8:15 (or the delay attend-by) it pulses red so the class can remind you. The wall beeps during P1. Link opens SchoolTool. Desk ST chip still works.",
  },
  {
    id: "vocab",
    category: "Skills",
    title: "Word Heat",
    tags: ["vocab", "glossary", "words", "quiz", "blooket", "heat"],
    body: "Learn → Words → Word Heat. Shop vocab from the bank. Projector-size. Keys 1–4. Streak score is this heat, not wallet, not a grade. Review misses at the end. Off is Modules → Word Heat.",
  },
  {
    id: "watch",
    category: "Skills",
    title: "Watch one skill",
    tags: ["watch", "stem", "beginning", "developing", "proficient", "distinguished", "1-4"],
    body: "Watch one skill. PlanIt tags on that hour open first. The four sentences under the title are evidence stems — what you can see. 1 Beginning, 2 Developing, 3 Proficient, 4 Distinguished. Gold ring is the expected mark for today’s activity. A tap stores the stem on the worker (Profile → Skills). Blank is not a zero. Crew and project are notes, not the owner. PIN for Sit-down.",
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
    tags: ["project", "agenda", "activity", "plan book", "cycle", "gradebook", "stem", "driving question", "unit"],
    body: "Learn → Projects parks a multi-day unit. The hour itself is written on PlanIt: Job · Guiding Q · Prove · beats. That write fills Wall and Deck. Print lesson from PlanIt. Floor parks the unit on a period.",
  },
  {
    id: "studyhall",
    category: "Study Hall",
    title: "Study Hall pad",
    tags: ["study hall", "p6", "a day", "b day", "cleanup", "hall"],
    body: "Admin → Hall Mgr, or tap P6 on the wall (unlocked). Phone: Hall next to Admin. Check-in pad (HERE / NURSE / …). Tap a name for the drawer (ready, on-task, note). Dash → Hall is the projector wall (HERE counts). Habits ≠ Tech XP. Data → Mix is the only building rank.",
  },
  {
    id: "studyhall-wall",
    category: "Study Hall",
    title: "Study Hall wall",
    tags: ["hall", "p6", "here", "wall", "study hall"],
    wall: true,
    body: "Dash → Hall is the projector: HERE counts, not Tech XP. P6 on the Wall jumps there when unlocked. Coral cleanup has its own hall list. Store on Hall is separate perks, not class effort.",
  },
  {
    id: "club",
    category: "Club",
    title: "Technology Club",
    tags: ["club", "late bus", "minecraft", "robotics", "workshop", "computer", "3:00", "minutes"],
    body: "Admin → Club. Tap a month day to SET club (usual weekdays still apply). Open that date and pick Talk / Stations / Contest / Workshop. Type the agenda. Brief holds the projector until you tap Work (Release). Then stations, contests, and the activity timer take the wall. Cleanup still 3:00–3:05. Sign in (first name + last initial) pays $10 + 2 XP once that day if the alias matches class — not effort, not the project grade.",
  },
  {
    id: "glossary",
    category: "Skills",
    title: "Shop words",
    tags: ["glossary", "vocabulary", "kerf", "grit", "proficient", "words"],
    wall: true,
    body: "Learn → Words. Search or tap a letter. Categories: Safety, Measure, Tools, Materials, Process, Design, Crew, Grades, Class. Kid definition plus an in-the-shop sentence. STEM, driving question, and evidence stem live here. Project the card. Not a grade.",
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
    body: "More → Grades (PIN). Up to 10 columns: Class participation (from 3/2/1 that cycle) and Skill (from 1–4). Hover a cell for the evidence stem. 100 = full, 85 = steady, 70 = starting. Blank = not enough evidence, not a zero. Wallet, stock, store, and personal days are not in the mark. Numbers are calculated; type only to override, then Revert. Assignment names + Classroom CSV. Full report card is on the worker profile.",
  },
  {
    id: "xp",
    category: "Skills",
    title: "XP",
    tags: ["xp", "level", "6"],
    body: "1–4 on a skill is that many XP. Every 6 XP is the next internal level (max 8). The Dashboard Skills board shows the XP number, not a level name, until you turn on Level labels in Settings. XP never changes wallet, stock, store, or effort.",
  },
  {
    id: "stocks",
    category: "Stocks",
    title: "Stocks are a separate game",
    tags: ["stock", "invest", "djia", "dow", "market", "picks"],
    body: "Crew taps INVEST? after a 3/2/1. You approve on Score (PIN). That day's pay leaves the wallet and becomes principal. Pick 3 of 12 names. DJIA weekly average moves the basket. Rankings on the wall ignore stock on purpose.",
  },
  {
    id: "lucky-bench",
    category: "Money",
    title: "Lucky Bench",
    tags: ["lucky", "die", "raffle", "pot", "gamble", "wallet"],
    body: "Admin → Lucky. PIN. Stake $5 / $10 / $15, roll a d6. 1 bust, 2–3 half back, 4 push, 5 ×1.5, 6 double. About 8% house edge so saving usually beats rolling. 3 rolls a day. Friday pot: $5 ticket, 2/day, you draw. Class cash only — never XP or grades. Off in Modules if you don't want it.",
  },
  {
    id: "store-buy",
    category: "Money",
    title: "Rewards and can't afford",
    tags: ["rewards", "perks", "spend", "wallet", "store"],
    body: "Rewards = wallet perks. Pick the kid, tap the perk. Buy needs PIN. If the price is bigger than the wallet, the card is dim. Teacher deducts can still go negative (penalty, not a purchase). Rewards never change effort or grades. 3D pieces are Prints → Hold, not this catalog.",
  },
  {
    id: "prints",
    category: "Money",
    title: "3D print collections",
    tags: ["print", "gallery", "rare", "shiny", "trade", "small", "large"],
    wall: true,
    body: "Unlock → Prints. Gallery is the wall. Hold: pick a kid, tap a piece — it lands on that profile. Trade: official smalls-for-a-large, or unofficial kid-to-kid / back to the bin with a prove note. Archive is the census. Bin: add a piece, Take photo (iPad camera), next size drafts itself. Wallet only. Hidden on the projector until something is released.",
  },
  {
    id: "schedule",
    category: "Schedule",
    title: "Bells, delay, A/B, SUB, lunch",
    tags: ["bell", "delay", "a day", "b day", "sub", "lunch", "snow"],
    body: "Desk → Schedule: Regular / 1-hour / 2-hour / half / Assembly. A/B chip is the live letter; next school day infers the other. Snow · reset A/B (PIN). SUB voids that date and does not rewind the cycle. Specials: Admin Today → add Grade 6/7/8/All assemblies even if they are not during Tech. The wall shows every period and gold-rings the assembly window.",
  },
  {
    id: "nurse-pass",
    category: "Schedule",
    title: "Nurse and out-of-room",
    tags: ["nurse", "pass", "attendance", "excused", "time"],
    body: "Desk: Nurse on the worker card stamps the clock and sets attendance to nurse. If they had no 3/2/1 yet, effort becomes Excused (E). A score already given stays. Tap Back when they return (in-time is saved). Hall NURSE / LIBRARY / TEACHER does the same clock. Admin Today lists who is out. SchoolTool is still the official AM attendance.",
  },
  {
    id: "cleanup",
    category: "Schedule",
    title: "Cleanup time",
    tags: ["cleanup", "coral", "bell", "5 minutes"],
    body: "Last minutes of a live period: the cleanup bell rings once. Wall goes coral full-screen (Workshop vs classroom jobs, one leftover clock). Teach stays open with the same jobs pad so you can still run the room. Extra tidy / +$5 catch is on Teach (PIN), not the student Cleanup wall. Study hall has its own list. Tap a name on Teach for +$5 wallet when you catch extra cleanup (max 2/day). Not XP. Desk button hides the wall card until the next period. Cleanup miss is still −$10 wallet, not effort.",
  },
  {
    id: "profile",
    category: "Profiles",
    title: "Worker profile",
    tags: ["profile", "alias"],
    body: "Open from Dashboard, Data, Skills, or Find worker. Public handle + alias. Arrow reveals course. Store and money steps need PIN. The locked worker id never changes; alias can.",
  },
  {
    id: "google-book",
    category: "Admin",
    title: "Google book",
    tags: ["google", "sheets", "drive", "export", "year", "vault", "lock", "class", "club"],
    body: "Admin → Records → Google book (also Data). One 2026–27 workbook: YEAR dashboard, a tab per class (P1, P2, P3, P8, P9, P10), study hall, club, STEM stems, skill log, full-year C1D1–C8D4, LOG, MASTER, VAULT. Gold headers (tw_ keys) are locked for the desk — do not rename them. extra_1 through extra_8 are yours; add more columns only after extra_8 and keep a copy before you re-export. VAULT name columns stay blank. Download, then open in Drive as a Google Sheet. Data → Protect gold columns. No Apps Script. This device is still the gradebook.",
  },
  {
    id: "deck",
    category: "Wall",
    title: "Deck plays Teach",
    tags: ["deck", "slides", "projector", "theme", "navy", "violet", "powerpoint", "edit"],
    wall: true,
    body: "Dash → Deck plays this hour from PlanIt. Present is play-only (even with PIN). Same date and period chip. Write Job · Guiding Q · Prove · beats on PlanIt.",
  },
  {
    id: "roster-ids",
    category: "Admin",
    title: "Roster ids and aliases",
    tags: ["roster", "id", "alias", "add", "save", "ferpa", "separate"],
    body: "Admin → Records → Roster. Add an alias, or Import / CSV (Last, First, Period). The paste is used once to mint Shop IDs and aliases, then the real names are dropped. Separate: pick two aliases already on the list; they will not sit in the same crew. Clear workers snapshots first. Edit alias and crew in the table. Scores, XP, and $ stay on the id. Auto-save on this device; tap the Save chip to write now. Backups is the other Records chip: snapshot, download full, restore.",
  },
  {
    id: "profile-house",
    category: "Profiles",
    title: "Berty and Mr. K",
    tags: ["berty", "mr k", "kulibert", "mascot", "teacher"],
    wall: true,
    body: "BertyBot is the workshop mascot — cleanup, enter/listen/work, never a grade or a wallet. Mr. K is the teacher card (Richard Kulibert). Open from the version chip (tap Berty or the v number), Find (type berty or kulibert), Teach (tap Berty), or Admin → About. These are house profiles, not students.",
  },
  {
    id: "data-privacy",
    category: "Data privacy",
    title: "Data privacy",
    tags: ["privacy", "ferpa", "data", "names", "alias", "cloud", "family"],
    wall: true,
    body: "TechWorks does not store legal names, IEP, or 504. The wall, this PC, the cloud desk, the Google book, and backups are Shop ID + alias only. A SchoolTool paste may mint aliases once; those names are dropped and never saved. Family web needs the class code, then the Shop ID — it does not list the class. Wallet and Lucky stay off family web. Cloud copies aliases and scores with a desk key you keep in the planner. Idle lock after 5 minutes. The teacher PIN is the one you set — never 1111.",
  },
  {
    id: "portal",
    category: "Data privacy",
    title: "Family web code",
    tags: ["web", "portal", "family", "crew", "student", "pin", "2627"],
    body: "Web on the HUD, or ?web=1. Class web code is the portal PIN (default 2627 — change in Settings). Not the teacher PIN. Then type the Shop ID from your teacher. No class list. Aliases, skill charts, family sheet. No wallet.",
  },
  {
    id: "ferpa",
    category: "Data privacy",
    title: "FERPA / what gets published",
    tags: ["ferpa", "alias", "names", "export"],
    body: "This app does not store last names, legal first names, IEP, or 504. Cloud, live, Google book, and this PC are Shop ID + alias. Import may paste a SIS list once to mint aliases, then those names are dropped. Family web asks for Shop ID. Idle lock after 5 minutes.",
  },
  {
    id: "codebook",
    category: "Data privacy",
    title: "Shop IDs",
    tags: ["codebook", "ferpa", "alias", "shop", "id", "print", "names"],
    body: "Admin → Records → Roster or Backups → Print Shop IDs / Download Shop IDs. Columns: Period, Shop ID, Alias. Real names are not stored.",
  },
  {
    id: "first-names",
    category: "Data privacy",
    title: "No real names",
    tags: ["names", "alias", "legal", "ferpa", "desk", "first", "privacy"],
    body: "The desk cannot store or show legal first or last names. Aliases and Shop IDs only. A SIS paste is used once to mint aliases, then dropped.",
  },
  {
    id: "export",
    category: "Export",
    title: "Save, live export, Friday",
    tags: ["save", "export", "friday", "vault"],
    body: "Roster and scoring auto-save on this device, and also to the internet when Cloud is on (chip in the top bar). Admin → Records → Cloud: copy the desk key, paste it once on the other room’s PC, Pull. Aliases travel. This PC still keeps a copy if the pipe misses. Snapshots and full backup stay on Records → Backups.",
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
    title: "One desk",
    tags: ["web", "mobile", "ipad", "projector", "layout", "dock"],
    body: "One layout. Bottom dock is Dash · Learn · Crew · Rosters · Admin. Dash strip is Wall · Teach · Deck · Week · Club · Hall. Teach during class. After class, Wall is the projector — no grips. Unlocked: Wall → Arrange wall (kits, hide, drag). Teach → Arrange plates. Cog always opens Admin. Rosters is the yearbook (aliases). Shop IDs print from Records. Google Site embed hides the dock.",
  },
  {
    id: "themes",
    category: "Start",
    title: "Stylesheets",
    tags: ["theme", "bearcat", "night", "holiday", "contrast", "dice", "look", "premade", "stylesheet", "roll", "wall look", "new look"],
    body: "Admin → Theme (PIN), or Wall → Arrange wall → Looks. Default stays dark (navy / cyan). Never a white wall — Kulibert is light-sensitive. NEW LOOK is an optional chip (same navy, extra shine) — it does not replace Dream. Wall looks (Shop, Back row, Night shop, Oswego, Scoreboard, Club night, Projector, Harvest) each show a mini wall, then paint color, type, scale, and plates in one tap. Kits only move plates. Drag a plate to the other column. Brand chips include ROLL THE DICE. Holiday packs (Holly, Frost, Harvest, Spooky, Patriot, Clover, Wrapping, Valentine, Pumpkin) and Day / ADA (Daylight, Manila, Polar) are full themes. High vis / Contrast sit on top. Hover a chip to preview (mouse). Tap to apply (Chromebook). Looks may grow wall plates — HUD buttons (Web, Help, Lock, Cog, language, NOW) stay the same tap size and stay clickable. Shine overlays on the top bar cannot steal taps. Cleanup coral. Due red.",
  },
  {
    id: "chrome-hud",
    category: "Start",
    title: "Top chrome (Lock, Help, Web, language)",
    tags: ["chrome", "web", "help", "lock", "settings", "cog", "translate", "now", "chips", "hud", "globe"],
    wall: true,
    body: "The top bar is one thin row. TECHWORKS goes to the Wall. Classroom chips stay on that row: Wall · Teach · Deck · Week · Club · Hall. More (Edge Pocket) holds Fake data, Find, NOW P#, Lock, Cog, Help, Web, language, cloud, and the version chip — tap to open an overlay, not a second row and not a side rail. Teach’s own tools (PlanIt · Deck · Projector · Hang) live in Teach’s left Edge Pocket. Wall looks, ROLL THE DICE, holiday themes, and Theme Tools may paint this bar — they cannot cover it, steal taps, or resize those buttons.",
  },
  {
    id: "period-now",
    category: "Schedule",
    title: "Period chips and the clock",
    tags: ["period", "chips", "now", "time", "bell", "clock"],
    wall: true,
    body: "NOW on the HUD is the live period and time left. Period chips on the Wall, Teach, Deck, and Score jump you to that hour. Gold ring = this period. P6 is Study Hall. Cleanup coral in the last minutes. Bells live on Admin → Day. Themes do not turn the chips off.",
  },
  {
    id: "legal",
    category: "Start",
    title: "Copyright and trademark",
    tags: ["copyright", "trademark", "kulibert", "license", "legal"],
    body: "© 2026 Richard Kulibert. All rights reserved. TECHWORKS™ is a trademark of Richard Kulibert. You may use this copy in your own classroom. Do not sell, sublicense, or republish the source without written permission. ™ is a claim of trademark; ® would require a registration. Hover the version chip or the logo for the notice.",
  },
  {
    id: "settings-cog",
    category: "Start",
    title: "The cog is Settings",
    tags: ["settings", "gear", "cog", "admin", "arrange"],
    body: "The cog always opens Admin (Today, Day, Records, Crews, Theme, Docs, Modules). It does not jump you off Deck or flash “this page is this page.” Theme is wall looks + color chips + Type. Modules hide Club / Hall / Store / games. Arrange the projector from Wall → Arrange wall (drag plates left or right). Teach → Arrange plates (drag / hide). Deck → Edit slides. Unlock first if the lock is on.",
  },
  {
    id: "data-copies",
    category: "Start",
    title: "Where the data lives",
    tags: ["save", "local", "cloud", "drive", "web", "desk key", "google"],
    body: "Three copies, none of them is live Google Drive sync. 1) This PC — the gradebook (auto-save). 2) Cloud — encrypted blob, unlocked by the desk key you mint in Records → Cloud. Same key on the other room. 3) Drive folder — JSON + Google book you download; File → Open as a Sheet. The PIN is not a backup. The desk key is not the PIN. New fields stay on the desk when the app updates — compact will not wipe what it does not know.",
  },
  {
    id: "app-map",
    category: "Start",
    title: "App map (architecture)",
    tags: ["architecture", "map", "docs", "plan book", "teach", "deck", "wall", "club", "hall", "skills", "store"],
    body: "Admin → Docs. PlanIt writes the hour; Teach, Deck, and Wall play it. Crew 3/2/1 is not a skill 1–4. Wallet $ never goes on the Family sheet. Club and Hall are after-school — not Tech effort. Download architecture from Docs or from this Help panel.",
  },
  {
    id: "teach-plan",
    category: "Dashboard",
    title: "PlanIt → Teach → Deck → Wall",
    tags: ["plan", "teach", "deck", "wall", "activity", "unit"],
    body: "One write. Type Job · Guiding Q · Prove · beats on PlanIt. TEACH is the live board (same teachDays row, tools in the left Edge Pocket). Mid-class TEACH edits write back. Deck Present plays TEACH. Projector Wall still hangs the kid scoreboard. Hang still pastes on TEACH.",
  },
  {
    id: "roles-it",
    category: "Roles",
    title: "Shop PC and second room",
    tags: ["it", "shop pc", "cloud", "desk key", "deploy", "chromebook"],
    body: "The shop PC is the writer. A second computer is a reader until you Pull with the desk key. Empty browser will not overwrite a cloud roster. Live class URL is tw.kulibert.net (Cloudflare Pages ← GitHub trebiluk/TechWorks main). Public GitHub ships students: []. Chromebooks are the tap pad; iPad camera is prints. Do not print the teacher PIN. Crew 2222 stays off the student About card. Admin → Docs is the architecture map.",
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

/** IT / teacher print. Twin of docs/TECHWORKS-TECHNICAL-DETAILS-v8.1.html */
export function techMarkdown(): string {
  return `# TechWorks technical manual · v${APP_VERSION}

${COPYRIGHT_LONG}

Live class: https://tw.kulibert.net
Help in the app: tap **?**. This file is the IT / teacher print. Twin of docs/TECHWORKS-TECHNICAL-DETAILS-v8.1.html.

## Who this is for

- **Students** — Wall, Teach (locked), Deck Present, Help Welcome / Wall. No legal names.
- **Crew leads** — Crew pad, 3 / 2 / 1. PIN 2222 for another period. No wallet, bonus, or grades.
- **Families** — Web on the HUD or ?web=1. Class web code (portal PIN, default 2627), then Shop ID. One project mark, skills in words. No wallet.
- **Teacher** — Set teacher PIN (never 1111). Teach → Deck → Wall. Score one-row pad. Cog = Admin.
- **Sub** — Do not open this app. Teacher taps SUB. Wall stays up.
- **IT / second room** — Same desk key, Pull. Public GitHub ships students: []. Do not print the teacher PIN.

## Three copies (not live Drive sync)

1. **This PC** — the gradebook (localStorage + IndexedDB snapshots). Auto-save ~0.5s. Shop ID + alias only.
2. **Cloud** — encrypted blob at /api/desk, desk key from Records → Cloud (AES-GCM, PBKDF2 80k). Same key on the other room. Empty PC will not overwrite a named cloud roster.
3. **Drive folder** — JSON + Google book you download, then File → Open as a Sheet. VAULT tab is Shop ID + alias. Drive does not watch this PC.

The PIN is not a backup. The desk key is not the PIN. Layout, theme, PIN, and Fake data stay on this browser.

## PINs

- Teacher unlock = Lock → Set teacher PIN. 1111 is rejected. Never print the real PIN.
- Crew 2222 = crew pad only. Off the student About card.
- Family web / portal default 2627 (Settings → Worker portal PIN). Not the teacher PIN.

## Chrome (must stay tappable)

Top bar: TECHWORKS · Dash strip (Wall / Teach / Deck / Week / Club / Hall) · NOW · Lock · Cog (Settings) · Help · Web · language · version.
Wall looks, ROLL THE DICE, holiday packs, and Theme Tools paint color / type / scale. Theme picker shows a mini wall per look and a color stripe per chip. They must not cover HUD hits, resize HUD buttons, or disable handlers. Shine overlays on chrome are paint-only (pointer-events none). Chip scale applies to wall plates, not the HUD. Mini wall previews are paint-only.
Web = Family web (?web=1). Globe = translate (EN / UK / RU). Cleanup coral is a Wall overlay; Teach and Score stay open.

## PlanIt → Teach → Deck → Wall

One write. Type Job · Guiding Q · Prove · beats on the PlanIt hour card. Teach is a live mirror. Present is play-only. Hang a Drive / Slides / YouTube / Canva link on Teach; Deck and Wall play it. Arrange wall (drag columns) and Arrange plates live on those pages — not the cog.

## Score, Store, Club, Hall

- Crew 3/2/1 is not a skill 1–4. Wallet $ never goes on the Family sheet.
- Store / Rewards = wallet perks (PIN). Prints are 3D collections. Lucky Bench is class cash only.
- Club IN is $10 + 2 XP once a day — not Tech effort. Dash Club is the projector; Admin Club is the desk.
- Study Hall (P6) HERE / NURSE is not Tech effort. Dash Hall is the wall; Hall Mgr is the pad.

## Monday

Shop PC only. Fake data Off. Snapshot. Mint desk key. Push if this PC has workers; Pull if this PC is empty. Paste Last, First, Period (names mint aliases, then drop). Wall shows aliases. PlanIt: type Job · Guiding Q · Prove · beats. Flip to Deck — same words.

## Deploy

tw.kulibert.net ← Cloudflare Pages kulibert-desk ← github.com/trebiluk/TechWorks main.
Grok Publish hits Orbit only. Do not commit legal names. Desk pack kind techworks-desk. Cloud pack kind techworks-cloud.

## Privacy

This app does not store legal names, IEP, or 504. Projector, ?embed=1, cloud, Google book, and this PC are Shop ID + alias. Family web asks for Shop ID after the class code. Idle lock after 5 minutes. Crew 2222 stays off student About. Teacher PIN is never printed.
`;
}

export function searchHelp(q: string, wallOnly = false): HelpArticle[] {
  const pool = wallOnly ? HELP_ARTICLES.filter((a) => a.wall) : HELP_ARTICLES;
  const n = q.trim().toLowerCase();
  if (!n) return pool;
  return pool.filter((a) => {
    const blob = `${a.category} ${a.title} ${a.body} ${a.tags.join(" ")}`.toLowerCase();
    return n.split(/\s+/).every((w) => {
      const alts = [w, ...(HELP_SYNONYMS[w] ?? [])];
      return alts.some((term) => blob.includes(term));
    });
  });
}
