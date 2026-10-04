import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { mintSession, readSession, sessionExpiry, WHO_COOKIE } from "./who-session.ts";
import { resetKnKeys } from "./kn-keys.ts";

describe("who session", () => {
  beforeEach(() => {
    process.env.KN_AUTH_KEY = Buffer.alloc(32, 7).toString("base64");
    resetKnKeys();
  });
  it("round-trips alias and code and rejects a bad cookie", async () => {
    const now = Date.parse("2026-09-29T15:00:00.000Z");
    const token = await mintSession({}, { alias: "Pixel", code: "AB23C", picture: "🐾" }, now);
    const row = await readSession({}, token, now);
    assert.equal(row?.alias, "Pixel");
    assert.equal(row?.code, "AB23C");
    assert.equal(row?.picture, "🐾");
    assert.equal(await readSession({}, `${token}x`, now), null);
    assert.equal(WHO_COOKIE, "tw_session");
    const end = sessionExpiry(now);
    assert.ok(end > now);
    assert.ok(end <= now + 8 * 60 * 60 * 1000);
  });
});
