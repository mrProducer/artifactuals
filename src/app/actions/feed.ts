"use server";

import { createClient } from "@/lib/supabase/server";
import type { FeedArtifact } from "@/components/feed-post";
import { FEED_SELECT, FEED_PAGE_SIZE, type FeedBatch } from "@/lib/feed";

/**
 * Fetch a page of the feed for incremental "load more". The tab and the
 * viewer's follow graph are resolved server-side (never trusted from the
 * client) so this can't be used to page through arbitrary users' feeds.
 */
export async function loadMoreFeed(
  tab: "trending" | "following",
  offset: number
): Promise<FeedBatch> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const from = Math.max(offset, 0);
  const to = from + FEED_PAGE_SIZE - 1;

  let query = supabase
    .from("artifacts")
    .select(FEED_SELECT)
    .eq("status", "published");

  if (tab === "following") {
    if (!user) return { artifacts: [], likedIds: [], hasMore: false };
    const { data: follows } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id);
    const followeeIds = follows?.map((f) => f.followee_id) ?? [];
    if (followeeIds.length === 0) {
      return { artifacts: [], likedIds: [], hasMore: false };
    }
    query = query
      .in("owner_id", followeeIds)
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("trending_score", { ascending: false })
      .order("created_at", { ascending: false });
  }

  const { data } = await query.range(from, to);
  const artifacts = (data ?? []) as FeedArtifact[];

  let likedIds: string[] = [];
  if (user && artifacts.length > 0) {
    const { data: likes } = await supabase
      .from("likes")
      .select("artifact_id")
      .eq("user_id", user.id)
      .in(
        "artifact_id",
        artifacts.map((a) => a.id)
      );
    likedIds = likes?.map((l) => l.artifact_id) ?? [];
  }

  return {
    artifacts,
    likedIds,
    hasMore: artifacts.length === FEED_PAGE_SIZE,
  };
}
