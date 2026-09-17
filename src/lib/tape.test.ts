import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recentMarks, writeTape } from "./tape.ts";

describe("recent marks", () => {
  it("walks backward over dated marks and skips blanks", () => {
    const s = {
      marks: {
        "2026-09-14": "3",
        "2026-09-11": "2",
        "2026-09-10": "3",
      },
    };
    const rows = recentMarks(s, "2026-09-15", 3);
    assert.deepEqual(rows.map((r) => r.code), ["3", "2", "3"]);
    assert.equal(rows[0]?.date, "2026-09-14");
  });

  it("reads the year tape when the dict is empty", () => {
    let tape = "";
    tape = writeTape(tape, "2026-09-08", "3");
    tape = writeTape(tape, "2026-09-09", "1");
    const rows = recentMarks({ markTape: tape }, "2026-09-10", 5);
    assert.deepEqual(rows.map((r) => `${r.date}:${r.code}`), ["2026-09-09:1", "2026-09-08:3"]);
  });
});
