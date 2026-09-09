import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { frameOf, titleOf } from "./flair.ts";

describe("frameOf", () => {
  it("stays plain until Scout, gold at Legend", () => {
    assert.equal(frameOf(0), "plain");
    assert.equal(frameOf(12), "gain");
    assert.equal(frameOf(24), "accent");
    assert.equal(frameOf(42), "gold");
  });
});

describe("titleOf", () => {
  it("calls first in the period Shop lead", () => {
    assert.equal(titleOf(8, 1), "Shop lead");
    assert.equal(titleOf(8, 2), "Rookie");
  });
});
