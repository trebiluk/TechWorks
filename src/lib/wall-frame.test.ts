import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "styles.css"), "utf8");
const dash = readFileSync(join(root, "components/dashboard.tsx"), "utf8");
const frame = readFileSync(join(root, "components/wall-frame.tsx"), "utf8");
const weather = readFileSync(join(root, "lib/weather.ts"), "utf8");
const lunch = readFileSync(join(root, "lib/lunch.ts"), "utf8");

describe("Wall frame sandwich", () => {
  it("locks header ≥48px and ticker footer ≥44px", () => {
    const bar = css.match(/\.tw-wall-frame-bar \{[^}]+\}/);
    assert.ok(bar, "frame bar");
    assert.match(bar[0], /min-height:\s*3rem/);
    const tick = css.match(/\.tw-ticker \{[^}]+\}/);
    assert.ok(tick, "ticker");
    assert.match(tick[0], /min-height:\s*2\.75rem/);
  });

  it("sits on the wall, not a second desk-chrome row", () => {
    assert.match(dash, /<WallFrame/);
    assert.match(frame, /data-wall-frame/);
    assert.doesNotMatch(dash, /header className="desk-chrome[\s\S]*WallFrame/);
    assert.match(css, /\.tw-wall-frame-bar \{[\s\S]*?pointer-events:\s*none/);
  });

  it("reads Open-Meteo then NWS, and Bearcat Bistro then the cycle", () => {
    assert.match(weather, /api\.open-meteo\.com/);
    assert.match(weather, /api\.weather\.gov\/stations\/KSYR/);
    assert.match(lunch, /apps\.kulibert\.net\/bistro-today\.json/);
    assert.match(lunch, /BISTRO_WEEKS/);
    assert.match(lunch, /tw-bistro/);
    assert.match(weather, /tw-sky/);
  });
});
