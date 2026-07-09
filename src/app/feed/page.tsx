import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FeedPost, type FeedArtifact } from "@/components/feed-post";

export const metadata = { title: "Feed" };

const FEED_SELECT =
  "id, title, description, preview_image_url, like_count, comment_count, created_at, profiles:owner_id (username, display_name, avatar_url)";
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
    `border-b-2 px-1 pb-2.5 text-sm font-semibold transition-colors ${
      selected
        ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
        : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="flex-1 bg-zinc-100 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-[600px] pb-16">
        {/* Tabs */}
        <div className="flex items-end gap-6 border-b border-zinc-200 bg-white px-4 pt-3 sm:mt-6 sm:border-x sm:border-t dark:border-zinc-800 dark:bg-zinc-900">
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
          <p className="border-b border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 sm:border-x dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            You aren&apos;t following anyone yet, so here&apos;s what&apos;s
            trending.
          </p>
        )}

        {artifacts.length > 0 ? (
          <div className="flex flex-col gap-3 pt-3 sm:gap-4 sm:pt-4">
            {artifacts.map((artifact) => (
              <FeedPost
                key={artifact.id}
                artifact={artifact}
                likedByViewer={likedIds.has(artifact.id)}
                signedIn={user !== null}
              />
            ))}
          </div>
        ) : (
          <div className="border-b border-zinc-200 bg-white px-4 py-16 text-center sm:border-x dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nothing here yet.{" "}
              <Link
                href="/new"
                className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
              >
                Publish the first artifact
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
