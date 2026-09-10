import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sanitizeSlide } from "./deck-store.ts";

describe("deck sanitize", () => {
  it("keeps words with spaces when stored", () => {
    const s = sanitizeSlide({ title: "How can a load move?", line: "one two three" }, "s1");
    assert.equal(s.title, "How can a load move?");
    assert.equal(s.line, "one two three");
  });

  it("trims edges only on save, not inner spaces", () => {
    const s = sanitizeSlide({ title: "  Hello  world  ", note: "  goggles on  " }, "s1");
    assert.equal(s.title, "Hello  world");
    assert.equal(s.note, "goggles on");
  });
});
