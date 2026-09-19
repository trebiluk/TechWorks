import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../styles.css"), "utf8");

describe("chrome hit layer", () => {
  it("does not let wall chip scale resize HUD min-heights", () => {
    const rules = [...css.matchAll(/html\[data-look\][^{]*\.min-h-11[^{]*\{/g)].map((m) => m[0]);
    assert.ok(rules.length >= 1, "look chip rules");
    for (const rule of rules) {
      assert.match(rule, /\.board-main/, rule);
      assert.doesNotMatch(rule, /desk-chrome/, rule);
    }
  });

  it("keeps gadget shine from stealing pointer hits", () => {
    assert.match(css, /\.tw-gadget::after \{[\s\S]*?pointer-events:\s*none/);
    assert.match(css, /\.tw-hud::before \{[\s\S]*?pointer-events:\s*none/);
    assert.match(css, /html\[data-look\] body::before \{[\s\S]*?pointer-events:\s*none/);
  });

  it("isolates desk chrome above the board so themes cannot cover controls", () => {
    assert.match(css, /header\.desk-chrome \{[\s\S]*?z-index:\s*40/);
    assert.match(css, /header\.desk-chrome \{[\s\S]*?isolation:\s*isolate/);
    assert.match(css, /header\.desk-chrome\.tw-gadget::after \{[\s\S]*?content:\s*none/);
    assert.match(css, /header\.desk-chrome button,[\s\S]*?pointer-events:\s*auto\s*!important/);
  });

  it("pins HUD tap size so premade looks cannot inflate Web and peer buttons", () => {
    assert.match(css, /header\.desk-chrome \.tw-hud-btn \{[\s\S]*?min-height:\s*2\.75rem/);
  });

  it("keeps look previews paint-only so they cannot steal HUD hits", () => {
    assert.match(css, /header\.desk-chrome \{[\s\S]*?pointer-events:\s*auto/);
    assert.match(css, /\.tw-look-mini \{[\s\S]*?pointer-events:\s*none/);
    assert.match(css, /\.tw-theme-swatch \{[\s\S]*?pointer-events:\s*none/);
    assert.match(css, /header\.desk-chrome button,[\s\S]*?touch-action:\s*manipulation/);
  });

  it("never lets status pills cover Wall Teach Deck PlanIt", () => {
    const cluster = css.match(/header\.desk-chrome \.nav-cluster \{[^}]+\}/);
    assert.ok(cluster, "nav-cluster rule");
    assert.match(cluster[0], /flex-wrap:\s*wrap/);
    assert.doesNotMatch(cluster[0], /flex-wrap:\s*nowrap/);
    const chips = css.match(/header\.desk-chrome \.nav-cluster > \.nav-chips \{[^}]+\}/);
    assert.ok(chips, "nav-chips rule");
    assert.match(chips[0], /flex:\s*1 1 auto/);
    assert.match(chips[0], /min-width:\s*min\(24rem,\s*100%\)/);
    const hud = css.match(/header\.desk-chrome \.tw-hud-row \{[^}]+\}/);
    assert.ok(hud, "hud-row rule");
    assert.match(hud[0], /flex:\s*0 0 auto/);
    const chipZ = Number(/z-index:\s*(\d+)/.exec(chips[0])?.[1] ?? 0);
    const hudZ = Number(/z-index:\s*(\d+)/.exec(hud[0])?.[1] ?? 0);
    assert.ok(chipZ > hudZ, `nav chips z-index ${chipZ} must beat HUD ${hudZ}`);
  });
});
