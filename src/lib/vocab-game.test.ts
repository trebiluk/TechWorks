import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dealHeat, heatScore } from "./vocab-game.ts";

describe("word heat", () => {
  it("deals four unique choices and one correct", () => {
    const qs = dealHeat(8, "Safety");
    assert.ok(qs.length >= 4);
    for (const q of qs) {
      assert.equal(q.choices.length, 4);
      assert.equal(new Set(q.choices).size, 4);
      assert.ok(q.choices.includes(q.answer));
      assert.ok(q.term);
    }
  });

  it("pays speed and streak, zero on a miss", () => {
    assert.equal(heatScore(false, 12, 5), 0);
    assert.ok(heatScore(true, 12, 3) > heatScore(true, 1, 0));
  });
});
