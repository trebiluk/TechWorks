import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { badgesOf, progressCsv, recentClears, weekXp } from "./app-progress.ts";
import { HUB_DOORS } from "./hub-doors.ts";

describe("app progress", () => {
  const row = {
    v: 2,
    app: "spancraft",
    alias: "Nova",
    code: "PNZM4",
    event: "clear",
    level: "First Truss",
    stars: 4,
    xp: 12,
    ts: new Date().toISOString(),
  };

  it("rolls a badge and a clear line with no shop code", () => {
    const text = recentClears([row])[0] ?? "";
    assert.match(text, /SpanCraft · Clear First Truss ★4/);
    assert.equal(text.includes("PNZM4"), false);
    assert.equal(badgesOf([row])[0]?.clears, 1);
    assert.equal(weekXp([row]) >= 12, true);
  });

  it("csv is alias, app, level, stars, xp, ts", () => {
    const csv = progressCsv([row]);
    assert.match(csv, /^alias,app,level,stars,xp,ts/);
    assert.match(csv, /Nova/);
    assert.equal(csv.includes("PNZM4"), false);
  });

  it("lists 24 hub doors and names Berty's Run", () => {
    assert.equal(HUB_DOORS.length, 24);
    assert.equal(HUB_DOORS.find((d) => d[0] === "berty-run")?.[1], "Berty's Run");
    assert.equal(new Set(HUB_DOORS.map((d) => d[0])).size, 24);
  });
});
