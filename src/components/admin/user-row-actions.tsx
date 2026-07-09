"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserBan, setUserRole } from "@/app/actions/moderation";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { Role } from "@/lib/moderation";

const ROLES: Role[] = ["user", "moderator", "admin"];

export function UserRowActions({
  userId,
  username,
  currentRole,
  banned,
  viewerRole,
  isSelf,
}: {
  userId: string;
  username: string;
  currentRole: Role;
  banned: boolean;
  viewerRole: Role;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");

  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        toast(result.error);
      } else {
        toast(ok);
        router.refresh();
      }
    });

  const canBan = !isSelf && (currentRole === "user" || viewerRole === "admin");

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {viewerRole === "admin" && !isSelf && (
          <select
            value={currentRole}
            disabled={pending}
            onChange={(e) =>
              run(
                () => setUserRole(userId, e.target.value as Role),
                `@${username} is now ${e.target.value}.`
              )
            }
            className="h-9 border border-border bg-surface px-2 text-small text-fg outline-none transition-colors focus:border-accent disabled:opacity-50"
            aria-label={`Role for @${username}`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}

        {banned ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending || isSelf}
            onClick={() =>
              run(
                () => setUserBan(userId, false),
                `@${username} unbanned.`
              )
            }
          >
            Unban
          </Button>
        ) : canBan ? (
          <Button
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() => setBanOpen((v) => !v)}
          >
            Ban
          </Button>
        ) : null}
      </div>

      {banOpen && !banned && (
        <form
          className="flex w-full max-w-xs flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => setUserBan(userId, true, banReason),
              `@${username} banned.`
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
