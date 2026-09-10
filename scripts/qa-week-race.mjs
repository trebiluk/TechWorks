import { chromium } from "playwright";

const URL = "http://127.0.0.1:8080/";
const Y = "2026-09-08";

function kid(id, first, period, crewKey, code) {
  return {
    id,
    first,
    last: "",
    period,
    crewKey,
    days: [code, "", "", ""],
    marks: { [Y]: code },
    bonus: 0,
    deduct: 0,
    clutch: 0,
    opening: 0,
    sem: "Q1",
  };
}

const pack = {
  kind: "techworks-desk",
  schema: 12,
  app: "1.90.10",
  saved: new Date().toISOString(),
  file: {
    meta: {
      title: "TechWorks",
      quarterName: "Q1",
      currentWeek: 1,
      schoolYear: "2026-27",
      codes: { 3: 25, 2: 20, 1: 15, A: 0, E: 0, P: -25, Assist: 10 },
      bell: [
        { period: 1, grade: 6 },
        { period: 2, grade: 8 },
        { period: 3, grade: 7 },
        { period: 6, grade: 5 },
        { period: 8, grade: 7 },
        { period: 9, grade: 8 },
        { period: 10, grade: 6 },
      ],
      savedAt: new Date().toISOString(),
      schema: 12,
      config: { currentCycle: 1, modules: { berty: true } },
    },
    crews: [
      { period: 1, key: "Crew A", name: "Sprocket" },
      { period: 1, key: "Crew B", name: "Rivet" },
      { period: 2, key: "Crew A", name: "Bit" },
      { period: 3, key: "Crew A", name: "Kerf" },
      { period: 8, key: "Crew A", name: "Tenon" },
      { period: 9, key: "Crew A", name: "Pixel" },
      { period: 10, key: "Crew A", name: "Cam" },
    ],
    students: [
      kid("a1", "Ace", 1, "Crew A", "3"),
      kid("a2", "Bea", 1, "Crew A", "3"),
      kid("a3", "Cal", 1, "Crew B", "2"),
      kid("b1", "Dot", 2, "Crew A", "2"),
      kid("b2", "Eve", 2, "Crew A", "2"),
      kid("b3", "Fay", 2, "Crew A", "2"),
      kid("c1", "Gus", 3, "Crew A", "1"),
      kid("c2", "Hal", 3, "Crew A", "1"),
      kid("c3", "Ivy", 3, "Crew A", "2"),
      kid("d1", "Joy", 8, "Crew A", "3"),
      kid("d2", "Kit", 8, "Crew A", "2"),
      kid("e1", "Leo", 9, "Crew A", "2"),
      kid("e2", "Mo", 9, "Crew A", "2"),
      kid("f1", "Nix", 10, "Crew A", "3"),
      kid("f2", "Ora", 10, "Crew A", "3"),
      kid("f3", "Pax", 10, "Crew A", "3"),
    ],
  },
};

const browser = await chromium.launch({ args: ["--no-sandbox"] });

async function shot(contextOpts, path, seed) {
  const ctx = await browser.newContext(contextOpts);
  if (seed) {
    await ctx.addInitScript((p) => {
      localStorage.setItem("techworks-desk-v12", JSON.stringify(p));
    }, pack);
  }
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Week", exact: true }).click();
  await page.waitForTimeout(900);
  await page.screenshot({ path, fullPage: false });
  const text = await page.locator("body").innerText();
  await ctx.close();
  return text.slice(0, 900);
}

const empty = await shot({ viewport: { width: 1440, height: 900 } }, "/workspace/screenshots/qa-week.png", false);
const emptyM = await shot({ viewport: { width: 390, height: 844 } }, "/workspace/screenshots/qa-week-mobile.png", false);
const race = await shot({ viewport: { width: 1440, height: 900 } }, "/workspace/screenshots/qa-week-race.png", true);
const raceM = await shot({ viewport: { width: 390, height: 844 } }, "/workspace/screenshots/qa-week-race-mobile.png", true);

console.log(JSON.stringify({
  emptyHasHeat: empty.includes("heat"),
  emptyHasLead: empty.includes("Shop lead"),
  raceHasLead: race.includes("Shop lead"),
  raceHasCrew: race.includes("First crew") || race.includes("keep"),
  raceHasBack: /\d+ back/.test(race),
  raceHasCam: race.includes("Cam"),
  emptyMHasHeat: emptyM.includes("heat"),
  raceMHasLead: raceM.includes("Shop lead"),
  emptyHead: empty.replace(/\s+/g, " ").slice(0, 280),
  raceHead: race.replace(/\s+/g, " ").slice(0, 360),
}, null, 2));

await browser.close();
