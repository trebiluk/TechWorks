import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import type { EconomyFile } from "./economy.ts";
import { writePlanitHour } from "./planit.ts";
import { hourIsSet, planCell } from "./planbook.ts";
import { teachDay } from "./teach.ts";
import { packDesk, unpackDesk } from "./vault.ts";
import { pickDesk } from "./vault-core.ts";
import {
  hourCount,
  mergeHourMaps,
  readHours,
  recoverHours,
  writeHours,
} from "./hour-persist.ts";
import { hourWallSpine } from "./hour-flow.ts";
import { teachDeckOf } from "./teach-deck.ts";

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
  (globalThis as { window?: unknown }).window = { localStorage: mem() };
});

function desk(): EconomyFile {
  return {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      codes: { "3": 25, "2": 20, "1": 15, A: 0, E: 0, P: -25 },
      bell: [{ period: 1, grade: 6 }],
      config: { currentCycle: 1 },
    },
    crews: [],
    students: [],
  };
}

function monP1(file = desk()) {
  return writePlanitHour(file, "2026-09-21", 1, {
    job: "Safety goggles check",
    ask: "Why PPE first?",
    prove: "Show goggles on",
    beats: {
      now: "Sit with your crew.",
      goal: "Safety goggles check",
      next: "Peer check straps.",
      behave: "Choose → work → focus → cleanup.",
    },
  });
}

describe("PlanIt hour persistence", () => {
  it("Mon P1 Job · Guiding Q · Prove · beats survive pack → unpack (reload)", () => {
    const packed = packDesk(monP1());
    const opened = unpackDesk(JSON.stringify(packed));
    assert.ok(opened);
    assert.equal(hourIsSet(opened, "2026-09-21", 1), true);
    const cell = planCell(opened, "2026-09-21", 1);
    assert.equal(cell.do, "Safety goggles check");
    assert.equal(cell.ask, "Why PPE first?");
    assert.equal(cell.objective, "Show goggles on");
    const day = teachDay(opened, "2026-09-21", 1);
    assert.equal(day.agenda?.now, "Sit with your crew.");
    assert.equal(day.agenda?.goal, "Safety goggles check");
    assert.equal(day.agenda?.next, "Peer check straps.");
    assert.equal(day.agenda?.behave, "Choose → work → focus → cleanup.");
    const spine = hourWallSpine(opened, "2026-09-21", 1);
    assert.equal(spine.job, "Safety goggles check");
    assert.equal(spine.ask, "Why PPE first?");
    assert.equal(spine.prove, "Show goggles on");
    const deck = teachDeckOf(opened, 1, "2026-09-21");
    assert.equal(deck.slides[0]?.title, "Why PPE first?");
  });

  it("hours key restores a wiped empty desk", () => {
    const filled = monP1();
    writeHours(filled.meta.config?.teachDays ?? {}, "2026-09-21T12:00:00.000Z");
    const empty = desk();
    empty.meta.savedAt = "2026-09-21T12:05:00.000Z";
    const recovered = recoverHours(empty, readHours());
    assert.equal(hourCount(recovered), 1);
    assert.equal(planCell(recovered, "2026-09-21", 1).do, "Safety goggles check");
    assert.equal(planCell(recovered, "2026-09-21", 1).ask, "Why PPE first?");
  });

  it("same-stamp empty hours key is a real Clear, not a restore", () => {
    const stamp = "2026-09-21T13:00:00.000Z";
    writeHours({}, stamp);
    const empty = desk();
    empty.meta.savedAt = stamp;
    const recovered = recoverHours(empty, readHours());
    assert.equal(hourCount(recovered), 0);
  });

  it("cloud pull of an empty desk does not drop local hours", () => {
    const local = monP1();
    const cloud = desk();
    cloud.meta.savedAt = "2026-09-21T14:00:00.000Z";
    const merged = recoverHours(cloud, { saved: "2026-09-21T12:00:00.000Z", days: local.meta.config?.teachDays ?? {} });
    assert.equal(hourCount(merged), 1);
    assert.equal(teachDay(merged, "2026-09-21", 1).do, "Safety goggles check");
  });

  it("merge keeps Job from one side and Guiding Q from the other", () => {
    const job = writePlanitHour(desk(), "2026-09-21", 1, { job: "Safety goggles check" });
    const ask = writePlanitHour(desk(), "2026-09-21", 1, { ask: "Why PPE first?" });
    const days = mergeHourMaps(job.meta.config?.teachDays, ask.meta.config?.teachDays);
    assert.equal(days["2026-09-21"]?.["1"]?.do, "Safety goggles check");
    assert.equal(days["2026-09-21"]?.["1"]?.ask, "Why PPE first?");
  });

  it("pickDesk keeps hours when the winner is an empty newer Day 0", () => {
    const filled = monP1();
    filled.meta.savedAt = "2026-09-21T10:00:00.000Z";
    const empty = desk();
    empty.meta.savedAt = "2026-09-21T11:00:00.000Z";
    const picked = pickDesk(empty, filled);
    const recovered = recoverHours(picked, { saved: filled.meta.savedAt ?? "", days: filled.meta.config?.teachDays ?? {} });
    assert.equal(hourCount(recovered), 1);
  });
});
