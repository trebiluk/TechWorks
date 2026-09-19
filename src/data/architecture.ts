import { APP_VERSION } from "@/lib/version";
import { COPYRIGHT_LONG } from "@/lib/copy";

export type ArchTable = { caption: string; head: string[]; rows: string[][] };
export type ArchFlow = { title: string; steps: { from: string; arrow: string; to: string }[] };
export type ArchLane = { name: string; color: "gold" | "accent" | "crew" | "muted"; items: string[] };
export type ArchSection = {
  id: string;
  title: string;
  lead: string;
  lanes?: ArchLane[];
  flows?: ArchFlow[];
  tables?: ArchTable[];
  never?: string[];
  notes?: string[];
};

/** Teacher-facing map. Twin of docs/ARCHITECTURE.md. */
export const ARCH_SECTIONS: ArchSection[] = [
  {
    id: "one-desk",
    title: "One desk, four jobs",
    lead: "TechWorks is one shop PC gradebook with four kinds of number. They never average into each other. The wall is a projector of aliases. Admin is the writer.",
    lanes: [
      { name: "Author", color: "gold", items: ["PlanIt"] },
      { name: "Play", color: "accent", items: ["Teach", "Deck", "Wall", "Club wall", "Hall wall"] },
      { name: "Score", color: "crew", items: ["Crew pad 3/2/1", "Teacher Score", "Skills 1–4"] },
      { name: "Perk / after", color: "muted", items: ["Wallet $", "Store", "Prints", "Lucky", "Club IN", "Hall HERE"] },
    ],
    notes: [
      "Cog = Settings (Admin). Arrange wall / Arrange plates live on those pages.",
      "Shop PC writes. Cloud is a locked copy. Drive is a download, not a live sync.",
      "HUD chrome (Lock, Help, Web, language, NOW) stays tappable after any premade theme or wall look. Chip scale is for plates, not the top bar. Theme picker shows mini wall previews; those previews are paint-only.",
    ],
  },
  {
    id: "lesson-spine",
    title: "PlanIt → Teach → Deck → Wall",
    lead: "One write. PlanIt hour card is the author. Teach, Deck, and Wall read that hour.",
    flows: [
      {
        title: "How a class hour is born",
        steps: [
          { from: "PlanIt hour card", arrow: "Job · Guiding Q · Prove · beats", to: "teachDays for that P × day" },
          { from: "PlanIt send this hour", arrow: "empty slots only", to: "same teachDays on other P or days" },
          { from: "PlanIt New unit", arrow: "name + optional question", to: "Parked unit on that period" },
          { from: "Deck Present", arrow: "reads teachJob + hourAgenda", to: "Slides for this P + date" },
          { from: "Teach", arrow: "live mirror · Open PlanIt", to: "same hour, no second editor" },
          { from: "Wall beat", arrow: "wallMode from the bell", to: "Enter · Agenda · Cleanup · idle" },
        ],
      },
    ],
    tables: [
      {
        caption: "Lesson fields — who shows them",
        head: ["Field", "Written on", "Teach", "Deck", "Wall", "PlanIt", "Family"],
        rows: [
          ["Job", "PlanIt hour card", "Mirror", "Agenda 02 + Prove Today", "NOW band + Agenda 02", "Yes", "No"],
          ["Guiding Q", "PlanIt hour card", "Mirror", "Title slide", "Hour plate", "Yes", "No"],
          ["Prove", "PlanIt hour card", "Mirror", "Prove Done", "Hour plate", "Yes", "No"],
          ["Beats 01–04", "PlanIt hour card", "Mirror", "This hour slide", "Agenda plate", "Yes", "No"],
          ["Look-for a 3", "Activity.lookFor", "Hour line", "Prove", "Look-for", "Activity", "No"],
          ["Rules / goggles", "Project constraints", "Listen beat", "Rules slide", "Rules", "Need", "No"],
          ["Hour pack (Workshop…)", "Teach live", "Chips", "Beat kicker", "No", "No", "No"],
          ["STEM sentence", "Project stemLine", "Objective fallback", "Title line", "Under question", "Unit", "No"],
          ["Hang (Drive / Slides / YouTube / Canva)", "Teach Hang paste", "Yes", "Embed slide", "Under Agenda", "No", "No"],
          ["Need / materials", "PlanIt hour card", "Mirror", "No", "Enter + kit chip", "Yes", "No"],
          ["Closure / homework / mods", "PlanIt notes", "No", "No", "No", "Yes", "No"],
          ["Skill 1–4 expected", "Activity.expect", "No", "No", "Look-for n =", "Activity", "Words after you score"],
        ],
      },
    ],
    never: [
      "Deck does not keep its own lesson file anymore. Old techworks-deck-v1 is leftover chrome, not the hour.",
      "Wall does not show legal names, IEP, wallet, Lucky, or SCOREPIXEL / grading debt.",
    ],
  },
  {
    id: "four-numbers",
    title: "Four number systems (do not mix)",
    lead: "A 3 on the crew pad is not a 3 on a skill. Gold XP is not class cash. Family report is the project mark in words.",
    tables: [
      {
        caption: "What each number is",
        head: ["System", "Scale", "Who taps", "Pays / feeds", "On the wall", "On Family"],
        rows: [
          ["Crew effort", "3 / 2 / 1 + A E P", "Crew lead or teacher Score", "Wallet $ that day; Week race", "Top XP uses skills, not this. Week race uses 3 as full share", "Time in class listed, not averaged"],
          ["Skill", "1 Beginning … 4 Distinguished", "Teacher Watch / Sit-down", "Gold XP (that many points)", "Skills board / gold numbers", "Skills in plain words"],
          ["Perks $", "Wallet", "Auto from 3/2/1; Store / Lucky / Prints spend", "Store, Lucky, Prints, cleanup miss −$10", "Perks board if you flip it", "Never"],
          ["Project grade", "100 / 85 / 70 / blank", "Teacher Grades (from 3/2/1 + skills)", "Classroom CSV", "Never", "The one mark"],
        ],
      },
    ],
    never: [
      "Wallet, stock, Lucky Bench, and personal-day docks never enter the family mark.",
      "A crew-lead 3 is not Distinguished. Distinguished is a teacher 4.",
      "Club IN ($10 + 2 XP) is not class effort.",
      "Hall HERE / NURSE is not Tech effort.",
    ],
  },
  {
    id: "people",
    title: "People and crews",
    lead: "A worker is a locked id. The wall shows an alias minted from that id, never from the legal name.",
    tables: [
      {
        caption: "Identity",
        head: ["Bit", "Where it lives", "Wall", "Profile (locked)", "Family", "Export"],
        rows: [
          ["Locked id", "students[].id", "Hidden", "Hidden", "Hidden", "Encoded live export"],
          ["Shop ID", "publicHandle(id)", "Never as a name", "Roster / dossier / Shop IDs", "Portal tag", "Live export code"],
          ["Alias (first)", "students[].first", "Yes", "Yes", "Yes", "Yes"],
          ["Codebook", "paper / CSV", "Never", "Print Shop IDs after PIN", "Never", "Teacher drawer only"],
          ["Legal name", "not stored", "Never", "Never", "Never", "Not in this app"],
          ["IEP / 504", "not stored", "Never", "Never", "Never", "Not in this app"],
          ["Crew key", "crewKey + crewDays", "Crew plates", "Yes", "No", "Class tabs"],
          ["Period / grade", "period, grade", "P chips", "Yes", "Yes", "Yes"],
        ],
      },
    ],
    notes: [
      "Admin → Crews: size, deal, look, crown. Separate rules live on Roster.",
      "Rosters page is the yearbook of aliases. Shop IDs print from Records → Roster / Backups. Real names are not stored.",
    ],
  },
  {
    id: "score-week",
    title: "Score, Week, Year, Data",
    lead: "Teacher Score is name + 3/2/1 on one row. Crew pad is the teal kiosk. Week race is yesterday so today can still be scored.",
    tables: [
      {
        caption: "Scoring surfaces",
        head: ["Surface", "Who", "Writes", "Shows"],
        rows: [
          ["Crew pad", "Lead, PIN 2222 for other P", "3/2/1, A/E/P, INVEST?", "This period’s crew only"],
          ["Teacher Score", "PIN", "Same codes + Assist / Clean / cash", "All crews, period chips"],
          ["Week", "Anyone", "Nothing", "Classes & crews earned vs possible as of yesterday. Gold #1 class and #1 crew"],
          ["Year", "Teacher", "End session archive", "Cohort XP / $ vs cohort"],
          ["Data", "PIN", "Nothing (graphs)", "Look-back. Mix-in hall is opt-in"],
        ],
      },
    ],
  },
  {
    id: "learn",
    title: "Learn: Book, Projects, Skills, Words, Grades",
    lead: "Learn is the filing cabinet. PlanIt is the author of today.",
    tables: [
      {
        caption: "Learn → rest of the shop",
        head: ["Learn tool", "Writes", "Feeds"],
        rows: [
          ["PlanIt", "Job · Guiding Q · Prove · beats for a P × day", "Teach mirror, Wall Goals, Deck, lesson PDF"],
          ["Projects", "Unit, activities, dates, belong, skill", "Parked unit on a period"],
          ["Watch one skill", "skillLog 1–4 + stem", "Gold XP, Family words, Grades Skill column"],
          ["Standard 5 / NY Tech", "Same 1–4 on S1–S7", "XP, CSV"],
          ["Word Heat", "Streak this heat only", "Nothing else (not wallet, not grade)"],
          ["Grades", "Optional override; else calculated", "Classroom CSV, Family mark"],
          ["Book", "Reference", "Stems / why a 3"],
        ],
      },
    ],
  },
  {
    id: "club-hall",
    title: "Tech Club and Study Hall",
    lead: "After-school modules. They have a desk (author) and a wall (play). They do not mix into Tech 3/2/1.",
    tables: [
      {
        caption: "Club",
        head: ["Bit", "Written on", "Club wall", "Class wall", "Wallet / XP", "Effort grade"],
        rows: [
          ["SET date + pack (Talk/Stations/…)", "Admin Club desk", "Agenda until Work", "No", "No", "No"],
          ["Agenda / brief", "Club desk, one directive", "Yes until Release", "No", "No", "No"],
          ["Stations / contest / timer", "After Work", "Yes", "No", "No", "No"],
          ["Sign in (alias match)", "Club IN", "Badge", "No", "+$10 + 2 XP once that day", "No"],
          ["Late bus / pickup", "Member dismiss", "Cleanup 3:00–3:05", "No", "No", "No"],
        ],
      },
      {
        caption: "Study Hall (P6)",
        head: ["Bit", "Written on", "Hall wall", "Class wall", "Tech effort"],
        rows: [
          ["HERE / NURSE / LIBRARY / TEACHER", "Hall pad (PIN)", "Counts, not names of who is out on projector", "No", "No"],
          ["Line leader", "Weekly", "Yes", "No", "No"],
          ["Hall store", "Separate catalog", "No", "No", "No"],
          ["P6 on class wall", "Bell strip", "Time only", "Time only", "No"],
        ],
      },
    ],
  },
  {
    id: "perks",
    title: "Wallet, Store, Prints, Lucky, Stocks, Reward",
    lead: "Class cash is a perk game for showing up. It is not the grade. Modules can hide the tabs; the wallet can still exist.",
    tables: [
      {
        caption: "Money flows",
        head: ["Event", "Wallet", "XP", "Wall", "Family"],
        rows: [
          ["3 / 2 / 1 pay", "+$25 / $20 / $15", "No", "Perks board only", "No"],
          ["A / E", "$0", "No", "No", "Time listed"],
          ["P personal", "−$25", "No", "No", "No"],
          ["Cleanup miss", "−$10", "No", "No", "No"],
          ["Cleanup catch (teacher)", "+$5, max 2/day", "No", "No", "No"],
          ["Store buy (PIN)", "−price", "No", "No", "No"],
          ["Prints buy / trade", "Wallet or trade", "No", "Gallery once released", "No"],
          ["Lucky Bench", "Stake / payout", "No", "No", "No"],
          ["Invest / Stocks", "Pay leaves wallet → principal", "No", "Not on rank", "No"],
          ["Club IN", "+$10", "+2 XP", "No", "No"],
          ["Class reward bar", "Module", "Optional XP target", "RewardBar if on", "Optional grade target"],
        ],
      },
    ],
  },
  {
    id: "chrome",
    title: "Screens and who may open them",
    lead: "Locked chrome is the projector. PIN opens the writer. Crew 2222 is the kiosk, not Admin.",
    tables: [
      {
        caption: "Chrome map",
        head: ["Screen", "Lock", "Kids see", "Teacher writes"],
        rows: [
          ["Wall", "Open", "Aliases, XP, $, job, clock, cleanup", "Arrange wall (PIN)"],
          ["Teach", "Open to read", "Ask / beats, no names", "Ask, Do, pack, plates"],
          ["Deck", "Open to Present", "Slides", "Edit slides → Teach"],
          ["Week / Year", "Open", "Race, rings", "Archive on Year"],
          ["Club wall / Hall wall", "Open", "Agenda / HERE counts", "On the desk"],
          ["Learn Words", "Open", "Shop vocab", "Bank"],
          ["Crew pad", "2222 / live P", "Teal 3/2/1", "—"],
          ["Score / Rosters / Admin / Store / Grades", "Teacher PIN", "Never", "Yes"],
          ["Family sheet", "Tap alias; family web uses Shop ID", "Project mark, skill words", "—"],
          ["Embed ?embed=1", "Wall only", "Same as Wall", "No dock"],
        ],
      },
    ],
  },
  {
    id: "save",
    title: "Where the bits live",
    lead: "Three copies. None of them is live Google Drive sync.",
    tables: [
      {
        caption: "Copies",
        head: ["Copy", "Holds", "Does not hold"],
        rows: [
          ["This PC (gradebook)", "Roster (Shop ID + alias), marks, skills, projects, teachDays, club, prints", "Theme, layout, PIN, Fake data toggle (browser only). Legal names / IEP"],
          ["Cloud (desk key)", "Same aliases + scores, encrypted", "Theme / PIN / Fake data. Empty PC will not overwrite names"],
          ["Drive folder", "JSON + Google book you download", "Live watch. VAULT tab = Shop ID + alias — not legal names"],
        ],
      },
    ],
    notes: [
      "Teacher PIN = Set teacher PIN. 1111 is rejected. Never print it.",
      "Crew 2222 stays off the student About card.",
      "Live URL tw.kulibert.net ← Cloudflare Pages kulibert-desk ← github.com/trebiluk/TechWorks main. Public repo ships students: [].",
    ],
  },
  {
    id: "compat",
    title: "Forward compatibility (this app will keep changing)",
    lead: "New fields are additive. An older build must still open a newer desk without wiping what it does not understand. Schema never goes backwards.",
    tables: [
      {
        caption: "Rules",
        head: ["Move", "What happens"],
        rows: [
          ["Add a student or config field", "migrate, compact, pack, unpack, and cloud keep it"],
          ["Bump app version", "chip + changelog. Desk schema 12 stays until the pack shape changes"],
          ["Newer schema on this PC", "open it, keep the higher schema stamp, keep extra keys"],
          ["Older localStorage key", "still read techworks-desk-v11 … v12"],
          ["Cloud pack v2+", "open if kind is techworks-cloud and vault is present"],
          ["New module", "add to FEATURES; default off if it is a game. JSON modules map is a bag"],
          ["Rename or delete a field", "needs a real migrate step — never silent drop"],
        ],
      },
    ],
    never: [
      "Do not whitelist-copy students in compact. Unknown keys ride.",
      "Do not stamp schema 12 over a 13 pack.",
      "Do not auto-push an empty PC over a named cloud roster.",
    ],
  },
];

