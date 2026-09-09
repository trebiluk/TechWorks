import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { emptyRoster, pickDesk } from "./vault-core.ts";

function desk(n: number, savedAt: string): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      savedAt,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
    },
    crews: [],
    students: Array.from({ length: n }, (_, i) => ({
      id: `TW-P1-S1-${String(i + 1).padStart(2, "0")}`,
      first: `Kid${i}`,
      last: "",
      period: 1,
      crewKey: "Crew A",
      days: ["", "", "", ""],
      bonus: 0,
      deduct: 0,
      clutch: 0,
      opening: 0,
    })),
  };
}

describe("local vault", () => {
  it("empties workers and stamps clearedAt", () => {
    const empty = emptyRoster(desk(3, "2026-09-08T12:00:00.000Z"));
    assert.equal(empty.students.length, 0);
    assert.ok(empty.meta.clearedAt);
    assert.equal(empty.crews.length, 0);
  });

  it("does not revive a bigger older roster over a newer empty desk", () => {
    const old = desk(84, "2026-09-08T10:00:00.000Z");
    const cleared = emptyRoster(desk(84, "2026-09-08T16:00:00.000Z"));
    cleared.meta.savedAt = "2026-09-08T16:00:00.000Z";
    const picked = pickDesk(cleared, old);
    assert.equal(picked.students.length, 0);
  });
});
