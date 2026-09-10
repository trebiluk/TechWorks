import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { needsPpe, ppeOn, setPpe, toolsOpen } from "./ppe.ts";

function desk(): EconomyFile {
  return {
    meta: { title: "T", quarterName: "Q1", currentWeek: 1, codes: { "3": 25 } },
    crews: [],
    students: [],
  };
}

describe("ppe lock", () => {
  it("goggles in the rules close tools until marked", () => {
    const rules = ["One tool at a time", "Goggles on"];
    assert.equal(needsPpe(rules), true);
    assert.equal(toolsOpen(desk(), rules, 1, "2026-09-09"), false);
    const on = setPpe(desk(), 1, true, "2026-09-09");
    assert.equal(ppeOn(on, 1, "2026-09-09"), true);
    assert.equal(toolsOpen(on, rules, 1, "2026-09-09"), true);
  });

  it("no goggles means tools stay open", () => {
    assert.equal(needsPpe(["One mark per student"]), false);
    assert.equal(toolsOpen(desk(), ["One mark per student"], 1, "2026-09-09"), true);
  });
});
