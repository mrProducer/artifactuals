import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveAvatarUrl } from "@/lib/profile";
import { ArtifactStage } from "@/components/artifact-stage";
import { ShareButtons } from "@/components/share-buttons";
import { ReportButton } from "@/components/report-button";
import { CommentsSection, type CommentItem } from "@/components/comments-section";
import { ArtifactOwnerToolbar } from "@/components/artifact-owner-toolbar";
import { sandboxBaseUrl } from "@/lib/sandbox";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ id: string }> };

async function getArtifact(id: string) {
  const supabase = await createClient();
  // No status filter here: RLS already hides removed artifacts from everyone
  // except their owner, so an owner can still reach their own removed artifact
  // (to see why it's gone / delete it) while the public gets nothing.
  const { data } = await supabase
    .from("artifacts")
    .select(
      "id, owner_id, title, description, tags, preview_image_url, like_count, comment_count, view_count, is_pinned, status, created_at, profiles:owner_id (username, display_name, avatar_url, github_username)"
    )
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artifact = await getArtifact(id);
  // Removed artifacts are only reachable by their owner; never expose public
  // metadata or let search engines index them.
  if (!artifact || artifact.status === "removed") {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const description =
    artifact.description ?? `An interactive artifact on Artifactuals`;

  // NOTE: the og:image / twitter:image come from the colocated
  // `opengraph-image.tsx` (real screenshot when it exists, branded card
  // otherwise). Setting images here too would emit duplicate, conflicting
  // tags, so we intentionally leave them out.
  return {
    title: artifact.title,
    description,
    openGraph: {
      title: artifact.title,
      description,
      url: `${siteUrl}/a/${artifact.id}`,
      siteName: "Artifactuals",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: artifact.title,
      description,
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

  const isOwner = user?.id === artifact.owner_id;

  // A removed artifact only ever renders for its owner (RLS enforces this);
  // show why it's gone and let them delete it rather than a bare 404.
  if (artifact.status === "removed") {
    if (!isOwner) notFound();
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-16 sm:px-6">
        <p className="font-mono text-label uppercase text-danger">Removed</p>
        <h1 className="mt-3 text-h1 text-fg">{artifact.title}</h1>
        <p className="mt-3 text-body text-fg-muted">
          This artifact was removed by a moderator and is no longer publicly
          visible. If you think this was a mistake, reach out. You can also
          delete it permanently.
        </p>
        <div className="mt-6">
          <ArtifactOwnerToolbar
            artifactId={artifact.id}
            isPinned={artifact.is_pinned}
          />
        </div>
      </main>
    );
  }

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

  // Fire-and-forget view count; SECURITY DEFINER RPC works for anon visitors.
  // Don't count the owner viewing their own artifact — it just inflates stats.
  if (!isOwner) {
    supabase.rpc("increment_view_count", { p_artifact_id: artifact.id }).then();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="flex-1">
      {/* The live artifact fills the viewport under the site header, with a
          bottom action bar. Details and comments live below the fold. */}
      <ArtifactStage
        src={`${sandboxBaseUrl()}/sandbox/a/${artifact.id}`}
        title={artifact.title}
        shareUrl={`${siteUrl}/a/${artifact.id}`}
        artifactId={artifact.id}
        creatorName={creator?.display_name ?? null}
        creatorUsername={creator?.username ?? null}
        creatorAvatarUrl={creator ? resolveAvatarUrl(creator) : null}
        initialLiked={likeRow !== null}
        initialLikeCount={artifact.like_count}
        viewCount={artifact.view_count}
        commentCount={artifact.comment_count}
        signedIn={user !== null}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {artifact.description && (
          <p className="max-w-[68ch] text-body text-fg-muted">
            {artifact.description}
          </p>
        )}

        {artifact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {artifact.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        {isOwner && (
          <div className="mt-6 border-t border-border pt-6">
            <ArtifactOwnerToolbar
              artifactId={artifact.id}
              isPinned={artifact.is_pinned}
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <ShareButtons
            url={`${siteUrl}/a/${artifact.id}`}
            title={artifact.title}
          />
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
      </div>
    </div>
  );
}
