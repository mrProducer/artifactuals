/**
 * QA helper: captures key pages at mobile and desktop viewports.
 *   node scripts/qa-screenshots.mjs
 * Output: .qa/*.png (gitignored)
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.QA_BASE_URL ?? "http://localhost:3000";
const OUT = ".qa";
const PAGES = [
  ["home", "/"],
  ["feed", "/feed"],
  ["login", "/login"],
  ["profile", "/tim"],
  ["artifact", "/a/bfc8b901-1f15-4734-afb0-7cf0c2fe64ef"],
];
const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1366, height: 900 },
};

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  for (const [name, path] of PAGES) {
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT}/${name}-${vpName}.png`, fullPage: true });
    console.log(`${name}-${vpName}.png`);
  }
  await context.close();
}

await browser.close();
