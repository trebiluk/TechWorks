import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { THEMES } from "./theme.ts";
import { WALL_PRESETS, wallPresetOf } from "./wall-presets.ts";

describe("wall presets", () => {
  it("ships named dark walls with back-row type", () => {
    assert.ok(WALL_PRESETS.length >= 6);
    const ids = WALL_PRESETS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const p of WALL_PRESETS) {
      const theme = THEMES.find((t) => t.id === p.theme);
      assert.ok(theme, `${p.id} theme`);
      assert.equal(theme!.kind, "dark", `${p.id} stays dark`);
      assert.ok(p.look.scale >= 18, `${p.id} scale`);
      assert.equal(p.look.fill, 100, `${p.id} fill`);
      assert.ok(p.look.titles >= 100, `${p.id} titles`);
    }
  });

  it("shop wall is the TechWorks default", () => {
    const shop = wallPresetOf("shop");
    assert.ok(shop);
    assert.equal(shop!.theme, "solvay");
    assert.equal(shop!.kit, "wall");
    assert.equal(shop!.font, "outfit");
    assert.equal(wallPresetOf("nope"), null);
  });
});
