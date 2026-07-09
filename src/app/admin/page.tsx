import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewer, type Role } from "@/lib/moderation";
import { timeAgo } from "@/lib/time";
import { ReportActions } from "@/components/admin/report-actions";

type ReportStatus = "open" | "reviewed" | "actioned";
const STATUSES: ReportStatus[] = ["open", "reviewed", "actioned"];

type Props = { searchParams: Promise<{ status?: string }> };

type EnrichedReport = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { username: string; display_name: string } | null;
  target:
    | {
        type: "artifact";
        id: string;
        title: string;
        removed: boolean;
        author: TargetAuthor | null;
      }
    | {
        type: "comment";
        id: string;
        body: string;
        artifactId: string;
        removed: boolean;
        author: TargetAuthor | null;
      }
    | { type: "missing"; id: string };
};

type TargetAuthor = {
  userId: string;
  username: string;
  display_name: string;
  role: Role;
  banned: boolean;
};

export default async function AdminReportsPage({ searchParams }: Props) {
  const { role: viewerRole } = await getViewer();
  const { status: statusParam } = await searchParams;
  const activeStatus: ReportStatus = STATUSES.includes(
    statusParam as ReportStatus
  )
    ? (statusParam as ReportStatus)
    : "open";

  const admin = createAdminClient();

  const [{ data: reports }, { count: openCount }] = await Promise.all([
    admin
      .from("reports")
      .select("id, reason, status, created_at, reporter_id, target_type, target_id")
      .eq("status", activeStatus)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "open"),
  ]);

  const rows = reports ?? [];
  const artifactIds = rows
    .filter((r) => r.target_type === "artifact")
    .map((r) => r.target_id);
  const commentIds = rows
    .filter((r) => r.target_type === "comment")
    .map((r) => r.target_id);

  const [artifactsRes, commentsRes] = await Promise.all([
    artifactIds.length
      ? admin
          .from("artifacts")
          .select("id, title, status, owner_id")
          .in("id", artifactIds)
      : Promise.resolve({ data: [] as { id: string; title: string; status: string; owner_id: string }[] }),
    commentIds.length
      ? admin
          .from("comments")
          .select("id, body, status, artifact_id, author_id")
          .in("id", commentIds)
      : Promise.resolve({ data: [] as { id: string; body: string; status: string; artifact_id: string; author_id: string }[] }),
  ]);

  const artifacts = new Map((artifactsRes.data ?? []).map((a) => [a.id, a]));
  const comments = new Map((commentsRes.data ?? []).map((c) => [c.id, c]));

  // Everyone we need a name/role/ban state for: reporters + content authors.
  const profileIds = new Set<string>();
  for (const r of rows) profileIds.add(r.reporter_id);
  for (const a of artifactsRes.data ?? []) profileIds.add(a.owner_id);
  for (const c of commentsRes.data ?? []) profileIds.add(c.author_id);

  const { data: profileRows } = profileIds.size
    ? await admin
        .from("profiles")
        .select("user_id, username, display_name, role, banned_at")
        .in("user_id", [...profileIds])
    : { data: [] };
  const profiles = new Map((profileRows ?? []).map((p) => [p.user_id, p]));

  const toAuthor = (userId: string): TargetAuthor | null => {
    const p = profiles.get(userId);
    if (!p) return null;
    return {
      userId,
      username: p.username,
      display_name: p.display_name,
      role: (p.role as Role) ?? "user",
      banned: Boolean(p.banned_at),
    };
  };

  const enriched: EnrichedReport[] = rows.map((r) => {
    const reporter = profiles.get(r.reporter_id);
    const base = {
      id: r.id,
      reason: r.reason,
      status: r.status,
      created_at: r.created_at,
      reporter: reporter
        ? { username: reporter.username, display_name: reporter.display_name }
        : null,
    };
    if (r.target_type === "artifact") {
      const a = artifacts.get(r.target_id);
      if (!a) return { ...base, target: { type: "missing", id: r.target_id } };
      return {
        ...base,
        target: {
          type: "artifact",
          id: a.id,
          title: a.title,
          removed: a.status === "removed",
          author: toAuthor(a.owner_id),
        },
      };
    }
    const c = comments.get(r.target_id);
    if (!c) return { ...base, target: { type: "missing", id: r.target_id } };
    return {
      ...base,
      target: {
        type: "comment",
        id: c.id,
        body: c.body,
        artifactId: c.artifact_id,
        removed: c.status === "removed",
        author: toAuthor(c.author_id),
      },
    };
  });

  const tabClass = (selected: boolean) =>
    `-mb-px border-b-2 px-1 pb-2.5 text-small font-semibold capitalize transition-colors ${
      selected
        ? "border-accent text-fg"
        : "border-transparent text-fg-subtle hover:text-fg"
    }`;

  return (
    <div>
      <div className="mb-6 flex items-end gap-6 border-b border-border">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={tabClass(activeStatus === s)}
          >
            {s}
            {s === "open" && openCount ? (
              <span className="ml-1.5 font-mono text-meta text-fg-subtle">
                {openCount}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      {enriched.length === 0 ? (
        <div className="border border-dashed border-border bg-surface px-4 py-16 text-center">
          <p className="font-mono text-label uppercase text-fg-subtle">
            No {activeStatus} reports
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {enriched.map((report) => (
            <li
              key={report.id}
              className="border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-meta text-fg-subtle">
                <span className="uppercase">
                  {report.target.type === "missing"
                    ? "unknown"
                    : report.target.type}
                </span>
                <span aria-hidden>·</span>
                <span>{timeAgo(report.created_at)}</span>
                {report.reporter && (
                  <>
                    <span aria-hidden>·</span>
                    <span>
                      reported by{" "}
                      <Link
                        href={`/${report.reporter.username}`}
                        className="hover:text-fg"
                      >
                        @{report.reporter.username}
                      </Link>
                    </span>
                  </>
                )}
              </div>

              <p className="mt-2 text-body text-fg">{report.reason}</p>

              {report.target.type === "missing" ? (
                <p className="mt-3 text-small text-fg-subtle">
                  The reported content no longer exists.
                </p>
              ) : (
                <div className="mt-3 border-l-2 border-border pl-3">
                  {report.target.type === "artifact" ? (
                    <Link
                      href={`/a/${report.target.id}`}
                      className="text-small font-medium text-fg hover:underline"
                    >
                      {report.target.title}
                    </Link>
                  ) : (
                    <Link
                      href={`/a/${report.target.artifactId}`}
                      className="text-small text-fg-muted hover:underline"
                    >
                      &ldquo;{report.target.body}&rdquo;
                    </Link>
                  )}
                  <div className="mt-1 font-mono text-meta text-fg-subtle">
                    {report.target.removed && (
                      <span className="mr-2 text-danger">removed</span>
                    )}
                    {report.target.author && (
                      <span>
                        by{" "}
                        <Link
                          href={`/${report.target.author.username}`}
                          className="hover:text-fg"
                        >
                          @{report.target.author.username}
                        </Link>
                        {report.target.author.banned && (
                          <span className="ml-2 text-danger">banned</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {report.target.type !== "missing" && (
                <ReportActions
                  reportId={report.id}
                  reportStatus={report.status}
                  target={{
                    type: report.target.type,
                    id: report.target.id,
                    removed: report.target.removed,
                  }}
                  author={report.target.author}
                  viewerRole={viewerRole}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
