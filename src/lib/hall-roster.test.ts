import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import {
  HALL_ALL_HERE_COPY,
  HALL_EMPTY_COPY,
  ensureP6StudyHall,
  hallAwayLine,
  p6HallKids,
  p6StudyHallClass,
  profileHallAliases,
} from "./hall-roster.ts";
import { paintDemo, seedFakeShop, takeRealDesk } from "./demo.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 6, grade: 5 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("P6 study hall roster", () => {
  it("ships an empty Solvay P6 class — no invented kids", () => {
    const cls = p6StudyHallClass(desk());
    assert.equal(cls.id, "p6-study-hall");
    assert.equal(cls.period, 6);
    assert.equal(cls.rosterStatus, "empty");
    assert.deepEqual(cls.roster.A, []);
    assert.deepEqual(cls.roster.B, []);
    assert.equal(profileHallAliases(desk()).length, 0);
    assert.equal(ensureP6StudyHall(desk()).students.length, 0);
  });

  it("hydrates loaded profile aliases onto period 6", () => {
    const file = desk();
    file.meta.config = {
      classes: {
        "p6-study-hall": {
          id: "p6-study-hall",
          period: 6,
          course: "STUDY HALL",
          section: 10,
          room: "136",
          rosterStatus: "loaded",
          roster: { A: ["Spark", "(alias)"], B: ["Kerf"] },
        },
      },
    };
    const next = ensureP6StudyHall(file);
    assert.equal(next.students.length, 2);
    assert.ok(next.students.every((s) => s.period === 6 && s.last === "" && !s.legalFirst && !s.legalLast));
    assert.equal(next.students.find((s) => s.first === "Spark")?.abDay, "A");
    assert.equal(next.students.find((s) => s.first === "Kerf")?.abDay, "B");
    assert.equal(p6HallKids(next, "A").map((s) => s.first).join(","), "Spark");
    assert.equal(p6HallKids(next, "B").map((s) => s.first).join(","), "Kerf");
  });

  it("empty hall copy is No class loaded — never Everyone is in the room", () => {
    assert.equal(hallAwayLine([], 0), HALL_EMPTY_COPY);
    assert.equal(hallAwayLine(p6HallKids(desk(), "A"), 0), HALL_EMPTY_COPY);
    assert.ok(!HALL_EMPTY_COPY.includes("Everyone"));
    const kid = {
      id: "h1",
      first: "Bit",
      last: "",
      period: 6,
      crewKey: "Hall",
      days: [],
      bonus: 0,
      deduct: 0,
      clutch: 0,
      opening: 0,
    };
    assert.equal(hallAwayLine([kid], 0), HALL_ALL_HERE_COPY);
    assert.equal(hallAwayLine([kid], 1), "");
  });

  it("Fake data paints a demo P6 SH roster on both A and B days", () => {
    const painted = paintDemo(desk(), "week");
    const hall = painted.students.filter((s) => s.period === 6);
    assert.ok(hall.length >= 8);
    assert.ok(hall.every((s) => s.id.startsWith("demo-")));
    assert.ok(hall.every((s) => s.last === "" && !s.legalFirst && !s.legalLast));
    assert.ok(p6HallKids(painted, "A").length >= 4);
    assert.ok(p6HallKids(painted, "B").length >= 4);
    const kept = takeRealDesk(desk(), painted, true);
    assert.equal(kept.students.filter((s) => s.period === 6).length, 0);
  });

  it("Fake data still paints Hall when a Tech roster already exists", () => {
    const file = desk();
    file.students = [
      {
        id: "real-1",
        first: "Ada",
        last: "",
        period: 1,
        crewKey: "Forge",
        days: [],
        bonus: 0,
        deduct: 0,
        clutch: 0,
        opening: 0,
      },
    ];
    const next = seedFakeShop(file);
    assert.equal(next.students.filter((s) => s.id === "real-1").length, 1);
    assert.ok(next.students.some((s) => s.period === 6 && s.id.startsWith("demo-")));
    assert.ok(p6HallKids(next, "A").length > 0);
  });
});
