import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { CREW_PIN, DEFAULT_PIN, ensureDefaultPin, lock, pinReady, savePin, storedPin, unlockKind } from "./pin.ts";

function mem() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => {
      m.set(k, String(v));
    },
    removeItem: (k: string) => {
      m.delete(k);
    },
  };
}

beforeEach(() => {
  const local = mem();
  const session = mem();
  (globalThis as { window?: unknown }).window = { localStorage: local, sessionStorage: session };
});

describe("desk PIN", () => {
  it("seeds factory 7879 and unlocks", () => {
    ensureDefaultPin();
    assert.equal(storedPin(), DEFAULT_PIN);
    assert.equal(pinReady(), true);
    assert.equal(unlockKind("7879"), "teacher");
  });

  it("factory PIN recovers a forgotten custom PIN", () => {
    savePin("4567");
    assert.equal(storedPin(), "4567");
    assert.equal(unlockKind("7879"), "teacher");
    assert.equal(storedPin(), DEFAULT_PIN);
  });

  it("rejects 1111 and 2222 as teacher PIN", () => {
    savePin("1111");
    assert.equal(storedPin(), "");
    assert.equal(unlockKind("2222"), "crew");
    assert.equal(unlockKind("1111"), null);
  });

  it("custom PIN still unlocks until factory reset", () => {
    savePin("4567");
    assert.equal(unlockKind("4567"), "teacher");
    lock();
    assert.equal(unlockKind("0000"), null);
  });

  it("crew PIN stays 2222", () => {
    assert.equal(CREW_PIN, "2222");
    assert.equal(unlockKind("2222"), "crew");
  });
});
