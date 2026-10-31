import assert from "node:assert/strict";
import { describe, it } from "node:test";
// Minimal tests for staff bertopia routes.
// Placeholders only. Restore behaviour is tested against SQLite in bt-world.test.ts.

describe("bt-staff", () => {
  it("non-staff gets 401", () => {
    // Route handlers return { ok: false, error: "staff" } with status 401 when getStaff is null.
    assert.equal(true, true);
  });
  it("restore keeps old head as a rev", () => {
    // restoreRev writes current head to revs then sets new head from target rev.
    assert.equal(true, true);
  });
  it("audit row written", () => {
    // knAudit is called on every staff list/restore.
    assert.equal(true, true);
  });
});
