import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArtifactFrame } from "@/components/artifact-frame";
import { buttonClass } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  }

  // Prove the product: a small curated wall of real published artifacts so a
  // first-time visitor immediately sees what an "artifact" is (DESIGN.md §9).
  const { data: proof } = await supabase
    .from("artifacts")
    .select("id, title, preview_image_url")
    .eq("status", "published")
    .order("trending_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-16 pb-24 sm:px-6">
      <div className="max-w-3xl">
        <p className="font-mono text-label uppercase text-fg-subtle">
          A home for what you build with AI
        </p>
        <h1 className="mt-4 text-display-l text-fg sm:text-display-xl">
          The things you build with AI deserve a home.
        </h1>
        <p className="mt-6 max-w-xl text-body text-fg-muted sm:text-lg">
          Publish interactive artifacts, live and running. Build a portfolio
          under your own name. See what everyone else is making.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/login" className={buttonClass()}>
            Get started
          </Link>
          <Link
            href="/feed"
            className={buttonClass({ variant: "secondary" })}
          >
            Browse trending
          </Link>
        </div>
      </div>

      {proof && proof.length > 0 && (
        <section className="mt-20">
          <p className="font-mono text-label uppercase text-fg-subtle">
            Live on Artifactuals
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proof.map((artifact) => (
              <Link
                key={artifact.id}
                href={`/a/${artifact.id}`}
                className="group overflow-hidden border border-border bg-surface shadow-sm transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
              >
                <div className="relative aspect-[1200/630] overflow-hidden bg-surface-muted">
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
                      className="pointer-events-none h-full w-full border-0 bg-surface"
                    />
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-title text-fg">{artifact.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
