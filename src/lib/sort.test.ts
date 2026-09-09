import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moveId } from "./sort.ts";
import { DEFAULT_LAYOUT, hydrateDashLayout, moveDashTo, pairMate, type DashRowId } from "./dash-layout.ts";

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

  it("moves Do this now onto Now", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "proc", "now");
    assert.equal(next.order[0], "proc");
    assert.ok(next.order.includes("now"));
  });
});

describe("pairMate", () => {
  it("pairs Now and Goals when they sit next to each other in either order", () => {
    const rest = DEFAULT_LAYOUT.order.filter((id) => id !== "class" && id !== "now");
    const flipped = { ...DEFAULT_LAYOUT, order: ["class", "now", ...rest] as DashRowId[] };
    assert.equal(pairMate(flipped, "class"), "first");
    assert.equal(pairMate(flipped, "now"), "second");
    assert.equal(pairMate(DEFAULT_LAYOUT, "now"), "first");
    assert.equal(pairMate(DEFAULT_LAYOUT, "class"), "second");
  });

  it("does not pair when a plate sits between them", () => {
    const rest = DEFAULT_LAYOUT.order.filter((id) => id !== "now" && id !== "class" && id !== "proc");
    const split = { ...DEFAULT_LAYOUT, hidden: ["tools"] as typeof DEFAULT_LAYOUT.hidden, order: ["now", "proc", "class", ...rest] as DashRowId[] };
    assert.equal(pairMate(split, "now"), null);
    assert.equal(pairMate(split, "class"), null);
  });
});

describe("hydrateDashLayout", () => {
  it("parks Do this now after Goals on an old wall", () => {
    const old = hydrateDashLayout({
      order: ["now", "class", "strip", "mods", "tools", "notes", "kpis"],
      hidden: ["tools"],
    });
    assert.deepEqual(old.order.slice(0, 4), ["now", "class", "proc", "strip"]);
    const clubAt = old.order.indexOf("club");
    assert.ok(clubAt > old.order.indexOf("strip"));
    assert.ok(old.order.includes("specials"));
    assert.equal(old.order.at(-1), "poll");
    assert.ok(old.hidden.includes("tools"));
    assert.ok(old.hidden.includes("proc"));
  });

  it("does not reshuffle a v9 wall that already has the new plates", () => {
    const saved = hydrateDashLayout({
      order: ["proc", "now", "class", "poll", "strip", "club", "specials", "mods", "tools", "notes", "kpis"],
      hidden: ["tools", "poll"],
    });
    assert.equal(saved.order[0], "proc");
    assert.equal(saved.order[3], "poll");
    assert.deepEqual(saved.hidden, ["tools", "poll"]);
  });
});
