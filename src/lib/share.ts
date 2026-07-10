/**
 * Client-side sharing helpers.
 *
 * The goal (per product): share the artifact as a *text post with the
 * screenshot attached*, not a bare link-unfurl card. The only web API that can
 * actually attach an image to a native composer is the Web Share API Level 2
 * (`navigator.share({ files })`) — on mobile this opens LinkedIn/X with the
 * screenshot attached and the caption prefilled & editable, which is exactly
 * the flow we want. Plain intent URLs (X) / share-offsite (LinkedIn) can't
 * attach images, so those are desktop fallbacks.
 */

/** Auto-filled caption. Leads with the title, ends with the link to keep. */
export function artifactShareText(title: string, url: string): string {
  return `${title}\n\nSee more here on Artifactuals: ${url}`;
}

/** Fetch the preview screenshot as a File so it can be attached to a share. */
export async function loadImageFile(
  imageUrl: string,
  filename = "artifact.png"
): Promise<File | null> {
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    return new File([blob], filename, { type: blob.type });
  } catch {
    return null;
  }
}

/** True when this browser can share the given files via the native sheet. */
export function canShareFiles(files: File[]): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files })
  );
}

export type ShareOutcome = "shared" | "cancelled" | "unsupported" | "error";

/**
 * Native share of the screenshot + caption. Returns an outcome the caller can
 * use to decide whether to fall back (e.g. copy link) — never throws.
 */
export async function shareArtifactImage({
  title,
  url,
  imageUrl,
}: {
  title: string;
  url: string;
  imageUrl: string | null;
}): Promise<ShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }

  const text = artifactShareText(title, url);
  const file = imageUrl ? await loadImageFile(imageUrl) : null;

  // Preferred: attach the screenshot so it posts as an image with a caption.
  if (file && canShareFiles([file])) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // Some targets reject files → fall through to a text/url share.
    }
  }

  // No image support: share text + link (still routes to the app chooser).
  try {
    await navigator.share({ text, url });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return "cancelled";
    }
    return "error";
  }
}

/** Trigger a browser download of the screenshot (desktop attach fallback). */
export async function downloadImage(
  imageUrl: string,
  filename = "artifact.png"
): Promise<boolean> {
  const file = await loadImageFile(imageUrl, filename);
  if (!file) return false;
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
  return true;
}

export function xIntentUrl(title: string, url: string): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(
    artifactShareText(title, url)
  )}`;
}

/** LinkedIn's feed composer (no text/image params exist; we assist manually). */
export const LINKEDIN_COMPOSER_URL =
  "https://www.linkedin.com/feed/?shareActive=true";
