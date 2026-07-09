import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Preview / OG screenshot generation.
 *
 * Renders an artifact through the SAME public sandbox route the site uses
 * (never raw HTML) via a hosted headless-browser API (ScreenshotOne), then
 * stores the PNG in the `artifact-previews` bucket and writes the URL onto the
 * artifact row. Headless Chromium can't run in Vercel's serverless runtime, so
 * we offload the render — this replaces the old GitHub Actions worker and lets
 * us generate the image synchronously at publish, before the share link is
 * ever handed to LinkedIn.
 *
 * Fully self-contained and best-effort: it never throws into the publish flow.
 * If it can't run (no API key, or a non-public origin like localhost) it
 * returns an error and the caller simply proceeds — the per-artifact OG route
 * falls back to a branded card until a real image exists.
 */

const VIEWPORT = { width: 1200, height: 630 }; // OG / Twitter card standard
const RENDER_SETTLE_SECONDS = 3; // let JS/canvas/animations/fonts settle
const REQUEST_TIMEOUT_MS = 25_000;

type PreviewResult = { url: string } | { error: string };

/** Public origin a headless browser can reach to render the sandbox. */
function screenshotOrigin(): string {
  return (
    process.env.SCREENSHOT_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}

function isPubliclyReachable(origin: string): boolean {
  return !/localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0/i.test(origin);
}

function buildScreenshotRequestUrl(accessKey: string, targetUrl: string): string {
  const params = new URLSearchParams({
    access_key: accessKey,
    url: targetUrl,
    format: "png",
    viewport_width: String(VIEWPORT.width),
    viewport_height: String(VIEWPORT.height),
    image_width: String(VIEWPORT.width),
    image_height: String(VIEWPORT.height),
    device_scale_factor: "1",
    delay: String(RENDER_SETTLE_SECONDS),
    block_ads: "true",
    block_cookie_banners: "true",
    block_trackers: "true",
    // We manage freshness ourselves via storage, so always render fresh.
    cache: "false",
  });
  return `https://api.screenshotone.com/take?${params.toString()}`;
}

/**
 * Render, store, and record the preview image for a published artifact.
 * Returns the stored public URL on success, or an error describing why it was
 * skipped/failed (callers treat this as non-fatal).
 */
export async function generateArtifactPreview(
  artifactId: string
): Promise<PreviewResult> {
  const accessKey = process.env.SCREENSHOTONE_ACCESS_KEY;
  if (!accessKey) {
    return { error: "SCREENSHOTONE_ACCESS_KEY is not set." };
  }

  const origin = screenshotOrigin();
  if (!isPubliclyReachable(origin)) {
    return {
      error: `Screenshot origin ${origin} is not publicly reachable; skipping.`,
    };
  }

  const targetUrl = `${origin.replace(/\/$/, "")}/sandbox/a/${artifactId}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let png: ArrayBuffer;
    try {
      const res = await fetch(buildScreenshotRequestUrl(accessKey, targetUrl), {
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return {
          error: `Screenshot API responded ${res.status}: ${body.slice(0, 200)}`,
        };
      }
      png = await res.arrayBuffer();
    } finally {
      clearTimeout(timeout);
    }

    const admin = createAdminClient();
    const storagePath = `${artifactId}.png`;
    const { error: uploadError } = await admin.storage
      .from("artifact-previews")
      .upload(storagePath, png, { contentType: "image/png", upsert: true });
    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
    }

    const { data: urlData } = admin.storage
      .from("artifact-previews")
      .getPublicUrl(storagePath);

    // Cache-bust so regenerated previews propagate to the feed/OG image and
    // aren't masked by a stale CDN copy at the same object path.
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await admin
      .from("artifacts")
      .update({ preview_image_url: publicUrl })
      .eq("id", artifactId);
    if (updateError) {
      return { error: `Could not save preview URL: ${updateError.message}` };
    }

    return { url: publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Screenshot render failed: ${message}` };
  }
}
