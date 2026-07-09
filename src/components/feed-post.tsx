import Link from "next/link";
import { Avatar } from "@/components/avatar";
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
}: {
  artifact: FeedArtifact;
  likedByViewer: boolean;
  signedIn: boolean;
}) {
  const creator = artifact.profiles;

  return (
    <article className="border-y border-zinc-200 bg-white sm:border-x dark:border-zinc-800 dark:bg-zinc-900">
      {/* Creator header (LinkedIn-style: photo, name, headline, time) */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
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
                className="block truncate text-sm font-semibold leading-5 text-zinc-900 hover:underline dark:text-zinc-50"
              >
                {creator.display_name}
              </Link>
              <p className="truncate text-xs leading-4 text-zinc-500 dark:text-zinc-400">
                {creator.bio ?? `@${creator.username}`}
              </p>
              <p className="text-xs leading-4 text-zinc-400 dark:text-zinc-500">
                {timeAgo(artifact.created_at)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Caption */}
      <div className="px-4 pb-3">
        <Link href={`/a/${artifact.id}`} className="group block">
          <h2 className="text-[15px] font-semibold leading-snug text-zinc-900 group-hover:underline dark:text-zinc-50">
            {artifact.title}
          </h2>
          {artifact.description && (
            <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {artifact.description}
            </p>
          )}
        </Link>
      </div>

      {/* Media */}
      <Link
        href={`/a/${artifact.id}`}
        className="block aspect-[1200/630] w-full overflow-hidden border-y border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {artifact.preview_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artifact.preview_image_url}
            alt={artifact.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
            Preview coming soon
          </div>
        )}
      </Link>

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
