import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { saveTeachAsk, saveTeachDo, saveTeachLine } from "./plan-sync.ts";
import { teachDay } from "./teach.ts";
import { patchTeachFromDeck, teachDeckOf } from "./teach-deck.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [{ period: 1, grade: 6 }],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("teach deck spine", () => {
  it("Teach ask is the deck title, not a second copy", () => {
    const file = saveTeachAsk(desk(), "2026-09-14", 1, "How can a small force move a bigger load?");
    const pack = teachDeckOf(file, 1, "2026-09-14");
    assert.equal(pack.slides[0]?.title, "How can a small force move a bigger load?");
  });

  it("Deck title write lands on Teach ask", () => {
    const next = patchTeachFromDeck(desk(), 1, "2026-09-14", "job", { title: "What makes a crew efficient?" });
    assert.equal(teachDay(next, "2026-09-14", 1).ask, "What makes a crew efficient?");
    assert.equal(teachDeckOf(next, 1, "2026-09-14").slides[0]?.title, "What makes a crew efficient?");
  });

  it("custom work line is the beat, not a leftover Today", () => {
    let file = saveTeachDo(desk(), "2026-09-14", 1, "Sketch one lever.");
    file = saveTeachLine(file, "2026-09-14", 1, "work", "Build the model.");
    const beats = teachDeckOf(file, 1, "2026-09-14").slides.find((s) => s.id === "beats");
    const work = beats?.cards?.find((c) => c.title === "CREW WORK");
    assert.equal(work?.line, "Build the model.");
  });
});
