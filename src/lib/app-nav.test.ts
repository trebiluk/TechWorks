import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chromeTabs, type NavTab } from "./app-nav.ts";

function tab(id: string): NavTab {
  return { id, label: id, on: false, onClick: () => {} };
}

describe("chrome tabs", () => {
  const primary = [tab("wall"), tab("hour"), tab("score"), tab("people"), tab("shop"), tab("week")];

  it("the top row is Wall, This hour, Score, People, Shop", () => {
    assert.deepEqual(chromeTabs("dash", [], primary, false).map((t) => t.id), ["wall", "hour", "score", "people", "shop"]);
  });

  it("a phone uses the dock, so the HUD row stays empty", () => {
    assert.deepEqual(chromeTabs("dash", [], primary, true), []);
    assert.deepEqual(chromeTabs("admin", [], primary, true), []);
  });
});
