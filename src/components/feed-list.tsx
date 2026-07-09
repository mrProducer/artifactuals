"use client";

import { useState, useTransition } from "react";
import { FeedPost, type FeedArtifact } from "@/components/feed-post";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { loadMoreFeed } from "@/app/actions/feed";
import { FEED_PAGE_SIZE } from "@/lib/feed";

export function FeedList({
  initialArtifacts,
  initialLikedIds,
  tab,
  signedIn,
}: {
  initialArtifacts: FeedArtifact[];
  initialLikedIds: string[];
  tab: "trending" | "following";
  signedIn: boolean;
}) {
  const [artifacts, setArtifacts] = useState(initialArtifacts);
  const [likedIds, setLikedIds] = useState(() => new Set(initialLikedIds));
  const [hasMore, setHasMore] = useState(
    initialArtifacts.length === FEED_PAGE_SIZE
  );
  const [pending, startTransition] = useTransition();

  const loadMore = () =>
    startTransition(async () => {
      const batch = await loadMoreFeed(tab, artifacts.length);
      setArtifacts((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        return [...prev, ...batch.artifacts.filter((a) => !seen.has(a.id))];
      });
      setLikedIds((prev) => new Set([...prev, ...batch.likedIds]));
      setHasMore(batch.hasMore);
      if (batch.artifacts.length === 0) toast("You're all caught up.");
    });

  return (
    <>
      <div className="flex flex-col gap-3 pt-3 sm:gap-4 sm:pt-4">
        {artifacts.map((artifact, i) => (
          <FeedPost
            key={artifact.id}
            artifact={artifact}
            likedByViewer={likedIds.has(artifact.id)}
            signedIn={signedIn}
            index={i}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8">
          <Button
            variant="secondary"
            size="sm"
            disabled={pending}
            onClick={loadMore}
          >
            {pending ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </>
  );
}
