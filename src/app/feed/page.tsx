import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedPost, type FeedArtifact } from "@/components/feed-post";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Feed" };

const FEED_SELECT =
  "id, title, description, preview_image_url, like_count, comment_count, created_at, profiles:owner_id (username, display_name, avatar_url, bio, github_username)";
const PAGE_SIZE = 30;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function FeedPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Following requires auth; everyone else gets Trending (PRD 6.3: logged-out
  // visitors can browse Trending, zero-follow users default to Trending).
  let followeeIds: string[] = [];
  if (user) {
    const { data: follows } = await supabase
      .from("follows")
      .select("followee_id")
      .eq("follower_id", user.id);
    followeeIds = follows?.map((f) => f.followee_id) ?? [];
  }

  const requestedTab = tab === "following" ? "following" : "trending";
  const activeTab =
    requestedTab === "following" && followeeIds.length > 0
      ? "following"
      : "trending";

  let artifacts: FeedArtifact[] = [];
  if (activeTab === "following") {
    const { data } = await supabase
      .from("artifacts")
      .select(FEED_SELECT)
      .eq("status", "published")
      .in("owner_id", followeeIds)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    artifacts = data ?? [];
  } else {
    const { data } = await supabase
      .from("artifacts")
      .select(FEED_SELECT)
      .eq("status", "published")
      .order("trending_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    artifacts = data ?? [];
  }

  // Which of the visible posts has the viewer liked (one query for the page)
  let likedIds = new Set<string>();
  if (user && artifacts.length > 0) {
    const { data: likes } = await supabase
      .from("likes")
      .select("artifact_id")
      .eq("user_id", user.id)
      .in(
        "artifact_id",
        artifacts.map((a) => a.id)
      );
    likedIds = new Set(likes?.map((l) => l.artifact_id));
  }

  const tabClass = (selected: boolean) =>
    `-mb-px border-b-2 px-1 pb-2.5 text-small font-semibold transition-colors ${
      selected
        ? "border-accent text-fg"
        : "border-transparent text-fg-subtle hover:text-fg"
    }`;

  return (
    <div className="flex-1 bg-bg">
      <main className="mx-auto w-full max-w-[600px] px-0 pb-16 sm:px-6">
        {/* Tabs */}
        <div className="flex items-end gap-6 border-b border-border bg-surface px-4 pt-3 shadow-sm sm:mt-6 sm:border-x sm:border-t">
          <Link href="/feed" className={tabClass(activeTab === "trending")}>
            Trending
          </Link>
          {user && (
            <Link
              href="/feed?tab=following"
              className={tabClass(activeTab === "following")}
            >
              Following
            </Link>
          )}
        </div>

        {requestedTab === "following" && followeeIds.length === 0 && (
          <p className="border-b border-border bg-surface px-4 py-3 text-small text-fg-muted sm:border-x">
            You aren&apos;t following anyone yet, so here&apos;s what&apos;s
            trending.
          </p>
        )}

        {artifacts.length > 0 ? (
          <div className="flex flex-col gap-3 pt-3 sm:gap-4 sm:pt-4">
            {artifacts.map((artifact, i) => (
              <FeedPost
                key={artifact.id}
                artifact={artifact}
                likedByViewer={likedIds.has(artifact.id)}
                signedIn={user !== null}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-4 border border-dashed border-border bg-surface px-4 py-16 text-center sm:mx-0">
            <p className="font-mono text-label uppercase text-fg-subtle">
              Nothing on the wall yet
            </p>
            <Link href="/new" className={buttonClass({ size: "sm" })}>
              Publish the first artifact
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
