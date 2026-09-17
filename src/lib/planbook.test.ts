import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { setTeachAsk, setTeachDo, setTeachMaterials, teachDay } from "./teach.ts";
import { pinDayActivity, pinnedActivityId } from "./projects.ts";
import {
  alignWeekDays,
  copyHour,
  copyHourThroughWeek,
  copyHourToSameGrade,
  copyHourToEmptySameGrade,
  copyPrevWeek,
  hourIsSet,
  hourTargets,
  planCell,
  sameGradePeriods,
  sendHour,
} from "./planbook.ts";

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
        { period: 3, grade: 6 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("planbook week", () => {
  it("aligns Tuesday to Tuesday across a short week", () => {
    const pairs = alignWeekDays(["2026-09-08", "2026-09-09", "2026-09-10"], ["2026-09-15", "2026-09-17"]);
    assert.deepEqual(
      pairs.map((p) => p.from + "→" + p.to),
      ["2026-09-08→2026-09-15", "2026-09-10→2026-09-17"],
    );
  });

  it("copies one hour including materials and the activity pin, not the live beat", () => {
    let file = setTeachAsk(desk(), "2026-09-14", 1, "How does a lever help?");
    file = setTeachDo(file, "2026-09-14", 1, "Sketch one machine.");
    file = setTeachMaterials(file, "2026-09-14", 1, "Rulers · goggles");
    file = pinDayActivity(file, "2026-09-14", 1, "act-lever");
    const next = copyHour(file, "2026-09-14", 1, "2026-09-15", 3);
    assert.equal(teachDay(next, "2026-09-15", 3).ask, "How does a lever help?");
    assert.equal(teachDay(next, "2026-09-15", 3).materials, "Rulers · goggles");
    assert.equal(pinnedActivityId(next, 3, "2026-09-15"), "act-lever");
    assert.equal(teachDay(next, "2026-09-15", 3).pin, undefined);
    assert.equal(hourIsSet(next, "2026-09-15", 3), true);
  });

  it("same-grade copy hits the other grade 6, not grade 7", () => {
    assert.deepEqual(sameGradePeriods(desk(), 1), [3]);
    let file = setTeachAsk(desk(), "2026-09-14", 1, "What is kerf?");
    file = copyHourToSameGrade(file, "2026-09-14", 1);
    assert.equal(teachDay(file, "2026-09-14", 3).ask, "What is kerf?");
    assert.equal(teachDay(file, "2026-09-14", 2).ask, undefined);
  });

  it("empty same-grade copy skips an hour that is already set", () => {
    let file = setTeachAsk(desk(), "2026-09-14", 1, "What is kerf?");
    file = setTeachAsk(file, "2026-09-14", 3, "Keep me");
    file = copyHourToEmptySameGrade(file, "2026-09-14", 1);
    assert.equal(teachDay(file, "2026-09-14", 3).ask, "Keep me");
    file = desk();
    file = setTeachAsk(file, "2026-09-14", 1, "What is kerf?");
    file = copyHourToEmptySameGrade(file, "2026-09-14", 1);
    assert.equal(teachDay(file, "2026-09-14", 3).ask, "What is kerf?");
  });

  it("repeat through the week stamps later school days of that period", () => {
    let file = setTeachDo(desk(), "2026-09-14", 2, "Sand the blank.");
    file = copyHourThroughWeek(file, "2026-09-14", 2);
    assert.equal(teachDay(file, "2026-09-15", 2).do, "Sand the blank.");
    assert.equal(teachDay(file, "2026-09-16", 2).do, "Sand the blank.");
    assert.equal(teachDay(file, "2026-09-15", 1).do, undefined);
  });

  it("last week → this week follows weekday, not array index", () => {
    let file = setTeachAsk(desk(), "2026-09-08", 1, "Tuesday ask");
    file = setTeachAsk(file, "2026-09-09", 1, "Wednesday ask");
    const next = copyPrevWeek(file, "2026-09-15");
    assert.equal(planCell(next, "2026-09-15", 1).ask, "Tuesday ask");
    assert.equal(planCell(next, "2026-09-16", 1).ask, "Wednesday ask");
  });

  it("empty source does not wipe a filled dest", () => {
    let file = setTeachDo(desk(), "2026-09-15", 1, "Keep me.");
    file = copyHour(file, "2026-09-14", 1, "2026-09-15", 1);
    assert.equal(teachDay(file, "2026-09-15", 1).do, "Keep me.");
  });

  it("sends one hour to picked empty slots and skips a filled hour", () => {
    let file = setTeachDo(desk(), "2026-09-14", 1, "Cut the blanks.");
    file = setTeachDo(file, "2026-09-14", 3, "Keep me.");
    const hit = sendHour(file, "2026-09-14", 1, hourTargets("2026-09-14", 1, [2, 3], ["2026-09-15"]));
    assert.equal(teachDay(hit.file, "2026-09-14", 2).do, "Cut the blanks.");
    assert.equal(teachDay(hit.file, "2026-09-14", 3).do, "Keep me.");
    assert.equal(teachDay(hit.file, "2026-09-15", 1).do, "Cut the blanks.");
    assert.equal(teachDay(hit.file, "2026-09-15", 2).do, undefined);
    assert.deepEqual(hit.sent.map((t) => `${t.period}@${t.date}`), ["2@2026-09-14", "1@2026-09-15"]);
    assert.deepEqual(hit.skipped.map((t) => t.period), [3]);
  });

  it("does not send a empty source onto a filled dest", () => {
    let file = setTeachDo(desk(), "2026-09-14", 3, "Keep me.");
    const hit = sendHour(file, "2026-09-14", 1, [{ date: "2026-09-14", period: 3 }]);
    assert.equal(teachDay(hit.file, "2026-09-14", 3).do, "Keep me.");
    assert.equal(hit.sent.length, 0);
  });
});
