"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions/social";
import { Avatar } from "@/components/avatar";
import { resolveAvatarUrl } from "@/lib/profile";
import { ReportButton } from "@/components/report-button";
import { inputClass } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <section id="comments" className="mt-12">
      <h2 className="font-mono text-label uppercase text-fg-subtle">
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
            className={inputClass}
          />
          {error && <p className="text-small text-danger">{error}</p>}
          <Button type="submit" size="sm" disabled={pending} className="self-end">
            {pending ? "Posting..." : "Comment"}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-body text-fg-muted">
          <Link href="/login" className="text-accent underline">
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
                    className="text-title text-fg hover:underline"
                  >
                    {comment.profiles.display_name}
                  </Link>
                )}
                <span className="font-mono text-meta text-fg-subtle">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-body text-fg">
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
                    className="text-meta text-fg-subtle transition-colors hover:text-danger"
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
