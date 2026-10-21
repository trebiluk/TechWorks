import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { isSchoolDay, stepSchoolDay } from "./calendar.ts";
import { pinCrewActivity, pinDayActivity } from "./projects.ts";
import { periodGoal, setPeriodGoal } from "./store.ts";
import { setTeachDo, teachDay } from "./teach.ts";
import { bumpDay, unbumpDay } from "./bump-day.ts";

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
      dayLog: {},
    },
    crews: [],
    students: [{ id: "s1", first: "Altair", last: "", period: 3, crewKey: "A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 }],
  };
}

function lesson(file: EconomyFile, date: string, period: number, title: string, pin = ""): EconomyFile {
  let next = setTeachDo(file, date, period, title);
  if (pin) next = pinDayActivity(next, date, period, pin);
  return setPeriodGoal(next, date, period, title);
}

describe("bump day", () => {
  const mon = "2026-10-19";
  const tue = "2026-10-20";
  const wed = "2026-10-21";
  const thu = "2026-10-22";
  const fri = "2026-10-23";
  const nextMon = "2026-10-26";

  it("slides a Wednesday snow day across the weekend and leaves other periods", () => {
    assert.equal(isSchoolDay(wed), true);
    assert.equal(isSchoolDay("2026-10-24"), false);
    assert.equal(stepSchoolDay(fri, 1), nextMon);
    let file = lesson(desk(), mon, 3, "Bridge test", "act-mon");
    file = lesson(file, tue, 3, "Gusset fix", "act-tue");
    file = lesson(file, wed, 3, "Snow note", "act-wed");
    file = lesson(file, thu, 3, "Truss build", "act-thu");
    file = lesson(file, fri, 3, "Load day", "act-fri");
    file = lesson(file, wed, 1, "Stay put", "act-p1");
    file = pinCrewActivity(file, wed, 3, "A", "crew-wed");
    const before = structuredClone(file);
    const bumped = bumpDay(file, wed, 3);
    assert.equal(bumped.moved, 3);
    assert.deepEqual(bumped.overflow, []);
    assert.equal(teachDay(bumped.file, wed, 3).do, undefined);
    assert.equal(bumped.file.meta.dayLog?.[wed]?.periodActivity?.["3"], undefined);
    assert.equal(teachDay(bumped.file, thu, 3).do, "Snow note");
    assert.equal(bumped.file.meta.dayLog?.[thu]?.periodActivity?.["3"], "act-wed");
    assert.equal(periodGoal(bumped.file, thu, 3), "Snow note");
    assert.equal(bumped.file.meta.dayLog?.[thu]?.crewActivity?.["3|A"], "crew-wed");
    assert.equal(teachDay(bumped.file, fri, 3).do, "Truss build");
    assert.equal(teachDay(bumped.file, nextMon, 3).do, "Load day");
    assert.equal(teachDay(bumped.file, mon, 3).do, "Bridge test");
    assert.equal(teachDay(bumped.file, tue, 3).do, "Gusset fix");
    assert.equal(teachDay(bumped.file, wed, 1).do, "Stay put");
    assert.equal(bumped.file.meta.dayLog?.[wed]?.periodActivity?.["1"], "act-p1");
    assert.deepEqual(bumped.file.students, before.students);
    const back = unbumpDay(bumped.file, wed, 3);
    assert.equal(back.moved, 3);
    assert.deepEqual(back.file, before);
  });

  it("skips an empty day instead of erasing the next lesson", () => {
    let file = lesson(desk(), wed, 3, "Snow note", "act-wed");
    file = lesson(file, fri, 3, "Load day", "act-fri");
    const bumped = bumpDay(file, wed, 3);
    assert.equal(bumped.moved, 2);
    assert.equal(teachDay(bumped.file, wed, 3).do, undefined);
    assert.equal(teachDay(bumped.file, thu, 3).do, "Snow note");
    assert.equal(teachDay(bumped.file, fri, 3).do, undefined);
    assert.equal(teachDay(bumped.file, nextMon, 3).do, "Load day");
    assert.deepEqual(unbumpDay(bumped.file, wed, 3).file, file);
  });

  it("skips a holiday", () => {
    const holiday = "2026-11-11";
    const beforeH = "2026-11-10";
    const afterH = "2026-11-12";
    assert.equal(isSchoolDay(holiday), false);
    assert.equal(stepSchoolDay(beforeH, 1), afterH);
    let file = lesson(desk(), beforeH, 3, "Saw", "act-saw");
    file = lesson(file, afterH, 3, "Drill", "act-drill");
    const bumped = bumpDay(file, beforeH, 3);
    assert.equal(teachDay(bumped.file, beforeH, 3).do, undefined);
    assert.equal(teachDay(bumped.file, holiday, 3).do, undefined);
    assert.equal(teachDay(bumped.file, afterH, 3).do, "Saw");
    assert.equal(teachDay(bumped.file, "2026-11-13", 3).do, "Drill");
    assert.deepEqual(unbumpDay(bumped.file, beforeH, 3).file, file);
  });

  it("does nothing to a day with no later lesson and keeps the roster", () => {
    const file = lesson(desk(), mon, 3, "Bridge test", "act-mon");
    const bumped = bumpDay(file, wed, 3);
    assert.equal(bumped.moved, 0);
    assert.deepEqual(bumped.file, file);
    assert.equal(unbumpDay(bumped.file, wed, 3).moved, 0);
  });
});
