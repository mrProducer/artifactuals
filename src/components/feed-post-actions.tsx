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
  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 active:scale-[0.96] dark:text-zinc-400 dark:hover:bg-zinc-800";

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
  const [, startTransition] = useTransition();

  function handleLike() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    const wasLiked = liked;
    setLiked(!wasLiked);
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
        <button onClick={handleLike} aria-pressed={liked} className={actionClass}>
          <Heart
            size={ICON_SIZE}
            weight={liked ? "fill" : "regular"}
            className={liked ? "text-rose-500" : undefined}
          />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <Link href={`/a/${artifactId}#comments`} className={actionClass}>
          <ChatCircle size={ICON_SIZE} />
          {commentCount > 0 && <span>{commentCount}</span>}
        </Link>

        <button onClick={handleShare} className={actionClass}>
          <PaperPlaneTilt size={ICON_SIZE} />
          {shared && <span className="text-xs">Copied</span>}
        </button>
      </div>

      <Link href={`/a/${artifactId}`} className={actionClass}>
        <ArrowSquareOut size={ICON_SIZE} />
        <span className="hidden sm:inline">Open</span>
      </Link>
    </div>
  );
}
