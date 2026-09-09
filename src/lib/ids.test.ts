import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aliasAfterId, auditStudentIds, ensureStudentIds, newStudentId } from "./ids.ts";

describe("student ids", () => {
  it("mints unique TW- ids that do not include names", () => {
    const used = new Set<string>();
    const a = newStudentId(used);
    used.add(a);
    const b = newStudentId(used);
    assert.match(a, /^TW-[A-Z2-9]{10}$/);
    assert.match(b, /^TW-[A-Z2-9]{10}$/);
    assert.notEqual(a, b);
    assert.equal(a.includes("Smith"), false);
  });

  it("keeps existing unique ids and fills blanks / dups", () => {
    const rows = ensureStudentIds([
      { id: "TW-P1-S1-01", first: "Wren" },
      { id: "", first: "New" },
      { id: "TW-P1-S1-01", first: "Clone" },
    ]);
    assert.equal(rows[0]!.id, "TW-P1-S1-01");
    assert.match(rows[1]!.id, /^TW-/);
    assert.notEqual(rows[2]!.id, "TW-P1-S1-01");
    assert.equal(auditStudentIds(rows).ok, true);
  });

  it("assigns alias after the id, not from the legal name", () => {
    const idA = "TW-AAAAAAAAAA";
    const idB = "TW-BBBBBBBBBB";
    const aliasA = aliasAfterId(idA, []);
    const aliasB = aliasAfterId(idB, [aliasA]);
    assert.notEqual(aliasA, aliasB);
    assert.equal(aliasA.includes("Smith"), false);
  });
});
