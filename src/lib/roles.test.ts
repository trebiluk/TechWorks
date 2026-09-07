import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import {
  afterAffectMaybeConfirm,
  afterCrewLeaderChange,
  confirmCrewLead,
  DEFAULT_LEAD_XP,
  leadSkillsXp,
  leadXpBonusOf,
  recordLineLeaderDay,
  roleHistoryOf,
  setLeadXpBonus,
} from "./roles.ts";
import { achievementsFor } from "./achievements.ts";

function blank(): EconomyFile {
  return {
    meta: {
      title: "Test",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25, Assist: 10 },
      config: { currentCycle: 2, crewRoles: {}, roleHistory: [] },
    },
    crews: [{ period: 1, key: "Crew A", name: "Crew A" }],
    students: [
      {
        id: "s1",
        first: "Ace",
        last: "Hidden",
        period: 1,
        crewKey: "Crew A",
        days: ["", "", "", ""],
        bonus: 0,
        deduct: 0,
        clutch: 0,
        opening: 0,
        skills: { team: 1 },
        affect: {},
      },
    ],
  };
}

describe("Diego roles + lead XP", () => {
  it("defaults lead XP to +2 and never touches wallet fields", () => {
    const f = blank();
    assert.equal(leadXpBonusOf(f), DEFAULT_LEAD_XP);
    assert.equal(DEFAULT_LEAD_XP, 2);
    const next = setLeadXpBonus(f, 5);
    assert.equal(next.meta.config?.leadXpBonus, 5);
    assert.equal(next.students[0].bonus, 0);
    assert.equal(next.students[0].opening, 0);
  });

  it("awards Skills XP once per confirmed lead — not on crown toggle alone", () => {
    let f = blank();
    f.meta.config!.crewRoles = { "2|1|Crew A": "s1" };
    f = afterCrewLeaderChange(f, 1, "Crew A", "s1", "2026-09-04");
    assert.equal(leadSkillsXp(f, "s1"), 0, "no XP until feedback");
    assert.equal(roleHistoryOf(f).length, 1);
    assert.equal(roleHistoryOf(f)[0].confirmed, false);

    f.students[0].affect = { "2026-09-04": "🙂" };
    f = confirmCrewLead(f, 1, "Crew A", "2026-09-04");
    assert.equal(leadSkillsXp(f, "s1"), 2);

    const again = confirmCrewLead(f, 1, "Crew A", "2026-09-04");
    assert.equal(leadSkillsXp(again, "s1"), 2, "idempotent");

    const spam = afterAffectMaybeConfirm(again, "s1", "2026-09-04");
    assert.equal(leadSkillsXp(spam, "s1"), 2);
    assert.equal(spam.students[0].bonus, 0);
    assert.equal(spam.students[0].opening, 0);
  });

  it("records line leader days and surfaces achievements", () => {
    let f = blank();
    f = recordLineLeaderDay(f, "2026-09-04", "s1");
    f = recordLineLeaderDay(f, "2026-09-04", "s1");
    f = recordLineLeaderDay(f, "2026-09-05", "s1");
    const a = achievementsFor(f, "s1");
    assert.equal(a.lineLeaderDays, 2);
    assert.equal(a.timesLedCrew, 0);
  });
});
