import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PROJECTOR_VIEWS, lockView } from "./lock-view.ts";

describe("lockView", () => {
  it("keeps the club and hall projector pages", () => {
    assert.equal(lockView("clubwall"), "clubwall");
    assert.equal(lockView("hallwall"), "hallwall");
    assert.ok((PROJECTOR_VIEWS as readonly string[]).includes("clubwall"));
    assert.ok((PROJECTOR_VIEWS as readonly string[]).includes("hallwall"));
  });

  it("folds the teacher desk onto the matching wall", () => {
    assert.equal(lockView("club"), "clubwall");
    assert.equal(lockView("studyhall"), "hallwall");
  });

  it("returns the class wall from Admin and Score", () => {
    assert.equal(lockView("admin"), "overview");
    assert.equal(lockView("score"), "overview");
    assert.equal(lockView("roster"), "overview");
    assert.equal(lockView("data"), "overview");
    assert.equal(lockView("overview"), "overview");
  });

  it("lets a crew sitting stay until they sign out", () => {
    assert.equal(lockView("crew", true), "crew");
    assert.equal(lockView("crew", false), "overview");
  });
});
