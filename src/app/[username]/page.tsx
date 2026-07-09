import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { FollowButton } from "@/components/follow-button";
import { fetchGitHubProfile } from "@/lib/github";

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
          imageUrl={profile.avatar_url ?? github?.profile.avatar_url}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.display_name}
            </h1>
            <span className="text-zinc-400 dark:text-zinc-500">
              @{profile.username}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {profile.bio}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                {followerCount ?? 0}
              </strong>{" "}
              followers
            </span>
            <span>
              <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
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
                  className="border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
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
            className="self-start border border-zinc-300 px-4 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
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
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Recent on GitHub
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {github.repos.map((repo) => (
              <a
                key={repo.html_url}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {repo.name}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-400">
                    ★ {repo.stargazers_count}
                  </span>
                </div>
                {repo.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {repo.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Artifacts */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Artifacts
        </h2>
        {artifacts && artifacts.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artifacts.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/a/${artifact.id}`}
                className="group overflow-hidden border border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="aspect-[1200/630] bg-zinc-100 dark:bg-zinc-900">
                  {artifact.preview_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={artifact.preview_image_url}
                      alt={artifact.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    {artifact.is_pinned && (
                      <span className="bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        Pinned
                      </span>
                    )}
                    <span className="truncate text-sm font-medium">
                      {artifact.title}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    {artifact.like_count} likes · {artifact.comment_count}{" "}
                    comments
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
            {isOwner
              ? "You haven't published anything yet."
              : `${profile.display_name} hasn't published anything yet.`}
          </p>
        )}
      </section>
    </main>
  );
}
