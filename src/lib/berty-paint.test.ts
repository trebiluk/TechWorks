import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { countBertyHands, paintBertySvg } from "./berty-paint.ts";
import { bertyBodyHex, DEFAULT_BERTY_LOOK } from "./berty-look.ts";

const DIR = join(process.cwd(), "public/berty/brand");

describe("berty hands and color", () => {
  it("every full-body pose has two hands", () => {
    const files = readdirSync(DIR).filter((f) => f.startsWith("bertybot_") && f.endsWith(".svg") && !f.includes("icon"));
    assert.ok(files.length >= 5);
    for (const f of files) {
      const svg = readFileSync(join(DIR, f), "utf8");
      assert.equal(countBertyHands(svg), 2, `${f} must ship two data-berty-hand groups`);
      assert.match(svg, /overflow="visible"/);
    }
  });

  it("paints the swatch onto the body, not a hue guess", () => {
    const raw = readFileSync(join(DIR, "bertybot_waving.svg"), "utf8");
    const look = { ...DEFAULT_BERTY_LOOK, ink: "cleanup" as const };
    const painted = paintBertySvg(raw, bertyBodyHex(look));
    assert.match(painted, /#f97316/i);
    assert.equal(painted.includes("#2ee6ff"), false);
  });
});
