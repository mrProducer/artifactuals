import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { ArtifactViewer } from "@/components/artifact-viewer";
import { LikeButton } from "@/components/like-button";
import { ShareButtons } from "@/components/share-buttons";
import { ReportButton } from "@/components/report-button";
import { CommentsSection, type CommentItem } from "@/components/comments-section";
import { sandboxBaseUrl } from "@/lib/sandbox";

type Props = { params: Promise<{ id: string }> };

async function getArtifact(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artifacts")
    .select(
      "id, owner_id, title, description, tags, preview_image_url, like_count, comment_count, view_count, status, created_at, profiles:owner_id (username, display_name, avatar_url, github_username)"
    )
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) return { title: "Not found" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description =
    artifact.description ?? `An interactive artifact on Artifactuals`;

  return {
    title: artifact.title,
    description,
    openGraph: {
      title: artifact.title,
      description,
      url: `${siteUrl}/a/${artifact.id}`,
      siteName: "Artifactuals",
      type: "website",
      ...(artifact.preview_image_url
        ? { images: [{ url: artifact.preview_image_url, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: artifact.title,
      description,
      ...(artifact.preview_image_url
        ? { images: [artifact.preview_image_url] }
        : {}),
    },
  };
}

export default async function ArtifactPage({ params }: Props) {
  const { id } = await params;
  const artifact = await getArtifact(id);

  if (!artifact) {
    notFound();
  }

  const creator = artifact.profiles;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: likeRow }, { data: comments }] = await Promise.all([
    user
      ? supabase
          .from("likes")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("artifact_id", artifact.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("comments")
      .select(
        "id, body, created_at, author_id, profiles:author_id (username, display_name, avatar_url, github_username)"
      )
      .eq("artifact_id", artifact.id)
      .eq("status", "visible")
      .order("created_at", { ascending: true })
      .limit(200),
  ]);

  // Fire-and-forget view count; SECURITY DEFINER RPC works for anon visitors
  supabase.rpc("increment_view_count", { p_artifact_id: artifact.id }).then();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {artifact.title}
          </h1>
          {artifact.description && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {artifact.description}
            </p>
          )}
          {creator && (
            <Link
              href={`/${creator.username}`}
              className="mt-3 flex items-center gap-2"
            >
              <Avatar
                name={creator.display_name}
                imageUrl={resolveAvatarUrl(creator)}
                size="sm"
              />
              <span className="text-sm font-medium">
                {creator.display_name}
              </span>
              <span className="text-sm text-zinc-400">
                @{creator.username}
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LikeButton
            artifactId={artifact.id}
            initialLiked={likeRow !== null}
            initialCount={artifact.like_count}
            signedIn={user !== null}
          />
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            {artifact.view_count} views
          </span>
        </div>
      </div>

      {artifact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              className="bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* The live artifact */}
      <div className="mt-5">
        <ArtifactViewer
          src={`${sandboxBaseUrl()}/sandbox/a/${artifact.id}`}
          title={artifact.title}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ShareButtons url={`${siteUrl}/a/${artifact.id}`} title={artifact.title} />
        <ReportButton
          targetType="artifact"
          targetId={artifact.id}
          signedIn={user !== null}
        />
      </div>

      <CommentsSection
        artifactId={artifact.id}
        comments={(comments ?? []) as CommentItem[]}
        currentUserId={user?.id ?? null}
      />
    </main>
  );
}
