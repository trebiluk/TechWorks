import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { ensureProjects, jobCardOf } from "./projects.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 8 },
        { period: 3, grade: 7 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("job card", () => {
  it("puts the G6 modeling challenge on P1 for D3", () => {
    const file = ensureProjects(desk());
    const job = jobCardOf(file, 1, "2026-09-10");
    assert.equal(job.grade, 6);
    assert.equal(job.question, "How can a small force move a bigger load?");
    assert.deepEqual(job.rules, ["One tool at a time", "Goggles on"]);
    assert.equal(job.today, "Build a model that lifts or moves a load.");
    assert.equal(job.done, "Show the load move. Say which simple machine it is.");
    assert.equal(job.lookFor, "3 = working the model, not the phone.");
    assert.match(job.stemLine, /force/i);
    assert.equal(job.stage, "Modeling");
  });

  it("uses one STEM sentence, not four capital words", () => {
    const job = jobCardOf(ensureProjects(desk()), 1, "2026-09-10");
    assert.doesNotMatch(job.stemLine, /SCIENCE · TECHNOLOGY/);
    assert.match(job.stemLine, /[a-z]/);
  });

  it("keeps G7 rules on the CO2 unit", () => {
    const job = jobCardOf(ensureProjects(desk()), 3, "2026-09-10");
    assert.equal(job.grade, 7);
    assert.equal(job.question, "How does shape change speed?");
    assert.ok(job.rules.includes("Goggles on"));
    assert.ok(job.rules.includes("No extra mass after weigh-in"));
  });

  it("teacher MODELING cycle goal beats calendar DESIGN", () => {
    const file = ensureProjects(desk());
    file.meta.config = {
      ...(file.meta.config ?? {}),
      currentCycle: 1,
      cycleGoals: { "6": "MODELING STAGE", "1|6": "MODELING STAGE" },
    };
    const job = jobCardOf(file, 1, "2026-09-09");
    assert.equal(job.stage, "Modeling");
    assert.equal(job.today, "Build a model that lifts or moves a load.");
  });

  it("calendar DESIGN beats leftover IDEA cycle default", () => {
    const file = ensureProjects(desk());
    file.meta.config = {
      ...(file.meta.config ?? {}),
      currentCycle: 1,
      cycleGoals: { "6": "IDEA STAGE", "1|6": "IDEA STAGE" },
    };
    const job = jobCardOf(file, 1, "2026-09-09");
    assert.equal(job.stage, "Design");
    assert.match(job.today, /Draw the machine/i);
  });
});
