import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserCard, type DirectoryProfile } from "@/components/user-card";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";

export const metadata = { title: "Users" };

const PAGE_SIZE = 48;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function UsersPage({ searchParams }: Props) {
  const { q: rawQ, page: rawPage } = await searchParams;
  const q = (rawQ ?? "").trim();
  const safeQ = q.replace(/[,()*%]/g, " ").trim();
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "username, display_name, avatar_url, github_username, bio, created_at",
      { count: "exact" }
    )
    .is("banned_at", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (safeQ) {
    query = query.or(
      `username.ilike.%${safeQ}%,display_name.ilike.%${safeQ}%`
    );
  }

  const { data, count } = await query;
  const profiles = (data ?? []) as DirectoryProfile[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/users?${qs}` : "/users";
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-6 border-b border-border pb-4">
        <p className="font-mono text-label uppercase text-fg-subtle">
          Community
        </p>
        <h1 className="text-h1 text-fg">Users</h1>
      </header>

      <form method="get" className="mb-6 flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search people by name or @username"
          className={inputClass}
        />
        <button type="submit" className={buttonClass({ size: "sm" })}>
          Search
        </button>
      </form>

      {profiles.length === 0 ? (
        <div className="border border-dashed border-border bg-surface px-4 py-16 text-center">
          <p className="font-mono text-label uppercase text-fg-subtle">
            {q ? "No people match your search" : "No users yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <UserCard key={profile.username} profile={profile} />
          ))}
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="mt-6 flex items-center justify-between">
          {hasPrev ? (
            <Link
              href={pageHref(page - 1)}
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-meta text-fg-subtle">
            Page {page} of {totalPages}
          </span>
          {hasNext ? (
            <Link
              href={pageHref(page + 1)}
              className={buttonClass({ variant: "secondary", size: "sm" })}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}
