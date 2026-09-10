import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { projectsOf } from "./projects.ts";
import {
  copyDayPlan,
  copyDayToRestOfQuarter,
  copyQuarterCurriculum,
  cyclesOfQuarter,
  isPlannedDay,
  schoolDaysInQuarter,
} from "./year-plan.ts";

function desk(over: Partial<EconomyFile["meta"]> = {}): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      dayLog: {},
      config: { projects: [], meetings: [] },
      ...over,
    },
    crews: [],
    students: [],
  };
}

describe("year plan", () => {
  it("maps quarters to cycles 1-2 / 3-4 / 5-6 / 7-8", () => {
    assert.deepEqual(cyclesOfQuarter(1), [1, 2]);
    assert.deepEqual(cyclesOfQuarter(2), [3, 4]);
    assert.deepEqual(cyclesOfQuarter(3), [5, 6]);
    assert.deepEqual(cyclesOfQuarter(4), [7, 8]);
  });

  it("lists Q1 school days from first student day through MP1", () => {
    const days = schoolDaysInQuarter(1);
    assert.equal(days[0], "2026-09-08");
    assert.ok(days.includes("2026-11-13"));
    assert.equal(days.some((d) => d > "2026-11-13"), false);
    assert.ok(days.length > 30);
  });

  it("copies lunch, goals, wall cards, and the meeting pin — not scores", () => {
    const src = desk({
      dayLog: {
        "2026-09-08": {
          periodGoals: { "1": "Sand the dragster" },
          crewGoals: {},
          lunch: "Pizza",
          cards: [{ title: "Open house", body: "6pm gym" }],
          schooltool: { "1": true },
          verify: { "1": true },
        },
        "2026-09-09": {
          periodGoals: {},
          crewGoals: { "1|A": "keep" },
        },
      },
      config: { meetings: [{ title: "Faculty", date: "2026-09-08", time: "14:30" }], projects: [] },
    });
    const next = copyDayPlan(src, "2026-09-08", "2026-09-09");
    const day = next.meta.dayLog?.["2026-09-09"];
    assert.equal(day?.lunch, "Pizza");
    assert.equal(day?.periodGoals["1"], "Sand the dragster");
    assert.equal(day?.cards?.[0]?.title, "Open house");
    assert.equal(day?.crewGoals["1|A"], "keep");
    assert.equal(day?.schooltool?.["1"], undefined);
    assert.equal(day?.verify?.["1"], undefined);
    assert.ok(next.meta.config?.meetings?.some((m) => m.date === "2026-09-09" && m.title === "Faculty"));
    assert.equal(isPlannedDay(src, "2026-09-08"), true);
    assert.equal(isPlannedDay(src, "2026-09-10"), false);
  });

  it("copy through the quarter stamps every later school day", () => {
    const src = desk({
      dayLog: {
        "2026-09-08": { periodGoals: { "3": "Listen" }, crewGoals: {}, lunch: "Tacos" },
      },
    });
    const next = copyDayToRestOfQuarter(src, "2026-09-08");
    const q1 = schoolDaysInQuarter(1);
    assert.equal(next.meta.dayLog?.["2026-09-08"]?.lunch, "Tacos");
    assert.equal(next.meta.dayLog?.[q1[1]!]?.lunch, "Tacos");
    assert.equal(next.meta.dayLog?.[q1.at(-1)!]?.periodGoals["3"], "Listen");
    assert.equal(next.meta.dayLog?.[schoolDaysInQuarter(2)[0]!]?.lunch, undefined);
  });

  it("copy Q1 → Q2 duplicates grade projects onto cycles 3–4 and planned days by index", () => {
    const q1 = schoolDaysInQuarter(1);
    const q2 = schoolDaysInQuarter(2);
    const src = desk({
      dayLog: {
        [q1[0]!]: { periodGoals: { "7": "Brainstorm" }, crewGoals: {}, lunch: "Bagel" },
      },
      config: {
        projects: [
          {
            id: "prj-drag",
            title: "CO2 dragster",
            grades: [7],
            skills: ["draw"],
            cycleStart: 1,
            cycleLen: 2,
            stages: [
              { cycle: 1, slot: "D1", goal: "IDEA STAGE", skillId: "draw" },
              { cycle: 2, slot: "D1", goal: "MODELING STAGE", skillId: "model" },
            ],
          },
        ],
        crewProjects: [{ cycle: 1, period: 3, crewKey: "A", projectId: "prj-drag" }],
      },
    });
    const next = copyQuarterCurriculum(src, 1, 2);
    const copies = projectsOf(next).filter((p) => p.id === "prj-drag-q2");
    assert.equal(copies.length, 1);
    assert.equal(copies[0]?.cycleStart, 3);
    assert.equal(copies[0]?.title, "CO2 dragster (Q2)");
    assert.equal(copies[0]?.stages[0]?.cycle, 3);
    assert.equal(copies[0]?.start, q2[0]);
    assert.ok(projectsOf(next).some((p) => p.id === "prj-drag"));
    assert.equal(next.meta.dayLog?.[q2[0]!]?.lunch, "Bagel");
    assert.equal(next.meta.dayLog?.[q2[0]!]?.periodGoals["7"], "Brainstorm");
    const crew = next.meta.config?.crewProjects ?? [];
    assert.ok(crew.some((r) => r.cycle === 3 && r.projectId === "prj-drag-q2" && r.crewKey === "A"));
  });
});
