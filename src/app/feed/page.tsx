import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type FeedArtifact } from "@/components/feed-post";
import { type FeedMember } from "@/components/new-member-card";
import { FeedList } from "@/components/feed-list";
import { MemberList } from "@/components/member-list";
import { buttonClass } from "@/components/ui/button";
import {
  FEED_SELECT,
  FEED_PAGE_SIZE,
  MEMBER_SELECT,
  FEED_MEMBER_PAGE_SIZE,
} from "@/lib/feed";

export const metadata = { title: "Feed" };

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

  const requestedTab =
    tab === "following" ? "following" : tab === "new" ? "new" : "trending";
  const activeTab =
    requestedTab === "following" && followeeIds.length === 0
      ? "trending"
      : requestedTab;

  let artifacts: FeedArtifact[] = [];
  let members: FeedMember[] = [];
  let memberFollowingIds: string[] = [];

  if (activeTab === "new") {
    const { data } = await supabase
      .from("profiles")
      .select(MEMBER_SELECT)
      .is("banned_at", null)
      .order("created_at", { ascending: false })
      .limit(FEED_MEMBER_PAGE_SIZE);
    members = (data ?? []) as FeedMember[];

    if (user && members.length > 0) {
      const { data: follows } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", user.id)
        .in(
          "followee_id",
          members.map((m) => m.user_id)
        );
      memberFollowingIds = follows?.map((f) => f.followee_id) ?? [];
    }
  } else if (activeTab === "following") {
    const { data } = await supabase
      .from("artifacts")
      .select(FEED_SELECT)
      .eq("status", "published")
      .in("owner_id", followeeIds)
      .order("created_at", { ascending: false })
      .limit(FEED_PAGE_SIZE);
    artifacts = (data ?? []) as FeedArtifact[];
  } else {
    const { data } = await supabase
      .from("artifacts")
      .select(FEED_SELECT)
      .eq("status", "published")
      .order("trending_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(FEED_PAGE_SIZE);
    artifacts = (data ?? []) as FeedArtifact[];
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
          <Link
            href="/feed?tab=new"
            className={tabClass(activeTab === "new")}
          >
            New members
          </Link>
        </div>

        {requestedTab === "following" && followeeIds.length === 0 && (
          <p className="border-b border-border bg-surface px-4 py-3 text-small text-fg-muted sm:border-x">
            You aren&apos;t following anyone yet, so here&apos;s what&apos;s
            trending.
          </p>
        )}

        {activeTab === "new" ? (
          members.length > 0 ? (
            <MemberList
              initialMembers={members}
              initialFollowingIds={memberFollowingIds}
              signedIn={user !== null}
              viewerId={user?.id ?? null}
            />
          ) : (
            <div className="mt-3 flex flex-col items-center gap-4 border border-dashed border-border bg-surface px-4 py-16 text-center sm:mx-0">
              <p className="font-mono text-label uppercase text-fg-subtle">
                No members yet
              </p>
            </div>
          )
        ) : artifacts.length > 0 ? (
          <FeedList
            initialArtifacts={artifacts}
            initialLikedIds={[...likedIds]}
            tab={activeTab === "following" ? "following" : "trending"}
            signedIn={user !== null}
          />
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
