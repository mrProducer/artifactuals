import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { authUserMap } from "@/lib/admin-users";
import { getViewer, type Role } from "@/lib/moderation";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { timeAgo } from "@/lib/time";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { UserRowActions } from "@/components/admin/user-row-actions";

export const metadata = { title: "Users · Admin" };

const PAGE_SIZE = 50;

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q: rawQ, page: rawPage } = await searchParams;
  const { user: viewer, role: viewerRole } = await getViewer();

  const q = (rawQ ?? "").trim();
  // Strip characters that would break the PostgREST or() filter string, then
  // use the remainder as a case-insensitive substring match.
  const safeQ = q.replace(/[,()*%]/g, " ").trim();
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select(
      "user_id, username, display_name, avatar_url, github_username, bio, role, banned_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (safeQ) {
    query = query.or(
      `username.ilike.%${safeQ}%,display_name.ilike.%${safeQ}%`
    );
  }

  const [{ data: profiles, count }, authMap] = await Promise.all([
    query,
    authUserMap(admin),
  ]);

  const rows = profiles ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/users?${qs}` : "/admin/users";
  };

  return (
    <div>
      <form method="get" className="mb-4 flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or @username"
          className={inputClass}
        />
        <button type="submit" className={buttonClass({ size: "sm" })}>
          Search
        </button>
      </form>

      <p className="mb-3 font-mono text-meta text-fg-subtle">
        {total} {total === 1 ? "account" : "accounts"}
        {q ? ` matching “${q}”` : ""}
      </p>

      {rows.length === 0 ? (
        <div className="border border-dashed border-border bg-surface px-4 py-16 text-center">
          <p className="font-mono text-label uppercase text-fg-subtle">
            No matching accounts
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-small">
            <thead>
              <tr className="border-b border-border text-left font-mono text-meta uppercase text-fg-subtle">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const meta = authMap.get(p.user_id);
                const role = (p.role as Role) ?? "user";
                const banned = Boolean(p.banned_at);
                return (
                  <tr
                    key={p.user_id}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/${p.username}`}
                        className="flex items-center gap-2.5"
                      >
                        <Avatar
                          name={p.display_name}
                          imageUrl={resolveAvatarUrl(p)}
                          size="sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg">
                            {p.display_name}
                          </span>
                          <span className="block truncate font-mono text-meta text-fg-muted">
                            @{p.username}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-meta text-fg-muted">
                      {meta?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-meta uppercase text-fg-subtle">
                        {role}
                      </span>
                      {banned && (
                        <span className="ml-2 font-mono text-meta text-danger">
                          banned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-meta text-fg-muted">
                      {timeAgo(p.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-meta text-fg-muted">
                      {meta?.lastSignInAt ? timeAgo(meta.lastSignInAt) : "never"}
                    </td>
                    <td className="px-4 py-3">
                      <UserRowActions
                        userId={p.user_id}
                        username={p.username}
                        currentRole={role}
                        banned={banned}
                        viewerRole={viewerRole}
                        isSelf={viewer?.id === p.user_id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(hasPrev || hasNext) && (
        <div className="mt-4 flex items-center justify-between">
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
    </div>
  );
}
