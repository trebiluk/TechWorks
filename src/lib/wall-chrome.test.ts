import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { chromeReady } from "./wall-chrome.ts";

function desk(over: Partial<EconomyFile["meta"]> = {}): EconomyFile {
  return {
    meta: { title: "T", quarterName: "Q1", currentWeek: 1, codes: { "3": 25 }, ...over },
    crews: [],
    students: [],
  };
}

describe("wall chrome", () => {
  it("hides lucky, pizza, polls, and store at zero", () => {
    const file = desk();
    assert.equal(chromeReady("lucky", file), false);
    assert.equal(chromeReady("reward", file), false);
    assert.equal(chromeReady("polls", file), false);
    assert.equal(chromeReady("store", file), false);
    assert.equal(chromeReady("teach", file), true);
    assert.equal(chromeReady("weather", file), true);
  });

  it("shows lucky once the pot has money", () => {
    const file = desk({ config: { lucky: { pot: 40, tickets: [] } } });
    assert.equal(chromeReady("lucky", file), true);
  });
});
