import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { laySlots, packOf, slotNow, teachFocusPeriod } from "./teach.ts";
import { setSubDay } from "./store.ts";

function file(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25, Assist: 10 },
      config: { currentCycle: 1, schedule: "regular" },
    },
    crews: [],
    students: [],
  };
}

function at(h: number, m: number, s = 0) {
  return new Date(2026, 8, 8, h, m, s);
}

describe("teach", () => {
  it("lays shop slots that meet cleanup with no overlap", () => {
    const f = file();
    const rows = laySlots(f, "2026-09-08", 1);
    assert.equal(rows[0].title, "ENTER");
    const last = rows[rows.length - 1];
    assert.equal(last.clean, true);
    for (let i = 1; i < rows.length; i++) {
      assert.equal(rows[i].startMin, rows[i - 1].endMin);
    }
    assert.equal(rows[0].startMin, 7 * 60 + 55);
    assert.equal(last.endMin, 8 * 60 + 35);
  });

  it("follows live shop period, then next, not leftover P1", () => {
    const f = file();
    assert.equal(teachFocusPeriod(f, "2026-09-08", at(8, 10)), 1);
    assert.equal(teachFocusPeriod(f, "2026-09-08", at(8, 36)), 2);
    assert.equal(teachFocusPeriod(f, "2026-09-08", at(12, 40)), 8);
    assert.equal(teachFocusPeriod(f, "2026-09-08", at(15, 0)), 10);
  });

  it("shows ENTER before the bell, cleanup in the last minutes, nothing after", () => {
    const f = file();
    assert.equal(slotNow(f, "2026-09-08", 1, at(7, 50))?.title, "ENTER");
    assert.equal(slotNow(f, "2026-09-08", 1, at(8, 33))?.clean, true);
    assert.equal(slotNow(f, "2026-09-08", 1, at(8, 36)), null);
  });

  it("sub pack wins on a sub day", () => {
    const f = setSubDay(file(), "2026-09-08", true);
    assert.equal(packOf(f, "2026-09-08", 1).id, "sub");
  });

  it("half-day still has a cleanup tail", () => {
    const f = file();
    f.meta.config = { ...(f.meta.config ?? {}), schedule: "half" };
    const rows = laySlots(f, "2026-09-08", 1);
    assert.ok(rows.some((s) => s.clean));
    assert.equal(rows[rows.length - 1].endMin, rows[0].startMin + (8 * 60 + 40 - (7 * 60 + 55)));
  });
});
