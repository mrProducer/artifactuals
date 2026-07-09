"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/actions/social";

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
      <span className="text-xs text-zinc-400 dark:text-zinc-500">
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
        className="text-xs text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
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
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {status && (
        <span className="text-xs text-red-600 dark:text-red-400">{status}</span>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Sending..." : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
