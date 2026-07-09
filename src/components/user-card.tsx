import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { timeAgo } from "@/lib/time";

export type DirectoryProfile = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  github_username: string | null;
  bio: string | null;
  created_at: string;
};

export function UserCard({ profile }: { profile: DirectoryProfile }) {
  return (
    <Link
      href={`/${profile.username}`}
      className="group flex items-start gap-3 border border-border bg-surface p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
    >
      <Avatar
        name={profile.display_name}
        imageUrl={resolveAvatarUrl(profile)}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-title text-fg group-hover:underline">
          {profile.display_name}
        </span>
        <span className="block truncate font-mono text-meta text-fg-muted">
          @{profile.username}
        </span>
        {profile.bio && (
          <p className="mt-1 line-clamp-2 text-small text-fg-muted">
            {profile.bio}
          </p>
        )}
        <p className="mt-1 font-mono text-meta text-fg-subtle">
          joined {timeAgo(profile.created_at)}
        </p>
      </div>
    </Link>
  );
}
