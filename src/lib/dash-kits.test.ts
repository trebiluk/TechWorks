import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_LAYOUT, applyDashKit, nowGoalPaired, pairNowGoals, rowOn } from "./dash-layout.ts";

describe("dash kits", () => {
  it("wall kit shows job and procedure, hides tools", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "wall");
    assert.equal(rowOn(next, "class"), true);
    assert.equal(rowOn(next, "proc"), true);
    assert.equal(rowOn(next, "tools"), false);
    assert.ok(next.order.indexOf("class") < next.order.indexOf("proc"));
  });

  it("work kit turns tools on", () => {
    const next = applyDashKit(DEFAULT_LAYOUT, "work");
    assert.equal(rowOn(next, "tools"), true);
  });

  it("pair Now + Goals, then split", () => {
    const together = pairNowGoals(DEFAULT_LAYOUT, true);
    assert.equal(nowGoalPaired(together), true);
    const split = pairNowGoals(together, false);
    assert.equal(nowGoalPaired(split), false);
  });
});
