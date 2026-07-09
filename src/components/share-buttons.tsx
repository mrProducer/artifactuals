"use client";

import { useState } from "react";

/**
 * Share-intent links (handoff §6): open the platform's own composer
 * pre-filled — no OAuth, the user posts it themselves.
 */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const text = `${title} — built with AI, live on Artifactuals`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const buttonClass =
    "inline-flex h-10 items-center border border-border bg-surface px-4 text-small font-medium text-fg transition-colors hover:border-border-strong";

  return (
    <div className="flex items-center gap-2">
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        Share on X
      </a>
      <a
        href={linkedInHref}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
      >
        Share on LinkedIn
      </a>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={buttonClass}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
