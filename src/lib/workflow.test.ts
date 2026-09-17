import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { todayIso } from "./calendar.ts";
import { setTeachDo } from "./teach.ts";
import { setSchooltoolDone } from "./store.ts";
import { nextJob } from "./workflow.ts";

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

describe("next job", () => {
  it("before first bell, an empty hour is Plan P1, not a leftover score", () => {
    const date = todayIso();
    let file = setSchooltoolDone(desk(), date, 1, true);
    file = setTeachDo(file, date, 2, "Sand the blank.");
    const job = nextJob(file, new Date(2026, 8, 15, 7, 20, 0));
    assert.equal(job.go, "teach");
    assert.equal(job.period, 1);
  });
});
