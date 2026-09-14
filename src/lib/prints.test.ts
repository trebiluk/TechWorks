import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { copyPiece, printsOf, upsertPiece, buyPrint, swapPrints, returnPrint, suggestCopy, ownedQty } from "./prints.ts";

function desk(pieces?: EconomyFile["meta"]["config"]): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      bell: [{ period: 1, grade: 6 }],
      config: pieces,
    },
    crews: [],
    students: [],
  };
}

describe("prints catalog", () => {
  it("starts empty", () => {
    assert.equal(printsOf(desk()).length, 0);
  });

  it("does not re-seed the old dragon set", () => {
    const file = desk({
      prints: {
        pieces: [
          { id: "dragon-s", name: "Small Dragon", size: "S", rarity: "rare", price: 12, stock: 6 },
          { id: "axolotl-s", name: "Small Axolotl", size: "S", rarity: "shiny", price: 8, stock: 8 },
        ],
        log: [],
      },
    });
    assert.equal(printsOf(file).length, 0);
  });

  it("keeps a piece you add and copies the line", () => {
    let file = upsertPiece(desk(), {
      id: "",
      name: "Bench Buddy",
      size: "S",
      rarity: "common",
      price: 5,
      stock: 4,
    });
    assert.equal(printsOf(file).length, 1);
    assert.equal(printsOf(file)[0]?.name, "Bench Buddy");
    file = copyPiece(file, printsOf(file)[0]!.id);
    assert.equal(printsOf(file).length, 2);
    assert.equal(printsOf(file)[1]?.stock, 0);
  });

  it("buy lands on the kid, unofficial swap and return keep counts", () => {
    let file = upsertPiece(desk(), {
      id: "gear-s",
      name: "Gear",
      size: "S",
      rarity: "shiny",
      price: 5,
      stock: 3,
    });
    file.students = [
      { id: "a", first: "Ada", last: "", period: 1, crewKey: "A", days: ["", "", "", ""], bonus: 0, deduct: 0, clutch: 0, opening: 40 },
      { id: "b", first: "Bo", last: "", period: 1, crewKey: "A", days: ["", "", "", ""], bonus: 0, deduct: 0, clutch: 0, opening: 0 },
    ];
    file = buyPrint(file, "a", "gear-s");
    assert.equal(ownedQty(file.students[0], "gear-s"), 1);
    file = swapPrints(file, "a", "b", "gear-s", 1, "Bo held the line");
    assert.equal(ownedQty(file.students[0], "gear-s"), 0);
    assert.equal(ownedQty(file.students[1], "gear-s"), 1);
    file = returnPrint(file, "b", "gear-s", "back in the bin");
    assert.equal(ownedQty(file.students[1], "gear-s"), 0);
    assert.equal(printsOf(file)[0]?.stock, 3);
  });

  it("suggests the next size after you save a small", () => {
    const next = suggestCopy({ id: "x", name: "Gear", size: "S", rarity: "common", price: 5, stock: 2 });
    assert.equal(next.size, "M");
    assert.equal(next.id, "");
    assert.equal(suggestCopy({ ...next, size: "L" }).variant, "new color");
  });
});
