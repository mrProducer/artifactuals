import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { ArtifactFrame } from "@/components/artifact-frame";
import { FeedPostActions } from "@/components/feed-post-actions";
import { resolveAvatarUrl } from "@/lib/profile";
import { timeAgo } from "@/lib/time";

export type FeedArtifact = {
  id: string;
  title: string;
  description: string | null;
  preview_image_url: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    github_username: string | null;
  } | null;
};

export function FeedPost({
  artifact,
  likedByViewer,
  signedIn,
  index = 0,
}: {
  artifact: FeedArtifact;
  likedByViewer: boolean;
  signedIn: boolean;
  index?: number;
}) {
  const creator = artifact.profiles;

  return (
    <article
      style={{ "--enter-index": index } as React.CSSProperties}
      className="group animate-rise border-y border-border bg-surface shadow-sm transition-[transform,box-shadow] duration-200 ease-out sm:border-x hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Creator header (LinkedIn-style: photo, name, handle, time) */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
        {creator && (
          <>
            <Link href={`/${creator.username}`} className="shrink-0">
              <Avatar
                name={creator.display_name}
                imageUrl={resolveAvatarUrl(creator)}
                size="lg"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/${creator.username}`}
                className="block truncate text-title text-fg hover:underline"
              >
                {creator.display_name}
              </Link>
              <p className="truncate font-mono text-meta text-fg-muted">
                @{creator.username}
              </p>
              {creator.bio && (
                <p className="truncate text-small text-fg-muted">
                  {creator.bio}
                </p>
              )}
              <p className="font-mono text-meta text-fg-subtle">
                {timeAgo(artifact.created_at)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pb-3 sm:px-5">
        <Link href={`/a/${artifact.id}`} className="block">
          <h2 className="text-title text-fg hover:underline">
            {artifact.title}
          </h2>
          {artifact.description && (
            <p className="mt-0.5 line-clamp-2 text-body text-fg-muted">
              {artifact.description}
            </p>
          )}
        </Link>
      </div>

      {/* Media: a generated screenshot once it exists, otherwise the live
          artifact itself (non-interactive) so the feed is never empty. */}
      <div className="relative aspect-[1200/630] w-full overflow-hidden border-y border-border bg-surface-muted">
        {artifact.preview_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artifact.preview_image_url}
            alt={artifact.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[320ms] ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <ArtifactFrame
            src={`/sandbox/a/${artifact.id}`}
            title={artifact.title}
            scroll={false}
            className="pointer-events-none h-full w-full border-0 bg-surface"
          />
        )}
        {/* Transparent overlay makes the whole media open the artifact
            (and keeps the live preview non-interactive). */}
        <Link
          href={`/a/${artifact.id}`}
          aria-label={`Open ${artifact.title}`}
          className="absolute inset-0"
        />
      </div>

      {/* Action bar */}
      <FeedPostActions
        artifactId={artifact.id}
        title={artifact.title}
        initialLiked={likedByViewer}
        initialLikeCount={artifact.like_count}
        commentCount={artifact.comment_count}
        signedIn={signedIn}
      />
    </article>
  );
}
