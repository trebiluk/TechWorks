import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moveId } from "./sort.ts";
import { DEFAULT_LAYOUT, moveDashTo, pairMate } from "./dash-layout.ts";

describe("moveId", () => {
  it("moves the first item onto the last", () => {
    assert.deepEqual(moveId(["a", "b", "c"], "a", "c"), ["b", "c", "a"]);
  });

  it("moves the last item onto the first", () => {
    assert.deepEqual(moveId(["a", "b", "c"], "c", "a"), ["c", "a", "b"]);
  });

  it("swaps neighbors when dragging down", () => {
    assert.deepEqual(moveId(["now", "class", "strip"], "now", "class"), ["class", "now", "strip"]);
  });

  it("is a no-op for the same id or a missing id", () => {
    const order = ["a", "b"];
    assert.equal(moveId(order, "a", "a"), order);
    assert.equal(moveId(order, "z", "a"), order);
  });
});

describe("moveDashTo", () => {
  it("keeps hidden rows in the list while moving visible plates", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "kpis", "now");
    assert.equal(next.order[0], "kpis");
    assert.deepEqual(next.hidden, DEFAULT_LAYOUT.hidden);
  });
});

describe("pairMate", () => {
  it("pairs Now and Goals when they sit next to each other in either order", () => {
    const a = { ...DEFAULT_LAYOUT, order: ["class", "now", "strip", "mods", "tools", "notes", "kpis"] as typeof DEFAULT_LAYOUT.order };
    assert.equal(pairMate(a, "class"), "first");
    assert.equal(pairMate(a, "now"), "second");
    assert.equal(pairMate(DEFAULT_LAYOUT, "now"), "first");
    assert.equal(pairMate(DEFAULT_LAYOUT, "class"), "second");
  });

  it("does not pair when a plate sits between them", () => {
    const a = { ...DEFAULT_LAYOUT, order: ["now", "strip", "class", "mods", "tools", "notes", "kpis"] as typeof DEFAULT_LAYOUT.order };
    assert.equal(pairMate(a, "now"), null);
    assert.equal(pairMate(a, "class"), null);
  });
});
