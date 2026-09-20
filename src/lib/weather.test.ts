import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { skyFrom, skyFromWmo } from "./weather.ts";

describe("Solvay sky", () => {
  it("maps Open-Meteo WMO codes to one classroom word", () => {
    assert.equal(skyFromWmo(17, 0, 4).word, "Sunshine");
    assert.equal(skyFromWmo(17, 0, 4).f, 63);
    assert.equal(skyFromWmo(17, 0, 4).icon, "sun");
    assert.equal(skyFromWmo(12, 3, 8).word, "Overcast");
    assert.equal(skyFromWmo(12, 3, 8).icon, "cloud");
    assert.equal(skyFromWmo(4, 71, 10).word, "Flurries");
    assert.equal(skyFromWmo(4, 75, 10).word, "Snow");
    assert.equal(skyFromWmo(18, 95, 6).word, "Storm");
    assert.equal(skyFromWmo(10, 61, 5).word, "Rain");
    assert.equal(skyFromWmo(16, 2, 45).word, "Blustery");
    assert.equal(skyFromWmo(16, 2, 45).icon, "wind");
    assert.equal(skyFromWmo(17, 0, 4).source, "open-meteo");
  });

  it("keeps NWS one-word sky as the fallback map", () => {
    const sky = skyFrom(17.2, "Overcast", 8);
    assert.equal(sky.word, "Overcast");
    assert.equal(sky.f, 63);
    assert.equal(sky.source, "nws");
  });
});
