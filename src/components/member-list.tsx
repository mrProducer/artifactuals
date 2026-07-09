"use client";

import { useState, useTransition } from "react";
import { NewMemberCard, type FeedMember } from "@/components/new-member-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { loadMoreMembers } from "@/app/actions/feed";
import { FEED_MEMBER_PAGE_SIZE } from "@/lib/feed";

export function MemberList({
  initialMembers,
  initialFollowingIds,
  signedIn,
  viewerId,
}: {
  initialMembers: FeedMember[];
  initialFollowingIds: string[];
  signedIn: boolean;
  viewerId: string | null;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [followingIds, setFollowingIds] = useState(
    () => new Set(initialFollowingIds)
  );
  const [hasMore, setHasMore] = useState(
    initialMembers.length === FEED_MEMBER_PAGE_SIZE
  );
  const [pending, startTransition] = useTransition();

  const loadMore = () =>
    startTransition(async () => {
      const batch = await loadMoreMembers(members.length);
      setMembers((prev) => {
        const seen = new Set(prev.map((m) => m.user_id));
        return [...prev, ...batch.members.filter((m) => !seen.has(m.user_id))];
      });
      setFollowingIds((prev) => new Set([...prev, ...batch.followingIds]));
      setHasMore(batch.hasMore);
      if (batch.members.length === 0) toast("You're all caught up.");
    });

  return (
    <>
      <div className="flex flex-col gap-3 pt-3 sm:gap-4 sm:pt-4">
        {members.map((member, i) => (
          <NewMemberCard
            key={member.user_id}
            member={member}
            followedByViewer={followingIds.has(member.user_id)}
            signedIn={signedIn}
            isSelf={viewerId === member.user_id}
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
