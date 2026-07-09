"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions/social";
import { toast } from "@/components/ui/toast";

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
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!signedIn) {
      window.location.href = "/login";
      return;
    }
    const was = following;
    setFollowing(!was);
    startTransition(async () => {
      const result = await toggleFollow(followeeId, was, username);
      if (result.error) {
        setFollowing(was);
        toast(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex h-10 items-center px-5 text-small font-medium transition-colors active:translate-y-px disabled:opacity-50 ${
        following
          ? "border border-border bg-surface text-fg hover:border-danger hover:text-danger"
          : "bg-accent text-accent-fg hover:bg-accent-hover"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
