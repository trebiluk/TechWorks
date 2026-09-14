import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { compactFile, compactStudent } from "./compact.ts";
import { cloudPackOpen, deskStorageKeys, keepUnknown, openSchema, withUnknown } from "./compat.ts";
import { migrateDesk, packDesk, unpackDesk } from "./vault.ts";

function kid(extra: Record<string, unknown> = {}): RawStudent {
  return {
    id: "TW-P1-S1-01",
    first: "Forge",
    last: "",
    period: 1,
    crewKey: "Crew A",
    days: ["", "", "", ""],
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    ...extra,
  };
}

function desk(students: RawStudent[]): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      config: { authoredPlans: true, futureKit: true } as EconomyFile["meta"]["config"],
    },
    crews: [],
    students,
  };
}

describe("forward compat", () => {
  it("keeps unknown keys beside a known slim object", () => {
    const slim = { id: "a", first: "Forge" };
    const kept = withUnknown(slim, { id: "a", first: "Forge", futureBadge: "gold" }, ["id", "first"]);
    assert.equal((kept as { futureBadge?: string }).futureBadge, "gold");
    assert.deepEqual(keepUnknown({ id: "a", futureBadge: "gold" }, ["id"]), { futureBadge: "gold" });
  });

  it("compact does not drop a future student field", () => {
    const out = compactStudent(kid({ futureBadge: "gold", licenses: ["band-saw"] }));
    assert.equal((out as { futureBadge?: string }).futureBadge, "gold");
    assert.deepEqual((out as { licenses?: string[] }).licenses, ["band-saw"]);
  });

  it("migrate + pack + unpack keep a future field and do not downgrade schema", () => {
    const file = desk([kid({ futureBadge: "gold" })]);
    file.meta.schema = 99;
    const migrated = migrateDesk(file);
    assert.equal(migrated.meta.schema, 99);
    assert.equal((migrated.students[0] as { futureBadge?: string }).futureBadge, "gold");
    const packed = packDesk(migrated);
    assert.equal(packed.schema, 99);
    const opened = unpackDesk(JSON.stringify(packed));
    assert.ok(opened);
    assert.equal(opened.meta.schema, 99);
    assert.equal((opened.students[0] as { futureBadge?: string }).futureBadge, "gold");
    const slim = compactFile(opened);
    assert.equal((slim.students[0] as { futureBadge?: string }).futureBadge, "gold");
    assert.equal((slim.meta.config as { futureKit?: boolean } | undefined)?.futureKit, true);
  });

  it("opens a newer cloud pack if the vault is still there", () => {
    assert.equal(cloudPackOpen({ kind: "techworks-cloud", v: 2, vault: { kind: "techworks-vault" } }), true);
    assert.equal(cloudPackOpen({ kind: "techworks-cloud", v: 0, vault: {} }), false);
    assert.equal(cloudPackOpen({ kind: "nope", vault: {} }), false);
  });

  it("still reads older localStorage keys", () => {
    assert.deepEqual(deskStorageKeys(12).slice(0, 2), ["techworks-desk-v12", "techworks-desk-v11"]);
    assert.equal(openSchema(13, 12), 13);
    assert.equal(openSchema("nope", 12), 12);
  });
});
