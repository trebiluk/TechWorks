import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { isLiveStudent } from "./economy.ts";
import { fillQuarterOne, HALL_SEATS, SHOP_SEATS } from "./roster-seed.ts";
import { publicHandle } from "./live.ts";
import { aliasAllowed } from "./alias-bank.ts";
import { onAbRoster, addTypedStudent } from "./store.ts";
import { claimAlias, pinSet, resetStudentPin, setStudentPin } from "./student-pin.ts";

function blank(): EconomyFile {
  return {
    meta: {
      title: "Shop",
      schema: 12,
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 8 },
        { period: 3, grade: 7 },
        { period: 6, grade: 7 },
        { period: 8, grade: 7 },
        { period: 9, grade: 8 },
        { period: 10, grade: 6 },
      ],
      config: {},
    },
    crews: [],
    students: [],
  };
}

describe("quarter roster", () => {
  it("seats 18 in each empty Q1 shop and 22 in study hall on both days", () => {
    const file = fillQuarterOne(blank());
    for (const period of [1, 2, 3, 8, 9, 10]) {
      const n = file.students.filter((s) => s.period === period && isLiveStudent(s, "Q1")).length;
      assert.equal(n, SHOP_SEATS, `P${period}`);
    }
    const hall = file.students.filter((s) => s.period === 6);
    assert.equal(hall.length, HALL_SEATS);
    assert.ok(hall.every((s) => onAbRoster(s, "A") && onAbRoster(s, "B")));
    const names = file.students.map((s) => s.first.toLowerCase());
    assert.equal(new Set(names).size, names.length);
    const codes = file.students.map((s) => publicHandle(s.id));
    assert.equal(new Set(codes).size, codes.length);
    assert.ok(file.students.every((s) => aliasAllowed(s.first)));
    assert.ok(file.students.every((s) => !s.legalFirst && !s.legalLast));
  });

  it("does not add seats to a class that already has a student", () => {
    const start = addTypedStudent(blank(), { alias: "Cedar", period: 2, sem: "Q1" });
    const file = fillQuarterOne(start);
    assert.equal(file.students.filter((s) => s.period === 2).length, 1);
    assert.equal(file.students.filter((s) => s.period === 1).length, SHOP_SEATS);
  });
});

describe("student pin", () => {
  it("lets a student rename only after a pin, and a reset locks the name again", () => {
    const seeded = fillQuarterOne(blank());
    const kid = seeded.students[0] as RawStudent;
    const code = publicHandle(kid.id);
    const blocked = claimAlias(seeded, code, "2468", "Bluejay");
    assert.match(blocked.error, /pin/i);
    const bad = setStudentPin(seeded, code, "1111");
    assert.ok(bad.error);
    const set = setStudentPin(seeded, code, "2468");
    assert.equal(set.error, "");
    assert.ok(pinSet(set.file.students.find((s) => s.id === kid.id)!));
    const dirty = claimAlias(set.file, code, "2468", "shit");
    assert.ok(dirty.error);
    const named = claimAlias(set.file, code, "2468", "Bluejay");
    assert.equal(named.error, "");
    assert.equal(named.file.students.find((s) => s.id === kid.id)?.first, "Bluejay");
    const cleared = resetStudentPin(named.file, kid.id);
    const again = claimAlias(cleared, code, "2468", "Redwing");
    assert.match(again.error, /pin/i);
  });
});
