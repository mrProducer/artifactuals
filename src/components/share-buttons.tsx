"use client";

import { useState, useSyncExternalStore } from "react";
import { XLogo, LinkedinLogo, LinkSimple, ShareNetwork } from "@phosphor-icons/react";
import { toast } from "@/components/ui/toast";
import {
  artifactShareText,
  canShareImageFiles,
  downloadImage,
  shareArtifactImage,
  xIntentUrl,
  LINKEDIN_COMPOSER_URL,
} from "@/lib/share";

/**
 * Share the artifact as a text post with the screenshot attached (not a bare
 * link card).
 *
 * On touch devices we lead with the native share sheet: it lists the installed
 * LinkedIn / X *apps* as targets and hands them the screenshot + prefilled,
 * editable caption — there is no public deep link that can pre-fill a LinkedIn
 * post, so the OS sheet is the only way into the app. On desktop (no app to
 * target) we fall back to per-network web buttons.
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

  // Prefer the native sheet on touch devices that can share image files —
  // that's the route into the LinkedIn/X apps. Server + first paint report
  // false to avoid a hydration mismatch.
  const preferNative = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(pointer: coarse)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () =>
      window.matchMedia("(pointer: coarse)").matches && canShareImageFiles(),
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

  // Touch device: one native button that opens the app chooser with the image.
  if (preferNative) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <button
          onClick={handleNativeShare}
          className={`${buttonClass} border-accent bg-accent text-accent-fg hover:bg-accent-hover`}
        >
          <ShareNetwork size={18} weight="bold" />
          Share to LinkedIn, X &amp; more
        </button>
        <button onClick={copyLink} className={buttonClass}>
          <LinkSimple size={18} weight="bold" />
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    );
  }

  // Desktop: no app to target, so per-network web composers.
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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
