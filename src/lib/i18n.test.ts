import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { articleCopy, CLASS_LANGS, glossCopy, LANGS, t } from "./i18n.ts";

describe("class languages", () => {
  it("follows the eight Hub languages", () => {
    assert.deepEqual(
      CLASS_LANGS.map((l) => l.id),
      ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"],
    );
  });

  it("turns Arabic and Dari on, and keeps shop words English", () => {
    assert.equal(LANGS.find((l) => l.id === "ar")?.classLang, true);
    assert.equal(LANGS.find((l) => l.id === "fa-AF")?.native, "دری");
    assert.equal(LANGS.find((l) => l.id === "ar")?.dir, "rtl");
    assert.equal(t("XP", "ar"), "XP");
    assert.equal(t("Now", "es"), "Ahora");
    assert.equal(t("Help", "rw"), "Ubufasha");
    assert.notEqual(t("Today", "ti"), "Today");
    assert.equal(t("No such key", "es"), "No such key");
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
    assert.equal(t("More", "uk"), "Ще");
    assert.equal(t("More", "ru"), "Ещё");
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

  it("returns Spanish help and a short simple skills card", () => {
    const es = articleCopy("welcome-what", "What is TechWorks?", "English body", "es");
    assert.match(es.body, /taller/);
    const skills = articleCopy("wall-skills", "Skill levels 1–4", "English", "es");
    assert.match(skills.body, /1️⃣ Beginning/);
    assert.match(skills.body, /4️⃣ Distinguished/);
    const miss = articleCopy("no-such", "Title", "Body", "es");
    assert.equal(miss.body, "Body");
    const simple = articleCopy("wall-skills", "Skill levels 1–4", "English", "simple");
    assert.match(simple.body, /1, 2, 3, or 4/);
    const ar = articleCopy("wall-skills", "Skill levels 1–4", "English", "ar");
    assert.match(ar.body, /Distinguished/);
  });

  it("returns a grade-6 Ukrainian shop definition", () => {
    const copy = glossCopy("ppe", "English def", "English use", "uk");
    assert.match(copy.def, /одягаєш/);
    assert.match(copy.use, /PPE/);
  });
});
