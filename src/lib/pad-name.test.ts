import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compactFile } from "./compact.ts";
import type { EconomyFile } from "./economy.ts";
import { padFirst, setShowFirstReal, showFirstReal } from "./economy.ts";

function desk(): EconomyFile {
  return {
    meta: { title: "TechWorks", quarterName: "Q1", currentWeek: 1, codes: { "3": 25 } },
    crews: [],
    students: [],
  };
}

describe("first real names", () => {
  it("defaults off and uses the alias", () => {
    const file = desk();
    assert.equal(showFirstReal(file), false);
    assert.equal(padFirst({ first: "River", legalFirst: "Jordan" }, false), "River");
  });

  it("teacher toggle shows legal first, not last, and falls back to alias", () => {
    const on = showFirstReal(setShowFirstReal(desk(), true));
    assert.equal(on, true);
    assert.equal(padFirst({ first: "River", legalFirst: "Jordan" }, true), "Jordan");
    assert.equal(padFirst({ first: "River" }, true), "River");
  });

  it("survives compact", () => {
    const packed = compactFile(setShowFirstReal(desk(), true));
    assert.equal(showFirstReal(packed), true);
  });
});
