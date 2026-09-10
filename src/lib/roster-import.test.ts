import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { addTypedStudent, importLegalRoster, stripFakeDemo } from "./store.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      bell: [{ period: 1, grade: 6 }, { period: 3, grade: 7 }],
      config: {},
    },
    crews: [],
    students: [],
  };
}

describe("roster import", () => {
  it("keeps the alias when the same legal name comes in again", () => {
    let file = addTypedStudent(desk(), { legalFirst: "Ada", legalLast: "Lovelace", period: 1 });
    const alias = file.students[0]?.first;
    const id = file.students[0]?.id;
    file = importLegalRoster(file, [{ legalFirst: "Ada", legalLast: "Lovelace", period: 1 }]);
    assert.equal(file.students.length, 1);
    assert.equal(file.students[0]?.first, alias);
    assert.equal(file.students[0]?.id, id);
  });

  it("adds a new row for a new name in the same period", () => {
    let file = addTypedStudent(desk(), { legalFirst: "Ada", legalLast: "Lovelace", period: 1 });
    file = importLegalRoster(file, [
      { legalFirst: "Ada", legalLast: "Lovelace", period: 1 },
      { legalFirst: "Grace", legalLast: "Hopper", period: 1 },
    ]);
    assert.equal(file.students.length, 2);
  });
});

describe("strip fake demo", () => {
  it("drops overlay workers before save", () => {
    const file = desk();
    file.students = [
      { id: "demo-1-0", first: "Spark1", last: "", period: 1, crewKey: "Forge", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
      { id: "s_real", first: "Ada", last: "", period: 1, crewKey: "Forge", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    ];
    const next = stripFakeDemo(file);
    assert.equal(next.students.length, 1);
    assert.equal(next.students[0]?.id, "s_real");
  });
});
