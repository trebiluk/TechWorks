import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { markOn, setCrewMark, setStudentMark } from "./store.ts";
import { crewEffortMark, crewGlyphId, isAwayMark, isEffortMark } from "./score-pad.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period" | "crewKey">): RawStudent {
  return {
    last: "",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    ...partial,
  };
}

function desk(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      config: {},
    },
    crews: [
      { period: 1, key: "Forge", name: "Forge" },
      { period: 1, key: "Volt", name: "Volt" },
    ],
    students: [
      kid({ id: "a", first: "Spark", period: 1, crewKey: "Forge" }),
      kid({ id: "b", first: "Bit", period: 1, crewKey: "Forge" }),
      kid({ id: "c", first: "Flux", period: 1, crewKey: "Volt" }),
    ],
  };
}

describe("crew effort mark", () => {
  it("selects a shared 3/2/1 and ignores mixed or blank", () => {
    assert.equal(crewEffortMark(["3", "3"]), "3");
    assert.equal(crewEffortMark(["2", "3"]), "");
    assert.equal(crewEffortMark(["", ""]), "");
    assert.equal(crewEffortMark(["3", "A", "3"]), "3");
    assert.equal(crewEffortMark(["A", "E"]), "");
  });

  it("treats A/E/P as away, never effort", () => {
    assert.equal(isAwayMark("A"), true);
    assert.equal(isAwayMark("3"), false);
    assert.equal(isEffortMark("2"), true);
    assert.equal(isEffortMark("P"), false);
  });
});

describe("setCrewMark present-only", () => {
  it("writes one crew 3/2/1 and leaves the other crew alone", () => {
    const date = "2026-09-17";
    const next = setCrewMark(desk(), 1, "Forge", date, "3");
    assert.equal(markOn(next.students[0]!, date), "3");
    assert.equal(markOn(next.students[1]!, date), "3");
    assert.equal(markOn(next.students[2]!, date), "");
  });

  it("does not overwrite A/E/P when the pad taps 3/2/1", () => {
    const date = "2026-09-17";
    let file = setStudentMark(desk(), "a", date, "A");
    file = setCrewMark(file, 1, "Forge", date, "2");
    assert.equal(markOn(file.students[0]!, date), "A");
    assert.equal(markOn(file.students[1]!, date), "2");
  });

  it("follows crewAt so a dated move scores the right table", () => {
    const date = "2026-09-17";
    const file = desk();
    file.students[0] = { ...file.students[0]!, crewDays: { [date]: "Volt" } };
    const next = setCrewMark(file, 1, "Volt", date, "1");
    assert.equal(markOn(next.students[0]!, date), "1");
    assert.equal(markOn(next.students[2]!, date), "1");
    assert.equal(markOn(next.students[1]!, date), "");
  });
});

describe("Score · 40s surfaces", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const score = readFileSync(join(root, "components/score.tsx"), "utf8");
  const teach = readFileSync(join(root, "components/teach-board.tsx"), "utf8");
  const lead = readFileSync(join(root, "components/crew-lead.tsx"), "utf8");

  it("keeps Daily Goal and Happened off the scoring pad", () => {
    assert.doesNotMatch(score, /DayFacts/);
    assert.doesNotMatch(score, /Daily goal/);
    assert.doesNotMatch(score, /Happened/);
    assert.doesNotMatch(score, /dayPay/);
    assert.doesNotMatch(score, /money\(/);
    assert.doesNotMatch(score, /PollPad/);
    assert.doesNotMatch(score, /PeriodRewardChip/);
    assert.match(score, /data-score-pad/);
    assert.match(score, /data-score-crews/);
    assert.match(score, /min-h-11/);
    assert.match(score, /c\.kids\.length > 0/);
  });

  it("parks Daily Goal and Happened on TEACH under the period strip", () => {
    assert.match(teach, /DayFacts/);
    assert.match(teach, /data-teach-day-facts/);
    assert.match(teach, /tw-teach-top[\s\S]*data-teach-day-facts[\s\S]*<\/header>/);
  });

  it("PIN-gates the crew pad to own crew only", () => {
    assert.match(lead, /data-crew-pick/);
    assert.match(lead, /writeOwnCrew/);
    assert.match(lead, /Your crew only/);
    assert.doesNotMatch(lead, /bg-gold px-3 py-3 text-bg ring-4/);
  });

  it("paints StyleBot hex glyphs and Chromebook 6-up chrome", () => {
    const css = readFileSync(join(root, "styles.css"), "utf8");
    assert.match(score, /data-score-hex/);
    assert.doesNotMatch(score, /Chromebook · 1366×768/);
    assert.match(score, /Mark = crew score/);
    assert.match(score, /score-lead-card/);
    assert.match(score, /tapeMark/);
    assert.doesNotMatch(score, /Tech Club/);
    assert.doesNotMatch(score, /club-board/);
    assert.match(css, /\[data-score-mark\]\[data-score-on="1"\]/);
    assert.match(css, /clip-path: polygon\(50% 0%/);
  });
});

describe("crew hex glyph", () => {
  it("maps shop names to pictograms, never a default letter", () => {
    assert.equal(crewGlyphId("Forge"), "flame");
    assert.equal(crewGlyphId("Spark2"), "zap");
    assert.equal(crewGlyphId("Rivet1"), "wrench");
    assert.equal(crewGlyphId("Sprocket"), "cog");
    assert.equal(crewGlyphId("Bit1"), "cpu");
    assert.equal(crewGlyphId("Crew A"), "users");
  });
});
