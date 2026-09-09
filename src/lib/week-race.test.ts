import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { assignmentOf, codeOn, raceDays, todayJobs, weekRace, yesterdaySchool } from "./week-race.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period" | "crewKey">): RawStudent {
  return {
    last: "",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    sem: "Q1",
    ...partial,
  };
}

function blank(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25, Assist: 10 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 8 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [
      { period: 1, key: "Crew A", name: "Sprocket" },
      { period: 1, key: "Crew B", name: "Rivet" },
      { period: 2, key: "Crew A", name: "Bit" },
    ],
    students: [],
  };
}

describe("week race", () => {
  it("locks standings on yesterday, not today", () => {
    assert.equal(yesterdaySchool("2026-09-09"), "2026-09-08");
    assert.deepEqual(raceDays("2026-09-09"), ["2026-09-08"]);
    assert.ok(!raceDays("2026-09-09").includes("2026-09-09"));
  });

  it("ranks classes and crews on earned vs possible as of yesterday", () => {
    const f = blank();
    f.students = [
      kid({ id: "a", first: "Ace", period: 1, crewKey: "Crew A", marks: { "2026-09-08": "3", "2026-09-09": "1" } }),
      kid({ id: "b", first: "Bea", period: 1, crewKey: "Crew A", marks: { "2026-09-08": "3", "2026-09-09": "1" } }),
      kid({ id: "c", first: "Cal", period: 1, crewKey: "Crew B", marks: { "2026-09-08": "2", "2026-09-09": "3" } }),
      kid({ id: "d", first: "Dot", period: 2, crewKey: "Crew A", marks: { "2026-09-08": "1", "2026-09-09": "3" } }),
    ];
    const race = weekRace(f, "2026-09-09");
    assert.equal(race.asOf, "2026-09-08");
    assert.equal(codeOn(f.students[0]!, "2026-09-08"), "3");
    const p1 = race.classes.find((c) => c.period === 1)!;
    const p2 = race.classes.find((c) => c.period === 2)!;
    assert.equal(p1.earned, 3 + 3 + 2);
    assert.equal(p1.possible, 9);
    assert.equal(p2.earned, 1);
    assert.equal(p2.possible, 3);
    assert.equal(p1.rank, 1);
    assert.equal(p1.hold, true);
    assert.equal(p1.gapPct, 0);
    assert.equal(p2.rank, 2);
    assert.equal(p2.hold, false);
    assert.ok(p2.gapPct > 0);
    const sprocket = race.crews.find((c) => c.name === "Sprocket")!;
    const rivet = race.crews.find((c) => c.name === "Rivet")!;
    assert.equal(sprocket.earned, 6);
    assert.equal(sprocket.possible, 6);
    assert.equal(sprocket.hold, true);
    assert.equal(sprocket.gapPct, 0);
    assert.equal(rivet.pct < sprocket.pct, true);
    assert.ok(rivet.gapPct > 0);
    assert.equal(race.shop.earned, 3 + 3 + 2 + 1);
  });

  it("lets same-percent crews share the crown even if one has more workers", () => {
    const f = blank();
    f.students = [
      kid({ id: "a", first: "Ace", period: 1, crewKey: "Crew A", marks: { "2026-09-08": "3" } }),
      kid({ id: "b", first: "Bea", period: 1, crewKey: "Crew A", marks: { "2026-09-08": "3" } }),
      kid({ id: "c", first: "Cal", period: 2, crewKey: "Crew A", marks: { "2026-09-08": "3" } }),
    ];
    const race = weekRace(f, "2026-09-09");
    const holders = race.crews.filter((c) => c.hold);
    assert.equal(holders.length, 2);
    assert.ok(holders.every((c) => c.pct === 100));
  });

  it("excuses A/E from possible and treats a miss as 0 of 3", () => {
    const f = blank();
    f.students = [
      kid({ id: "a", first: "Ace", period: 1, crewKey: "Crew A", marks: { "2026-09-08": "A" } }),
      kid({ id: "b", first: "Bea", period: 1, crewKey: "Crew B", marks: { "2026-09-08": "" } }),
    ];
    const race = weekRace(f, "2026-09-09");
    const p1 = race.classes.find((c) => c.period === 1)!;
    assert.equal(p1.possible, 3);
    assert.equal(p1.earned, 0);
  });

  it("pulls project, activity, and assignment onto today’s jobs", () => {
    const jobs = todayJobs(blank(), "2026-09-09");
    assert.ok(jobs.length >= 2);
    const p1 = jobs.find((j) => j.period === 1)!;
    assert.ok(p1.project.length > 1);
    assert.ok(p1.activity.length > 1);
    assert.equal(p1.assignment, assignmentOf(p1.project, p1.cycle));
    assert.match(p1.assignment, /Cycle/);
    assert.ok(p1.expect >= 1);
  });
});
