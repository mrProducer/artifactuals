import type { FeedArtifact } from "@/components/feed-post";
import type { FeedMember } from "@/components/new-member-card";

// Plain module (NOT "use server"): shared feed constants/types that both the
// server page and the client load-more list import as real values.

export const FEED_SELECT =
  "id, title, description, preview_image_url, like_count, comment_count, created_at, profiles:owner_id (username, display_name, avatar_url, bio, github_username)";

export const FEED_PAGE_SIZE = 30;

// Columns needed to render a "new member" entry in the feed.
export const MEMBER_SELECT =
  "user_id, username, display_name, avatar_url, github_username, bio, created_at";

export const FEED_MEMBER_PAGE_SIZE = 30;

export type FeedBatch = {
  artifacts: FeedArtifact[];
  likedIds: string[];
  hasMore: boolean;
};

export type MemberBatch = {
  members: FeedMember[];
  followingIds: string[];
  hasMore: boolean;
};

/**
 * A single entry in the feed. Today the "New members" tab renders only
 * `member` items and the other tabs render only `artifact` items, but keeping a
 * discriminated union here means members can be interleaved into the main
 * stream later without reworking the data shape.
 */
export type FeedItem =
  | { kind: "artifact"; artifact: FeedArtifact }
  | { kind: "member"; member: FeedMember };
