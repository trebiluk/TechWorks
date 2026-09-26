import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "styles.css"), "utf8");
const teach = readFileSync(join(root, "components/teach-board.tsx"), "utf8");
const pocket = readFileSync(join(root, "components/teach-pocket.tsx"), "utf8");
const board = readFileSync(join(root, "components/board.tsx"), "utf8");
const projects = readFileSync(join(root, "components/projects-board.tsx"), "utf8");

describe("TEACH Edge Pocket", () => {
  it("is a left overlay, not a reserved right column", () => {
    assert.match(pocket, /Left Edge Pocket on TEACH/);
    assert.match(css, /\.tw-teach-pocket-rail \{/);
    assert.match(css, /\.tw-teach-pocket-rail \{[\s\S]*?position:\s*absolute/);
    assert.match(css, /\.tw-teach-pocket-rail \{[\s\S]*?left:\s*0/);
    assert.doesNotMatch(css, /\.tw-teach-pocket-rail \{[\s\S]*?right:\s*0/);
    assert.match(css, /\.tw-teach-pocket-tab \{[\s\S]*?min-height:\s*2\.75rem/);
    assert.match(css, /\.tw-teach-pocket-btn \{[\s\S]*?min-height:\s*2\.75rem/);
  });

  it("keeps Hang and Print in the pocket, not a second planner", () => {
    assert.match(teach, /<TeachPocket/);
    assert.match(teach, /label:\s*"Hang"/);
    assert.match(teach, /label:\s*"Print"/);
    assert.doesNotMatch(teach, /label:\s*"PlanIt"/);
    assert.doesNotMatch(teach, /label:\s*"Deck"/);
    assert.doesNotMatch(teach, /label:\s*"Projector"/);
    assert.doesNotMatch(teach, /label:\s*"Arrange"/);
    assert.doesNotMatch(teach, /function plateOf/);
    assert.doesNotMatch(teach, /function TeachRing/);
    const header = teach.slice(teach.indexOf('className="tw-teach-top"'), teach.indexOf("</header>"));
    assert.doesNotMatch(header, />Deck</);
    assert.doesNotMatch(header, />See wall</);
    assert.doesNotMatch(header, />Arrange plates</);
    assert.doesNotMatch(header, />Print lesson</);
  });

  it("kills the LessonBoard editor and the Projects Plan Book", () => {
    assert.doesNotMatch(board, /LessonBoard/);
    assert.doesNotMatch(board, /teachStart/);
    assert.doesNotMatch(projects, /PlanBook/);
    assert.match(projects, /The hour lives on PlanIt/);
  });
});
