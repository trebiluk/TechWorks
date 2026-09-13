import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { createActivityPlan, pinnedActivityId } from "./projects.ts";
import { laySlots, setTeachAsk } from "./teach.ts";
import { hydrateWeekFromTeach, saveTeachAsk, upsertPlanFromTeach } from "./plan-sync.ts";

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

describe("plan sync", () => {
  it("typing on Teach parks a unit the plan book can see", () => {
    let file = saveTeachAsk(desk(), "2026-09-14", 1, "How can a small force move a bigger load?");
    assert.ok(pinnedActivityId(file, 1, "2026-09-14"));
    file = upsertPlanFromTeach(file, "2026-09-14", 1);
    assert.ok(pinnedActivityId(file, 1, "2026-09-14"));
  });

  it("Listen plate reads the parked ask", () => {
    const made = createActivityPlan(desk(), {
      name: "Levers",
      belong: "project",
      period: 1,
      grades: [6],
      dates: ["2026-09-14"],
      ask: "How can a small force move a bigger load?",
      do: "Sketch one lever.",
    });
    const slots = laySlots(made.file, "2026-09-14", 1);
    const listen = slots.find((s) => s.id === "listen" || s.kind === "listen");
    const work = slots.find((s) => s.kind === "work");
    assert.equal(listen?.line, "How can a small force move a bigger load?");
    assert.equal(work?.line, "Sketch one lever.");
  });

  it("hydrates a teach-only day onto the week", () => {
    const taught = setTeachAsk(desk(), "2026-09-15", 1, "What makes a crew efficient?");
    const next = hydrateWeekFromTeach(taught, 1, ["2026-09-14", "2026-09-15"]);
    assert.ok(pinnedActivityId(next, 1, "2026-09-15"));
  });
});
