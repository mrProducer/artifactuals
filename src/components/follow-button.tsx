"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/social";

export function FollowButton({
  followeeId,
  username,
  initialFollowing,
  signedIn,
}: {
  followeeId: string;
  username: string;
  initialFollowing: boolean;
  signedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    const was = following;
    setFollowing(!was);
    setError(null);
    startTransition(async () => {
      const result = await toggleFollow(followeeId, was, username);
      if (result.error) {
        setFollowing(was);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={pending}
        className={`px-5 py-1.5 text-sm font-medium transition-colors ${
          following
            ? "border border-zinc-300 text-zinc-600 hover:border-red-400 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400"
            : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
}
