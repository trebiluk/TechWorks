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
  it("always uses the alias", () => {
    const file = desk();
    assert.equal(showFirstReal(file), false);
    assert.equal(padFirst({ first: "River", legalFirst: "Jordan" }, false), "River");
    assert.equal(padFirst({ first: "River", legalFirst: "Jordan" }, true), "River");
  });

  it("toggle cannot turn real names on", () => {
    const on = showFirstReal(setShowFirstReal(desk(), true));
    assert.equal(on, false);
  });

  it("compact does not keep legal names", () => {
    const packed = compactFile({
      ...desk(),
      students: [{ id: "TW-AAAAAAAAAA", first: "River", last: "Smith", legalLast: "Smith", legalFirst: "Jordan", period: 1, crewKey: "A", days: ["", "", "", ""], bonus: 0, deduct: 0, clutch: 0, opening: 0 }],
    });
    assert.equal(packed.students[0]!.legalFirst, undefined);
    assert.equal(packed.students[0]!.legalLast, undefined);
    assert.equal(packed.students[0]!.last, "");
    assert.equal(packed.students[0]!.first, "River");
  });
});
