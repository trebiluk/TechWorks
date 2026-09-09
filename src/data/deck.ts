/** Default TechWorks projector deck. Navy + violet plate. Aliases only. */

export const DECK_TITLE = "TechWorks · Default Deck";

export type DeckCard = { n?: string; title: string; line: string };
export type DeckKind = "title" | "cards" | "steps" | "ladder" | "letters" | "now" | "blank" | "close";

export type DeckSlide = {
  id: string;
  kicker?: string;
  title: string;
  line?: string;
  kind: DeckKind;
  berty?: "waving" | "standing" | "point" | "think";
  cards?: DeckCard[];
  note?: string;
};

export const DECK: DeckSlide[] = [
  {
    id: "title",
    kind: "title",
    kicker: "Solvay Tech Ed · Room 13 · 2026–27",
    title: "TECHWORKS",
    line: "Workshop you can see.",
    berty: "waving",
    note: "Aliases on the wall. Legal names stay in the vault.",
  },
  {
    id: "how",
    kind: "cards",
    kicker: "How this class works",
    title: "Crew. Skills. Gold.",
    berty: "standing",
    cards: [
      { title: "Crew", line: "You work in a small crew. Four people, one bench." },
      { title: "Skills", line: "Measure, cut, finish, share. Real work you can see." },
      { title: "Gold XP", line: "Getting better at the craft. That is the point." },
      { title: "Cash", line: "A perk game. Not the grade. Not on the family sheet." },
    ],
  },
  {
    id: "beats",
    kind: "steps",
    kicker: "Every period",
    title: "Four beats",
    cards: [
      { n: "1", title: "ENTER", line: "Sit with your crew." },
      { n: "2", title: "LISTEN", line: "Directions first. Then questions." },
      { n: "3", title: "CREW WORK", line: "Today’s activity. Tools with a purpose." },
      { n: "4", title: "CLEAN UP", line: "Stations reset before the bell." },
    ],
  },
  {
    id: "effort",
    kind: "ladder",
    kicker: "Today’s effort · not the skill grade",
    title: "3 · 2 · 1",
    cards: [
      { n: "3", title: "On the job", line: "Full day with the crew." },
      { n: "2", title: "Needs a nudge", line: "Working, with a check-in." },
      { n: "1", title: "Not with the crew", line: "Off-task. Redirect." },
    ],
    note: "A absent · E excused · P present but no work. Crew lead taps this period only.",
  },
  {
    id: "skills",
    kind: "ladder",
    kicker: "Observable · Watch stores the sentence",
    title: "Skills 1 to 4",
    cards: [
      { n: "1", title: "Beginning", line: "Needs a demo. Not independent yet." },
      { n: "2", title: "Developing", line: "Can do it with a check-in." },
      { n: "3", title: "Proficient", line: "Independent. Meets the standard." },
      { n: "4", title: "Distinguished", line: "Can teach a crewmate. Exceeds." },
    ],
    note: "SAFETY · MEASURE · DRAW · MODEL · TOOLS · FINISH · PRESENT · TEAM",
  },
  {
    id: "stem",
    kind: "letters",
    kicker: "On the unit · not a second score",
    title: "S T E M",
    cards: [
      { n: "S", title: "Science", line: "Materials, force, speed, and what the test showed." },
      { n: "T", title: "Technology", line: "Tools, files, and the process that made the part." },
      { n: "E", title: "Engineering", line: "The design: constraints, ideas, and the next change." },
      { n: "M", title: "Math", line: "Measure, size, scale, and whether the numbers hold." },
    ],
    note: "Grade 6 driving question · How can a small force move a bigger load?",
  },
  {
    id: "safety",
    kind: "cards",
    kicker: "No work until this is solid",
    title: "Safety first",
    berty: "point",
    cards: [
      { title: "Glasses", line: "On before the tool starts." },
      { title: "Ask", line: "Ask, then wait for the nod." },
      { title: "Zone", line: "Stand clear of swing and offcut." },
      { title: "License", line: "One tool at a time. Licensed tools only." },
    ],
    note: "Distinguished: stop a crewmate who skipped PPE.",
  },
  {
    id: "now",
    kind: "now",
    kicker: "Duplicate this slide every period",
    title: "Do this now",
    cards: [
      { n: "ACTIVITY", title: "Technical Drawing", line: "Today’s job at the bench." },
      { n: "LOOK FOR", title: "a 3", line: "Independent. Meets the standard." },
      { n: "QUESTION", title: "How can a small force move a bigger load?", line: "Driving question for this unit." },
    ],
  },
  {
    id: "clean",
    kind: "cards",
    kicker: "Last beat · before the bell",
    title: "Clean up",
    berty: "point",
    cards: [
      { title: "Tools", line: "Tools and kits away." },
      { title: "Bench", line: "Floor and tables clear." },
      { title: "Seats", line: "Names stay until the room is ready." },
      { title: "Help", line: "Caught helping extra can earn a perk — not XP." },
    ],
  },
  {
    id: "blank",
    kind: "blank",
    kicker: "Section",
    title: "Title here",
    cards: [
      { title: "Left", line: "Type over this. Keep the navy plate." },
      { title: "Right", line: "Duplicate for demos, critiques, club." },
    ],
    note: "Default theme master. Do not change the colors.",
  },
  {
    id: "close",
    kind: "close",
    kicker: "Aliases on the projector",
    title: "See you at the bench.",
    line: "Workshop, not a lecture.",
    berty: "standing",
    note: "Legal names stay in the vault.",
  },
];
