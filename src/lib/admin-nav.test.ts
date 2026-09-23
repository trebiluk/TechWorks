import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_GROUPS, groupOfPane, paneInGroup } from "./admin-nav.ts";

describe("admin nav", () => {
  it("keeps five chips and puts add-class on People", () => {
    assert.equal(ADMIN_GROUPS.length, 5);
    assert.deepEqual(
      ADMIN_GROUPS.map((g) => g.id),
      ["today", "people", "money", "room", "data"],
    );
    const people = ADMIN_GROUPS.find((g) => g.id === "people");
    assert.equal(people?.panes[0], "roster");
    assert.ok(people?.panes.includes("crews"));
    assert.equal(groupOfPane("crews").id, "people");
    assert.equal(groupOfPane("roster").id, "people");
    assert.equal(groupOfPane("vault").id, "data");
    assert.equal(groupOfPane("room").id, "room");
    assert.equal(groupOfPane("wall").id, "room");
    assert.equal(groupOfPane("day").id, "room");
    assert.equal(groupOfPane("modules").id, "room");
    assert.equal(paneInGroup("crews", "people"), true);
    const ids = ADMIN_GROUPS.map((g) => g.id) as string[];
    assert.equal(ids.includes("records"), false);
  });
});
