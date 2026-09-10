import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloudSyncPlan } from "./desk-cloud.ts";

describe("cloud sync plan", () => {
  it("pulls a roster onto an empty PC", () => {
    assert.equal(cloudSyncPlan(0, 84, true, false), "pull");
  });

  it("pushes a local roster onto an empty cloud", () => {
    assert.equal(cloudSyncPlan(24, 0, false, false), "push");
  });

  it("never auto-pushes an empty desk over names even if local is newer", () => {
    assert.equal(cloudSyncPlan(0, 12, true, false), "pull");
  });

  it("keeps both empty", () => {
    assert.equal(cloudSyncPlan(0, 0, true, false), "keep");
  });

  it("pushes when both have names and local is newer", () => {
    assert.equal(cloudSyncPlan(24, 24, true, false), "push");
  });

  it("pulls when both have names and cloud is newer", () => {
    assert.equal(cloudSyncPlan(24, 24, false, false), "pull");
  });

  it("keeps matching timestamps", () => {
    assert.equal(cloudSyncPlan(24, 24, false, true), "keep");
  });
});
