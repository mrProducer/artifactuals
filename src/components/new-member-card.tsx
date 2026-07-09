import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { resolveAvatarUrl } from "@/lib/profile";
import { timeAgo } from "@/lib/time";

export type FeedMember = {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  github_username: string | null;
  bio: string | null;
  created_at: string;
};

export function NewMemberCard({
  member,
  followedByViewer,
  signedIn,
  isSelf,
  index = 0,
}: {
  member: FeedMember;
  followedByViewer: boolean;
  signedIn: boolean;
  isSelf: boolean;
  index?: number;
}) {
  return (
    <article
      style={{ "--enter-index": index } as React.CSSProperties}
      className="group animate-rise border-y border-border bg-surface shadow-sm transition-[transform,box-shadow] duration-200 ease-out sm:border-x hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <Link href={`/${member.username}`} className="shrink-0">
          <Avatar
            name={member.display_name}
            imageUrl={resolveAvatarUrl(member)}
            size="lg"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-meta uppercase text-fg-subtle">
            New member · joined {timeAgo(member.created_at)}
          </p>
          <Link
            href={`/${member.username}`}
            className="mt-0.5 block truncate text-title text-fg hover:underline"
          >
            {member.display_name}
          </Link>
          <p className="truncate font-mono text-meta text-fg-muted">
            @{member.username}
          </p>
          {member.bio && (
            <p className="mt-1 line-clamp-2 text-small text-fg-muted">
              {member.bio}
            </p>
          )}
        </div>
        {!isSelf && (
          <div className="shrink-0">
            <FollowButton
              followeeId={member.user_id}
              username={member.username}
              initialFollowing={followedByViewer}
              signedIn={signedIn}
            />
          </div>
        )}
      </div>
    </article>
  );
}
