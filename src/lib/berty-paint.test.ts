import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { countBertyHands, paintBertySvg, stampSvgIds } from "./berty-paint.ts";
import { bertyBodyHex, DEFAULT_BERTY_LOOK } from "./berty-look.ts";

const DIR = join(process.cwd(), "public/berty/brand");

describe("berty hands and color", () => {
  it("every full-body pose has two hands", () => {
    const files = readdirSync(DIR).filter((f) => f.startsWith("bertybot_") && f.endsWith(".svg") && !f.includes("icon"));
    assert.ok(files.length >= 5);
    for (const f of files) {
      const svg = readFileSync(join(DIR, f), "utf8");
      assert.equal(countBertyHands(svg), 2, `${f} must ship two data-berty-hand groups`);
      assert.match(svg, /overflow="hidden"|overflow="visible"/);
    }
  });

  it("paints the swatch onto the body, not a hue guess", () => {
    const raw = readFileSync(join(DIR, "bertybot_waving.svg"), "utf8");
    const look = { ...DEFAULT_BERTY_LOOK, ink: "cleanup" as const };
    const painted = paintBertySvg(raw, bertyBodyHex(look), "maker");
    assert.match(painted, /#f97316/i);
    assert.equal(painted.includes("#2ee6ff"), false);
  });

  it("stamps gradient ids so two Bertys on one page cannot steal each other's color", () => {
    const raw = readFileSync(join(DIR, "bertybot_waving.svg"), "utf8");
    const a = paintBertySvg(raw, "#f97316", "head");
    const b = paintBertySvg(raw, "#f97316", "maker");
    assert.match(a, /id="twwavingBody-head"/);
    assert.match(b, /url\(#twwavingBody-maker\)/);
    assert.equal(a.includes('id="twwavingBody"'), false);
    assert.equal(b.includes("twwavingBody-head"), false);
  });

  it("keeps the pose viewBox so both mitts stay in frame", () => {
    const raw = readFileSync(join(DIR, "bertybot_waving.svg"), "utf8");
    const painted = paintBertySvg(raw, "#2ee6ff", "wv");
    assert.match(painted, /viewBox="-40 -40 280 340"/);
    assert.match(painted, /overflow="visible"/);
    assert.equal(countBertyHands(painted), 2);
  });

  it("stampSvgIds rewrites url(#) and id=", () => {
    const src = `<svg><defs><linearGradient id="g"><stop stop-color="#2ee6ff"/></linearGradient></defs><rect fill="url(#g)"/></svg>`;
    const out = stampSvgIds(src, "x");
    assert.match(out, /id="g-x"/);
    assert.match(out, /url\(#g-x\)/);
    assert.equal(out.includes('id="g"'), false);
  });
});
