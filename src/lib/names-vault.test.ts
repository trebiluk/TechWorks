import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeNames, namesVaultOf, stripNames } from "./names-vault.ts";
import type { EconomyFile, RawStudent } from "./economy.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period">): RawStudent {
  return {
    last: "",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    crewKey: "A",
    ...partial,
  };
}

function desk(students: RawStudent[]): EconomyFile {
  return {
    meta: { title: "Shop", schema: 12, quarterName: "Q1", currentWeek: 1, codes: { "3": 25 } },
    crews: [],
    students,
  } as unknown as EconomyFile;
}

describe("names vault", () => {
  it("strips legal names from a public desk copy", () => {
    const file = desk([
      kid({
        id: "TW-AAAAAAAAAA",
        first: "Rivet",
        period: 3,
        last: "Smith",
        legalLast: "Smith",
        legalFirst: "Jordan",
        flags: { iep: true, plan504: true, ell: true },
      }),
    ]);
    const pub = stripNames(file);
    const s = pub.students[0]!;
    assert.equal(s.first, "Rivet");
    assert.equal(s.last, "");
    assert.equal(s.legalFirst, undefined);
    assert.equal(s.legalLast, undefined);
    assert.equal(s.flags?.iep, undefined);
    assert.equal(s.flags?.plan504, undefined);
    assert.equal(s.flags?.ell, undefined);
    const vault = namesVaultOf(file);
    assert.deepEqual(vault, {});
  });

  it("merge does not restore legal names", () => {
    const pub = desk([kid({ id: "TW-AAAAAAAAAA", first: "Rivet", period: 3, last: "Smith", legalLast: "Smith" })]);
    const merged = mergeNames(pub, {
      "TW-AAAAAAAAAA": { alias: "Rivet", last: "Smith", legalFirst: "Jordan", period: 3, iep: true, plan504: false },
    });
    assert.equal(merged.students[0]!.legalLast, undefined);
    assert.equal(merged.students[0]!.last, "");
    assert.equal(merged.students[0]!.first, "Rivet");
  });
});
