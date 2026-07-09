"use client";

import { useState, useTransition } from "react";
import { Heart } from "@phosphor-icons/react";
import { toggleLike } from "@/app/actions/social";

export function LikeButton({
  artifactId,
  initialLiked,
  initialCount,
  signedIn,
}: {
  artifactId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    // Optimistic flip; revert on failure
    const wasLiked = liked;
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));
    startTransition(async () => {
      const { error } = await toggleLike(artifactId, wasLiked);
      if (error) {
        setLiked(wasLiked);
        setCount((c) => c + (wasLiked ? 1 : -1));
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      className={`inline-flex h-10 items-center gap-1.5 border px-4 text-small font-medium transition-colors ${
        liked
          ? "border-like/40 bg-like/10 text-like"
          : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
      }`}
    >
      <Heart
        size={18}
        weight={liked ? "fill" : "regular"}
        className={liked ? "text-like" : undefined}
      />
      {count}
    </button>
  );
}
