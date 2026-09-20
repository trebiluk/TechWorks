import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bistroCycleOf, bistroLabel, lunchLineOf, nextServeDay } from "./lunch.ts";

describe("Bearcat Bistro cycle", () => {
  it("serves the four-week MS entrée on school days", () => {
    assert.equal(bistroCycleOf("2026-09-08"), "Chicken Poppers w/ Dippin' Sauce");
    assert.equal(bistroCycleOf("2026-09-09"), "Mac & Cheese");
    assert.equal(bistroCycleOf("2026-09-10"), "Cheeseburger or Hamburger");
    assert.equal(bistroCycleOf("2026-09-11"), "Stuffed Crust Pizza");
    assert.equal(bistroCycleOf("2026-09-14"), "ABC Chicken Nuggets");
    assert.equal(bistroCycleOf("2026-09-21"), "Shrimp Poppers");
    assert.equal(bistroCycleOf("2026-09-24"), "Soft Taco w/ cheese and lettuce");
    assert.equal(bistroCycleOf("2026-09-28"), "Chicken & Waffles");
  });

  it("stays blank on weekends and before the first serve day", () => {
    assert.equal(bistroCycleOf("2026-09-20"), "");
    assert.equal(bistroCycleOf("2026-09-07"), "");
    assert.equal(bistroCycleOf("2026-09-06"), "");
    assert.equal(nextServeDay("2026-09-20"), "2026-09-21");
    assert.equal(bistroCycleOf("2026-09-21"), "Shrimp Poppers");
  });

  it("labels a weekend wall with the next serve day", () => {
    const row = lunchLineOf("2026-09-20");
    assert.equal(row.line, "Shrimp Poppers");
    assert.equal(row.label, "Mon · Shrimp Poppers");
    assert.equal(row.source, "cycle");
    assert.equal(bistroLabel("2026-09-21", "Shrimp Poppers", "2026-09-21"), "Shrimp Poppers");
  });

  it("lets a typed desk lunch win over the cycle", () => {
    const row = lunchLineOf("2026-09-21", "Field trip — bag lunch");
    assert.equal(row.line, "Field trip — bag lunch");
    assert.equal(row.source, "desk");
  });
});
