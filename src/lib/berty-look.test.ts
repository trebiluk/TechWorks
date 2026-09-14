import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_BERTY_LOOK, hydrateBertyLook, lookCounts } from "./berty-look.ts";

describe("berty look", () => {
  it("unknown ids fall back", () => {
    const look = hydrateBertyLook({ ink: "nope" as never, kit: "apron" });
    assert.equal(look.ink, DEFAULT_BERTY_LOOK.ink);
    assert.equal(look.kit, "apron");
    assert.equal(look.hat, "none");
  });

  it("offers hundreds of shop looks", () => {
    assert.ok(lookCounts().combos >= 800);
  });
});
