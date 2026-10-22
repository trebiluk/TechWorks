import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { checkEnrollToken, enrollOpen, markEnrollUsed, safeEqual } from "../../server/kn-enroll-gate.ts";
import { resetKnKeys } from "../../server/kn-keys.ts";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");
const FAKE = "x".repeat(64);
const OTHER = "y".repeat(64);
const TOKEN_NAME = "KN_" + "ENROLL_TOKEN";

function putToken(value?: string) {
  if (value === undefined) delete process.env[TOKEN_NAME];
  else process.env[TOKEN_NAME] = value;
}

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
    putToken();
    process.env.KN_AUTH_KEY = TEST_KEY;
    resetKnKeys();
  });
  afterEach(() => {
    putToken();
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
    putToken("   ");
    assert.equal(enrollOpen({}), false);
    putToken("x".repeat(31));
    assert.equal(enrollOpen({}), false);
    putToken("x".repeat(32));
    assert.equal(enrollOpen({}), true);
  });

  it("slows the 6th try from one address", async () => {
    putToken(FAKE);
    const event = gateEvent(fakeDb());
    for (let i = 1; i <= 5; i++) assert.equal(await checkEnrollToken(event, OTHER), "bad");
    assert.equal(await checkEnrollToken(event, OTHER), "slow");
  });

  it("rejects a token after it is marked used", async () => {
    putToken(FAKE);
    const event = gateEvent(fakeDb(), "198.51.100.11");
    assert.equal(await checkEnrollToken(event, FAKE), "ok");
    await markEnrollUsed(event, FAKE);
    assert.equal(await checkEnrollToken(event, FAKE), "used");
  });

  it("accepts a different token after the secret changes", async () => {
    putToken(FAKE);
    const event = gateEvent(fakeDb(), "198.51.100.12");
    await markEnrollUsed(event, FAKE);
    putToken(OTHER);
    assert.equal(await checkEnrollToken(event, OTHER), "ok");
  });
});
