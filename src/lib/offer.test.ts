import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { studentScreen } from "./offer.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      bell: [{ period: 1, grade: 6 }],
      config: { currentCycle: 1, schedule: "regular", modules: { club: true } },
    },
    crews: [],
    students: [],
  };
}

describe("student screen", () => {
  it("puts a live shop period on the wall", () => {
    const screen = studentScreen(desk(), new Date(2026, 8, 15, 8, 5, 0));
    assert.equal(screen.view, "overview");
    assert.match(screen.why, /P1/);
  });

  it("puts study hall on the hall wall", () => {
    const screen = studentScreen(desk(), new Date(2026, 8, 15, 11, 30, 0));
    assert.equal(screen.view, "hallwall");
  });

  it("stays on the wall for cleanup so the reset list can cover it", () => {
    const screen = studentScreen(desk(), new Date(2026, 8, 15, 8, 32, 0));
    assert.equal(screen.view, "overview");
    assert.equal(screen.label, "Cleanup");
  });

  it("opens club only when club is actually live", () => {
    const afternoon = new Date(2026, 8, 15, 15, 0, 0);
    assert.equal(studentScreen(desk(), afternoon, false).view, "overview");
    assert.equal(studentScreen(desk(), afternoon, true).view, "clubwall");
  });
});
