import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { totpAt, totpDecision, throttleHit } from "../../server/kn-totp.ts";
import { hkdfReady, hmacText, resetKnKeys, sessionKey, kidSessionKey } from "../../server/kn-keys.ts";
import { staffExpiry, STAFF_MAX_MS } from "../../server/kn-session.ts";
import { mintSession, readSession } from "../../server/who-session.ts";

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
});
