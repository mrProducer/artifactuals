"use client";

import { useState, useTransition } from "react";
import {
  resolveReport,
  setArtifactStatus,
  setCommentStatus,
  setUserBan,
} from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Role } from "@/lib/moderation";

type Target = {
  type: "artifact" | "comment";
  id: string;
  removed: boolean;
};

type Author = {
  userId: string;
  username: string;
  role: Role;
  banned: boolean;
} | null;

export function ReportActions({
  reportId,
  reportStatus,
  target,
  author,
  viewerRole,
}: {
  reportId: string;
  reportStatus: string;
  target: Target;
  author: Author;
  viewerRole: Role;
}) {
  const [pending, startTransition] = useTransition();
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast(result.error);
      else toast(ok);
    });

  const toggleContent = () =>
    run(() => {
      const next = target.removed ? "restore" : "remove";
      if (target.type === "artifact") {
        return setArtifactStatus(
          target.id,
          next === "remove" ? "removed" : "published",
          reportId
        );
      }
      return setCommentStatus(
        target.id,
        next === "remove" ? "removed" : "visible",
        reportId
      );
    }, target.removed ? "Content restored." : "Content removed.");

  const canBanAuthor =
    author &&
    (author.role === "user" ||
      viewerRole === "admin"); // admins can ban moderators; moderators can't

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <Button
        variant={target.removed ? "secondary" : "danger"}
        size="sm"
        disabled={pending}
        onClick={toggleContent}
      >
        {target.removed ? "Restore content" : "Remove content"}
      </Button>

      {reportStatus === "open" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => resolveReport(reportId, "actioned"), "Report actioned.")
            }
          >
            Mark actioned
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() => resolveReport(reportId, "reviewed"), "Report dismissed.")
            }
          >
            Dismiss
          </Button>
        </>
      )}

      {reportStatus !== "open" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(() => resolveReport(reportId, "open"), "Report reopened.")
          }
        >
          Reopen
        </Button>
      )}

      {author &&
        (author.banned ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setUserBan(author.userId, false),
                `@${author.username} unbanned.`
              )
            }
          >
            Unban @{author.username}
          </Button>
        ) : canBanAuthor ? (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => setBanOpen((v) => !v)}
          >
            Ban @{author.username}
          </Button>
        ) : null)}

      {banOpen && author && !author.banned && (
        <form
          className="mt-2 flex w-full max-w-md flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => setUserBan(author.userId, true, banReason),
              `@${author.username} banned.`
            );
            setBanOpen(false);
            setBanReason("");
          }}
        >
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Reason for the ban (internal note)"
            className={inputClass}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" variant="danger" size="sm" disabled={pending}>
              Confirm ban
            </Button>
            <button
              type="button"
              onClick={() => setBanOpen(false)}
              className="text-meta text-fg-subtle transition-colors hover:text-fg"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
