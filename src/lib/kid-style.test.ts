import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_KID_STYLE, KID_BUILDS, nextBuild } from "./kid-style.ts";

describe("kid style", () => {
  it("cycles build names and never asks for a typed name", () => {
    assert.equal(nextBuild("Catapult"), "Racer");
    assert.equal(nextBuild("Launcher"), "Catapult");
    assert.equal(DEFAULT_KID_STYLE.sound, false);
    assert.equal(KID_BUILDS.length, 5);
  });
});
