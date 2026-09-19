import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../styles.css"), "utf8");
const planit = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/planit.tsx"), "utf8");
const teachLive = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/teach-live.tsx"), "utf8");
const teachBoard = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../components/teach-board.tsx"), "utf8");

describe("PlanIt Mr Fortnite chrome", () => {
  it("locks Plan 40 / TEACH 60 on the hour spine", () => {
    const stage = css.match(/\.tw-planit-mf \.tw-planit-stage \{[^}]+\}/);
    assert.ok(stage, "mf stage rule");
    assert.match(stage[0], /40%/);
    assert.match(stage[0], /60%/);
  });

  it("paints LCARS L-rails with open corners", () => {
    assert.match(css, /\.tw-lcars::before/);
    assert.match(css, /--lcars-gap/);
    assert.match(css, /\.tw-lcars::before \{[\s\S]*?pointer-events:\s*none/);
  });

  it("keeps taps at 44px and honors reduced motion", () => {
    const taps = css.match(/\.tw-planit-mf button,[\s\S]*?min-height:\s*2\.75rem/);
    assert.ok(taps, "44px taps");
    assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\) \{[\s\S]*?\.tw-planit-mf[\s\S]*?animation:\s*none/);
  });

  it("stays Dream purple-blue + gold and never mixes Baboo Stark", () => {
    assert.match(css, /\.tw-planit-mf(?:,\s*\.tw-teach-live)? \{[\s\S]*?--mf-violet/);
    assert.match(css, /\.tw-planit-mf(?:,\s*\.tw-teach-live)? \{[\s\S]*?--mf-gold/);
    assert.doesNotMatch(css, /baboo|stark/i);
    assert.doesNotMatch(planit, /baboo|stark/i);
    assert.doesNotMatch(teachLive, /baboo|stark/i);
  });

  it("names the right pane TEACH, not a second Wall chrome", () => {
    assert.match(planit, /data-planit-mf/);
    assert.match(planit, /<TeachLive/);
    assert.match(teachLive, /data-teach-live/);
    assert.match(teachLive, /LIVE_BOARD_TABS/);
    assert.match(teachBoard, /<TeachLive/);
    assert.match(teachLive, /Top XP/);
    assert.match(teachLive, /Top \$/);
  });
});
