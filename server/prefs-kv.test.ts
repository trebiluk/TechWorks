import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appSlug, fitPrefs, shopCode } from "./prefs-kv.ts";

describe("prefs", () => {
  it("keeps a small object and refuses anything over 8 KB", () => {
    const ok = fitPrefs({ theme: "night", layout: ["wall", "apps"] });
    assert.equal(ok.ok, true);
    const big = fitPrefs({ note: "x".repeat(9000) });
    assert.equal(big.ok, false);
    if (!big.ok) assert.equal(big.reason, "big");
    assert.equal(fitPrefs(["nope"]).ok, false);
  });

  it("cleans a shop code and an app slug", () => {
    assert.equal(shopCode("pnzm4"), "PNZM4");
    assert.equal(appSlug("Bits"), "bits");
  });
});
