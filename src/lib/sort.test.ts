import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { moveId } from "./sort.ts";
import { COL_RIGHT, DEFAULT_LAYOUT, hydrateDashLayout, moveDashTo, dashCol } from "./dash-layout.ts";

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
  it("keeps hidden rows in the list while moving visible plates in a column", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "kpis", "now");
    assert.equal(next.right[0], "kpis");
    assert.equal(next.right[1], "now");
    assert.deepEqual(next.hidden, DEFAULT_LAYOUT.hidden);
    assert.equal(dashCol(next, "class"), "left");
  });

  it("drags Do this now onto Now and parks it on the right", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "proc", "now");
    assert.equal(next.right[0], "proc");
    assert.ok(next.right.includes("now"));
    assert.equal(dashCol(next, "proc"), "right");
    assert.ok(!next.left.includes("proc"));
  });

  it("drops Hour onto the right well", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "class", COL_RIGHT);
    assert.equal(dashCol(next, "class"), "right");
    assert.equal(next.right.at(-1), "class");
    assert.ok(!next.left.includes("class"));
  });

  it("is a no-op when dropping a left plate onto the left well", () => {
    const next = moveDashTo(DEFAULT_LAYOUT, "class", "col:left");
    assert.equal(next, DEFAULT_LAYOUT);
  });
});

describe("hydrateDashLayout", () => {
  it("splits an old one-column wall: Hour left, clock right", () => {
    const old = hydrateDashLayout({
      order: ["now", "class", "strip", "mods", "tools", "notes", "kpis"],
      hidden: ["tools"],
    });
    assert.equal(old.left[0], "class");
    assert.ok(old.left.includes("proc"));
    assert.ok(old.left.includes("strip"));
    assert.equal(old.right[0], "now");
    assert.ok(old.right.includes("kpis"));
    assert.ok(old.order.includes("club"));
    assert.ok(old.order.includes("specials"));
    assert.ok(old.order.includes("poll"));
    assert.ok(old.hidden.includes("tools"));
    assert.ok(!old.hidden.includes("proc"));
  });

  it("keeps a saved two-column grid", () => {
    const saved = hydrateDashLayout({
      order: ["now", "class"],
      left: ["now", "kpis"],
      right: ["class", "proc"],
      hidden: ["tools", "poll"],
    });
    assert.equal(saved.left[0], "now");
    assert.ok(saved.left.includes("kpis"));
    assert.equal(saved.right[0], "class");
    assert.ok(saved.right.includes("proc"));
    assert.deepEqual(saved.hidden, ["tools", "poll"]);
  });

  it("does not reshuffle plates already in a v9 order beyond the column split", () => {
    const saved = hydrateDashLayout({
      order: ["proc", "now", "class", "poll", "strip", "club", "specials", "mods", "tools", "notes", "kpis"],
      hidden: ["tools", "poll"],
    });
    assert.equal(saved.left[0], "proc");
    assert.ok(saved.left.indexOf("class") < saved.left.indexOf("strip"));
    assert.equal(saved.right[0], "now");
    assert.ok(saved.right.includes("poll"));
    assert.deepEqual(saved.hidden, ["tools", "poll"]);
  });
});
