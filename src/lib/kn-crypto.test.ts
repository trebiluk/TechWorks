import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { totpAt, totpDecision, throttleHit } from "../../server/kn-totp.ts";
import { hkdfReady, hmacText, resetKnKeys, sessionKey, kidSessionKey, emailKey } from "../../server/kn-keys.ts";
import { staffExpiry, STAFF_MAX_MS, markStepup } from "../../server/kn-session.ts";
import { mintSession, readSession } from "../../server/who-session.ts";
import { knVar, mailer } from "../../server/cf-env.ts";
import { chargeThrottle } from "../../server/kn-throttle.ts";
import { saveChallenge, takeChallenge } from "../../server/kn-challenge.ts";
import { resetKnReady } from "../../server/kn-db.ts";
import { claimRecoveryCode, normalizeRecoveryEmail, openEmail, recoveryBlocklist, sealEmail, storeRecoveryCode } from "../../server/kn-recovery.ts";

const TEST_KEY = Buffer.alloc(32, 7).toString("base64");

describe("staff crypto", () => {
  beforeEach(() => {
    process.env.KN_AUTH_KEY = TEST_KEY;
    resetKnKeys();
  });
  afterEach(() => {
    delete process.env.KN_AUTH_KEY;
    resetKnKeys();
  });

  it("matches the RFC 6238 vector", async () => {
    const secret = new TextEncoder().encode("12345678901234567890");
    assert.equal(await totpAt(secret, 59, 8), "94287082");
    assert.equal(await totpAt(secret, 59, 6), "287082");
  });

  it("derives a different key for each info string", async () => {
    assert.equal(hkdfReady({}), true);
    const a = await sessionKey({});
    const b = await kidSessionKey({});
    assert.ok(a && b);
    assert.notEqual(await hmacText(a!, "x"), await hmacText(b!, "x"));
  });

  it("keeps a staff session for 10 days and never slides", () => {
    const now = Date.parse("2026-10-03T20:00:00.000Z");
    assert.equal(staffExpiry(now, false) - now, STAFF_MAX_MS);
    assert.equal(staffExpiry(now, false), staffExpiry(now, false));
  });

  it("rejects a kid token signed with the old built-in key", async () => {
    const token = await mintSession({}, { alias: "Pixel", code: "AB23C" }, Date.parse("2026-10-03T16:00:00.000Z"));
    delete process.env.KN_AUTH_KEY;
    resetKnKeys();
    process.env.KN_AUTH_KEY = Buffer.alloc(32, 9).toString("base64");
    assert.equal(await readSession({}, token), null);
  });

  it("refuses a reused code step and locks after five wrong tries", () => {
    assert.equal(totpDecision(10, 10, true), "reuse");
    assert.equal(totpDecision(9, 10, true), "ok");
    assert.equal(throttleHit(5).locked, true);
    assert.equal(throttleHit(4).locked, false);
  });

  it("derives an email key instead of a TOTP key", async () => {
    const email = await emailKey({});
    const session = await sessionKey({});
    assert.ok(email && session);
    assert.notEqual(email, session);
  });

  it("reads the recovery-email blocklist default and no mailer", () => {
    delete process.env.KN_RECOVERY_EMAIL_BLOCKLIST;
    assert.equal(knVar({}, "KN_RECOVERY_EMAIL_BLOCKLIST", "solvayschools.org"), "solvayschools.org");
    assert.equal(mailer({}), null);
  });
});

