import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { compactFile } from "./compact.ts";
import { createActivityPlan } from "./projects.ts";
import { activityCsv, bookOf, setActivityNote, setActivityScore, setTrackedSkills } from "./activity-score.ts";
import { rosterScopeStart } from "./year-roster.ts";
import { skillScore } from "./skills.ts";

function kid(id: string, first: string): RawStudent {
  return { id, first, last: "", period: 2, crewKey: "A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 };
}

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: 0 },
      bell: [{ period: 2, grade: 8 }],
    },
    crews: [],
    students: [kid("a", "Pixel"), kid("b", "Nova"), kid("c", "Orbit")],
  };
}

describe("activity scores", () => {
  it("keeps two skills and three workers after a reload compact", () => {
    const made = createActivityPlan(desk(), {
      name: "Catapult",
      belong: "project",
      period: 2,
      grades: [8],
      dates: ["2026-09-29"],
      skillIds: ["draw", "measure"],
      scoreMode: "rubric",
    });
    let file = setTrackedSkills(made.file, made.projectId, made.activityId, ["draw", "measure"]);
    file = setActivityScore(file, made.activityId, "a", "draw", 3, { mode: "rubric", projectId: made.projectId });
    file = setActivityScore(file, made.activityId, "b", "measure", 2, { mode: "rubric", projectId: made.projectId });
    file = setActivityScore(file, made.activityId, "c", "draw", 4, { mode: "rubric", projectId: made.projectId });
    file = setActivityNote(file, made.activityId, "a", "Clean sketch");
    const kept = compactFile(file);
    const book = bookOf(kept, made.activityId);
    assert.deepEqual(book.skills, ["draw", "measure"]);
    assert.equal(book.cells?.a?.scores?.draw, 3);
    assert.equal(book.cells?.a?.note, "Clean sketch");
    assert.equal(book.cells?.b?.scores?.measure, 2);
    assert.equal(book.cells?.c?.scores?.draw, 4);
    assert.equal(skillScore(kept.students[0], "draw"), 3);
    const csv = activityCsv(kept, made.activityId, kept.students, ["draw", "measure"]);
    assert.match(csv, /Pixel/);
    assert.match(csv, /Nova/);
    assert.match(csv, /Orbit/);
    assert.doesNotMatch(csv, /legal/i);
  });
});

describe("roster opens on my class", () => {
  it("uses the last chip, then the live period", () => {
    assert.deepEqual(rosterScopeStart("8", 2), { kind: "period", period: 8 });
    assert.deepEqual(rosterScopeStart(null, 2), { kind: "period", period: 2 });
    assert.deepEqual(rosterScopeStart("hall", 2), { kind: "hall" });
    assert.deepEqual(rosterScopeStart("all", 2), { kind: "all" });
    assert.deepEqual(rosterScopeStart(null, 6), { kind: "hall" });
  });
});
