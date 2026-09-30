import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { compactStudent } from "./compact.ts";
import { bookSnapshot, columnTsv, gradeSlots, postedFor, sessionMark } from "./grades.ts";
import { setGradeExcuse, setGradeNote, setGradeOverride } from "./store.ts";

function kid(id: string, first: string): RawStudent {
  return { id, first, last: "", period: 1, crewKey: "A", days: [], bonus: 0, deduct: 0, clutch: 0, opening: 0 };
}

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: 0 },
      bell: [{ period: 1, grade: 6 }],
      config: {
        projects: [
          { id: "cat", title: "Catapult", grades: [6], skills: ["model"], stages: [], activities: [] },
          { id: "draw", title: "Drawing", grades: [6], skills: ["draw"], stages: [], activities: [] },
        ],
      },
    },
    crews: [],
    students: [kid("a", "Alder"), kid("b", "Birch")],
  };
}

describe("grade book", () => {
  it("treats a blank as not scored, and an excuse as out of the average", () => {
    let file = desk();
    const slots = gradeSlots(file, 6);
    assert.equal(slots.length, 2);
    const open = postedFor(file, file.students[0], slots[0]);
    assert.equal(open.posted, null);
    assert.equal(open.excused, false);

    file = setGradeExcuse(file, "a", slots[0].id, true);
    file = setGradeOverride(file, "a", slots[1].id, 92);
    file = setGradeNote(file, "a", slots[1].id, "Strong launch");
    const alder = file.students[0];
    const excused = postedFor(file, alder, slots[0]);
    const posted = postedFor(file, alder, slots[1]);
    assert.equal(excused.excused, true);
    assert.equal(excused.posted, null);
    assert.equal(posted.posted, 92);
    assert.equal(posted.note, "Strong launch");
    assert.equal(sessionMark([excused, posted]), 92);

    file = setGradeOverride(file, "a", slots[0].id, 80);
    assert.equal(postedFor(file, file.students[0], slots[0]).excused, false);
    assert.equal(postedFor(file, file.students[0], slots[0]).posted, 80);
  });

  it("counts not-scored and under-70, and keeps comments through compact", () => {
    let file = desk();
    const slots = gradeSlots(file, 6);
    file = setGradeOverride(file, "b", slots[0].id, 60);
    file = setGradeOverride(file, "b", slots[1].id, 60);
    file = setGradeNote(file, "b", slots[0].id, "Redo the arm");
    const rows = file.students.map((s) => {
      const posted = slots.map((slot) => postedFor(file, s, slot));
      return { posted, avg: sessionMark(posted) };
    });
    const snap = bookSnapshot(rows);
    assert.equal(snap.n, 2);
    assert.equal(snap.openKids, 1);
    assert.equal(snap.low, 1);
    assert.equal(snap.letters.F, 1);

    const kept = compactStudent(file.students[1]);
    assert.equal(kept.gradeNotes?.[slots[0].id], "Redo the arm");
    assert.match(columnTsv(file, file.students, slots[0]), /Birch\t60\tRedo the arm/);
  });
});
