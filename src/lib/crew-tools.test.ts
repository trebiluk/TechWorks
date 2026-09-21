import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import {
  BENCH,
  addPeriodCrew,
  copyCrewLooks,
  crewAt,
  crewRulesOf,
  dealCrews,
  dropPeriodCrew,
  nextPeriodCrewKey,
  setCrewProfile,
  setCrewRules,
  setStudentCrew,
} from "./crew-desk.ts";

function kid(id: string, crewKey: string): RawStudent {
  return {
    id,
    first: id,
    last: "Hidden",
    period: 1,
    crewKey,
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    skills: {},
    affect: {},
  };
}

function blank(): EconomyFile {
  return {
    meta: { title: "Test", quarterName: "Q1", currentWeek: 1, codes: { "3": 25 } },
    crews: [
      { period: 1, key: "Crew A", name: "Crew A" },
      { period: 1, key: "Crew B", name: "Crew B" },
    ],
    students: [kid("a", BENCH), kid("b", BENCH), kid("c", BENCH), kid("d", BENCH)],
  };
}

describe("crew tools", () => {
  it("size pack is stored and caps a deal", () => {
    let file = setCrewRules(blank(), { min: 2, max: 2, crewsMax: 8 });
    assert.equal(crewRulesOf(file).max, 2);
    file = dealCrews(file, 1, "2026-09-14");
    const a = file.students.filter((s) => crewAt(s, "2026-09-14") === "Crew A");
    const b = file.students.filter((s) => crewAt(s, "2026-09-14") === "Crew B");
    assert.equal(a.length, 2);
    assert.equal(b.length, 2);
  });

  it("drop seats the crew on the bench", () => {
    let file = setStudentCrew(blank(), "a", "Crew A", "2026-09-14");
    file = dropPeriodCrew(file, 1, "Crew A", "2026-09-14");
    assert.equal(crewAt(file.students[0], "2026-09-14"), BENCH);
    assert.equal(file.crews.some((c) => c.key === "Crew A" && c.period === 1), false);
  });

  it("restores a dropped letter even when the period is at max", () => {
    let file = dropPeriodCrew(blank(), 1, "Crew A", "2026-09-14");
    file = setCrewRules(file, { min: 2, max: 4, crewsMax: 1 });
    assert.equal(nextPeriodCrewKey(file, 1), "Crew A");
    file = addPeriodCrew(file, 1);
    assert.equal(file.crews.some((c) => c.period === 1 && c.key === "Crew A"), true);
  });

  it("does not grow past max when there is no hole", () => {
    const file = setCrewRules(blank(), { min: 2, max: 4, crewsMax: 2 });
    assert.equal(nextPeriodCrewKey(file, 1), null);
    assert.equal(addPeriodCrew(file, 1), file);
  });

  it("copy look paints the same key on another period", () => {
    let file = addPeriodCrew(blank(), 3);
    file = setCrewProfile(file, 1, "Crew A", { name: "Volt", motto: "Hold the lead", color: "#22D3EE", icon: "⚡" });
    file = copyCrewLooks(file, 1, 3);
    const hit = file.crews.find((c) => c.period === 3 && c.key === "Crew A");
    assert.equal(hit?.name, "Volt");
    assert.equal(hit?.motto, "Hold the lead");
    assert.equal(hit?.color, "#22D3EE");
    assert.equal(hit?.icon, "⚡");
  });
});
