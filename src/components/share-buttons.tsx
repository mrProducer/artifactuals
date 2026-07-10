"use client";

import { useState, useSyncExternalStore } from "react";
import { XLogo, LinkedinLogo, LinkSimple, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import {
  artifactShareText,
  downloadImage,
  shareArtifactImage,
  xIntentUrl,
  LINKEDIN_COMPOSER_URL,
} from "@/lib/share";

/**
 * Share the artifact as a text post with the screenshot attached (not a bare
 * link card). Native share (mobile / supported desktop) attaches the image and
 * prefills the caption directly. Per-network buttons are desktop fallbacks:
 * X unfurls the screenshot via its card; LinkedIn can't take an image or text
 * from a URL, so we copy the caption + download the image and open the composer.
 */
export function ShareButtons({
  url,
  title,
  imageUrl,
}: {
  url: string;
  title: string;
  imageUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  // Client-only capability check; server + first paint report false to avoid a
  // hydration mismatch, then the button appears where native share exists.
  const canNativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );

  async function handleNativeShare() {
    const outcome = await shareArtifactImage({ title, url, imageUrl });
    if (outcome === "error" || outcome === "unsupported") {
      await copyLink();
    }
  }

  function handleX() {
    window.open(xIntentUrl(title, url), "_blank", "noopener,noreferrer");
  }

  async function handleLinkedIn() {
    try {
      await navigator.clipboard.writeText(artifactShareText(title, url));
    } catch {
      /* clipboard may be blocked; still open the composer */
    }
    const downloaded = imageUrl ? await downloadImage(imageUrl) : false;
    window.open(LINKEDIN_COMPOSER_URL, "_blank", "noopener,noreferrer");
    toast(
      downloaded
        ? "Caption copied & screenshot downloaded — paste it, then attach the image in LinkedIn."
        : "Caption copied — paste it into your LinkedIn post."
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const buttonClass =
    "inline-flex h-10 flex-1 items-center justify-center gap-2 border border-border bg-surface px-4 text-small font-medium text-fg transition-colors hover:border-border-strong sm:flex-none";

  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      {canNativeShare && (
        <button onClick={handleNativeShare} className={buttonClass}>
          <ShareNetwork size={18} weight="bold" />
          Share
        </button>
      )}
      <button onClick={handleX} className={buttonClass}>
        <XLogo size={18} weight="bold" />
        Post on X
      </button>
      <button onClick={handleLinkedIn} className={buttonClass}>
        <LinkedinLogo size={18} weight="bold" />
        Post on LinkedIn
      </button>
      <button onClick={copyLink} className={buttonClass}>
        <LinkSimple size={18} weight="bold" />
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
