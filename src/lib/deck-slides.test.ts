import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { setTeachAgenda, setTeachAsk, setTeachDo, setTeachMaterials, setTeachObjective } from "./teach.ts";
import { slidesFor } from "./deck-slides.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 3, grade: 7 },
      ],
      config: { currentCycle: 1, teachDays: {} },
      dayLog: {},
    },
    crews: [],
    students: [{ id: "s1", first: "Altair", last: "", period: 3, crewKey: "A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 }],
  };
}

describe("deck slides", () => {
  const date = "2026-10-21";

  it("an empty day is one No plan yet slide", () => {
    const slides = slidesFor(desk(), date, 3);
    assert.equal(slides.length, 1);
    assert.equal(slides[0].title, "No plan yet");
    assert.equal(slides[0].id, "empty");
  });

  it("builds title, kit, agenda, prove, and cleanup from the hour", () => {
    let file = setTeachDo(desk(), date, 3, "Gusset plates");
    file = setTeachAsk(file, date, 3, "How do gussets make a joint stronger?");
    file = setTeachMaterials(file, date, 3, "cardboard");
    file = setTeachObjective(file, date, 3, "The joint holds.");
    file = setTeachAgenda(file, date, 3, { now: "Sketch the joint.", goal: "Glue the plates." });
    const before = structuredClone(file);
    const slides = slidesFor(file, date, 3);
    assert.deepEqual(file, before);
    assert.equal(slides[0].title, "Gusset plates");
    assert.equal(slides[0].line, "How do gussets make a joint stronger?");
    assert.equal(slides[1].id, "need");
    assert.match(slides[1].line, /cardboard/);
    assert.ok(slides.some((s) => s.line === "Sketch the joint."));
    assert.ok(slides.some((s) => s.line === "Glue the plates."));
    const prove = slides.find((s) => s.id === "prove");
    const clean = slides.find((s) => s.id === "clean");
    assert.equal(prove?.line, "The joint holds.");
    assert.equal(clean?.title, "Cleanup");
    assert.equal(slides.at(-1)?.id, "clean");
    assert.ok(slides.length >= 6);
  });

  it("does not change another period", () => {
    let file = setTeachDo(desk(), date, 3, "Gusset plates");
    file = setTeachDo(file, date, 1, "Stay put");
    const other = slidesFor(file, date, 1);
    assert.equal(other[0].title, "Stay put");
    assert.equal(slidesFor(file, date, 3)[0].title, "Gusset plates");
  });
});
