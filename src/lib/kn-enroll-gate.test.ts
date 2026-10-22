import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { checkEnrollToken, enrollOpen, markEnrollUsed, safeEqual } from "../../server/kn-enroll-gate.ts";
import { resetKnKeys } from "../../server/kn-keys.ts";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");
const FAKE = "x".repeat(64);
const OTHER = "y".repeat(64);

type Row = { n: number; exp: number };

function fakeDb() {
  const throttle = new Map<string, Row>();
  const meta = new Map<string, string>();
  return {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>() {
              if (sql.includes("kn_throttle") && sql.startsWith("SELECT")) {
                return (throttle.get(String(args[0])) ?? null) as T | null;
              }
              if (sql.includes("kn_meta") && sql.startsWith("SELECT")) {
                const v = meta.get("enroll_used");
                return (v === undefined ? null : { v }) as T | null;
              }
              return null;
            },
            async run() {
              if (sql.startsWith("CREATE")) return;
              if (sql.includes("kn_throttle")) {
                throttle.set(String(args[0]), { n: Number(args[1]), exp: Number(args[2]) });
                return;
              }
              if (sql.includes("kn_meta")) meta.set("enroll_used", String(args[0]));
            },
          };
        },
      };
    },
  };
}

function gateEvent(db: ReturnType<typeof fakeDb>, ip = "198.51.100.10") {
  return {
    context: { env: { KN_DB: db } },
    req: { headers: new Headers({ "cf-connecting-ip": ip }) },
  };
}

describe("enroll gate", () => {
  beforeEach(() => {
    delete process.env.KN_ENROLL_TOKEN;
    process.env.KN_AUTH_KEY = TEST_KEY;
    resetKnKeys();
  });
  afterEach(() => {
    delete process.env.KN_ENROLL_TOKEN;
    delete process.env.KN_AUTH_KEY;
    resetKnKeys();
  });

  it("compares equal strings and rejects a different length", () => {
    assert.equal(safeEqual("same-text", "same-text"), true);
    assert.equal(safeEqual("same-text", "same-texT"), false);
    assert.equal(safeEqual("short", "longer"), false);
  });

  it("stays shut when the token is unset, blank, or 31 characters", () => {
    assert.equal(enrollOpen({}), false);
    process.env.KN_ENROLL_TOKEN = "   ";
    assert.equal(enrollOpen({}), false);
    process.env.KN_ENROLL_TOKEN = "x".repeat(31);
    assert.equal(enrollOpen({}), false);
    process.env.KN_ENROLL_TOKEN = "x".repeat(32);
    assert.equal(enrollOpen({}), true);
  });

  it("slows the 6th try from one address", async () => {
    process.env.KN_ENROLL_TOKEN = FAKE;
    const event = gateEvent(fakeDb());
    for (let i = 1; i <= 5; i++) assert.equal(await checkEnrollToken(event, OTHER), "bad");
    assert.equal(await checkEnrollToken(event, OTHER), "slow");
  });

  it("rejects a token after it is marked used", async () => {
    process.env.KN_ENROLL_TOKEN = FAKE;
    const event = gateEvent(fakeDb(), "198.51.100.11");
    assert.equal(await checkEnrollToken(event, FAKE), "ok");
    await markEnrollUsed(event, FAKE);
    assert.equal(await checkEnrollToken(event, FAKE), "used");
  });

  it("accepts a different token after the secret changes", async () => {
    process.env.KN_ENROLL_TOKEN = FAKE;
    const event = gateEvent(fakeDb(), "198.51.100.12");
    await markEnrollUsed(event, FAKE);
    process.env.KN_ENROLL_TOKEN = OTHER;
    assert.equal(await checkEnrollToken(event, OTHER), "ok");
  });
});
