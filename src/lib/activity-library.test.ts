import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import type { ProjectActivity, ShopProject } from "./projects.ts";
import { listActivities } from "./activity-library.ts";

function act(partial: Partial<ProjectActivity> & { id: string; name: string; minutes?: number; kit?: string }): ProjectActivity {
  return { skillId: "draw", goal: "IDEA STAGE", ...partial };
}

function project(partial: Partial<ShopProject> & { id: string; title: string; grades: number[]; activities: ProjectActivity[] }): ShopProject {
  return { skills: [], stages: [], ...partial };
}

function desk(projects: ShopProject[]): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [{ period: 3, grade: 7 }],
      config: { projects, authoredPlans: true },
      dayLog: {},
    },
    crews: [],
    students: [{ id: "s1", first: "Altair", last: "", period: 3, crewKey: "A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 }],
  };
}

function bridge(): EconomyFile {
  return desk([
    project({
      id: "prj-bridge",
      title: "Bridges",
      grades: [7],
      activities: [
        act({ id: "act-gusset", name: "Gusset plates", skillId: "structures", minutes: 25, kit: "cardboard" }),
        act({ id: "act-paper", name: "Paper bridge test", skillId: "testing", minutes: 30, kit: "paper" }),
        act({ id: "act-truss", name: "Truss sketch", skillId: "design", minutes: 15, kit: "pencil" }),
        act({ id: "act-long", name: "Load lecture", skillId: "present", minutes: 50, kit: "notes" }),
      ],
    }),
    project({
      id: "prj-saw",
      title: "Shop intro",
      grades: [6],
      activities: [act({ id: "act-saw", name: "Saw safety", skillId: "safety", minutes: 20, kit: "goggles" })],
    }),
  ]);
}

describe("activity library", () => {
  it("lists every project in name order", () => {
    const names = listActivities(bridge()).map((row) => row.name);
    assert.deepEqual(names, ["Gusset plates", "Load lecture", "Paper bridge test", "Saw safety", "Truss sketch"]);
  });

  it("filters by grade", () => {
    const names = listActivities(bridge(), { grade: 7 }).map((row) => row.name);
    assert.deepEqual(names, ["Gusset plates", "Load lecture", "Paper bridge test", "Truss sketch"]);
    assert.deepEqual(listActivities(bridge(), { grade: 6 }).map((row) => row.name), ["Saw safety"]);
  });

  it("filters by max minutes, including the cap", () => {
    const names = listActivities(bridge(), { grade: 7, maxMin: 30 }).map((row) => `${row.name} ${row.minutes}`);
    assert.deepEqual(names, ["Gusset plates 25", "Paper bridge test 30", "Truss sketch 15"]);
    assert.equal(listActivities(bridge(), { maxMin: 10 }).length, 0);
  });

  it("filters by kit and by skill", () => {
    assert.deepEqual(listActivities(bridge(), { kit: "Paper" }).map((row) => row.name), ["Paper bridge test"]);
    assert.deepEqual(listActivities(bridge(), { skill: "Design" }).map((row) => row.name), ["Truss sketch"]);
    assert.equal(listActivities(bridge(), { kit: "any", skill: "any" }).length, 5);
  });

  it("returns empty when nothing matches", () => {
    assert.deepEqual(listActivities(bridge(), { grade: 8 }), []);
    assert.deepEqual(listActivities(bridge(), { grade: 7, kit: "clay" }), []);
  });

  it("uses 45 minutes and shop kit when the activity does not say", () => {
    const file = desk([
      project({
        id: "prj-plain",
        title: "Plain",
        grades: [7],
        activities: [act({ id: "act-plain", name: "Plain build", skillId: "draw", days: 1 })],
      }),
    ]);
    const [row] = listActivities(file);
    assert.equal(row.minutes, 45);
    assert.equal(row.kit, "shop");
    assert.equal(row.skill, "draw");
    assert.equal(listActivities(file, { maxMin: 30 }).length, 0);
  });

  it("does not change the desk", () => {
    const file = bridge();
    const before = structuredClone(file);
    listActivities(file, { grade: 7, maxMin: 30, kit: "paper", skill: "testing" });
    assert.deepEqual(file, before);
  });
});
