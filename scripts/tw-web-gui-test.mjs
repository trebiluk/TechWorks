import { chromium } from "playwright";

const after = "/workspace/shared/archworks/techworks-live-source/style-review/web-gui-after.png";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const notes = [];
page.on("pageerror", (e) => notes.push("err:" + String(e.message).slice(0, 90)));
await page.goto("http://127.0.0.1:8080/?layout=web", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForSelector(".board-root", { timeout: 20000 });
await page.waitForTimeout(1800);
const title = await page.title();
const chip = await page.locator("text=/v1\\.80\\.\\d+/").first().textContent().catch(() => "");
const lockup = await page.locator("img[alt=TechWorks]").first().getAttribute("src").catch(() => "");
const wall = await page.locator(".tw-web-wall").count();
const school = await page.getByText("School", { exact: false }).count();
const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-bg").trim());
const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim());
await page.getByRole("button", { name: "Unlock desk" }).click({ timeout: 4000 }).catch(() => notes.push("no lock btn"));
await page.waitForTimeout(400);
const pin = await page.locator(".tw-scrim").count();
await page.screenshot({ path: after, fullPage: false });
await page.getByRole("button", { name: "Cancel" }).click({ timeout: 3000 }).catch(() => page.keyboard.press("Escape"));
await page.waitForTimeout(300);
const p1 = page.getByRole("button", { name: /P1/ }).first();
if (await p1.count()) {
  await p1.click({ timeout: 5000 });
  notes.push("p1-click");
}
console.log(JSON.stringify({ title, chip, lockup, wall, school, bg, accent, pin, notes }, null, 2));
await browser.close();
