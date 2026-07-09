"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Heart,
  ChatCircle,
  PaperPlaneTilt,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { toggleLike } from "@/app/actions/social";

const ICON_SIZE = 22;

const actionClass =
  "flex items-center gap-1.5 px-2 py-1.5 text-small font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg active:scale-[0.96]";

export function FeedPostActions({
  artifactId,
  title,
  initialLiked,
  initialLikeCount,
  commentCount,
  signedIn,
}: {
  artifactId: string;
  title: string;
  initialLiked: boolean;
  initialLikeCount: number;
  commentCount: number;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [shared, setShared] = useState(false);
  const [popKey, setPopKey] = useState(0);
  const [, startTransition] = useTransition();

  function handleLike() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
    // Replay the scale-pop by remounting the icon (DESIGN.md §6).
    if (!wasLiked) setPopKey((k) => k + 1);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    startTransition(async () => {
      const { error } = await toggleLike(artifactId, wasLiked);
      if (error) {
        setLiked(wasLiked);
        setLikeCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
  }

  async function handleShare() {
    const url = `${window.location.origin}/a/${artifactId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user dismissed the sheet; fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  return (
    <div className="flex items-center justify-between px-2.5 py-1.5">
      <div className="flex items-center gap-1">
        <button
          onClick={handleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className={actionClass}
        >
          <Heart
            key={popKey}
            size={ICON_SIZE}
            weight={liked ? "fill" : "regular"}
            className={liked ? "animate-like-pop text-like" : undefined}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <Link
          href={`/a/${artifactId}#comments`}
          aria-label="Comments"
          className={actionClass}
        >
          <ChatCircle size={ICON_SIZE} />
          {commentCount > 0 && <span>{commentCount}</span>}
        </Link>

        <button onClick={handleShare} aria-label="Share" className={actionClass}>
          <PaperPlaneTilt size={ICON_SIZE} />
          {shared && <span className="text-meta">Copied</span>}
        </button>
      </div>

      <Link href={`/a/${artifactId}`} className={actionClass}>
        <ArrowSquareOut size={ICON_SIZE} />
        <span className="hidden sm:inline">Open</span>
      </Link>
    </div>
  );
}
