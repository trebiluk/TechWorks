import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { paintDemo, seedFakeShop, stripFakeDemo, takeRealDesk, mergeTeacherDayLog } from "./demo.ts";
import { cloneFile } from "./clone.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 3, grade: 7 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("fake data overlay", () => {
  it("does not mutate the saved desk", () => {
    const file = desk();
    const painted = paintDemo(file, "messy");
    assert.equal(file.students.length, 0);
    assert.ok(painted.students.length > 0);
    assert.ok(painted.students.every((s) => s.id.startsWith("demo-")));
    assert.ok(painted.crews.length > 0);
  });

  it("messy puts crews, marks, and project slots on an empty shop", () => {
    const painted = paintDemo(desk(), "messy");
    assert.ok(painted.students.some((s) => s.crewKey === "Forge"));
    assert.ok(painted.students.some((s) => s.markTape && s.markTape.length > 0));
    assert.ok(painted.crews.some((c) => c.name === "Volt"));
    assert.ok((painted.meta.config?.periodProjects?.["1"] ?? []).length > 0);
    assert.ok((painted.meta.config?.crewProjects ?? []).some((r) => r.crewKey === "Forge"));
    assert.ok(painted.students.some((s) => s.skills && Object.keys(s.skills).length > 0));
  });

  it("seedFakeShop is a no-op when a real roster exists", () => {
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
    const next = seedFakeShop(cloneFile(file));
    assert.equal(next.students.length, 1);
    assert.equal(next.students[0]?.id, "real-1");
  });

  it("takeRealDesk never keeps overlay workers", () => {
    const real = desk();
    const painted = paintDemo(real, "messy");
    painted.meta.config = { ...(painted.meta.config ?? {}), modules: { debug: true } };
    const kept = takeRealDesk(real, painted, true);
    assert.equal(kept.students.length, 0);
    assert.equal(kept.crews.length, 0);
    assert.equal(kept.meta.config?.modules?.debug, true);
    assert.equal(kept.meta.config?.periodProjects, undefined);
  });

  it("takeRealDesk keeps teacher pass edits while overlay is on", () => {
    const real = desk();
    const painted = paintDemo(real, "messy");
    painted.meta.dayLog = {
      "2026-09-10": {
        periodGoals: {},
        crewGoals: {},
        visits: { "1": "MEETING", "2": "CLOSED" },
        crewPhase: { "1|Forge": "IDEA STAGE" },
      },
    };
    const kept = takeRealDesk(real, painted, true);
    assert.equal(kept.meta.dayLog?.["2026-09-10"]?.visits?.["1"], "MEETING");
    assert.equal(kept.meta.dayLog?.["2026-09-10"]?.visits?.["2"], "CLOSED");
    assert.equal(kept.meta.dayLog?.["2026-09-10"]?.crewPhase, undefined);
    assert.equal(kept.students.length, 0);
  });

  it("mergeTeacherDayLog does not copy overlay crewPhase over a real day", () => {
    const real = {
      "2026-09-10": { periodGoals: {}, crewGoals: {}, visits: { "1": "OPEN" }, crewPhase: { "1|Forge": "FINISHING STAGE" } },
    };
    const next = {
      "2026-09-10": { periodGoals: {}, crewGoals: {}, visits: { "1": "MEETING" }, crewPhase: { "1|Forge": "IDEA STAGE" } },
    };
    const merged = mergeTeacherDayLog(real, next);
    assert.equal(merged?.["2026-09-10"]?.visits?.["1"], "MEETING");
    assert.equal(merged?.["2026-09-10"]?.crewPhase?.["1|Forge"], "FINISHING STAGE");
  });

  it("stripFakeDemo drops demo ids and keeps real kids", () => {
    const file = desk();
    file.students = [
      { id: "demo-1-0", first: "Spark1", last: "", period: 1, crewKey: "Forge", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
      { id: "s_real", first: "Ada", last: "", period: 1, crewKey: "Forge", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    ];
    const next = stripFakeDemo(file);
    assert.equal(next.students.length, 1);
    assert.equal(next.students[0]?.id, "s_real");
  });
});
