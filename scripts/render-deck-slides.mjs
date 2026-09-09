import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const OUT = "/workspace/screenshots/deck";
const ART = "/workspace/artifacts/deck-slides";
mkdirSync(OUT, { recursive: true });
mkdirSync(ART, { recursive: true });

const SLUGS = [
  "01-title",
  "02-how",
  "03-beats",
  "04-effort",
  "05-skills",
  "06-stem",
  "07-safety",
  "08-now",
  "09-clean",
  "10-blank",
  "11-close",
];

const browser = await chromium.launch({ args: ["--no-sandbox"] });

const print = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
print.setDefaultTimeout(25000);
await print.goto("http://127.0.0.1:8080/deck-print.html", { waitUntil: "networkidle", timeout: 30000 });
await print.waitForTimeout(400);
const slides = print.locator("article.slide");
const n = await slides.count();
if (n !== 11) throw new Error(`expected 11 slides, got ${n}`);
const names = [];
for (let i = 0; i < n; i++) {
  const slug = SLUGS[i];
  const png = `${OUT}/${slug}.png`;
  await slides.nth(i).screenshot({ path: png, type: "png" });
  copyFileSync(png, `${ART}/${slug}.png`);
  names.push({ i: i + 1, slug, png });
}
await print.pdf({
  path: `${ART}/TechWorks-Deck.pdf`,
  width: "13.333in",
  height: "7.5in",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
});
copyFileSync(`${ART}/TechWorks-Deck.pdf`, "/workspace/public/TechWorks-Deck.pdf");
copyFileSync(`${ART}/TechWorks-Deck.pdf`, "/workspace/artifacts/TechWorks-Deck.pdf");

const page = await browser.newPage({ viewport: { width: 1680, height: 1100 } });
page.setDefaultTimeout(25000);
await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.getByRole("button", { name: "Deck", exact: true }).first().waitFor({ timeout: 20000 });
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Deck", exact: true }).first().click();
await page.getByText("TECHWORKS", { exact: true }).first().waitFor({ timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/board-chrome.png`, type: "png" });
const live = await page.locator("body").innerText();
const hasTitle = live.includes("TECHWORKS") && live.includes("Workshop you can see");
const pptx = await page.evaluate(() => {
  const a = document.querySelector('a[href="/TechWorks-Deck.pptx"]');
  return { href: a?.getAttribute("href") ?? null, text: a?.textContent?.trim() ?? null };
});

writeFileSync(`${ART}/index.json`, JSON.stringify({ names, hasTitle, pptx }, null, 2));
console.log(JSON.stringify({ ok: true, n, hasTitle, pptx, names }, null, 2));
await browser.close();
