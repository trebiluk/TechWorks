/** Solvay MS Tech desk profile. Hall aliases only — never legal names. */

export const P6_STUDY_HALL_ID = "p6-study-hall";

export type HallRosterStatus = "empty" | "loaded";

export type P6StudyHallClass = {
  id: typeof P6_STUDY_HALL_ID;
  period: 6;
  course: "STUDY HALL";
  section: 10;
  room: "136";
  rosterStatus: HallRosterStatus;
  roster: { A: string[]; B: string[]; BOTH?: string[] };
};

export type SolvayMsTechProfile = {
  id: "solvay-ms-tech";
  year: "2026-27";
  classes: Record<string, P6StudyHallClass>;
};

/** Diego has not pasted P6 aliases yet. Keep empty. Fake data paints demo nicknames separately. */
export const SOLVAY_MS_TECH_PROFILE: SolvayMsTechProfile = {
  id: "solvay-ms-tech",
  year: "2026-27",
  classes: {
    [P6_STUDY_HALL_ID]: {
      id: P6_STUDY_HALL_ID,
      period: 6,
      course: "STUDY HALL",
      section: 10,
      room: "136",
      rosterStatus: "empty",
      roster: { A: [], B: [] },
    },
  },
};
