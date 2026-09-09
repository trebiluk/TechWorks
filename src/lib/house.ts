import { BERTY_LABEL, BERTY_SRC, type BertyPose } from "@/lib/berty";
import { DAILY_PROCEDURE } from "@/lib/procedure";

export const HOUSE_BERTY = "house:berty";
export const HOUSE_MRK = "house:mrk";

export type HouseId = typeof HOUSE_BERTY | typeof HOUSE_MRK;

export type HouseProfile = {
  id: HouseId;
  alias: string;
  handle: string;
  role: string;
  line: string;
  about: string;
  jobs: { title: string; line: string }[];
  notes: string[];
  tags: string[];
};

export const HOUSE: Record<HouseId, HouseProfile> = {
  [HOUSE_BERTY]: {
    id: HOUSE_BERTY,
    alias: "Berty",
    handle: "BERTYBOT",
    role: "Workshop mascot",
    line: "Points at the job. Never grades you.",
    about:
      "BertyBot lives on the wall so the class can see what to do next. Enter, listen, crew work, clean. When the board turns coral, Berty points at cleanup. Berty does not keep a wallet, XP, or a report card.",
    jobs: DAILY_PROCEDURE.map((s) => ({ title: s.title, line: s.line })),
    notes: [
      "Cleanup and passing always show Berty, even if the Berty module is off.",
      "Caught helping extra at cleanup can earn class cash — not XP.",
      "Not a student. Not in the gradebook.",
    ],
    tags: ["berty", "bertybot", "bot", "mascot", "cleanup"],
  },
  [HOUSE_MRK]: {
    id: HOUSE_MRK,
    alias: "Mr. K",
    handle: "KULIBERT",
    role: "Technology teacher",
    line: "Runs TechWorks. Grades, skills, and the desk.",
    about:
      "Richard Kulibert — Tech Ed at Solvay. Tech 6, 7, and 8 plus Period 6 Study Hall. The projector uses shop aliases. Legal names stay in the private roster. Unlock the desk (PIN) for scoring, grades, and admin.",
    jobs: [
      { title: "DASHBOARD", line: "Goals and the school board stay up all day." },
      { title: "TEACH", line: "DO THIS NOW when he is in front of the group." },
      { title: "DESK", line: "Verify scores, skills, polls, and the store." },
      { title: "FAMILY", line: "Report card is the project grade — not the wallet." },
    ],
    notes: [
      "© 2026 Richard Kulibert. TECHWORKS™.",
      "Google Sheets stays the archive.",
      "Teacher PIN 1111. Crew override 2222.",
    ],
    tags: ["mr k", "mr. k", "kulibert", "teacher", "richard", "solvay"],
  },
};

export function isHouseId(id: string | null | undefined): id is HouseId {
  return id === HOUSE_BERTY || id === HOUSE_MRK;
}

export function houseOf(id: string): HouseProfile | null {
  return isHouseId(id) ? HOUSE[id] : null;
}

export function houseHits(q: string): HouseProfile[] {
  const n = q.trim().toLowerCase();
  if (!n) return [];
  return (Object.values(HOUSE) as HouseProfile[]).filter(
    (h) =>
      h.alias.toLowerCase().includes(n) ||
      h.handle.toLowerCase().includes(n) ||
      h.role.toLowerCase().includes(n) ||
      h.tags.some((t) => t.includes(n) || n.includes(t)),
  );
}

export const BERTY_POSES = (Object.keys(BERTY_SRC) as BertyPose[]).map((pose) => ({
  pose,
  src: BERTY_SRC[pose],
  label: BERTY_LABEL[pose],
}));
