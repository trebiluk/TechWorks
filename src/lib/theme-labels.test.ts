import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { THEMES } from "./theme.ts";
import { WALL_PRESETS } from "./wall-presets.ts";

describe("theme labels", () => {
  it("names ROLL THE DICE in teacher language", () => {
    const dice = THEMES.find((t) => t.id === "dice");
    assert.ok(dice);
    assert.equal(dice!.label, "ROLL THE DICE");
    assert.equal(dice!.group, "solvay");
    assert.equal(dice!.kind, "dark");
  });

  it("gives every wall look a swatch preview", () => {
    assert.ok(WALL_PRESETS.length >= 8);
    for (const p of WALL_PRESETS) {
      assert.match(p.swatch, /^#[0-9a-f]{6}$/i, p.id);
      assert.match(p.gold, /^#[0-9a-f]{6}$/i, p.id);
      assert.ok(p.label.length > 2, p.id);
      assert.ok(p.hint.length > 8, p.id);
    }
  });
});
