import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { FEATURES, FEATURE_GROUPS, FEATURE_HIDES, featureOn, setFeature, type FeatureId } from "./features.ts";
import { chromeReady } from "./wall-chrome.ts";

function desk(modules: Partial<Record<FeatureId, boolean>> = {}): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      config: { modules },
    },
    crews: [],
    students: [],
  };
}

describe("features pass", () => {
  it("lists every module once, grouped, with a real hide target", () => {
    const ids = FEATURES.map((f) => f.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, Object.keys(FEATURE_HIDES).length);
    for (const f of FEATURES) {
      assert.ok(FEATURE_GROUPS.includes(f.group), f.id);
      assert.ok(FEATURE_HIDES[f.id].length > 2, f.id);
    }
  });

  it("defaults: games and fake data off, shop wall on", () => {
    const file = desk();
    assert.equal(featureOn(file, "weather"), true);
    assert.equal(featureOn(file, "berty"), true);
    assert.equal(featureOn(file, "teach"), true);
    assert.equal(featureOn(file, "polls"), true);
    assert.equal(featureOn(file, "reward"), true);
    assert.equal(featureOn(file, "projects"), true);
    assert.equal(featureOn(file, "prints"), true);
    assert.equal(featureOn(file, "club"), true);
    assert.equal(featureOn(file, "studyhall"), true);
    assert.equal(featureOn(file, "picker"), true);
    assert.equal(featureOn(file, "timer"), true);
    assert.equal(featureOn(file, "crews"), true);
    assert.equal(featureOn(file, "grades"), true);
    assert.equal(featureOn(file, "achievements"), true);
    assert.equal(featureOn(file, "lucky"), false);
    assert.equal(featureOn(file, "store"), false);
    assert.equal(featureOn(file, "stocks"), false);
    assert.equal(featureOn(file, "portal"), false);
    assert.equal(featureOn(file, "debug"), false);
    assert.equal(featureOn(file, "nytech"), false);
    assert.equal(featureOn(file, "ambient"), false);
    assert.equal(featureOn(file, "contrast"), false);
    assert.equal(featureOn(file, "tips"), false);
  });

  it("setFeature on and off sticks", () => {
    let file = desk();
    file = setFeature(file, "lucky", true);
    assert.equal(featureOn(file, "lucky"), true);
    file = setFeature(file, "weather", false);
    assert.equal(featureOn(file, "weather"), false);
    assert.equal(featureOn(file, "berty"), true);
  });

  it("empty projector hides game chrome", () => {
    const file = desk();
    assert.equal(chromeReady("lucky", file), false);
    assert.equal(chromeReady("store", file), false);
    assert.equal(chromeReady("polls", file), false);
    assert.equal(chromeReady("prints", file), false);
    assert.equal(chromeReady("weather", file), true);
    assert.equal(chromeReady("teach", file), true);
    assert.equal(chromeReady("berty", file), true);
  });
});
