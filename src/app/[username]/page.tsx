import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { ArtifactFrame } from "@/components/artifact-frame";
import { resolveAvatarUrl } from "@/lib/profile";
import { FollowButton } from "@/components/follow-button";
import { fetchGitHubProfile } from "@/lib/github";
import { buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return { title: "Not found" };
  return {
    title: profile.display_name,
    description: profile.bio ?? `${profile.display_name} on Artifactuals`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const [
    { data: artifacts },
    { count: followerCount },
    { count: followingCount },
    { data: { user } },
  ] = await Promise.all([
    supabase
      .from("artifacts")
      .select("id, title, description, preview_image_url, like_count, comment_count, is_pinned, created_at")
      .eq("owner_id", profile.user_id)
      .eq("status", "published")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("followee_id", profile.user_id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.user_id),
    supabase.auth.getUser(),
  ]);

  const isOwner = user?.id === profile.user_id;

  let isFollowing = false;
  if (user && !isOwner) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("followee_id", profile.user_id)
      .maybeSingle();
    isFollowing = followRow !== null;
  }

  const github = profile.github_username
    ? await fetchGitHubProfile(profile.github_username)
    : null;

  const links = [
    profile.github_username && {
      label: "GitHub",
      url: `https://github.com/${profile.github_username}`,
    },
    profile.linkedin_url && { label: "LinkedIn", url: profile.linkedin_url },
    profile.instagram_url && { label: "Instagram", url: profile.instagram_url },
    ...((profile.custom_links as { label: string; url: string }[] | null) ?? []),
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      {/* Profile header */}
      <section className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar
          name={profile.display_name}
          imageUrl={
            profile.avatar_url ??
            github?.profile.avatar_url ??
            resolveAvatarUrl(profile)
          }
          size="xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-h1 text-fg">{profile.display_name}</h1>
            <span className="font-mono text-meta text-fg-subtle">
              @{profile.username}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-2 max-w-[68ch] text-body text-fg-muted">
              {profile.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-meta text-fg-muted">
            <span>
              <strong className="font-semibold text-fg">
                {followerCount ?? 0}
              </strong>{" "}
              followers
            </span>
            <span>
              <strong className="font-semibold text-fg">
                {followingCount ?? 0}
              </strong>{" "}
              following
            </span>
          </div>

          {links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border bg-surface px-3 py-1 text-small font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {isOwner ? (
          <Link
            href="/settings/profile"
            className={buttonClass({ variant: "secondary", size: "sm", className: "self-start" })}
          >
            Edit profile
          </Link>
        ) : (
          <div className="self-start">
            <FollowButton
              followeeId={profile.user_id}
              username={profile.username}
              initialFollowing={isFollowing}
              signedIn={user !== null}
            />
          </div>
        )}
      </section>

      {/* GitHub highlights */}
      {github && github.repos.length > 0 && (
        <section className="mt-12">
          <h2 className="font-mono text-label uppercase text-fg-subtle">
            Recent on GitHub
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {github.repos.map((repo) => (
              <a
                key={repo.html_url}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border bg-surface p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-title text-fg">
                    {repo.name}
                  </span>
                  <span className="shrink-0 font-mono text-meta text-fg-subtle">
                    ★ {repo.stargazers_count}
                  </span>
                </div>
                {repo.description && (
                  <p className="mt-1 line-clamp-2 text-small text-fg-muted">
                    {repo.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Artifacts */}
      <section className="mt-12">
        <h2 className="font-mono text-label uppercase text-fg-subtle">
          Artifacts
        </h2>
        {artifacts && artifacts.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/a/${artifact.id}`}
                className="group overflow-hidden border border-border bg-surface shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
              >
                <div className="aspect-[1200/630] overflow-hidden bg-surface-muted">
                  {artifact.preview_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artifact.preview_image_url}
                      alt={artifact.title}
                      className="h-full w-full object-cover transition-transform duration-[320ms] ease-out group-hover:scale-[1.02]"
                    />
                  ) : (
                    <ArtifactFrame
                      src={`/sandbox/a/${artifact.id}`}
                      title={artifact.title}
                      className="pointer-events-none h-full w-full border-0 bg-surface"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    {artifact.is_pinned && <Badge variant="pinned">Pinned</Badge>}
                    <span className="truncate text-title text-fg">
                      {artifact.title}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-meta text-fg-subtle">
                    {artifact.like_count} likes · {artifact.comment_count}{" "}
                    comments
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center gap-4 border border-dashed border-border bg-surface p-10 text-center">
            <p className="font-mono text-label uppercase text-fg-subtle">
              {isOwner
                ? "Nothing on the wall yet"
                : `${profile.display_name} hasn't published anything yet`}
            </p>
            {isOwner && (
              <Link href="/new" className={buttonClass({ size: "sm" })}>
                Publish your first artifact
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
