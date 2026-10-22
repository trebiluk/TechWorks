import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookKey, classIdOf, classSummary, csvOf, emptyBook, loadBook, markOf, parseBook, saveBook, setLevel, TRACK_SKILLS } from "./skill-track.ts";

describe("skill track", () => {
  const book = emptyBook("TechWorks TEST|Q1");

  it("lists the eight shop skills", () => {
    assert.deepEqual(TRACK_SKILLS, ["measure", "plan", "build", "test", "fix", "safety", "team", "explain"]);
  });

  it("sets a level and a proof, and replaces the same skill", () => {
    const before = structuredClone(book);
    const once = setLevel(book, "Altair", "measure", 3, "build");
    const twice = setLevel(once, "Altair", "measure", 4, "photo");
    assert.deepEqual(book, before);
    assert.equal(markOf(twice, "Altair", "measure")?.level, 4);
    assert.equal(markOf(twice, "Altair", "measure")?.proof, "photo");
    assert.equal(twice.marks.length, 1);
  });

  it("keeps two levels and writes a three-line CSV of aliases only", () => {
    let next = setLevel(book, "Altair", "safety", 2, "demo");
    next = setLevel(next, "Altair", "measure", 3, "build");
    const lines = csvOf(next).split("\n");
    assert.equal(lines.length, 3);
    assert.equal(lines[0], "alias,skill,level,proof");
    assert.equal(lines[1], "Altair,measure,3,build");
    assert.equal(lines[2], "Altair,safety,2,demo");
    assert.equal(csvOf(next).includes("legal"), false);
  });

  it("refuses a bad level, skill, proof, or blank alias", () => {
    assert.equal(setLevel(book, "Altair", "measure", 5, "build"), book);
    assert.equal(setLevel(book, "Altair", "draw", 2, "build"), book);
    assert.equal(setLevel(book, "Altair", "measure", 2, "video"), book);
    assert.equal(setLevel(book, "  ", "measure", 2, "oral"), book);
  });

  it("stores each class apart and reloads the same marks", () => {
    const mem = new Map<string, string>();
    const read = (key: string) => mem.get(key) ?? null;
    const write = (key: string, value: string) => {
      mem.set(key, value);
    };
    const id = classIdOf("TechWorks TEST", "Q1");
    const other = classIdOf("Other", "Q2");
    let next = setLevel(emptyBook(id), "Vega", "explain", 1, "oral");
    next = setLevel(next, "Vega", "team", 4, "photo");
    saveBook(next, write);
    saveBook(setLevel(emptyBook(other), "Vega", "team", 2, "build"), write);
    const loaded = loadBook(id, read);
    assert.equal(bookKey(id) === bookKey(other), false);
    assert.equal(markOf(loaded, "Vega", "explain")?.level, 1);
    assert.equal(markOf(loaded, "Vega", "team")?.proof, "photo");
    assert.equal(markOf(loadBook(other, read), "Vega", "team")?.level, 2);
    assert.equal(parseBook("{", id).marks.length, 0);
  });

  it("counts a skill across the class and skips names not on the list", () => {
    let next = emptyBook("TechWorks TEST|Q1");
    next = setLevel(next, "Altair", "measure", 4, "build");
    next = setLevel(next, "Nova", "measure", 3, "demo");
    next = setLevel(next, "Volt", "measure", 1, "oral");
    next = setLevel(next, "Stranger", "measure", 4, "photo");
    const before = structuredClone(next);
    const row = classSummary(next, ["Altair", "Nova", "Volt", "Grid"]).find((r) => r.skill === "measure");
    assert.deepEqual(next, before);
    assert.equal(row?.n4, 1);
    assert.equal(row?.n3, 1);
    assert.equal(row?.n2, 0);
    assert.equal(row?.n1, 1);
    assert.equal(row?.unset, 1);
    assert.equal(row?.atLeast3, 2);
    assert.equal(row?.total, 4);
    assert.equal(classSummary(next, ["Altair", "Nova", "Volt", "Grid"]).length, 8);
    assert.equal(JSON.stringify(row).includes("Stranger"), false);
  });
});
