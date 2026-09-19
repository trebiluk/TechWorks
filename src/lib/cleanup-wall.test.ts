import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "styles.css"), "utf8");
const wall = readFileSync(join(root, "components/cleanup-wall.tsx"), "utf8");
const teach = readFileSync(join(root, "components/teach-board.tsx"), "utf8");

describe("Cleanup wall 1.92.90", () => {
  it("is one leftover clock — no ProgressRing twin on the student wall", () => {
    assert.match(wall, /data-cleanup-wall/);
    assert.match(wall, /tw-cleanup-clock/);
    assert.match(wall, /tw-cleanup-drain/);
    assert.doesNotMatch(wall, /ProgressRing/);
    assert.doesNotMatch(wall, /go get caught/);
  });

  it("keeps Extra tidy / +$5 catch on Teach, not the student wall", () => {
    const wallFn = wall.slice(wall.indexOf("function CleanupWall"), wall.indexOf("function JobCard"));
    assert.doesNotMatch(wallFn, /ExtraTidyCatch/);
    assert.doesNotMatch(wallFn, /grantCleanupCatch/);
    assert.doesNotMatch(wallFn, /CLEANUP_CASH/);
    assert.match(wall, /function ExtraTidyCatch/);
    assert.match(wall, /data-extra-tidy/);
    assert.match(teach, /period=\{period\}/);
    assert.match(teach, /<CleanupJobsPad/);
  });

  it("lets Workshop + Classroom fill the coral plate", () => {
    assert.match(css, /\.tw-cleanup-cards \{[\s\S]*?flex:\s*1 1 0/);
    assert.match(css, /\.tw-cleanup-cards \{[\s\S]*?grid-template-columns:\s*1fr 1fr/);
    assert.match(css, /\.tw-cleanup-drain \{/);
    assert.match(css, /\.tw-dot-on,\s*\n\.tw-blink \{/);
    assert.match(css, /\.tw-blink,/);
  });
});
