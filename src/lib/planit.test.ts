import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { setTeachDo, teachDay } from "./teach.ts";
import { projectsOf } from "./projects.ts";
import {
  newPlanitUnit,
  planitLiveWeek,
  planitPreview,
  planitStripHasWork,
  planitUnitName,
  setPlanitMove,
  setPlanitTitle,
  writePlanitHour,
} from "./planit.ts";
import { hourAgendaWall } from "./hour-flow.ts";
import { hourIsSet, planCell } from "./planbook.ts";
import { teachDeckOf } from "./teach-deck.ts";

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 7 },
        { period: 3, grade: 6 },
      ],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

describe("planit names", () => {
  it("never parks a unit named Ask / Sketch / Build", () => {
    assert.equal(planitUnitName("Ask", "How does a lever help?"), "How does a lever help?");
    assert.equal(planitUnitName("Sketch", ""), "This class");
    assert.equal(planitUnitName("Cut the blanks", "What is kerf?"), "Cut the blanks");
  });

  it("titles the hour from Do this, not the process chip", () => {
    let file = setPlanitTitle(desk(), "2026-09-15", 1, "Cut the blanks");
    file = setPlanitMove(file, "2026-09-15", 1, "create");
    assert.equal(teachDay(file, "2026-09-15", 1).do, "Cut the blanks");
    assert.equal(teachDay(file, "2026-09-15", 1).move, "create");
    const unit = projectsOf(file)[0];
    assert.ok(unit);
    assert.notEqual(unit.title, "Ask");
    assert.notEqual(unit.title, "Create");
    assert.equal(unit.title, "Cut the blanks");
  });

  it("new unit uses the typed name, even if a move chip is nearby", () => {
    const file = newPlanitUnit(desk(), {
      date: "2026-09-15",
      period: 2,
      name: "CO2 cars",
      question: "How does shape change speed?",
      title: "Sketch three bodies",
    });
    assert.equal(projectsOf(file)[0]?.title, "CO2 cars");
    assert.equal(teachDay(file, "2026-09-15", 2).do, undefined);
    assert.equal(projectsOf(file)[0]?.prompt, "How does shape change speed?");
  });
});

describe("planit wall strip", () => {
  it("feeds This week from Do this, and hides when empty", () => {
    const empty = planitLiveWeek(desk(), 1, "2026-09-15");
    assert.equal(planitStripHasWork(empty), false);
    const file = setTeachDo(desk(), "2026-09-15", 1, "Sand the blank.");
    const days = planitLiveWeek(file, 1, "2026-09-15");
    assert.equal(planitStripHasWork(days), true);
    const tue = days.find((d) => d.date === "2026-09-15");
    assert.equal(tue?.title, "Sand the blank.");
    assert.equal(tue?.live, true);
  });

  it("wall preview is the same Agenda + Need the projector plays", () => {
    let file = setPlanitTitle(desk(), "2026-09-15", 1, "Cut the blanks");
    file = setTeachDo(file, "2026-09-15", 1, "Cut the blanks");
    const prev = planitPreview(file, "2026-09-15", 1);
    assert.equal(prev.title, "Cut the blanks");
    assert.ok(prev.cards.some((c) => c.kicker === "Do this" && c.body.includes("Cut")));
  });

  it("Mon P1 Job · Guiding Q · Prove · beats fill Wall and Deck", () => {
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
    assert.equal(hourIsSet(file, mon, 1), true);
    const cell = planCell(file, mon, 1);
    assert.equal(cell.do, "Sketch one lever.");
    assert.equal(cell.ask, "How can a small force move a bigger load?");
    assert.equal(cell.objective, "Point to the load and the force on the sketch.");
    const wall = hourAgendaWall(file, mon, 1);
    assert.equal(wall.find((c) => c.id === "now")?.body, "Sit with your crew.");
    assert.equal(wall.find((c) => c.id === "goal")?.body, "Sketch one lever.");
    assert.equal(wall.find((c) => c.id === "next")?.body, "Peer restyle the sketch.");
    const deck = teachDeckOf(file, 1, mon);
    assert.equal(deck.slides[0]?.title, "How can a small force move a bigger load?");
    assert.equal(deck.slides.find((s) => s.id === "agenda")?.cards?.[1]?.line, "Sketch one lever.");
    const prove = deck.slides.find((s) => s.id === "prove");
    assert.ok(prove?.cards?.some((c) => c.line === "Point to the load and the force on the sketch."));
  });
});
