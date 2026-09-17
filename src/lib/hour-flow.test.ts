import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { setTeachAsk, setTeachDo, setTeachMaterials } from "./teach.ts";
import { cleanupJobsOf, dayHourStatus, hourAgenda, hourKit, saveAgendaLine, setCleanupJobs, wallMode } from "./hour-flow.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 7 },
      ],
      config: { currentCycle: 1, schedule: "regular" },
    },
    crews: [],
    students: [],
  };
}

describe("hour flow", () => {
  it("agenda 02 is Do this now, and a write lands on Teach and the wall cards", () => {
    let file = setTeachDo(desk(), "2026-09-15", 1, "Sketch seven logo marks.");
    const cards = hourAgenda(file, "2026-09-15", 1);
    assert.equal(cards.find((c) => c.id === "goal")?.body, "Sketch seven logo marks.");
    file = saveAgendaLine(file, "2026-09-15", 1, "now", "Sit at a regular table.");
    file = saveAgendaLine(file, "2026-09-15", 1, "behave", "Choose → work → focus → cleanup.");
    const next = hourAgenda(file, "2026-09-15", 1);
    assert.equal(next.find((c) => c.id === "now")?.body, "Sit at a regular table.");
    assert.equal(next.find((c) => c.id === "behave")?.body.includes("cleanup"), true);
  });

  it("empty Then drops so the wall plate flexes", () => {
    const file = setTeachDo(desk(), "2026-09-15", 1, "Sketch seven logo marks.");
    const ids = hourAgenda(file, "2026-09-15", 1).map((c) => c.id);
    assert.equal(ids.includes("next"), false);
    assert.equal(ids.includes("goal"), true);
  });

  it("day strip marks a period set once Ask or Do exists", () => {
    const file = setTeachAsk(desk(), "2026-09-15", 2, "What should a personal logo say?");
    const rows = dayHourStatus(file, "2026-09-15", [1, 2]);
    assert.equal(rows[0]?.set, false);
    assert.equal(rows[1]?.set, true);
  });

  it("cleanup jobs persist a teacher rewrite", () => {
    const file = setCleanupJobs(desk(), { shop: ["Hang goggles", "Sweep"], extra: "Caught extra = $5" });
    const jobs = cleanupJobsOf(file);
    assert.deepEqual(jobs.shop, ["Hang goggles", "Sweep"]);
    assert.equal(jobs.room.length, 5);
    assert.match(jobs.extra, /\$5/);
  });

  it("wall is idle on a weekend", () => {
    assert.equal(wallMode(desk(), "2026-09-19"), "idle");
  });

  it("wall follows the bell: enter between, agenda mid-hour, cleanup last minutes", () => {
    const file = desk();
    const day = "2026-09-15";
    assert.equal(wallMode(file, day, new Date(2026, 8, 15, 7, 50, 0)), "enter");
    assert.equal(wallMode(file, day, new Date(2026, 8, 15, 8, 10, 0)), "agenda");
    assert.equal(wallMode(file, day, new Date(2026, 8, 15, 8, 32, 0)), "cleanup");
    assert.equal(wallMode(file, day, new Date(2026, 8, 15, 8, 36, 0)), "enter");
    assert.equal(wallMode(file, day, new Date(2026, 8, 15, 15, 10, 0)), "agenda");
  });

  it("Need line is the kit kids see on Enter", () => {
    const file = setTeachMaterials(desk(), "2026-09-15", 1, "Chromebooks · one scrap of pine");
    assert.match(hourKit(file, "2026-09-15", 1), /Chromebooks/);
  });
});
