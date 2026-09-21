import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_GROUPS, groupOfPane, paneInGroup } from "./admin-nav.ts";

describe("admin nav", () => {
  it("puts Crews on Records and keeps it off a second top group", () => {
    const rec = ADMIN_GROUPS.find((g) => g.id === "records");
    assert.ok(rec?.panes.includes("crews"));
    assert.ok(rec?.panes.includes("roster"));
    assert.equal(groupOfPane("crews").id, "records");
    assert.equal(paneInGroup("crews", "records"), true);
  });
});
