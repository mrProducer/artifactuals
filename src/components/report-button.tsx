"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/actions/social";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ReportButton({
  targetType,
  targetId,
  signedIn,
}: {
  targetType: "artifact" | "comment";
  targetId: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="font-mono text-meta text-fg-subtle">
        Reported — thank you.
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          if (!signedIn) {
            window.location.href = "/login";
            return;
          }
          setOpen(true);
        }}
        className="text-meta text-fg-subtle transition-colors hover:text-fg"
      >
        Report
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await reportContent(targetType, targetId, reason);
          if (result.error) {
            setStatus(result.error);
          } else {
            setDone(true);
          }
        });
      }}
      className="flex w-full max-w-sm flex-col gap-2"
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
        maxLength={500}
        rows={2}
        placeholder={`Why are you reporting this ${targetType}?`}
        className={inputClass}
      />
      {status && <span className="text-small text-danger">{status}</span>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Sending..." : "Submit report"}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-meta text-fg-subtle transition-colors hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
