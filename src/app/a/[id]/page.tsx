import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ArtifactFrame } from "@/components/artifact-frame";
import { sandboxBaseUrl } from "@/lib/sandbox";

type Props = { params: Promise<{ id: string }> };

async function getArtifact(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artifacts")
    .select(
      "id, owner_id, title, description, tags, preview_image_url, like_count, comment_count, view_count, status, created_at, profiles:owner_id (username, display_name, avatar_url)"
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
  // Fire-and-forget view count; SECURITY DEFINER RPC works for anon visitors
  supabase.rpc("increment_view_count", { p_artifact_id: artifact.id }).then();

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
                imageUrl={creator.avatar_url}
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

        <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span>{artifact.like_count} likes</span>
          <span>{artifact.comment_count} comments</span>
          <span>{artifact.view_count} views</span>
        </div>
      </div>

      {artifact.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {artifact.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* The live artifact */}
      <div className="mt-5 flex-1 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <ArtifactFrame
          src={`${sandboxBaseUrl()}/sandbox/a/${artifact.id}`}
          title={artifact.title}
          className="h-[70vh] min-h-[420px] w-full border-0 bg-white"
        />
      </div>
    </main>
  );
}