export function architectureMarkdown(): string {
  const bits = ARCH_SECTIONS.map((s) => {
    const parts: string[] = [`## ${s.title}`, "", s.lead, ""];
    if (s.lanes?.length) {
      parts.push("**Lanes**", "");
      for (const lane of s.lanes) parts.push(`- **${lane.name}:** ${lane.items.join(" · ")}`);
      parts.push("");
    }
    for (const flow of s.flows ?? []) {
      parts.push(`### ${flow.title}`, "", "```", ...flow.steps.map((st) => `${st.from}  —${st.arrow}→  ${st.to}`), "```", "");
    }
    for (const t of s.tables ?? []) {
      parts.push(`### ${t.caption}`, "", `| ${t.head.join(" | ")} |`, `| ${t.head.map(() => "---").join(" | ")} |`);
      for (const row of t.rows) parts.push(`| ${row.join(" | ")} |`);
      parts.push("");
    }
    if (s.never?.length) {
      parts.push("**Do not**", "");
      for (const n of s.never) parts.push(`- ${n}`);
      parts.push("");
    }
    if (s.notes?.length) {
      for (const n of s.notes) parts.push(`- ${n}`);
      parts.push("");
    }
    return parts.join("\n");
  }).join("\n");
  return `# TechWorks architecture · v${APP_VERSION}

${COPYRIGHT_LONG}

How the shop is wired. In-app: **Admin → Docs**. Help **?** is the role book.

\`\`\`mermaid
flowchart LR
  subgraph author [Author]
    Plan[PlanIt hour card]
  end
  subgraph play [Play]
    Teach[Teach live mirror]
    Deck[Deck]
    Wall[Wall Goals]
    Club[Club wall]
    Hall[Hall wall]
  end
  subgraph score [Score]
    Crew[Crew 3/2/1]
    Skill[Skills 1-4]
  end
  subgraph perk [Perks]
    Wallet[Wallet $]
    Store[Store / Prints / Lucky]
  end
  Plan --> Teach
  Plan --> Deck
  Plan --> Wall
  Crew --> Wallet
  Skill --> XP[Gold XP]
  Wallet --> Store
  Club -.->|not effort| Crew
  Hall -.->|not effort| Crew
  Wallet -.->|never| Family[Family sheet]
  Skill --> Family
\`\`\`

${bits}`;
}
