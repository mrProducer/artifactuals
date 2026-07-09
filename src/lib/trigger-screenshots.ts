/**
 * Kick the screenshot worker immediately after a publish instead of waiting for
 * the scheduled cron (see .github/workflows/screenshots.yml). Headless Chromium
 * can't run in the serverless runtime, so we trigger the existing GitHub Actions
 * workflow via workflow_dispatch; it renders every artifact missing a preview.
 *
 * Fire-and-forget and fully self-contained: if the token/repo aren't configured
 * (e.g. local dev), this no-ops and the 15-minute cron remains the fallback.
 * It must never throw into the publish flow.
 */
export async function triggerScreenshotWorker(): Promise<void> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY ?? "mrProducer/artifactuals";
  const workflow = process.env.GITHUB_WORKFLOW_FILE ?? "screenshots.yml";
  const ref = process.env.GITHUB_DISPATCH_REF ?? "master";

  if (!token) return; // Not configured — rely on the scheduled run.

  try {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${workflow}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "artifactuals-app",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ref }),
      }
    );

    if (!res.ok) {
      console.error(
        `Screenshot dispatch failed: ${res.status} ${await res.text()}`
      );
    }
  } catch (err) {
    console.error("Screenshot dispatch error:", err);
  }
}
