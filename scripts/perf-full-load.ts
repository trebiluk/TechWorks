/**
 * Full-storage load bench. Does not write the live desk.
 * Run: node --experimental-strip-types scripts/perf-full-load.ts
 */
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import type { EconomyFile, RawStudent } from "../src/lib/economy.ts";
import { score } from "../src/lib/economy.ts";
import { cloneFile } from "../src/lib/clone.ts";
import { compactFile } from "../src/lib/compact.ts";
import { packDesk } from "../src/lib/vault.ts";
import { schoolDays } from "../src/lib/calendar.ts";
import { writeTape } from "../src/lib/tape.ts";
import { dueCrews, scoredToday } from "../src/lib/crews.ts";
import { traceToday } from "../src/lib/workflow.ts";
import { setStudentMark } from "../src/lib/store.ts";
import { SKILL_TRACK } from "../src/lib/skills.ts";

function kb(n: number) {
  return `${(n / 1024).toFixed(1)} KB`;
}

function bench(label: string, fn: () => unknown) {
  const t0 = performance.now();
  const out = fn();
  const ms = performance.now() - t0;
  return { label, ms, out };
}

function hash(s: string) {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++) {
    n ^= s.charCodeAt(i);
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}

function fatten(file: EconomyFile, years = 1): EconomyFile {
  const next = cloneFile(file);
  const days = schoolDays().map((d) => d.date);
  const codes = ["3", "3", "3", "2", "2", "1", "A", "E", "P"] as const;
  const skills = SKILL_TRACK.slice(0, 10);
  next.students = next.students.map((s, si) => {
    let tape = s.markTape ?? "";
    const marks: Record<string, string> = { ...(s.marks ?? {}) };
    const notes: Record<string, string> = {};
    const attend: Record<string, string> = {};
    const skillsMap: Record<string, number> = {};
    const purchases: NonNullable<RawStudent["purchases"]> = [];
    const lucky: NonNullable<RawStudent["lucky"]> = [];
    const passes: NonNullable<RawStudent["passes"]> = [];
    const prints: Record<string, number> = {};
    const investDays: Record<string, number> = {};
    for (let y = 0; y < years; y++) {
      days.forEach((d, i) => {
        const code = codes[hash(`${s.id}|${y}|${d}`) % codes.length];
        tape = writeTape(tape, d, code);
        if (i % 7 === 0) notes[d] = "check-in";
        if (hash(`${s.id}|n|${d}`) % 18 === 0) attend[d] = "nurse";
        if (hash(`${s.id}|inv|${d}`) % 22 === 0) investDays[d] = 25;
      });
    }
    for (const sk of skills) skillsMap[sk.id] = 1 + (hash(s.id + sk.id) % 4);
    for (let p = 0; p < 24; p++) {
      purchases.push({
        ts: new Date(2026, 8, 1 + (p % 28)).toISOString(),
        item: `item-${p}`,
        category: p % 3 === 0 ? "LUCKY/ROLL" : "SHOP/SNACKS",
        price: 5 + (p % 4) * 5,
      });
    }
    for (let r = 0; r < 12; r++) {
      lucky.push({ ts: `2026-10-${String(10 + r).padStart(2, "0")}T12:00:00.000Z`, date: days[r] ?? days[0], face: 1 + (r % 6), stake: 5, payout: r % 2 ? 10 : 0 });
    }
    for (let r = 0; r < 8; r++) {
      const d = days[20 + r] ?? days[0];
      passes.push({ date: d, where: "nurse", out: "09:12", in: "09:28", period: s.period });
    }
    prints["dragon-s"] = 1 + (si % 3);
    prints["snake-s"] = si % 2;
    return {
      ...s,
      markTape: tape,
      marks,
      notes,
      attend,
      skills: skillsMap,
      purchases,
      lucky,
      passes,
      prints,
      investDays,
      bonus: 40,
      deduct: 85,
      opening: 50,
      bonusXp: 12,
    };
  });
  const dayLog: NonNullable<EconomyFile["meta"]["dayLog"]> = {};
  for (const d of days) {
    dayLog[d] = {
      periodGoals: { "1": "MODELING", "2": "DESIGN", "3": "FINISHING", "8": "IDEA" },
      crewGoals: { "1|Crew A": "glue up" },
      sub: hash(d) % 40 === 0,
      lunch: "pizza",
      specials: hash(d) % 15 === 0 ? [{ title: "Assembly", who: "Grade 6", place: "Auditorium", start: "08:00", end: "08:40" }] : undefined,
    };
  }
  next.meta.dayLog = dayLog;
  const ledger = [];
  for (let i = 0; i < 400; i++) {
    const s = next.students[i % next.students.length];
    ledger.push({
      ts: new Date().toISOString(),
      id: s.id,
      type: i % 5 === 0 ? "Lucky" : "Store Purchase",
      amount: i % 2 ? -5 : 10,
      date: days[i % days.length],
      note: "perf",
    });
  }
  next.meta.ledger = ledger;
  return next;
}

