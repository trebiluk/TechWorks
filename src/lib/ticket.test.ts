import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { acceptTicket, answerTicket, doorPrompt, readTicket } from "./ticket.ts";

function desk(): EconomyFile {
  return {
    students: [
      { id: "a", first: "River", last: "", period: 1, crewKey: "A", days: ["", "", "", ""], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    ],
    crews: [{ key: "A", name: "Crew A", period: 1 }],
    meta: { quarterName: "Q1", config: {}, dayLog: {} },
  } as EconomyFile;
}

describe("ticket out the door", () => {
  it("a crew answer is not XP until the teacher accepts the right word", () => {
    const date = "2026-09-28";
    const prompt = doorPrompt(date, 1);
    let file = answerTicket(desk(), date, 1, "A", prompt.term);
    assert.equal(readTicket(file, date, 1, "A").pick, prompt.term);
    assert.equal(file.students[0]?.bonusXp ?? 0, 0);
    file = answerTicket(file, date, 1, "A", prompt.choices[0] ?? prompt.term);
    assert.equal(readTicket(file, date, 1, "A").pick, prompt.term);
    file = acceptTicket(file, date, 1, "A");
    assert.equal(file.students[0]?.bonusXp, 1);
    assert.equal(Number(file.students[0]?.bonus || 0), 0);
    const again = acceptTicket(file, date, 1, "A");
    assert.equal(again.students[0]?.bonusXp, 1);
  });

  it("a wrong word cannot be accepted into XP", () => {
    const date = "2026-09-28";
    const prompt = doorPrompt(date, 1);
    const wrong = prompt.choices.find((c) => c !== prompt.term) ?? prompt.term;
    const file = acceptTicket(answerTicket(desk(), date, 1, "A", wrong), date, 1, "A");
    assert.equal(file.students[0]?.bonusXp ?? 0, 0);
    assert.equal(readTicket(file, date, 1, "A").accepted, undefined);
  });
});
