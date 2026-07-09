// One-off QA: open an artifact page, toggle fullscreen, capture both states.
import { chromium } from "playwright";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`${APP_URL}/feed`, { waitUntil: "networkidle" });
const firstPost = page.locator("article h2").first();
await firstPost.click();
await page.waitForLoadState("networkidle");

await page.screenshot({ path: ".qa/viewer-normal.png" });

await page.getByRole("button", { name: "Fullscreen" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: ".qa/viewer-fullscreen.png" });

await page.keyboard.press("Escape");
await page.waitForTimeout(500);
await page.screenshot({ path: ".qa/viewer-after-esc.png" });

await browser.close();
console.log("done");
