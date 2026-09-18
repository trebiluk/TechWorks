import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FINISHES, SOLVAY_LOOK, lookVars } from "./look.ts";
import { wallPresetOf } from "./wall-presets.ts";

describe("Solvay look", () => {
  it("defaults to a glass plate, not a heavy industrial stamp", () => {
    assert.equal(SOLVAY_LOOK.finish, "plate");
    assert.equal(SOLVAY_LOOK.stroke, 0);
    assert.ok(SOLVAY_LOOK.lift <= 75);
    assert.ok(SOLVAY_LOOK.wallpaper <= 60);
    assert.equal(SOLVAY_LOOK.corners, 14);
    const plate = FINISHES.find((f) => f.id === "plate");
    assert.equal(plate?.hint.includes("Glass"), true);
  });

  it("keeps back-row type and fill", () => {
    assert.equal(SOLVAY_LOOK.scale, 18);
    assert.equal(SOLVAY_LOOK.fill, 100);
    assert.ok(SOLVAY_LOOK.titles >= 118);
  });

  it("writes glow and lift as CSS vars", () => {
    const vars = lookVars(SOLVAY_LOOK);
    assert.equal(vars["--ui-radius"], "14px");
    assert.equal(vars["--ui-shadow"], "0.72");
    assert.equal(vars["--ui-glow"], "0.4");
  });

  it("Shop wall uses the glass plate", () => {
    const shop = wallPresetOf("shop");
    assert.ok(shop);
    assert.equal(shop!.look.finish, "plate");
    assert.equal(shop!.look.stroke, 0);
    assert.equal(shop!.theme, "solvay");
    assert.equal(shop!.font, "outfit");
  });
});
