import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserCard, type DirectoryProfile } from "@/components/user-card";
import { ArtifactFrame } from "@/components/artifact-frame";

export const metadata = { title: "Search" };

const RESULT_LIMIT = 24;

type Artifact = {
  id: string;
  title: string;
  description: string | null;
  preview_image_url: string | null;
  like_count: number;
  comment_count: number;
};

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();
  const safeQ = q.replace(/[,()*%]/g, " ").trim();

  let people: DirectoryProfile[] = [];
  let artifacts: Artifact[] = [];

  if (safeQ) {
    const supabase = await createClient();
    const [peopleRes, artifactsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, github_username, bio, created_at"
        )
        .is("banned_at", null)
        .or(`username.ilike.%${safeQ}%,display_name.ilike.%${safeQ}%`)
        .order("created_at", { ascending: false })
        .limit(RESULT_LIMIT),
      supabase
        .from("artifacts")
        .select(
          "id, title, description, preview_image_url, like_count, comment_count"
        )
        .eq("status", "published")
        .or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
        .order("trending_score", { ascending: false })
        .limit(RESULT_LIMIT),
    ]);
    people = (peopleRes.data ?? []) as DirectoryProfile[];
    artifacts = (artifactsRes.data ?? []) as Artifact[];
  }

  const hasQuery = q.length > 0;
  const nothing = hasQuery && people.length === 0 && artifacts.length === 0;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-label uppercase text-fg-subtle">Search</p>
        <h1 className="text-h1 text-fg">
          {hasQuery ? `Results for “${q}”` : "Search"}
        </h1>
      </header>

      {!hasQuery && (
        <p className="text-body text-fg-muted">
          Search for people and artifacts using the box in the header.
        </p>
      )}

      {nothing && (
        <div className="border border-dashed border-border bg-surface px-4 py-16 text-center">
          <p className="font-mono text-label uppercase text-fg-subtle">
            Nothing matched “{q}”
          </p>
        </div>
      )}

      {people.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 font-mono text-label uppercase text-fg-subtle">
            People
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((profile) => (
              <UserCard key={profile.username} profile={profile} />
            ))}
          </div>
        </section>
      )}

      {artifacts.length > 0 && (
        <section>
          <h2 className="mb-3 font-mono text-label uppercase text-fg-subtle">
            Artifacts
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                </div>
                <div className="p-3">
                  <span className="truncate text-title text-fg group-hover:underline">
                    {artifact.title}
                  </span>
                  <p className="mt-1 font-mono text-meta text-fg-subtle">
                    {artifact.like_count} likes · {artifact.comment_count}{" "}
                    comments
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
