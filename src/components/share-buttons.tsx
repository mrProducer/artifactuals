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
    "border border-zinc-300 px-3.5 py-1.5 text-sm font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500";

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
