import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { assignCrewProject, activitySpan, createActivityPlan, crewProjectId, ensureProjects, jobCardOf, pinDayActivity, plannedShopDays, projectsOf, putOnPeriod, pullFromPeriod, setActivitySpan, slotsOf, DEFAULT_PROJECTS } from "./projects.ts";

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
    students: [
      { id: "a", first: "Ada", last: "", period: 1, crewKey: "Forge", skills: {}, days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
      { id: "b", first: "Bea", last: "", period: 1, crewKey: "Forge", skills: {}, days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
      { id: "c", first: "Cal", last: "", period: 1, crewKey: "Volt", skills: {}, days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    ],
  };
}

function seeded(): EconomyFile {
  const d = desk();
  d.meta.config = {
    ...(d.meta.config ?? {}),
    authoredPlans: true,
    projects: DEFAULT_PROJECTS,
    periodProjects: { "1": ["prj6"], "2": ["prj8"], "3": ["prj7"] },
  };
  return d;
}

describe("empty desk", () => {
  it("does not inject factory units", () => {
    const file = ensureProjects(desk());
    assert.equal(projectsOf(file).length, 0);
    assert.deepEqual(slotsOf(file, 1), []);
    const job = jobCardOf(file, 1, "2026-09-14");
    assert.equal(job.question, "");
    assert.equal(job.today, "");
  });

  it("parks a new activity onto the plan book dates", () => {
    const made = createActivityPlan(desk(), {
      name: "Brainstorm levers",
      belong: "project",
      period: 1,
      grades: [6],
      dates: ["2026-09-14", "2026-09-15"],
      prove: "both",
      ask: "How can a small force move a bigger load?",
    });
    assert.equal(projectsOf(made.file).length, 1);
    assert.equal(slotsOf(made.file, 1)[0]?.id, made.projectId);
    const job = jobCardOf(made.file, 1, "2026-09-14");
    assert.equal(job.question, "How can a small force move a bigger load?");
    assert.equal(job.title, "Brainstorm levers");
  });

  it("stores the shop move, skill, and goggles", () => {
    const made = createActivityPlan(desk(), {
      name: "Levers",
      belong: "project",
      period: 1,
      grades: [6],
      dates: ["2026-09-14"],
      ask: "How can a small force move a bigger load?",
      do: "Sketch one machine.",
      done: "Point to the load.",
      skillId: "draw",
      goal: "IDEA STAGE",
      rules: ["Goggles on"],
    });
    const job = jobCardOf(made.file, 1, "2026-09-14");
    assert.equal(job.today, "Sketch one machine.");
    assert.ok(job.rules.includes("Goggles on"));
    assert.equal(job.skillId, "draw");
  });
});

describe("job card", () => {
  it("puts the G6 modeling challenge on P1 for D3", () => {
    const file = ensureProjects(seeded());
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
    const job = jobCardOf(ensureProjects(seeded()), 1, "2026-09-10");
    assert.doesNotMatch(job.stemLine, /SCIENCE · TECHNOLOGY/);
    assert.match(job.stemLine, /[a-z]/);
  });

  it("keeps G7 rules on the CO2 unit", () => {
    const job = jobCardOf(ensureProjects(seeded()), 3, "2026-09-10");
    assert.equal(job.grade, 7);
    assert.equal(job.question, "How does shape change speed?");
    assert.ok(job.rules.includes("Goggles on"));
    assert.ok(job.rules.includes("No extra mass after weigh-in"));
  });

  it("teacher MODELING cycle goal beats calendar DESIGN", () => {
    const file = ensureProjects(seeded());
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
    const file = ensureProjects(seeded());
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

describe("period slots", () => {
  it("starts P1 on Simple machines, then can hold a second job", () => {
    const file = ensureProjects(seeded());
    const start = slotsOf(file, 1).map((p) => p.id);
    assert.equal(start[0], "prj6");
    const two = putOnPeriod(file, 1, "prj-figure");
    assert.deepEqual(
      slotsOf(two, 1).map((p) => p.id),
      ["prj6", "prj-figure"],
    );
    const job = jobCardOf(two, 1, "2026-09-10");
    assert.equal(job.question, "How can a small force move a bigger load?");
  });

  it("lets a crew take slot 2 without moving the class job", () => {
    let file = putOnPeriod(ensureProjects(seeded()), 1, "prj-figure");
    file = assignCrewProject(file, 1, 1, "Volt", "prj-figure");
    assert.equal(crewProjectId(file, 1, 1, "Volt"), "prj-figure");
    assert.equal(crewProjectId(file, 1, 1, "Forge"), "prj6");
    assert.equal(jobCardOf(file, 1, "2026-09-10").title, "Simple machines");
  });

  it("taking the extra job off a period restores one slot", () => {
    const two = putOnPeriod(ensureProjects(seeded()), 1, "prj-figure");
    const one = pullFromPeriod(two, 1, "prj-figure");
    assert.deepEqual(
      slotsOf(one, 1).map((p) => p.id),
      ["prj6"],
    );
  });
});

describe("plan book spans", () => {
  it("infers modeling as two days on the default unit", () => {
    const p = projectsOf(ensureProjects(seeded())).find((x) => x.id === "prj6");
    assert.ok(p);
    assert.equal(activitySpan(p, "act-brain"), 1);
    assert.equal(activitySpan(p, "act-model"), 2);
    assert.equal(activitySpan(p, "act-finish"), 2);
    assert.equal(plannedShopDays(p), 8);
  });

  it("shortening modeling to one day relayouts the cycle grid", () => {
    const file = setActivitySpan(ensureProjects(seeded()), "prj6", "act-model", 1);
    const p = projectsOf(file).find((x) => x.id === "prj6");
    assert.ok(p);
    assert.equal(activitySpan(p, "act-model"), 1);
    assert.equal(p.stages.filter((s) => s.activityId === "act-model").length, 1);
  });

  it("parking an activity on one date does not rewrite the unit", () => {
    let file = ensureProjects(seeded());
    file = pinDayActivity(file, "2026-09-10", 1, "act-draw");
    const job = jobCardOf(file, 1, "2026-09-10");
    assert.match(job.today, /Draw the machine/i);
    const p = projectsOf(file).find((x) => x.id === "prj6");
    assert.ok(p);
    assert.equal(activitySpan(p, "act-model"), 2);
  });
});
