import type { FeedArtifact } from "@/components/feed-post";

// Plain module (NOT "use server"): shared feed constants/types that both the
// server page and the client load-more list import as real values.

export const FEED_SELECT =
  "id, title, description, preview_image_url, like_count, comment_count, created_at, profiles:owner_id (username, display_name, avatar_url, bio, github_username)";

export const FEED_PAGE_SIZE = 30;

export type FeedBatch = {
  artifacts: FeedArtifact[];
  likedIds: string[];
  hasMore: boolean;
};
