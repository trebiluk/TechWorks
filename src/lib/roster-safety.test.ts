import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { publicHandle } from "./shop-code.ts";
import {
  confirmMatches,
  hallList,
  leaveHall,
  moveToClass,
  purgeForever,
  restorePoint,
  saveRestorePoint,
  seatInHall,
  softRemove,
  undoRemove,
} from "./roster-safety.ts";

function kid(partial: Partial<RawStudent> & { id: string; first: string; period: number }): RawStudent {
  return {
    last: "",
    crewKey: "A",
    days: ["3", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 1,
    ...partial,
  };
}

function desk(students: RawStudent[]): EconomyFile {
  return {
    students,
    crews: [],
    meta: { title: "Test class", quarterName: "Q1", currentWeek: 1, codes: {} },
  } as EconomyFile;
}

describe("roster safety", () => {
  it("does nothing until the class name matches, then undo puts the same code and marks back", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Pixel", period: 1 }),
      kid({ id: "TW-BBBBBBBBBB", first: "Nova", period: 2 }),
    ]);
    assert.equal(confirmMatches("nope", "Test class"), false);
    assert.equal(confirmMatches("Test class", "Test class"), true);
    const code = publicHandle("TW-AAAAAAAAAA");
    const removed = softRemove(file, ["TW-AAAAAAAAAA"], "Test class");
    assert.equal(hallList(removed, 6).length, 0);
    assert.equal(removed.students.find((s) => s.id === "TW-AAAAAAAAAA")?.removedAt != null, true);
    assert.equal(removed.students.find((s) => s.id === "TW-AAAAAAAAAA")?.days[0], "3");
    assert.equal(removed.meta.config?.restorePoints?.[0]?.students.find((s) => s.id === "TW-AAAAAAAAAA")?.removedAt, undefined);
    const back = undoRemove(removed, ["TW-AAAAAAAAAA"]);
    const kidBack = back.students.find((s) => s.id === "TW-AAAAAAAAAA")!;
    assert.equal(kidBack.removedAt, undefined);
    assert.equal(publicHandle(kidBack.id), code);
    assert.equal(kidBack.days[0], "3");
  });

  it("restore point puts a removed class back", () => {
    const file = saveRestorePoint(desk([kid({ id: "TW-AAAAAAAAAA", first: "Pixel", period: 1 })]), "before");
    const at = file.meta.config!.restorePoints![0]!.at;
    const wiped = purgeForever(file, ["TW-AAAAAAAAAA"]);
    assert.equal(wiped.students.length, 0);
    const back = restorePoint(wiped, at);
    assert.equal(back.students[0]?.first, "Pixel");
    assert.equal(publicHandle(back.students[0]!.id), publicHandle("TW-AAAAAAAAAA"));
  });

  it("moves a worker and keeps the code and marks", () => {
    const file = desk([kid({ id: "TW-AAAAAAAAAA", first: "Pixel", period: 1 })]);
    const code = publicHandle(file.students[0]!.id);
    const moved = moveToClass(file, ["TW-AAAAAAAAAA"], 3, 2, "TECH 8");
    const kidMoved = moved.students[0]!;
    assert.equal(kidMoved.period, 3);
    assert.equal(kidMoved.id, "TW-AAAAAAAAAA");
    assert.equal(publicHandle(kidMoved.id), code);
    assert.equal(kidMoved.days[0], "3");
  });

  it("adds two home classes to hall and a hall removal leaves the home class", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Pixel", period: 1 }),
      kid({ id: "TW-BBBBBBBBBB", first: "Nova", period: 2 }),
    ]);
    const seated = seatInHall(file, ["TW-AAAAAAAAAA", "TW-BBBBBBBBBB"], 6);
    assert.equal(hallList(seated, 6).map((s) => s.first).join(","), "Nova,Pixel");
    assert.equal(seated.students.find((s) => s.id === "TW-AAAAAAAAAA")?.period, 1);
    assert.equal(seated.students.find((s) => s.id === "TW-BBBBBBBBBB")?.period, 2);
    const left = leaveHall(seated, ["TW-AAAAAAAAAA"], 6);
    assert.deepEqual(hallList(left, 6).map((s) => s.id), ["TW-BBBBBBBBBB"]);
    const home = left.students.find((s) => s.id === "TW-AAAAAAAAAA")!;
    assert.equal(home.period, 1);
    assert.equal(home.days[0], "3");
    assert.equal(publicHandle(home.id), publicHandle("TW-AAAAAAAAAA"));
  });
});
