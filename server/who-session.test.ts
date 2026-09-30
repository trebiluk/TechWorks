import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mintSession, readSession, sessionExpiry, WHO_COOKIE } from "./who-session.ts";

describe("who session", () => {
  it("round-trips alias and code and rejects a bad cookie", async () => {
    const now = Date.parse("2026-09-29T15:00:00.000Z");
    const token = await mintSession({ alias: "Pixel", code: "AB23C", picture: "🐾" }, now);
    const row = await readSession(token, now);
    assert.equal(row?.alias, "Pixel");
    assert.equal(row?.code, "AB23C");
    assert.equal(row?.picture, "🐾");
    assert.equal(await readSession(`${token}x`, now), null);
    assert.equal(WHO_COOKIE, "tw_session");
    const end = sessionExpiry(now);
    assert.ok(end > now);
    assert.ok(end <= now + 8 * 60 * 60 * 1000);
  });
});
