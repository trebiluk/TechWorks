import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HELP_ARTICLES, HELP_CATEGORIES, helpMarkdown, searchHelp } from "../data/help.ts";

const REQUIRED = [
  "web",
  "theme",
  "store",
  "study hall",
  "club",
  "cleanup",
  "settings",
  "pin",
  "score",
  "jobs",
  "translate",
  "chips",
  "period",
  "teach",
  "deck",
  "wall",
  "family",
];

describe("help coverage", () => {
  it("has at least one article in every category", () => {
    for (const cat of HELP_CATEGORIES) {
      const n = HELP_ARTICLES.filter((a) => a.category === cat).length;
      assert.ok(n > 0, `${cat} is empty`);
    }
  });

  it("documents every major surface", () => {
    const blob = HELP_ARTICLES.map((a) => `${a.id} ${a.title} ${a.body} ${a.tags.join(" ")}`).join("\n").toLowerCase();
    for (const word of REQUIRED) {
      assert.ok(blob.includes(word), `missing ${word}`);
    }
    assert.ok(HELP_ARTICLES.some((a) => a.id === "chrome-hud"));
    assert.ok(HELP_ARTICLES.some((a) => a.id === "themes"));
    assert.ok(HELP_ARTICLES.some((a) => a.id === "portal"));
    assert.ok(searchHelp("web").length > 0);
    assert.ok(searchHelp("theme").length > 0);
  });

  it("help markdown stays in lockstep with articles", () => {
    const md = helpMarkdown();
    assert.match(md, /^# TechWorks Help · v/);
    for (const a of HELP_ARTICLES) {
      assert.ok(md.includes(`### ${a.title}`), a.title);
    }
  });
});
