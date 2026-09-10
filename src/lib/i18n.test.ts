import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { articleCopy, CLASS_LANGS, glossCopy, LANGS, t } from "./i18n.ts";

describe("class languages", () => {
  it("this quarter is English, Ukrainian, Russian", () => {
    assert.deepEqual(
      CLASS_LANGS.map((l) => l.id),
      ["en", "uk", "ru"],
    );
  });

  it("keeps Cubano, Arabic, and Farsi as extras", () => {
    assert.deepEqual(
      LANGS.filter((l) => !l.classLang).map((l) => l.id),
      ["es", "ar", "fa"],
    );
  });
});

describe("t grade-6", () => {
  it("leaves English as the shop language", () => {
    assert.equal(t("Now", "en"), "Now");
    assert.equal(t("kerf", "uk"), "kerf");
  });

  it("translates student chrome at grade 6", () => {
    assert.equal(t("Now", "uk"), "Зараз");
    assert.equal(t("Cleanup", "uk"), "Прибрати");
    assert.equal(t("Crew", "uk"), "Команда");
    assert.equal(t("Words", "uk"), "Слова");
    assert.equal(t("Now", "ru"), "Сейчас");
    assert.equal(t("Cleanup", "ru"), "Убрать");
    assert.equal(t("Crew", "ru"), "Команда");
    assert.equal(t("Help", "ru"), "Помощь");
  });

  it("translates the P1 job card at grade 6", () => {
    assert.equal(t("Rules", "uk"), "Правила");
    assert.equal(t("Look-for", "uk"), "Шукай");
    assert.match(t("How can a small force move a bigger load?", "uk"), /сил/);
    assert.equal(t("Goggles on", "ru"), "Очки на глазах");
    assert.equal(t("Goggles first.", "uk"), "Спочатку окуляри.");
    assert.match(t("Build a model that lifts or moves a load.", "ru"), /модел/);
  });
});

describe("help and words packs", () => {
  it("returns Ukrainian help for a wall article", () => {
    const copy = articleCopy("welcome-what", "What is TechWorks?", "English body", "uk");
    assert.match(copy.title, /TechWorks/);
    assert.match(copy.body, /майстерн/i);
  });

  it("keeps English when the article has no pack", () => {
    const copy = articleCopy("no-such", "Title", "Body", "uk");
    assert.equal(copy.title, "Title");
    assert.equal(copy.body, "Body");
  });

  it("returns a grade-6 Ukrainian shop definition", () => {
    const copy = glossCopy("ppe", "English def", "English use", "uk");
    assert.match(copy.def, /одягаєш/);
    assert.match(copy.use, /PPE/);
  });
});
