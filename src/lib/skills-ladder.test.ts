import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ALL_TRACK, DEFAULT_LEVEL_BANDS, SKILL_MAX, SKILL_MARKS, SKILL_TRACK, XP_PER_LEVEL, LEVEL_MAX } from "./skills.ts";
import { MST_SKILLS, type MstSkillId } from "./mst.ts";
import { hourSkillsOf, setTeachDo, setTeachSkills, toggleTeachSkill, copyTeachHour } from "./teach.ts";
import type { EconomyFile } from "./economy.ts";

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

describe("skill ladder", () => {
  it("is Cub → Legend in 6 XP steps, eight bands", () => {
    assert.equal(XP_PER_LEVEL, 6);
    assert.equal(LEVEL_MAX, 8);
    assert.equal(DEFAULT_LEVEL_BANDS.length, 8);
    assert.deepEqual(
      DEFAULT_LEVEL_BANDS.map((b) => [b.minXp, b.label]),
      [
        [0, "Cub"],
        [6, "Rookie"],
        [12, "Scout"],
        [18, "Builder"],
        [24, "Crafter"],
        [30, "Lead"],
        [36, "Ace"],
        [42, "Legend"],
      ],
    );
  });

  it("shop marks are 1–4, blank is not a zero", () => {
    assert.equal(SKILL_MAX, 4);
    assert.deepEqual(
      SKILL_MARKS.map((m) => m.name),
      ["Beginning", "Developing", "Proficient", "Distinguished"],
    );
  });

  it("every shop skill maps onto NY MST Standard 5, including History (S5)", () => {
    const covered = new Set<MstSkillId>();
    for (const s of ALL_TRACK) for (const id of s.mst) covered.add(id);
    assert.deepEqual([...covered].sort(), MST_SKILLS.map((s) => s.id));
    assert.ok(SKILL_TRACK.find((s) => s.id === "present")?.mst.includes("S5"));
  });
});

describe("PlanIt hour skills", () => {
  it("toggles up to three skills onto the hour", () => {
    let file = setTeachDo(desk(), "2026-09-21", 1, "Cut the blanks");
    file = toggleTeachSkill(file, "2026-09-21", 1, "measure");
    file = toggleTeachSkill(file, "2026-09-21", 1, "tools");
    file = toggleTeachSkill(file, "2026-09-21", 1, "safety");
    file = toggleTeachSkill(file, "2026-09-21", 1, "draw");
    assert.deepEqual(hourSkillsOf(file, "2026-09-21", 1), ["measure", "tools", "safety"]);
    file = setTeachSkills(file, "2026-09-21", 1, ["tools"]);
    assert.deepEqual(hourSkillsOf(file, "2026-09-21", 1), ["tools"]);
  });

  it("SendHour copies the hour’s skills onto an empty cell", () => {
    let file = setTeachDo(desk(), "2026-09-21", 1, "Cut the blanks");
    file = setTeachSkills(file, "2026-09-21", 1, ["measure", "safety"]);
    file = copyTeachHour(file, "2026-09-21", 1, "2026-09-22", 1);
    assert.deepEqual(hourSkillsOf(file, "2026-09-22", 1), ["measure", "safety"]);
  });
});
