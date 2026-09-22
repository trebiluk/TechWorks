import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { teachDay } from "./teach.ts";
import {
  FACTORY_CRIB,
  adjustQty,
  aliasWho,
  checkIn,
  checkInItem,
  checkOut,
  cribOf,
  dropItem,
  isLow,
  liveAliases,
  lowItems,
  needThisHour,
  onHand,
  seedCrib,
  setBroken,
  takeStock,
  upsertItem,
} from "./inventory.ts";

function desk(config?: EconomyFile["meta"]["config"]): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25 },
      bell: [{ period: 1, grade: 6 }],
      config,
    },
    crews: [],
    students: [],
  };
}

describe("shop crib", () => {
  it("factory kit ids are unique and cover every kind", () => {
    const ids = FACTORY_CRIB.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length);
    const kinds = new Set(FACTORY_CRIB.map((x) => x.kind));
    for (const k of ["ppe", "tool", "machine", "consumable", "material", "kit"] as const) {
      assert.ok(kinds.has(k), k);
    }
  });

  it("missing crib shows the shop kit; a saved empty crib stays empty", () => {
    assert.equal(cribOf(desk()).items.length, FACTORY_CRIB.length);
    assert.equal(desk().meta.config?.crib, undefined);
    const empty = desk({ crib: { items: [], holds: [], log: [] } });
    assert.equal(cribOf(empty).items.length, 0);
    const seeded = seedCrib(empty);
    assert.equal(cribOf(seeded).items.length, FACTORY_CRIB.length);
    assert.equal(seedCrib(seeded), seeded);
  });

  it("checkout drops on-hand, return puts it back, overdraw is refused", () => {
    const file = desk();
    const glasses = cribOf(file).items.find((x) => x.id === "safety-glasses")!;
    const start = onHand(glasses, []);
    const refused = checkOut(file, "safety-glasses", 99, { label: "Spark", kind: "alias" });
    assert.equal(refused, file);
    assert.equal(refused.meta.config?.crib, undefined);

    let next = checkOut(file, "safety-glasses", 4, { label: "Spark", kind: "alias", period: 1 });
    const crib = cribOf(next);
    assert.equal(crib.holds.length, 1);
    assert.equal(crib.holds[0]?.who, "Spark");
    assert.equal(onHand(crib.items.find((x) => x.id === "safety-glasses")!, crib.holds), start - 4);

    const blank = checkOut(next, "safety-glasses", 1, { label: "  ", kind: "alias" });
    assert.equal(blank, next);

    next = checkIn(next, crib.holds[0]!.id);
    assert.equal(cribOf(next).holds.length, 0);
    assert.equal(onHand(cribOf(next).items.find((x) => x.id === "safety-glasses")!, cribOf(next).holds), start);
  });

  it("consumables take stock, tools do not, low follows par and broken", () => {
    let file = takeStock(desk(), "wood-glue", 5);
    const glue = cribOf(file).items.find((x) => x.id === "wood-glue")!;
    assert.equal(glue.qty, 1);
    assert.equal(cribOf(file).holds.length, 0);
    assert.equal(takeStock(file, "wood-glue", 5), file);
    assert.equal(takeStock(file, "try-square", 1), file);

    file = takeStock(desk(), "grit-80", 13);
    assert.ok(isLow(cribOf(file).items.find((x) => x.id === "grit-80")!, []));
    assert.ok(lowItems(file).some((x) => x.id === "grit-80"));

    file = setBroken(desk(), "band-saw", true);
    assert.ok(isLow(cribOf(file).items.find((x) => x.id === "band-saw")!, []));
    assert.equal(checkOut(file, "band-saw", 1, { label: "Saw", kind: "station" }), file);

    file = checkOut(desk(), "try-square", 2, { label: "Crew A", kind: "crew", crewKey: "A" });
    file = checkInItem(file, "try-square");
    assert.equal(cribOf(file).holds.length, 0);
  });

  it("alias who is the shop name, never legalFirst", () => {
    const who = aliasWho({ id: "s1", first: "Spark", legalFirst: "Richard" });
    assert.equal(who, "Spark");
    assert.doesNotMatch(who, /Richard/i);

    const file = desk();
    file.students = [
      {
        id: "s1",
        first: "Spark",
        legalFirst: "Richard",
        last: "",
        legalLast: "Kulibert",
        period: 1,
        crewKey: "A",
        days: ["", "", "", ""],
        bonus: 0,
        deduct: 0,
        clutch: 0,
        opening: 0,
      },
    ];
    const aliases = liveAliases(file, 1);
    assert.deepEqual(aliases.map((a) => a.alias), ["Spark"]);
    assert.ok(!JSON.stringify(aliases).includes("Richard"));
  });

  it("Need this hour appends PlanIt materials once", () => {
    let file = needThisHour(desk(), "2026-09-21", 1, "Safety glasses");
    assert.equal(teachDay(file, "2026-09-21", 1).materials, "Safety glasses");
    file = needThisHour(file, "2026-09-21", 1, "Safety glasses");
    assert.equal(teachDay(file, "2026-09-21", 1).materials, "Safety glasses");
    file = needThisHour(file, "2026-09-21", 1, "Push stick");
    assert.equal(teachDay(file, "2026-09-21", 1).materials, "Safety glasses · Push stick");
  });

  it("add, adjust, drop stay on the crib you saved", () => {
    let file = upsertItem(desk({ crib: { items: [], holds: [], log: [] } }), {
      id: "",
      name: "Bench hook",
      kind: "tool",
      qty: 4,
      par: 2,
      bin: "Bench",
    });
    assert.equal(cribOf(file).items.length, 1);
    assert.equal(cribOf(file).items[0]?.id, "bench-hook");
    file = adjustQty(file, "bench-hook", 2);
    assert.equal(cribOf(file).items[0]?.qty, 6);
    file = dropItem(file, "bench-hook");
    assert.equal(cribOf(file).items.length, 0);
  });
});
