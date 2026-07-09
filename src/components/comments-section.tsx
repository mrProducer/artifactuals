"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions/social";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { ReportButton } from "@/components/report-button";

export type CommentItem = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    github_username: string | null;
  } | null;
};

export function CommentsSection({
  artifactId,
  comments,
  currentUserId,
}: {
  artifactId: string;
  comments: CommentItem[];
  currentUserId: string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = new FormData(e.currentTarget).get("body");
    setError(null);
    startTransition(async () => {
      const result = await addComment(artifactId, String(body ?? ""));
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <section id="comments" className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Comments ({comments.length})
      </h2>

      {currentUserId ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="mt-3 flex flex-col gap-2"
        >
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            placeholder="Say something about this artifact..."
            className="w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400"
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="self-end bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {pending ? "Posting..." : "Comment"}
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="underline">
            Sign in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-4">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar
              name={comment.profiles?.display_name ?? "?"}
              imageUrl={
                comment.profiles ? resolveAvatarUrl(comment.profiles) : null
              }
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                {comment.profiles && (
                  <Link
                    href={`/${comment.profiles.username}`}
                    className="text-sm font-medium"
                  >
                    {comment.profiles.display_name}
                  </Link>
                )}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                {comment.body}
              </p>
              <div className="mt-1 flex items-center gap-3">
                {currentUserId === comment.author_id ? (
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await deleteComment(comment.id, artifactId);
                      })
                    }
                    className="text-xs text-zinc-400 hover:text-red-600 dark:text-zinc-500"
                  >
                    Delete
                  </button>
                ) : (
                  <ReportButton
                    targetType="comment"
                    targetId={comment.id}
                    signedIn={currentUserId !== null}
                  />
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
