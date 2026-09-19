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
  it("keeps PlanIt week as the timetable — no TEACH live mount in the stage", () => {
    const stage = css.match(/\.tw-planit-stage \{[^}]+\}/);
    assert.ok(stage, "stage rule");
    assert.match(stage[0], /overflow:\s*hidden/);
    assert.match(stage[0], /minmax\(0,\s*1fr\)/);
    assert.match(css, /\.tw-planit-stage\[data-week="on"\] \{[\s\S]*?minmax\(0,\s*1fr\)/);
    assert.match(css, /\.tw-planit-cell \{[\s\S]*?overflow:\s*hidden/);
    assert.match(css, /\.tw-planit-mf \.tw-planit-stage \{[\s\S]*?overflow:\s*hidden/);
    assert.doesNotMatch(planit, /<TeachLive/);
    assert.match(planit, /tw-planit-board/);
    assert.match(planit, /data-week=\{gridOn \? "on" : "off"\}/);
    assert.match(teachBoard, /<TeachLive/);
  });

  it("clips Hang and rank cards inside TEACH so they cannot float over PlanIt rails", () => {
    assert.match(css, /\.tw-mf-action,\s*\.tw-mf-rank \{[\s\S]*?overflow:\s*hidden/);
    assert.match(css, /\.tw-mf-action,\s*\.tw-mf-rank \{[\s\S]*?z-index:\s*0/);
    assert.match(css, /\.tw-teach-live \{[\s\S]*?min-width:\s*0/);
    assert.match(css, /\.tw-teach-live \{[\s\S]*?overflow:\s*auto/);
    assert.match(css, /\[data-teach-mf\] \{[\s\S]*?overflow:\s*hidden/);
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

  it("names TEACH as the live board, not a second Wall chrome", () => {
    assert.match(planit, /data-planit-mf/);
    assert.match(teachLive, /data-teach-live/);
    assert.match(teachLive, /LIVE_BOARD_TABS/);
    assert.match(teachBoard, /<TeachLive/);
    assert.match(teachLive, /Top XP/);
    assert.match(teachLive, /Top \$/);
  });
});
