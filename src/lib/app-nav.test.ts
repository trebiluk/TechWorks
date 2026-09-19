import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chromeTabs, type NavTab } from "./app-nav.ts";

function tab(id: string): NavTab {
  return { id, label: id, on: false, onClick: () => {} };
}

describe("chrome tabs", () => {
  const dash = [tab("wall"), tab("teach"), tab("deck")];
  const admin = [tab("today"), tab("records"), tab("people"), tab("wall"), tab("day"), tab("class"), tab("modules")];
  const board = [tab("wall"), tab("teach"), tab("deck"), tab("week")];

  it("Admin does not pile rooms onto the top HUD row", () => {
    assert.deepEqual(chromeTabs("admin", dash, admin, false).map((t) => t.id), ["wall", "teach", "deck"]);
    assert.deepEqual(chromeTabs("admin", dash, admin, true), []);
  });

  it("Dash keeps Wall Teach Deck plus the rest of that strip", () => {
    assert.deepEqual(chromeTabs("dash", dash, board, false).map((t) => t.id), ["wall", "teach", "deck", "week"]);
  });

  it("classroom primary set stays on the chrome row", () => {
    const rest = [tab("wall"), tab("teach"), tab("deck"), tab("week"), tab("clubwall"), tab("hallwall")];
    assert.deepEqual(
      chromeTabs("dash", dash, rest, false).map((t) => t.id),
      ["wall", "teach", "deck", "week", "clubwall", "hallwall"],
    );
  });
});
