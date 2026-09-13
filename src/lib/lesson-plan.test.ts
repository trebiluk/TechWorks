import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { createActivityPlan } from "./projects.ts";
import { lessonPlanOf } from "./lesson-plan.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [{ period: 1, grade: 6 }],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("lesson plan", () => {
  it("matrices the parked skill against NY MST 5", () => {
    const made = createActivityPlan(desk(), {
      name: "Levers",
      belong: "project",
      period: 1,
      grades: [6],
      dates: ["2026-09-14", "2026-09-15"],
      ask: "How can a small force move a bigger load?",
      do: "Sketch one machine.",
      skillId: "draw",
      goal: "IDEA STAGE",
      rules: ["Goggles on"],
    });
    const plan = lessonPlanOf(made.file, 1, ["2026-09-14", "2026-09-15", "2026-09-16"]);
    assert.equal(plan.ask, "How can a small force move a bigger load?");
    assert.ok(plan.rules.includes("Goggles on"));
    assert.equal(plan.days[0]?.do, "Sketch one machine.");
    const draw = plan.matrix.find((r) => r.skillId === "draw");
    assert.ok(draw);
    assert.ok(draw.mst.includes("S1"));
    assert.deepEqual(draw.days.slice(0, 2), [true, true]);
    assert.match(plan.standard, /MST/);
  });
});
