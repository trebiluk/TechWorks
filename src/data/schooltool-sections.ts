/** Official 2026–27 SchoolTool sections. Tech Club is not a ST section. */
export type SchoolSection = {
  course: string;
  period: number;
  section: number;
  days: "A,B";
  room: string;
  sem: string;
};

export const SCHOOLTOOL_SECTIONS: SchoolSection[] = [
  { course: "TECH 6", period: 1, section: 1, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 6", period: 1, section: 2, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 6", period: 1, section: 3, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 6", period: 1, section: 4, days: "A,B", room: "13", sem: "Q4" },
  { course: "TECH 8", period: 2, section: 1, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 8", period: 2, section: 2, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 8", period: 2, section: 3, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 8", period: 2, section: 4, days: "A,B", room: "13", sem: "Q4" },
  { course: "TECH 7", period: 3, section: 1, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 7", period: 3, section: 2, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 7", period: 3, section: 3, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 7", period: 3, section: 4, days: "A,B", room: "13", sem: "Q4" },
  { course: "STUDY HALL", period: 6, section: 10, days: "A,B", room: "136", sem: "Q1, Q2, Q3, Q4" },
  { course: "TECH 7", period: 8, section: 5, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 7", period: 8, section: 6, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 7", period: 8, section: 7, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 7", period: 8, section: 8, days: "A,B", room: "13", sem: "Q4" },
  { course: "TECH 8", period: 9, section: 5, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 8", period: 9, section: 6, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 8", period: 9, section: 7, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 8", period: 9, section: 8, days: "A,B", room: "13", sem: "Q4" },
  { course: "TECH 6", period: 10, section: 5, days: "A,B", room: "13", sem: "Q1" },
  { course: "TECH 6", period: 10, section: 6, days: "A,B", room: "13", sem: "Q2" },
  { course: "TECH 6", period: 10, section: 7, days: "A,B", room: "13", sem: "Q3" },
  { course: "TECH 6", period: 10, section: 8, days: "A,B", room: "13", sem: "Q4" },
];
