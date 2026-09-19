import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { liveBoardRanks, liveBoardSpine, LIVE_BOARD_TABS } from "./live-board.ts";
import { writePlanitHour } from "./planit.ts";
import { teachDeckOf } from "./teach-deck.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period">): RawStudent {
  return {
    last: "",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    crewKey: "A",
    ...partial,
  };
}

function desk(students: RawStudent[] = []): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 7 },
      ],
    },
    crews: [],
    students,
  };
}

describe("live board ranks", () => {
  it("paints gilded Top XP / Top $ plus the classic list, aliases only", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Rivet", period: 1, opening: 12, skills: { safety: 2 }, legalLast: "Smith", legalFirst: "Jordan", last: "Smith" }),
      kid({ id: "TW-BBBBBBBBBB", first: "Forge", period: 3, opening: 80, skills: { safety: 1 }, legalLast: "Nguyen", legalFirst: "Ada", last: "Nguyen" }),
      kid({ id: "TW-CCCCCCCCCC", first: "Volt", period: 6, opening: 900, skills: { safety: 9 }, legalLast: "Hall", legalFirst: "Pat" }),
    ]);
    const ranks = liveBoardRanks(file);
    assert.equal(ranks.topXp?.alias, "Rivet");
    assert.equal(ranks.topMoney?.alias, "Forge");
    assert.ok(ranks.list.some((r) => r.alias === "Rivet"));
    assert.equal(ranks.list.some((r) => r.period === 6), false);
    const blob = JSON.stringify(ranks);
    assert.equal(blob.includes("Smith"), false);
    assert.equal(blob.includes("Nguyen"), false);
    assert.equal(blob.includes("Jordan"), false);
    assert.equal(blob.includes("Ada"), false);
    assert.equal(blob.includes("Hall"), false);
  });
});

describe("live board spine", () => {
  it("labels the live pane TEACH and writes back the same row Deck plays", () => {
    assert.equal(LIVE_BOARD_TABS[0]?.id, "teach");
    assert.equal(LIVE_BOARD_TABS[0]?.label, "TEACH");
    const mon = "2026-09-21";
    const file = writePlanitHour(desk(), mon, 1, {
      job: "Sketch one lever.",
      ask: "How can a small force move a bigger load?",
      prove: "Point to the load and the force on the sketch.",
      beats: {
        now: "Sit with your crew.",
        goal: "Sketch one lever.",
        next: "Peer restyle the sketch.",
        behave: "Choose → work → focus → cleanup.",
      },
    });
    const spine = liveBoardSpine(file, mon, 1);
    assert.equal(spine.job, "Sketch one lever.");
    assert.equal(spine.ask, "How can a small force move a bigger load?");
    assert.equal(spine.prove, "Point to the load and the force on the sketch.");
    assert.equal(spine.tasksDone, 4);
    const deck = teachDeckOf(file, 1, mon);
    assert.equal(deck.slides[0]?.title, "How can a small force move a bigger load?");
    assert.equal(deck.slides.find((s) => s.id === "agenda")?.cards?.[1]?.line, "Sketch one lever.");
  });
});
