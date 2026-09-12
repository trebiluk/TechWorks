import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_TEACH_LAYOUT, hideTeachRow, moveTeachTo, teachRowOn } from "./teach-look.ts";

describe("teach layout", () => {
  it("reorders like the wall", () => {
    const next = moveTeachTo(DEFAULT_TEACH_LAYOUT, "slots", "hero");
    assert.deepEqual(next.order.slice(0, 2), ["slots", "hero"]);
  });

  it("hides packs and tools, never the live Now plate", () => {
    const hid = hideTeachRow(DEFAULT_TEACH_LAYOUT, "packs", false);
    assert.equal(teachRowOn(hid, "packs"), false);
    const hero = hideTeachRow(hid, "hero", false);
    assert.equal(teachRowOn(hero, "hero"), true);
  });
});
