/**
 * Screenshot / OG-image worker (handoff §4).
 *
 * Finds published artifacts with no preview image, renders each through the
 * SAME sandbox route the site uses (never raw HTML), captures a 1200x630
 * screenshot, uploads it to the artifact-previews bucket, and stores the URL
 * on the artifact row.
 *
 * Usage:
 *   node --env-file=.env.local scripts/screenshot-worker.mjs          # one-shot
 *   node --env-file=.env.local scripts/screenshot-worker.mjs --watch  # poll every 30s
 *
 * Runs anywhere Node + Playwright run (local now; small container/cron in
 * production). Deliberately not part of the Next.js app: headless Chromium
 * doesn't belong in serverless functions, and isolating the render keeps
 * blast radius small (handoff §1).
 */

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.SCREENSHOT_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const VIEWPORT = { width: 1200, height: 630 }; // OG/Twitter Card standard
const RENDER_SETTLE_MS = 2500;
const PAGE_TIMEOUT_MS = 20000;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function processPending(browser) {
  const { data: artifacts, error } = await supabase
    .from("artifacts")
    .select("id, title")
    .eq("status", "published")
    .is("preview_image_url", null)
    .limit(10);

  if (error) {
    console.error("Query failed:", error.message);
    return 0;
  }
  if (!artifacts?.length) return 0;

  for (const artifact of artifacts) {
    const url = `${APP_URL}/sandbox/a/${artifact.id}`;
    console.log(`Rendering ${artifact.id} (${artifact.title})...`);

    const context = await browser.newContext({ viewport: VIEWPORT });
    try {
      const page = await context.newPage();
      await page.goto(url, {
        waitUntil: "load",
        timeout: PAGE_TIMEOUT_MS,
      });
      // Settle window for JS-heavy artifacts (animations, canvas, fonts)
      await page.waitForTimeout(RENDER_SETTLE_MS);
      const png = await page.screenshot({ type: "png" });

      const storagePath = `${artifact.id}.png`;
      const { error: uploadError } = await supabase.storage
        .from("artifact-previews")
        .upload(storagePath, png, { contentType: "image/png", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from("artifact-previews")
        .getPublicUrl(storagePath);

      const { error: updateError } = await supabase
        .from("artifacts")
        .update({ preview_image_url: urlData.publicUrl })
        .eq("id", artifact.id);
      if (updateError) throw new Error(updateError.message);

      console.log(`  done -> ${urlData.publicUrl}`);
    } catch (err) {
      console.error(`  FAILED for ${artifact.id}:`, err.message);
    } finally {
      await context.close();
    }
  }
  return artifacts.length;
}

const watch = process.argv.includes("--watch");
const browser = await chromium.launch();

try {
  if (watch) {
    console.log("Screenshot worker watching (30s poll). Ctrl+C to stop.");
    for (;;) {
      await processPending(browser);
      await new Promise((r) => setTimeout(r, 30000));
    }
  } else {
    const n = await processPending(browser);
    console.log(n === 0 ? "Nothing pending." : `Processed ${n} artifact(s).`);
  }
} finally {
  await browser.close();
}
