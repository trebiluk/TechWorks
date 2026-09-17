import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LAYOUT, applyDashKit, dashCol, rowOn } from "./dash-layout.ts";

describe("dash kits", () => {
  it("wall kit parks Hour left and the clock right", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "wall");
    assert.equal(rowOn(next, "class"), true);
    assert.equal(rowOn(next, "proc"), true);
    assert.equal(rowOn(next, "tools"), false);
    assert.equal(next.left[0], "class");
    assert.ok(next.left.includes("proc"));
    assert.equal(next.right[0], "now");
    assert.equal(dashCol(next, "class"), "left");
    assert.equal(dashCol(next, "now"), "right");
  });

  it("work kit turns tools on, on the right", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "work");
    assert.equal(rowOn(next, "tools"), true);
    assert.equal(dashCol(next, "tools"), "right");
    assert.equal(next.left[0], "class");
  });

  it("score kit puts the lead board left of Hour", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "score");
    assert.equal(next.left[0], "kpis");
    assert.ok(next.left.includes("class"));
    assert.equal(dashCol(next, "now"), "right");
  });

  it("club kit puts the pulse left, then the hour", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "club");
    assert.equal(next.left[0], "club");
    assert.ok(next.left.includes("class"));
  });
});
