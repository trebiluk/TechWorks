import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarize } from "./djia.ts";

describe("DJIA week average", () => {
  it("uses this week's closes vs last week as the shock", () => {
    const bars = [
      { date: "2026-08-24", close: 100 },
      { date: "2026-08-25", close: 100 },
      { date: "2026-08-26", close: 100 },
      { date: "2026-08-27", close: 100 },
      { date: "2026-08-28", close: 100 },
      { date: "2026-08-31", close: 110 },
      { date: "2026-09-01", close: 110 },
      { date: "2026-09-02", close: 110 },
      { date: "2026-09-03", close: 110 },
      { date: "2026-09-04", close: 110 },
    ];
    const q = summarize(bars, "2026-09-04");
    assert.equal(q.weekAvg, 110);
    assert.equal(q.prevAvg, 100);
    assert.equal(q.wowPct, 10);
  });
});
