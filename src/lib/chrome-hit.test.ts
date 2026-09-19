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

  it("keeps one thin chrome row; status lives in the Edge Pocket overlay", () => {
    const cluster = css.match(/header\.desk-chrome \.nav-cluster \{[^}]+\}/);
    assert.ok(cluster, "nav-cluster rule");
    assert.match(cluster[0], /flex-wrap:\s*nowrap/);
    assert.doesNotMatch(cluster[0], /flex-wrap:\s*wrap/);
    const chips = css.match(/header\.desk-chrome \.nav-cluster > \.nav-chips \{[^}]+\}/);
    assert.ok(chips, "nav-chips rule");
    assert.match(chips[0], /flex:\s*1 1 auto/);
    assert.match(chips[0], /min-width:\s*0/);
    assert.doesNotMatch(chips[0], /min\(24rem/);
    const pocket = css.match(/header\.desk-chrome \.tw-edge-pocket \{[^}]+\}/);
    assert.ok(pocket, "edge-pocket rule");
    assert.match(pocket[0], /flex:\s*0 0 auto/);
    const menu = css.match(/\.tw-edge-pocket-menu \{[^}]+\}/);
    assert.ok(menu, "edge-pocket overlay");
    assert.match(menu[0], /position:\s*fixed/);
    const chipBtn = css.match(/header\.desk-chrome \.tw-edge-pocket-chip \{[^}]+\}/);
    assert.ok(chipBtn, "edge-pocket chip");
    assert.match(chipBtn[0], /min-height:\s*2\.75rem/);
    const chipZ = Number(/z-index:\s*(\d+)/.exec(chips[0])?.[1] ?? 0);
    const pocketZ = Number(/z-index:\s*(\d+)/.exec(pocket[0])?.[1] ?? 0);
    assert.ok(pocketZ >= chipZ, `More chip z-index ${pocketZ} must sit with nav ${chipZ}`);
  });

  it("puts Fake data and HUD extras inside EdgePocket, not a second chrome row", () => {
    const board = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/board.tsx"), "utf8");
    const pocketSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/edge-pocket.tsx"), "utf8");
    assert.match(board, /<EdgePocket/);
    assert.match(pocketSrc, /createPortal/);
    assert.match(pocketSrc, /data-edge-pocket="more"/);
    assert.match(pocketSrc, /aria-haspopup="menu"/);
    assert.match(pocketSrc, /min-h-11/);
    assert.doesNotMatch(pocketSrc, /onMouseEnter/);
    const header = board.slice(board.indexOf("<header className=\"desk-chrome"), board.indexOf("</header>"));
    const pocketAt = header.indexOf("<EdgePocket");
    const fakeAt = header.indexOf("Fake data");
    assert.ok(pocketAt > 0 && fakeAt > pocketAt, "Fake data sits inside EdgePocket");
    assert.match(header, /label=\{t\("More"\)\}/);
    assert.doesNotMatch(header, /nav-cluster flex min-w-0 flex-wrap/);
  });
});
