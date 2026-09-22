import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GLOSSARY } from "../data/glossary.ts";
import { dealFlash, dealHeat, dealHeatFrom, dealMatch, heatScore, spellOk } from "./vocab-game.ts";

describe("word heat", () => {
  it("deals four unique choices and one correct", () => {
    const qs = dealHeat(8, "Safety");
    assert.ok(qs.length >= 4);
    for (const q of qs) {
      assert.equal(q.choices.length, 4);
      assert.equal(new Set(q.choices).size, 4);
      assert.ok(q.choices.includes(q.answer));
      assert.ok(q.term);
    }
  });

  it("pays speed and streak, zero on a miss", () => {
    assert.equal(heatScore(false, 12, 5), 0);
    assert.ok(heatScore(true, 12, 3) > heatScore(true, 1, 0));
  });
});

describe("word games", () => {
  it("glossary ids stay unique", () => {
    const ids = GLOSSARY.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it("match deals paired term and def tiles", () => {
    const tiles = dealMatch(6, "Tools");
    assert.equal(tiles.length, 12);
    const pairs = new Set(tiles.map((t) => t.pair));
    assert.equal(pairs.size, 6);
    for (const id of pairs) {
      const face = tiles.filter((t) => t.pair === id).map((t) => t.face).sort();
      assert.deepEqual(face, ["def", "term"]);
    }
    assert.equal(new Set(tiles.map((t) => t.key)).size, 12);
  });

  it("flash deals unique cards from the bank", () => {
    const cards = dealFlash(8, "Safety");
    assert.ok(cards.length >= 4);
    assert.equal(new Set(cards.map((c) => c.id)).size, cards.length);
    for (const c of cards) assert.equal(c.cat, "Safety");
  });

  it("heat from a seed stays on those terms", () => {
    const qs = dealHeatFrom(["kerf", "grit", "ppe"]);
    assert.equal(qs.length, 3);
    assert.deepEqual(
      qs.map((q) => q.term).sort(),
      ["Grit", "Kerf", "PPE"],
    );
  });

  it("spellOk ignores case and hyphens, rejects the say-alike", () => {
    assert.equal(spellOk("Kerf", "Kerf"), true);
    assert.equal(spellOk(" try square ", "Try square"), true);
    assert.equal(spellOk("try-square", "Try square"), true);
    assert.equal(spellOk("PPE", "PPE"), true);
    assert.equal(spellOk("curf", "Kerf"), false);
    assert.equal(spellOk("", "Kerf"), false);
  });
});
