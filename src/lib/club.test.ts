import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clubPackOf,
  clubSlotNow,
  isClubDay,
  layClubSlots,
  loadClub,
  monthClubGrid,
  setClubPack,
  setClubPin,
  setDayClub,
  upcomingClubDays,
} from "./club.ts";

function at(h: number, m: number, s = 0) {
  return new Date(2026, 8, 11, h, m, s);
}

describe("club dates and teach slots", () => {
  it("sets extra club days and skips a usual Tuesday", () => {
    let f = loadClub();
    assert.equal(isClubDay(f, "2026-09-15"), true);
    f = setDayClub(f, "2026-09-15", false);
    assert.equal(isClubDay(f, "2026-09-15"), false);
    f = setDayClub(f, "2026-09-11", true);
    assert.equal(isClubDay(f, "2026-09-11"), true);
    const month = monthClubGrid(f, "2026-09");
    assert.ok(month.find((d) => d.date === "2026-09-11")?.club);
    assert.ok(upcomingClubDays(f, "2026-09-11").includes("2026-09-11"));
  });

  it("holds Brief on Talk until Work is released, then cleanup at 3:00", () => {
    let f = setClubPack(loadClub(), "2026-09-15", "talk");
    assert.equal(clubPackOf(f, "2026-09-15").id, "talk");
    const rows = layClubSlots(f, "2026-09-15");
    assert.equal(rows[0].title, "SIGN IN");
    assert.equal(rows.at(-1)?.clean, true);
    assert.equal(clubSlotNow(f, "2026-09-15", at(12, 20))?.kind, "brief");
    assert.equal(clubSlotNow(f, "2026-09-15", at(14, 42))?.kind, "sign");
    assert.equal(clubSlotNow(f, "2026-09-15", at(14, 50))?.kind, "brief");
    f = setClubPin(f, "2026-09-15", "work");
    assert.equal(clubSlotNow(f, "2026-09-15", at(14, 50))?.kind, "work");
    assert.equal(clubSlotNow(f, "2026-09-15", at(15, 1))?.clean, true);
  });
});
