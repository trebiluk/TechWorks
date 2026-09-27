import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { watchQueue } from "./skill-queue.ts";

function kid(id: string, skills: Record<string, number> = {}): RawStudent {
  return {
    id,
    first: id,
    last: "",
    period: 2,
    crewKey: "A",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    skills,
  };
}

function desk(students: RawStudent[]): EconomyFile {
  return {
    meta: {
      title: "Shop",
      schema: 12,
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      config: {
        teachDays: {
          "2026-09-20": { "2": { skills: ["draw"] } },
          "2026-09-27": { "2": { skills: ["safety"] } },
        },
      },
    },
    crews: [],
    students,
  } as unknown as EconomyFile;
}

describe("watch queue", () => {
  it("puts this hour first, then an older skill someone has not been seen on", () => {
    const file = desk([kid("a", { safety: 3, draw: 2 }), kid("b", { safety: 0 })]);
    const q = watchQueue(file, 2, "2026-09-27", file.students);
    assert.deepEqual(q.map((x) => x.id), ["safety", "draw"]);
    assert.equal(q[0]?.why, "today");
    assert.equal(q[1]?.why, "overdue");
  });

  it("drops an older skill once everyone has a mark", () => {
    const file = desk([kid("a", { draw: 2 }), kid("b", { draw: 3 })]);
    const q = watchQueue(file, 2, "2026-09-27", file.students);
    assert.deepEqual(q.map((x) => x.id), ["safety"]);
  });
});