const raw = JSON.parse(readFileSync(new URL("../src/data/economy.json", import.meta.url), "utf8")) as EconomyFile;
const days = schoolDays();
const empty = JSON.stringify(raw).length;

const tBuild = bench("fatten 1 year", () => fatten(raw, 1));
const fat = tBuild.out as EconomyFile;

function withPhotos(file: EconomyFile, n: number, bytes: number): EconomyFile {
  const next = cloneFile(file);
  const blob = `data:image/jpeg;base64,${"A".repeat(bytes)}`;
  const pieces = Array.from({ length: n }, (_, i) => ({
    id: `photo-${i}`,
    name: `Print ${i}`,
    size: "S" as const,
    rarity: "common" as const,
    price: 5,
    stock: 4,
    photo: blob,
  }));
  next.meta.config = { ...(next.meta.config ?? {}), prints: { pieces, log: [] } };
  return next;
}

score(fat);
dueCrews(fat);
traceToday(fat);

const fatJson = JSON.stringify(fat);
const tCompact = bench("compactFile", () => compactFile(fat));
const compact = tCompact.out as EconomyFile;
const compactJson = JSON.stringify(compact);
const gz = gzipSync(compactJson);
const tParse = bench("JSON.parse compact", () => JSON.parse(compactJson));
const parsed = tParse.out as EconomyFile;
const tScore = bench("score()", () => score(parsed).length);
const tClone = bench("cloneFile", () => cloneFile(parsed));
const tDue = bench("dueCrews", () => dueCrews(parsed).length);
const tTrace = bench("traceToday", () => traceToday(parsed));
const tPack = bench("packDesk", () => packDesk(parsed));
const pack = tPack.out as ReturnType<typeof packDesk>;
const packJson = JSON.stringify(pack);

let tap = parsed;
const tTap = bench("50 mark taps (clone+write)", () => {
  for (let i = 0; i < 50; i++) {
    const s = tap.students[i % tap.students.length];
    tap = setStudentMark(tap, s.id, days[i % days.length]?.date ?? days[0].date, "3");
  }
  return true;
});

const twoYear = bench("fatten 2 years", () => fatten(raw, 2));
const twoJson = JSON.stringify(compactFile(twoYear.out as EconomyFile));
const pictured = withPhotos(fat, 15, 35000);
const picturedJson = JSON.stringify(pictured);
const tPhotoClone = bench("clone with 15 photos", () => cloneFile(pictured));
const tPhotoTap = bench("10 taps with photos", () => {
  let f = pictured;
  for (let i = 0; i < 10; i++) {
    const s = f.students[i % f.students.length];
    f = setStudentMark(f, s.id, days[i].date, "3");
  }
  return true;
});
const tScore2 = bench("score() warmup-2", () => score(parsed).length);
const tTrace2 = bench("traceToday warmup-2", () => traceToday(parsed));

const report = {
  roster: raw.students.length,
  schoolDays: days.length,
  emptyDesk: kb(empty),
  fatYear: kb(fatJson.length),
  compactYear: kb(compactJson.length),
  gzipYear: kb(gz.length),
  packYear: kb(packJson.length),
  compactTwoYear: kb(twoJson.length),
  fifteenPhotos35k: kb(picturedJson.length),
  photosOver5mb: picturedJson.length > 5 * 1024 * 1024,
  localStorageHeadroom5mb: `${((5 * 1024 * 1024 - compactJson.length) / 1024 / 1024).toFixed(2)} MB left`,
  over5mb: compactJson.length > 5 * 1024 * 1024,
  timingsMs: {
    fatten: +tBuild.ms.toFixed(1),
    compact: +tCompact.ms.toFixed(1),
    parse: +tParse.ms.toFixed(1),
    score: +tScore.ms.toFixed(1),
    clone: +tClone.ms.toFixed(1),
    dueCrews: +tDue.ms.toFixed(1),
    traceToday: +tTrace.ms.toFixed(1),
    packDesk: +tPack.ms.toFixed(1),
    fiftyTaps: +tTap.ms.toFixed(1),
    tapEach: +(tTap.ms / 50).toFixed(2),
    fattenTwoYear: +twoYear.ms.toFixed(1),
    scoreWarm: +tScore2.ms.toFixed(1),
    traceWarm: +tTrace2.ms.toFixed(1),
    clonePhotos: +tPhotoClone.ms.toFixed(1),
    tenTapsPhotos: +tPhotoTap.ms.toFixed(1),
    tapEachPhotos: +(tPhotoTap.ms / 10).toFixed(1),
  },
  scoreRows: tScore.out,
  due: tDue.out,
};

console.log(JSON.stringify(report, null, 2));
