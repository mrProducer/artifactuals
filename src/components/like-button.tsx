"use client";

import { useState, useTransition } from "react";
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
      className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        liked
          ? "border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
      }`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      {count}
    </button>
  );
}
