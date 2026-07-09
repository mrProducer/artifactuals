/**
 * Artifact sandbox (docs/TECHNICAL_HANDOFF.md §3) — the single render path
 * used by BOTH the compose-time preview and published artifact pages.
 *
 * Isolation layers:
 * 1. Embedded via <iframe sandbox="allow-scripts"> WITHOUT allow-same-origin,
 *    so artifact JS runs in an opaque origin with no access to the parent's
 *    cookies, storage, or DOM.
 * 2. In production, served from a separate host (artifacts.artifactuals.com)
 *    so even a sandbox escape lands on an origin with nothing to steal.
 * 3. A strict CSP (below), including a `sandbox` directive that applies even
 *    if someone opens the artifact URL directly as a top-level document.
 */

export const MAX_ARTIFACT_BYTES = 1024 * 1024; // 1 MB, matches storage bucket cap

// The app can be served from either the apex or the www host (the apex
// redirects to www in production), so the iframe must permit both as parents
// — otherwise the browser blocks the embed with a CSP violation.
function frameAncestors(appOrigin: string): string {
  try {
    const url = new URL(appOrigin);
    const bareHost = url.host.replace(/^www\./, "");
    return [
      `${url.protocol}//${bareHost}`,
      `${url.protocol}//www.${bareHost}`,
    ].join(" ");
  } catch {
    return appOrigin;
  }
}

// Artifacts built with Claude commonly pull libraries from CDNs
// (script/style src https:), so those stay open. Exfiltration paths that
// matter most — fetch/XHR/WebSocket and form posts — are closed.
function buildCsp(appOrigin: string): string {
  return [
    "default-src 'none'",
    "script-src https: 'unsafe-inline' 'unsafe-eval'",
    "style-src https: 'unsafe-inline'",
    "img-src https: data: blob:",
    "font-src https: data:",
    "media-src https: data: blob:",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    `frame-ancestors ${frameAncestors(appOrigin)}`,
    "sandbox allow-scripts",
  ].join("; ");
}

export function sandboxResponseHeaders(): HeadersInit {
  const appOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": buildCsp(appOrigin),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    // Published artifact HTML is immutable per path; previews must not cache
    "Cache-Control": "no-store",
  };
}

/**
 * In production the sandbox routes must only answer on the dedicated
 * artifact host — never on the main app origin. Unset SANDBOX_HOST (local
 * dev) allows any host; the iframe sandbox attribute still isolates.
 */
export function isAllowedSandboxHost(requestHost: string | null): boolean {
  const sandboxHost = process.env.SANDBOX_HOST;
  if (!sandboxHost) return true;
  return requestHost === sandboxHost;
}

/** Base URL the app uses to point iframes at the sandbox routes. */
export function sandboxBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SANDBOX_URL ?? "";
}
