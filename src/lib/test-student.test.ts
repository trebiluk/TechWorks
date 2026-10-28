import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import type { EconomyFile, RawStudent } from "./economy.ts";
import { score } from "./economy.ts";
import { liveBoardRanks } from "./live-board.ts";
import { dropTestStudents, setStudentTest } from "./store.ts";
import { compactStudent } from "./compact.ts";
import { DESK_SCHEMA } from "./vault.ts";
import { hashStudentPin } from "../../server/pin-hash.ts";
import { enterWho } from "../../server/who-kv.ts";
import { aliasRefOf } from "../../server/bt-world.ts";
import { wipeTestStudents } from "../../server/bt-staff.ts";

function kid(partial: Partial<RawStudent> & Pick<RawStudent, "id" | "first" | "period">): RawStudent {
  return { last: "", days: ["", "", "", ""], bonus: 0, deduct: 0, clutch: 0, opening: 0, crewKey: "A", ...partial };
}

function desk(students: RawStudent[]): EconomyFile {
  return {
    meta: { title: "TechWorks", quarterName: "Q1", currentWeek: 1, codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 }, bell: [{ period: 1, grade: 6 }] },
    crews: [],
    students,
  };
}

describe("test students stay off the public board", () => {
  it("keeps two test aliases out of ranks and the class count", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Rivet", period: 1, opening: 40 }),
      kid({ id: "TW-BBBBBBBBBB", first: "Pixel", period: 1, opening: 90, test: true }),
      kid({ id: "TW-CCCCCCCCCC", first: "Nova", period: 1, opening: 80, test: true }),
    ]);
    const marked = setStudentTest(file, "TW-BBBBBBBBBB", true);
    assert.equal(marked.students.find((s) => s.first === "Pixel")?.test, true);
    const ranks = liveBoardRanks(marked);
    assert.equal(ranks.list.some((row) => row.alias === "Pixel" || row.alias === "Nova"), false);
    assert.equal(ranks.topXp?.alias, "Rivet");
    const counted = score(marked).filter((s) => s.period !== 6 && s.test !== true);
    const staff = score(marked).filter((s) => s.period !== 6);
    assert.equal(counted.length, 1);
    assert.equal(staff.length, 3);
    assert.equal(DESK_SCHEMA, 12);
    const slim = compactStudent(marked.students[1]!);
    assert.equal(slim.test, true);
  });

  it("wipes exactly the test rows", () => {
    const file = desk([
      kid({ id: "TW-AAAAAAAAAA", first: "Rivet", period: 1 }),
      kid({ id: "TW-BBBBBBBBBB", first: "Pixel", period: 1, test: true }),
      kid({ id: "TW-CCCCCCCCCC", first: "Nova", period: 1, test: true }),
    ]);
    const dropped = dropTestStudents(file);
    assert.deepEqual(dropped.aliases, ["Pixel", "Nova"]);
    assert.deepEqual(dropped.file.students.map((s) => s.first), ["Rivet"]);
  });
});

describe("who sign-in and wipe", () => {
  const KEY = Buffer.alloc(32, 7).toString("base64");
  afterEach(() => {
    delete process.env.KN_AUTH_KEY;
  });

  function book() {
    const store = new Map<string, string>();
    const worlds = new Map<string, { world: string }[]>();
    const kv = {
      async get(k: string) {
        return store.has(k) ? (store.get(k) ?? null) : null;
      },
      async put(k: string, v: string) {
        store.set(k, v);
      },
    };
    const db = {
      prepare(sql: string) {
        return {
          bind(...args: unknown[]) {
            return {
              async all() {
                if (sql.startsWith("SELECT") && sql.includes("bt_worlds")) return { results: worlds.get(String(args[0])) ?? [] };
                return { results: [] };
              },
              async first() {
                return null;
              },
              async run() {
                if (sql.startsWith("DELETE FROM bt_worlds")) worlds.delete(String(args[0]));
              },
            };
          },
        };
      },
    };
    const event = { context: { env: { TW_DESK: kv, KN_DB: db } } };
    return { store, worlds, event };
  }

  it("signs in test and real aliases, and refuses a code with no pin", async () => {
    process.env.KN_AUTH_KEY = KEY;
    const { store, event } = book();
    const people = [
      { id: "real-1", alias: "Rivet", avatar: "🐾", code: "AAAAA", pinHash: hashStudentPin("real-1", "1357") },
      { id: "test-1", alias: "Pixel", avatar: "🐾", code: "BBBBB", pinHash: hashStudentPin("test-1", "2468"), test: true },
      { id: "bare-1", alias: "Ghost", avatar: "🐾", code: "CCCCC", pinHash: "" },
    ];
    store.set("tw-who-v1", JSON.stringify({ v: 1, people }));
    const real = await enterWho(event, "Rivet", "AAAAA", "1357");
    const test = await enterWho(event, "Pixel", "BBBBB", "2468");
    const bare = await enterWho(event, "Ghost", "CCCCC", "0000");
    assert.equal(real.ok, true);
    if (real.ok) {
      assert.equal(real.verified, true);
      assert.equal("test" in real, false);
    }
    assert.equal(test.ok, true);
    if (test.ok) {
      assert.equal(test.verified, true);
      assert.equal(test.test, true);
    }
    assert.equal(bare.ok, false);
    assert.equal("verified" in bare && bare.verified === true, false);
  });

  it("wipes two test aliases and their saves only", async () => {
    process.env.KN_AUTH_KEY = KEY;
    const { store, worlds, event } = book();
    const token = "desk-token-test-value1";
    store.set("desk", JSON.stringify({ keyHash: token, saved: "", app: "", n: 3, salt: "", iv: "", data: "" }));
    store.set(
      "tw-who-v1",
      JSON.stringify({
        v: 1,
        people: [
          { id: "real-1", alias: "Rivet", avatar: "🐾", code: "AAAAA", pinHash: hashStudentPin("real-1", "1357") },
          { id: "test-1", alias: "Pixel", avatar: "🐾", code: "BBBBB", pinHash: hashStudentPin("test-1", "2468"), test: true },
          { id: "test-2", alias: "Nova", avatar: "🐾", code: "CCCCC", pinHash: hashStudentPin("test-2", "3690"), test: true },
        ],
      }),
    );
    const realRef = await aliasRefOf(event, "AAAAA");
    const pixelRef = await aliasRefOf(event, "BBBBB");
    const novaRef = await aliasRefOf(event, "CCCCC");
    assert.ok(realRef && pixelRef && novaRef);
    worlds.set(realRef!, [{ world: "shop" }]);
    worlds.set(pixelRef!, [{ world: "shop" }]);
    worlds.set(novaRef!, [{ world: "lab" }]);
    const wiped = await wipeTestStudents(event, token);
    assert.equal(wiped.ok, true);
    if (wiped.ok) {
      assert.equal(wiped.n, 2);
      assert.deepEqual(wiped.aliases.sort(), ["Nova", "Pixel"]);
      assert.equal(wiped.saves, 2);
    }
    assert.equal(worlds.has(realRef!), true);
    assert.equal(worlds.has(pixelRef!), false);
    assert.equal(worlds.has(novaRef!), false);
    const left = JSON.parse(store.get("tw-who-v1") ?? "{}") as { people: { alias: string; test?: boolean }[] };
    const names = left.people.map((row) => row.alias).sort();
    assert.equal(names.includes("Pixel"), false);
    assert.equal(names.includes("Nova"), false);
    assert.equal(names.includes("Rivet"), true);
    assert.equal(left.people.some((row) => row.test === true), false);
  });
});
