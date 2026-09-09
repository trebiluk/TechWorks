import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import {
  BENCH,
  addCrewBan,
  bansOf,
  crewAt,
  openCrewFor,
  placeBlock,
  separatePair,
  splitTogether,
} from "./crew-desk.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period" | "crewKey">): RawStudent {
  return {
    last: "",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    ...partial,
  };
}

function blank(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25, Assist: 10 },
      config: {},
    },
    crews: [
      { period: 1, key: "Crew A", name: "Crew A" },
      { period: 1, key: "Crew B", name: "Crew B" },
    ],
    students: [
      kid({ id: "s1", first: "River", period: 1, crewKey: "Crew A", legalLast: "Smith", legalFirst: "Jordan" }),
      kid({ id: "s2", first: "Wren", period: 1, crewKey: "Crew A", legalLast: "Lee", legalFirst: "Sam" }),
      kid({ id: "s3", first: "Oak", period: 1, crewKey: "Crew B" }),
    ],
  };
}

describe("Separate roster rule", () => {
  it("rejects the same name twice and is idempotent", () => {
    const f = blank();
    assert.equal(bansOf(addCrewBan(f, "s1", "s1")).length, 0);
    const once = addCrewBan(f, "s1", "s2", "office");
    assert.equal(bansOf(once).length, 1);
    assert.equal(bansOf(addCrewBan(once, "s2", "s1")).length, 1);
  });

  it("blocks seating them in the same crew", () => {
    const f = addCrewBan(blank(), "s1", "s2");
    const wren = f.students[1]!;
    assert.match(placeBlock(f, wren, "Crew A", "2026-09-09") ?? "", /^Separate: not with River/);
    assert.equal(placeBlock(f, wren, "Crew B", "2026-09-09"), null);
    const oak = f.students[2]!;
    assert.equal(placeBlock(f, oak, "Crew A", "2026-09-09"), null, "Oak is not in the Separate pair");
  });

  it("splits a pair that already sits together", () => {
    const f = blank();
    assert.equal(crewAt(f.students[0]!, "2026-09-09"), "Crew A");
    assert.equal(crewAt(f.students[1]!, "2026-09-09"), "Crew A");
    const out = separatePair(f, "s1", "s2", "principal note", "2026-09-09");
    assert.equal(bansOf(out.file).length, 1);
    assert.equal(bansOf(out.file)[0]?.note, "principal note");
    assert.ok(out.moved);
    assert.equal(out.moved?.id, "s2");
    assert.equal(out.moved?.from, "Crew A");
    assert.notEqual(crewAt(out.file.students.find((s) => s.id === "s2")!, "2026-09-09"), "Crew A");
    const wren = out.file.students.find((s) => s.id === "s2")!;
    assert.equal(placeBlock(out.file, wren, "Crew A", "2026-09-09")?.startsWith("Separate:"), true);
  });

  it("picks an open crew that is not a Separate seat", () => {
    const f = addCrewBan(blank(), "s1", "s2");
    const wren = f.students[1]!;
    const seat = openCrewFor(f, wren, "2026-09-09");
    assert.notEqual(seat, "Crew A");
    assert.notEqual(seat, BENCH);
    assert.equal(placeBlock(f, wren, seat, "2026-09-09"), null);
  });

  it("opens a new crew when the only seat is the banned one", () => {
    const f = blank();
    f.crews = [{ period: 1, key: "Crew A", name: "Crew A" }];
    const out = separatePair(f, "s1", "s2", undefined, "2026-09-09");
    const wren = out.file.students.find((s) => s.id === "s2")!;
    assert.notEqual(crewAt(wren, "2026-09-09"), "Crew A");
    assert.ok(out.file.crews.some((c) => c.period === 1 && c.key !== "Crew A"));
  });

  it("does not move names who already sit apart", () => {
    const f = blank();
    f.students[1] = { ...f.students[1]!, crewKey: "Crew B" };
    const out = splitTogether(f, "s1", "s2", "2026-09-09");
    assert.equal(out.moved, undefined);
    assert.equal(crewAt(out.file.students[1]!, "2026-09-09"), "Crew B");
  });
});
