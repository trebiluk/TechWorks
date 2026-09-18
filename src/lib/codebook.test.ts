import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { codebookCsv, codebookHtml, codebookOf } from "./codebook.ts";
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
    meta: { title: "Shop", schema: 12, quarterName: "Q1" },
    crews: [],
    students,
  } as unknown as EconomyFile;
}

describe("codebook", () => {
  it("lists shop id + alias and skips fake workers", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Rivet", period: 8, legalLast: "Smith", legalFirst: "Jordan" }),
      kid({ id: "TW-BBBBBBBBBB", first: "Forge", period: 3, legalLast: "Nguyen", legalFirst: "Ada" }),
      kid({ id: "demo-1", first: "Fake", period: 3, legalLast: "Nope", legalFirst: "Nope" }),
    ]);
    const rows = codebookOf(file);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]!.period, 3);
    assert.equal(rows[0]!.alias, "Forge");
    assert.equal(rows[0]!.last, "");
    assert.equal(rows[0]!.first, "");
    assert.match(rows[0]!.shop, /^[A-Z2-9]{5}$/);
    assert.equal(rows[1]!.alias, "Rivet");
  });

  it("csv and print html never carry last names", () => {
    const file = desk([kid({ id: "TW-CCCCCCCCCC", first: "Volt", period: 2, legalLast: "Lopez", legalFirst: "Mira" })]);
    const csv = codebookCsv(codebookOf(file));
    assert.equal(csv.includes("Lopez"), false);
    assert.equal(csv.includes("Mira"), false);
    assert.match(csv, /Volt/);
    assert.equal(csv.includes("Last"), false);
    const html = codebookHtml(file);
    assert.equal(html.includes("Lopez"), false);
    assert.match(html, /Volt/);
    assert.equal(html.includes("demo-"), false);
  });
});
