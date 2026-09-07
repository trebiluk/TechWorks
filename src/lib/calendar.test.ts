import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daySlot, instructionalWeeks, isSchoolDay, schoolDays, sessions } from "./calendar.ts";

describe("Solvay 2026-27", () => {
  it("first and last student days are school", () => {
    assert.equal(isSchoolDay("2026-09-08"), true);
    assert.equal(isSchoolDay("2027-06-24"), true);
  });

  it("skips holidays, staff days, recesses, weekends", () => {
    assert.equal(isSchoolDay("2026-09-07"), false);
    assert.equal(isSchoolDay("2026-10-12"), false);
    assert.equal(isSchoolDay("2026-11-26"), false);
    assert.equal(isSchoolDay("2026-12-25"), false);
    assert.equal(isSchoolDay("2027-01-18"), false);
    assert.equal(isSchoolDay("2027-02-16"), false);
    assert.equal(isSchoolDay("2027-04-14"), false);
    assert.equal(isSchoolDay("2027-05-31"), false);
    assert.equal(isSchoolDay("2026-09-12"), false);
  });

  it("counts Oct 30 half day and June 18 as school", () => {
    assert.equal(isSchoolDay("2026-10-30"), true);
    assert.equal(isSchoolDay("2027-06-18"), true);
    assert.equal(isSchoolDay("2027-06-15"), false);
  });

  it("maps D1–D4 to first four school days of the week", () => {
    const tue = daySlot("2026-09-08");
    assert.equal(tue.school, true);
    assert.equal(tue.label, "D1");
    const wed = daySlot("2026-09-09");
    assert.equal(wed.label, "D2");
    const friShort = daySlot("2026-09-11");
    assert.equal(friShort.label, "D4");
    assert.equal(friShort.fridayPay, false);
    const friFull = daySlot("2026-09-18");
    assert.equal(friFull.fridayPay, true);
  });

  it("builds four 8-week sessions covering the year", () => {
    const days = schoolDays();
    const weeks = instructionalWeeks();
    const blocks = sessions();
    assert.ok(days.length > 140);
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].start, "2026-09-08");
    assert.equal(blocks[0].weeks.length, 8);
    assert.equal(blocks[3].weeks.length, 8);
    assert.ok(weeks.length > 32);
  });
});
