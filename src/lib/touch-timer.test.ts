import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { endFromRemain, formatClock, secondsLeft } from "../components/touch-timer.tsx";

describe("TEACH timer end timestamp", () => {
  it("derives seconds left from an end time, including zero", () => {
    const now = 1_000_000;
    const end = endFromRemain(120, now);
    assert.equal(secondsLeft(end, now), 120);
    assert.equal(secondsLeft(end, now + 61_000), 59);
    assert.equal(formatClock(secondsLeft(end, now + 61_000)), "00:59");
    assert.equal(secondsLeft(end, now + 120_000), 0);
    assert.equal(secondsLeft(end, now + 180_000), 0);
    assert.equal(formatClock(0), "00:00");
  });

  it("pause stores the remainder and resume does not count the pause", () => {
    const start = 5_000_000;
    const end = endFromRemain(300, start);
    const pausedAt = start + 125_000;
    const remain = secondsLeft(end, pausedAt);
    assert.equal(remain, 175);
    const resumeAt = pausedAt + 40_000;
    const next = endFromRemain(remain, resumeAt);
    assert.equal(secondsLeft(next, resumeAt), 175);
    assert.equal(secondsLeft(next, resumeAt + 60_000), 115);
    assert.equal(secondsLeft(next, resumeAt + 175_000), 0);
  });

  it("formats a 2 minute preset as 02:00 and 4:59 as 04:59", () => {
    assert.equal(formatClock(2 * 60), "02:00");
    assert.equal(formatClock(299), "04:59");
    assert.equal(formatClock(10 * 60), "10:00");
  });
});
