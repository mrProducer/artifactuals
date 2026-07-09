import Link from "next/link";
import { Avatar } from "@/components/avatar";

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
  } | null;
};

export function ArtifactCard({ artifact }: { artifact: FeedArtifact }) {
  const creator = artifact.profiles;

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
      <Link href={`/a/${artifact.id}`} className="block">
        <div className="aspect-[1200/630] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800">
          {artifact.preview_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artifact.preview_image_url}
              alt={artifact.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-3xl font-semibold text-zinc-300 dark:text-zinc-700">
              {artifact.title.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-2 p-3.5">
        <Link href={`/a/${artifact.id}`} className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{artifact.title}</h3>
          {artifact.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {artifact.description}
            </p>
          )}
        </Link>

        <div className="flex items-center justify-between gap-2">
          {creator ? (
            <Link
              href={`/${creator.username}`}
              className="flex min-w-0 items-center gap-1.5"
            >
              <Avatar
                name={creator.display_name}
                imageUrl={creator.avatar_url}
                size="sm"
              />
              <span className="truncate text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {creator.display_name}
              </span>
            </Link>
          ) : (
            <span />
          )}
          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
            {artifact.like_count} ♥ · {artifact.comment_count} 💬
          </span>
        </div>
      </div>
    </article>
  );
}