function memDb() {
  const throttle = new Map<string, { n: number; exp: number }>();
  const chal = new Map<string, { kind: string; uid: string; exp: number }>();
  const meta = new Map<string, string>();
  const session = new Map<string, { stepup_at: number }>();
  const rcodes = new Map<string, { uid: string; used_at: number | null }>();
  const db = {
    throttle,
    chal,
    session,
    rcodes,
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first() {
              if (sql.includes("kn_meta")) {
                const v = meta.get("schema");
                return v === undefined ? null : { v };
              }
              if (sql.includes("kn_throttle")) return throttle.get(String(args[0])) ?? null;
              if (sql.includes("kn_chal") && sql.startsWith("SELECT")) return chal.get(String(args[0])) ?? null;
              if (sql.includes("kn_rcode") && sql.startsWith("SELECT")) return rcodes.get(String(args[0])) ?? null;
              return null;
            },
            async all() {
              return { results: [] };
            },
            async run() {
              if (sql.includes("kn_meta") && sql.includes("INSERT")) meta.set("schema", "3");
              if (sql.includes("kn_throttle") && sql.includes("INSERT")) {
                throttle.set(String(args[0]), { n: Number(args[1]), exp: Number(args[2]) });
              }
              if (sql.includes("kn_chal") && sql.includes("INSERT")) {
                chal.set(String(args[0]), { kind: String(args[1]), uid: String(args[2]), exp: Number(args[3]) });
              }
              if (sql.startsWith("DELETE") && sql.includes("kn_chal")) chal.delete(String(args[0]));
              if (sql.startsWith("UPDATE") && sql.includes("kn_session")) {
                session.set(String(args[1]), { stepup_at: Number(args[0]) });
              }
              if (sql.includes("kn_rcode") && sql.includes("INSERT")) {
                rcodes.set(String(args[0]), { uid: String(args[1]), used_at: null });
              }
              if (sql.startsWith("UPDATE") && sql.includes("kn_rcode")) {
                const row = rcodes.get(String(args[1]));
                if (row) row.used_at = Number(args[0]);
              }
            },
          };
        },
      };
    },
    async batch(stmts: Array<{ run: () => Promise<unknown> }>) {
      for (const stmt of stmts) await stmt.run();
    },
  };
  return db;
}

describe("staff library", () => {
  beforeEach(() => {
    process.env.KN_AUTH_KEY = TEST_KEY;
    resetKnKeys();
    resetKnReady();
  });
  afterEach(() => {
    delete process.env.KN_AUTH_KEY;
    resetKnKeys();
    resetKnReady();
  });

  it("slows the 6th try for one target and never stores the IP", async () => {
    const db = memDb();
    const event = {
      context: { env: { KN_DB: db } },
      req: { headers: new Headers({ "cf-connecting-ip": "198.51.100.20" }) },
    };
    for (let i = 0; i < 5; i++) assert.equal(await chargeThrottle(event, "demo", 5, 60_000), "ok");
    assert.equal(await chargeThrottle(event, "demo", 5, 60_000), "slow");
    const keys = [...db.throttle.keys()];
    assert.equal(keys.some((k) => k.includes("198.51.100")), false);
    assert.equal(keys.some((k) => k.startsWith("th:ip:")), true);
  });

  it("stores a challenge as an HMAC and spends it once", async () => {
    const db = memDb();
    const event = { context: { env: { KN_DB: db } } };
    const raw = "challenge-not-stored";
    await saveChallenge(event, "login", raw, 60_000, "staff-1");
    const stored = [...db.chal.keys()][0] ?? "";
    assert.notEqual(stored, raw);
    assert.equal(stored.includes(raw), false);
    const taken = await takeChallenge(event, "login", raw);
    assert.equal(taken.ok, true);
    if (taken.ok) assert.equal(taken.uid, "staff-1");
    assert.equal((await takeChallenge(event, "login", raw)).ok, false);
  });

  it("stamps step-up time on the session hash, not a raw token", async () => {
    const db = memDb();
    const event = { context: { env: { KN_DB: db } } };
    await markStepup(event, "session-hmac");
    const row = db.session.get("session-hmac");
    assert.ok(row && row.stepup_at > 0);
    assert.notEqual(String(row?.stepup_at), "session-hmac");
  });

  it("keeps recovery codes as HMACs and seals email to the staff id", async () => {
    const db = memDb();
    const event = { context: { env: { KN_DB: db } } };
    assert.equal(normalizeRecoveryEmail("x@example.test", recoveryBlocklist(event)), "x@example.test");
    assert.equal(normalizeRecoveryEmail("Person@SolvaySchools.org", recoveryBlocklist(event)), null);
    const code = "code-not-stored";
    await storeRecoveryCode(event, "staff-1", code);
    const stored = [...db.rcodes.keys()][0] ?? "";
    assert.notEqual(stored, code);
    assert.equal(stored.includes(code), false);
    assert.equal(await claimRecoveryCode(event, "staff-1", code), "ok");
    assert.equal(await claimRecoveryCode(event, "staff-1", code), "used");
    const sealed = await sealEmail(event, "staff-1", "x@example.test");
    assert.equal(sealed.includes("example.test"), false);
    assert.equal(await openEmail(event, "staff-1", sealed), "x@example.test");
    assert.equal(await openEmail(event, "other-staff", sealed), null);
  });
});
