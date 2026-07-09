import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArtifactCard, type FeedArtifact } from "@/components/artifact-card";

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

  const tabClass = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium ${
      selected
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
        : "border border-zinc-300 text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500"
    }`;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2">
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
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          You aren&apos;t following anyone yet — here&apos;s what&apos;s
          trending instead.
        </p>
      )}

      {artifacts.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((artifact) => (
            <ArtifactCard key={artifact.id} artifact={artifact} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-dashed border-zinc-300 p-12 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
          Nothing here yet. Be the first to{" "}
          <Link href="/new" className="underline">
            publish an artifact
          </Link>
          .
        </p>
      )}
    </main>
  );
}
